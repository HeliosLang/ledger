import {
    decodeBytes,
    decodeObjectIKey,
    decodeTag,
    decodeTagged,
    decodeTuple,
    encodeBytes,
    encodeInt,
    encodeObjectIKey,
    encodeTag,
    encodeTuple,
    isObject,
    isTuple
} from "@helios-lang/cbor"
import { bytesToHex, makeByteStream } from "@helios-lang/codec-utils"
import {
    decodeUplcProgramV1FromCbor,
    decodeUplcProgramV2FromCbor,
    expectConstrData,
    makeByteArrayData,
    makeConstrData,
    wrapUplcDataOption
} from "@helios-lang/uplc"
import { decodeDatumHash } from "../hashes/index.js"
import {
    convertUplcDataToValue,
    decodeValue,
    makeValue
} from "../money/index.js"
import { makeNetworkParamsHelper } from "../params/index.js"
import {
    convertUplcDataToShelleyAddress,
    decodeShelleyAddress,
    makeAddress
} from "../address/index.js"
import { makeHashedTxOutputDatum } from "./HashedTxOutputDatum.js"
import {
    convertUplcDataToTxOutputDatum,
    decodeTxOutputDatum
} from "./TxOutputDatum.js"

/**
 * @import { BytesLike } from "@helios-lang/codec-utils"
 * @import { ConstrData, UplcData, UplcProgramV1, UplcProgramV2 } from "@helios-lang/uplc"
 * @import { Address, NetworkParams, ShelleyAddressLike, SpendingCredential, TxOutput, TxOutputDatum, TxOutputEncodingConfig, Value, ValueLike } from "../index.js"
 */

/**
 * @type {TxOutputEncodingConfig}
 */
export const DEFAULT_TX_OUTPUT_ENCODING_CONFIG = {
    strictBabbage: true
}

/**
 * Constructs a `TxOutput` instance using an `Address`, a `Value`, an optional `Datum`, and optional `UplcProgram` reference script.
 * @template {SpendingCredential} [SC=SpendingCredential]
 * @param {Address<SC> | ShelleyAddressLike} address
 * @param {ValueLike} value
 * @param {TxOutputDatum | undefined} datum
 * @param {UplcProgramV1 | UplcProgramV2 | undefined} refScript - plutus v2 script for now
 * @returns {TxOutput<SC>}
 */
export function makeTxOutput(
    address,
    value,
    datum = undefined,
    refScript = undefined,
    encodingConfig = DEFAULT_TX_OUTPUT_ENCODING_CONFIG
) {
    return new TxOutputImpl(address, value, datum, refScript, encodingConfig)
}

/**
 * @param {BytesLike} bytes
 * @returns {TxOutput}
 */
export function decodeTxOutput(bytes) {
    const stream = makeByteStream(bytes)

    if (isObject(bytes)) {
        const {
            0: address,
            1: value,
            2: datum,
            3: refScriptBytes
        } = decodeObjectIKey(stream, {
            0: decodeShelleyAddress,
            1: decodeValue,
            2: decodeTxOutputDatum,
            3: (stream) => {
                if (decodeTag(stream) != 24n) {
                    throw new Error("unexpected reference script tag")
                }

                return decodeBytes(stream)
            }
        })

        if (!address || !value) {
            throw new Error("unexpected TxOutput encoding")
        }

        /**
         * @type {UplcProgramV1 | UplcProgramV2 | undefined}
         */
        const refScript = (() => {
            if (refScriptBytes) {
                const [scriptType, decodeScript] = decodeTagged(refScriptBytes)

                switch (scriptType) {
                    case 0:
                        throw new Error("native refScript not handled")
                    case 1:
                        return decodeScript((bs) =>
                            decodeUplcProgramV1FromCbor(bs)
                        )
                    case 2:
                        return decodeScript((bs) =>
                            decodeUplcProgramV2FromCbor(bs)
                        )
                    default:
                        throw new Error(`unhandled scriptType ${scriptType}`)
                }
            } else {
                return undefined
            }
        })()

        return new TxOutputImpl(address, value, datum, refScript, {
            strictBabbage: true
        })
    } else if (isTuple(bytes)) {
        const [address, value, datumHash] = decodeTuple(
            bytes,
            [decodeShelleyAddress, decodeValue],
            [decodeDatumHash]
        )

        return new TxOutputImpl(
            address,
            value,
            datumHash ? makeHashedTxOutputDatum(datumHash) : undefined
        )
    } else {
        throw new Error("unexpected TxOutput encoding")
    }
}

/**
 * @param {BytesLike} bytes
 * @returns {boolean}
 */
export function isValidTxOutputCbor(bytes) {
    const stream = makeByteStream(bytes).copy()

    try {
        decodeTxOutput(stream)
        return true
    } catch (_e) {
        return false
    }
}

/**
 * @param {boolean} mainnet
 * @param {UplcData} data
 * @param {TxOutputEncodingConfig} encodingConfig
 * @returns {TxOutput}
 */
export function convertUplcDataToTxOutput(
    mainnet,
    data,
    encodingConfig = DEFAULT_TX_OUTPUT_ENCODING_CONFIG
) {
    const cData = expectConstrData(data, 0, 4)

    return new TxOutputImpl(
        convertUplcDataToShelleyAddress(mainnet, cData.fields[0]),
        convertUplcDataToValue(cData.fields[1]),
        convertUplcDataToTxOutputDatum(cData.fields[2]),
        undefined, // The refScript hash isn't very useful
        encodingConfig
    )
}

