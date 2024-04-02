import { None } from "@helios-lang/type-utils"
import { ConstrData } from "@helios-lang/uplc"
import { Address } from "./Address.js"
import { TxOutput } from "./TxOutput.js"
import { TxOutputDatum } from "./TxOutputDatum.js"
import { TxOutputId } from "./TxOutputId.js"
import { Value } from "../money/Value.js"
import {
    decodeTuple,
    decodeTupleLazy,
    encodeTuple,
    isBytes,
    isTuple
} from "@helios-lang/cbor"
import { ByteStream } from "@helios-lang/codec-utils"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 * @typedef {import("./TxOutputDatum.js").TxOutputDatumKind} TxOutputDatumKind
 */

/**
 * TxInput represents UTxOs that are available for spending
 */
export class TxInput {
    /**
     * @readonly
     * @type {TxOutputId}
     */
    id

    /**
     * Can be mutated in order to recover
     * @type {Option<TxOutput>}
     */
    #output

    /**
     * @param {TxOutputId} outputId
     * @param {Option<TxOutput>} output - used during building/emulation, not part of serialization
     */
    constructor(outputId, output = None) {
        this.id = outputId
        this.#output = output
    }

    /**
     * Decodes either the ledger representation of full representation of a TxInput
     * @param {ByteArrayLike} bytes
     * @returns {TxInput}
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        if (decodeTupleLazy(stream.copy())(isBytes)) {
            // first element in tuple is a bytearray -> ledger representation (i.e. just a reference)
            const id = TxOutputId.fromCbor(stream) // [bytes, int]

            return new TxInput(id)
        } else if (decodeTupleLazy(stream.copy())(isTuple)) {
            // first element in tuple is another tuple -> full representation (i.e. as used in ScriptContext)

            // [[bytes,int], [...] | {...}]

            const [id, output] = decodeTuple(stream, [TxOutputId, TxOutput])

            return new TxInput(id, output)
        } else {
            throw new Error("unhandled TxInput encoding")
        }
    }

    /**
     * Full representation (as used in ScriptContext)
     * @param {UplcData} data
     * @returns {TxInput}
     */
    static fromUplcData(data) {
        ConstrData.assert(data, 0, 2)

        return new TxInput(
            TxOutputId.fromUplcData(data.fields[0]),
            TxOutput.fromUplcData(data.fields[1])
        )
    }

    /**
     * Used by TxBodyBuilder.addInput and TxBodyBuilder.addRefInput
     * @param {TxInput[]} list
     * @param {TxInput} input
     * @param {boolean} checkUniqueness
     */
    static append(list, input, checkUniqueness = true) {
        const output = input.#output

        if (!output) {
            throw new Error(
                "TxInput.output must be set when building a transaction"
            )
        }

        output.value.assertAllPositive()

        if (
            checkUniqueness &&
            list.some((prevInput) => prevInput.isEqual(input))
        ) {
            throw new Error("input already added before")
        }

        list.push(input)
        list.sort(TxInput.compare)
    }

    /**
     * Tx inputs must be ordered.
     * The following function can be used directly by a js array sort
     * @param {TxInput} a
     * @param {TxInput} b
     * @returns {number}
     */
    static compare(a, b) {
        return TxOutputId.compare(a.id, b.id)
    }

    /**
     * @param {TxInput[]} inputs
     * @returns {Value}
     */
    static sumValues(inputs) {
        return inputs.reduce(
            (prev, input) => prev.add(input.value),
            new Value()
        )
    }

    /**
     * Shortcut
     * @type {Address}
     */
    get address() {
        return this.output.address
    }

    /**
     * Shortcut
     * @type {Option<TxOutputDatum<TxOutputDatumKind>>}
     */
    get datum() {
        return this.output.datum
    }

    /**
     * Throws an error if the TxInput hasn't been recovered
     * @returns {TxOutput}
     */
    get output() {
        if (this.#output) {
            return this.#output
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
     * @param {(id: TxOutputId) => Promise<TxOutput>} fn
     */
    async recover(fn) {
        if (!this.#output) {
            this.#output = await fn(this.id)
        }
    }

    /**
     * @returns {Object}
     */
    dump() {
        return {
            outputId: this.id.toString(),
            output: this.#output ? this.#output.dump() : null
        }
    }

    /**
     * @param {TxInput} other
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
        if (this.#output) {
            return new ConstrData(0, [
                this.id.toUplcData(),
                this.#output.toUplcData()
            ])
        } else {
            throw new Error("TxInput original output not synced")
        }
    }
}