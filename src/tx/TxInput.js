import {
    decodeTuple,
    decodeTupleLazy,
    encodeTuple,
    isBytes,
    isTuple
} from "@helios-lang/cbor"
import { makeByteStream } from "@helios-lang/codec-utils"
import { expectConstrData, makeConstrData } from "@helios-lang/uplc"
import { convertUplcDataToTxOutput, decodeTxOutput } from "./TxOutput.js"
import {
    compareTxOutputIds,
    convertUplcDataToTxOutputId,
    decodeTxOutputId,
    makeTxOutputId
} from "./TxOutputId.js"
import { UtxoAlreadySpentError } from "./UtxoAlreadySpentError.js"

/**
 * @import { BytesLike } from "@helios-lang/codec-utils"
 * @import { ConstrData, UplcData, UplcProgramV1, UplcProgramV2 } from "@helios-lang/uplc"
 * @import { Address, SpendingCredential, TxInput, TxOutput, TxOutputDatum, TxOutputId, TxOutputIdLike, Value } from "../index.js"
 */

/**
 * @template {SpendingCredential} [SC=SpendingCredential]
 * @param {TxOutputIdLike} outputId
 * @param {TxOutput<SC> | undefined} output - used during building/emulation, not part of serialization
 * @returns {TxInput<SC>}
 */
export function makeTxInput(outputId, output = undefined) {
    return new TxInputImpl(outputId, output)
}

/**
 * Decodes either the ledger representation of full representation of a TxInput
 * @param {BytesLike} bytes
 * @returns {TxInput}
 */
export function decodeTxInput(bytes) {
    const stream = makeByteStream(bytes)

    if (decodeTupleLazy(stream.copy())(isBytes)) {
        // first element in tuple is a bytearray -> ledger representation (i.e. just a reference)
        const id = decodeTxOutputId(stream) // [bytes, int]

        return new TxInputImpl(id)
    } else if (decodeTupleLazy(stream.copy())(isTuple)) {
        // first element in tuple is another tuple -> full representation (i.e. as used in ScriptContext)

        // [[bytes,int], [...] | {...}]

        const [id, output] = decodeTuple(stream, [
            decodeTxOutputId,
            decodeTxOutput
        ])

        return new TxInputImpl(id, output)
    } else {
        throw new Error("unhandled TxInput encoding")
    }
}

/**
 * Full representation (as used in ScriptContext)
 * @param {boolean} mainnet
 * @param {UplcData} data
 * @returns {TxInput}
 */
export function convertUplcDataToTxInput(mainnet, data) {
    const { fields } = expectConstrData(data, 0, 2)

    return new TxInputImpl(
        convertUplcDataToTxOutputId(fields[0]),
        convertUplcDataToTxOutput(mainnet, fields[1])
    )
}

/**
 * Tx inputs must be ordered.
 * The following function can be used directly by a js array sort
 * @param {TxInput} a
 * @param {TxInput} b
 * @returns {number}
 */
export function compareTxInputs(a, b) {
    return compareTxOutputIds(a.id, b.id)
}

/**
 * @overload
 * @param {boolean} expectFull
 * @returns {(bytes: BytesLike) => boolean}
 */
/** 
 * @overload
 * @param {BytesLike} bytes
 * @param {boolean} expectFull
 * @returns {boolean}
/**
 * @param {[boolean] | [BytesLike, boolean]} args
 * @returns {((bytes: BytesLike) => boolean) | boolean}
 */
export function isValidTxInputCbor(...args) {
    if (args.length == 1) {
        const [expectFull] = args

        /**
         * @type {(bytes: BytesLike) => boolean}
         */
        return (bytes) => {
            return isValidTxInputCbor(bytes, expectFull)
        }
    } else {
        const [bytes, expectFull] = args

        const stream = makeByteStream(bytes).copy()

        try {
            const input = decodeTxInput(stream)
            if (expectFull) {
                input.output
            }
            return true
        } catch (_e) {
            return false
        }
    }
}

/**
 * Used by TxBodyBuilder.addInput and TxBodyBuilder.addRefInput
 * @param {TxInput[]} list
 * @param {TxInput} input
 * @param {boolean} checkUniqueness
 */
export function appendTxInput(list, input, checkUniqueness = true) {
    const output = input.output
    output.value.assertAllPositive()

    if (checkUniqueness && list.some((prevInput) => prevInput.isEqual(input))) {
        throw new Error("input already added before")
    }

    list.push(input)
    list.sort(compareTxInputs)
}

/**
 * TxInput represents UTxOs that are available for spending
 * @template {SpendingCredential} [SC=SpendingCredential]
 * @implements {TxInput<SC>}
 */
class TxInputImpl {
    /**
     * @readonly
     * @type {TxOutputId}
     */
    id

    /**
     * Can be mutated in order to recover
     * @private
     * @type {TxOutput<SC> | undefined}
     */
    _output

    /**
     * @param {TxOutputIdLike} outputId
     * @param {TxOutput<SC> | undefined} output - used during building/emulation, not part of serialization
     */
    constructor(outputId, output = undefined) {
        this.id = makeTxOutputId(outputId)
        this._output = output
    }

    /**
     * @type {"TxInput"}
     */
    get kind() {
        return "TxInput"
    }

    /**
     * Shortcut
     * @type {Address<SC>}
     */
    get address() {
        return this.output.address
    }

    /**
     * Shortcut
     * @type {TxOutputDatum | undefined}
     */
    get datum() {
        return this.output.datum
    }

    /**
     * Throws an error if the TxInput hasn't been recovered
     * @returns {TxOutput<SC>}
     */
    get output() {
        if (this._output) {
            return this._output
        } else {
            throw new Error("TxInput original output not synced")
        }
    }

    /**
     * Shortcut
     * @type {Value}
     */
    get value() {
        return this.output.value
    }

    /**
     * The output itself isn't stored in the ledger, so must be recovered after deserializing blocks/transactions
     * @param {{getUtxo(id: TxOutputId): Promise<TxInput>}} network
     */
    async recover(network) {
        if (!this._output) {
            /**
             * @type {TxOutput<any>}
             */
            let output

            try {
                output = (await network.getUtxo(this.id)).output
            } catch (e) {
                if (e instanceof UtxoAlreadySpentError) {
                    output = e.utxo.output
                } else {
                    throw e
                }
            }

            this._output = output
        }
    }

    /**
     * Deep copy of the TxInput so that Network interfaces don't allow accidental mutation of the underlying data
     * @returns {TxInput<SC>}
     */
    copy() {
        return new TxInputImpl(this.id, this._output?.copy())
    }

    /**
     * @returns {Object}
     */
    dump() {
        return {
            outputId: this.id.toString(),
            output: this._output ? this._output.dump() : null
        }
    }

    /**
     * @param {TxInput<any>} other
     * @returns {boolean}
     */
    isEqual(other) {
        return other.id.isEqual(this.id)
    }

    /**
     * Ledger format is without original output (so full = false)
     * full = true is however useful for complete deserialization of the TxInput (and then eg. using it in off-chain applications)
     * @param {boolean} full
     * @returns {number[]}
     */
    toCbor(full = false) {
        if (full) {
            return encodeTuple([this.id.toCbor(), this.output.toCbor()])
        } else {
            return this.id.toCbor()
        }
    }

    /**
     * full representation (as used in ScriptContext)
     * @returns {ConstrData}
     */
    toUplcData() {
        if (this._output) {
            return makeConstrData(0, [
                this.id.toUplcData(),
                this._output.toUplcData()
            ])
        } else {
            throw new Error("TxInput original output not synced")
        }
    }
}