/**
 * Represents a transaction output that is used when building a transaction.
 * @template {SpendingCredential} [SC=SpendingCredential]
 * @implements {TxOutput<SC>}
 */
class TxOutputImpl {
    /**
     * Mutation is useful when correcting the quantity of lovelace in a utxo
     * @type {Address<SC>}
     */
    address

    /**
     * Mutation is handy when correcting the quantity of lovelace in a utxo
     * @type {Value}
     */
    value

    /**
     * Mutation is handy when correcting the quantity of lovelace in a utxo
     * @type {TxOutputDatum | undefined}
     */
    datum

    /**
     * @type {UplcProgramV1 | UplcProgramV2 | undefined}
     */
    refScript

    /**
     * @type {TxOutputEncodingConfig}
     */
    encodingConfig

    /**
     * Constructs a `TxOutput` instance using an `Address`, a `Value`, an optional `Datum`, and optional `UplcProgram` reference script.
     * @param {Address<SC> | ShelleyAddressLike} address
     * @param {ValueLike} value
     * @param {TxOutputDatum | undefined} datum
     * @param {UplcProgramV1 | UplcProgramV2 | undefined} refScript - plutus v2 script for now
     */
    constructor(
        address,
        value,
        datum = undefined,
        refScript = undefined,
        encodingConfig = DEFAULT_TX_OUTPUT_ENCODING_CONFIG
    ) {
        this.address = /** @type {any} */ (
            typeof address != "string" &&
            "kind" in address &&
            address.kind == "Address"
                ? address
                : makeAddress(address)
        )
        this.value = makeValue(value)
        this.datum = datum
        this.refScript = refScript
        this.encodingConfig = encodingConfig
    }

    /**
     * @type {"TxOutput"}
     */
    get kind() {
        return "TxOutput"
    }

    /**
     * Deep copy of the TxInput so that Network interfaces don't allow accidental mutation of the underlying data
     * @returns {TxOutput<SC>}
     */
    copy() {
        return new TxOutputImpl(
            this.address.era == "Byron" ? this.address : this.address.copy(),
            this.value.copy(),
            this.datum?.copy(),
            this.refScript,
            this.encodingConfig
        )
    }

    /**
     * @returns {object}
     */
    dump() {
        return {
            address:
                this.address.era == "Byron"
                    ? this.address.toBase58()
                    : this.address.dump(),
            value: this.value.dump(),
            datum: this.datum ? this.datum.dump() : null,
            refScript: this.refScript
                ? bytesToHex(this.refScript.toCbor())
                : null
        }
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        if (
            (!this.datum || this.datum.kind == "HashedTxOutputDatum") &&
            !this.refScript &&
            !this.encodingConfig.strictBabbage
        ) {
            // this is needed to match eternl wallet (de)serialization (annoyingly eternl deserializes the tx and then signs its own serialization)
            // hopefully cardano-cli signs whatever serialization we choose (so we use the eternl variant in order to be compatible with both)

            const fields = [this.address.toCbor(), this.value.toCbor()]

            if (this.datum && this.datum.kind == "HashedTxOutputDatum") {
                fields.push(this.datum.hash.toCbor())
            }

            return encodeTuple(fields)
        } else {
            /**
             * @type {Map<number, number[]>}
             */
            const object = new Map()

            object.set(0, this.address.toCbor())
            object.set(1, this.value.toCbor())

            if (this.datum) {
                object.set(2, this.datum.toCbor())
            }

            if (this.refScript) {
                object.set(
                    3,
                    encodeTag(24n).concat(
                        encodeBytes(
                            encodeTuple([
                                encodeInt(
                                    BigInt(this.refScript.plutusVersionTag)
                                ),
                                this.refScript.toCbor()
                            ])
                        )
                    )
                )
            }

            return encodeObjectIKey(object)
        }
    }

    /**
     * @returns {ConstrData}
     */
    toUplcData() {
        const address = this.address

        if (address.era == "Byron") {
            throw new Error("not yet implemented")
        }

        return makeConstrData(0, [
            address.toUplcData(),
            this.value.toUplcData(),
            this.datum ? this.datum.toUplcData() : makeConstrData(0, []),
            wrapUplcDataOption(
                this.refScript
                    ? makeByteArrayData(this.refScript.hash())
                    : undefined
            )
        ])
    }

    /**
     * Each UTxO must contain some minimum quantity of lovelace to avoid that the blockchain is used for data storage.
     * @param {NetworkParams} params
     * @returns {bigint}
     */
    calcDeposit(params) {
        // TODO: also iterative calculation
        const helper = makeNetworkParamsHelper(params)

        const lovelacePerByte = helper.lovelacePerUtxoByte

        const correctedSize = this.toCbor().length + 160 // 160 accounts for some database overhead?

        return BigInt(correctedSize) * BigInt(lovelacePerByte)
    }

    /**
     * Makes sure the `TxOutput` contains the minimum quantity of lovelace.
     * The network requires this to avoid the creation of unusable dust UTxOs.
     *
     * Optionally an update function can be specified that allows mutating the datum of the `TxOutput` to account for an increase of the lovelace quantity contained in the value.
     * @param {NetworkParams} params
     * @param {((output: TxOutput<SC>) => void) | undefined} updater
     */
    correctLovelace(params, updater = undefined) {
        let minLovelace = this.calcDeposit(params)

        while (this.value.lovelace < minLovelace) {
            this.value.lovelace = minLovelace

            if (updater != null) {
                updater(this)
            }

            minLovelace = this.calcDeposit(params)
        }
    }
}
