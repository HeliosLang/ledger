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
import { ByteStream, bytesToHex } from "@helios-lang/codec-utils"
import { None } from "@helios-lang/type-utils"
import { ByteArrayData, ConstrData, encodeOptionData } from "@helios-lang/uplc"
import { UplcProgram as UplcProgramV1 } from "@helios-lang/uplc/v1"
import { UplcProgram as UplcProgramV2 } from "@helios-lang/uplc/v2"
import { DatumHash } from "../hashes/index.js"
import { Value } from "../money/index.js"
import { config } from "./config.js"
import { Address } from "./Address.js"
import { TxOutputDatum } from "./TxOutputDatum.js"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 * @typedef {import("./TxOutputDatum.js").TxOutputDatumKinds} TxOutputDatumKinds
 */

/**
 * Represents a transaction output that is used when building a transaction.
 */
export class TxOutput {
    /**
     * Mutation is useful when correcting the quantity of lovelace in a utxo
     * @type {Address}
     */
    address

    /**
     * Mutation is handy when correcting the quantity of lovelace in a utxo
     * @type {Value}
     */
    value

    /**
     * Mutation is handy when correctin the quantity of lovelace in a utxo
     * @type {Option<TxOutputDatum<TxOutputDatumKinds>>}
     */
    datum

    /**
     * @type {Option<UplcProgramV1 | UplcProgramV2>}
     */
    refScript

    /**
     * Constructs a `TxOutput` instance using an `Address`, a `Value`, an optional `Datum`, and optional `UplcProgram` reference script.
     * @param {Address} address
     * @param {Value} value
     * @param {Option<TxOutputDatum<TxOutputDatumKinds>>} datum
     * @param {Option<UplcProgramV1 | UplcProgramV2>} refScript - plutus v2 script for now
     */
    constructor(address, value, datum = None, refScript = None) {
        this.address = address
        this.value = value
        this.datum = datum
        this.refScript = refScript
    }

    /**
     * @param {ByteArrayLike} bytes
     * @returns {TxOutput}
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        if (isObject(bytes)) {
            const {
                0: address,
                1: value,
                2: datum,
                3: refScriptBytes
            } = decodeObjectIKey(stream, {
                0: Address,
                1: Value,
                2: TxOutputDatum,
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
             * @type {Option<UplcProgramV1 | UplcProgramV2>}
             */
            const refScript = (() => {
                if (refScriptBytes) {
                    const [scriptType, decodeScript] =
                        decodeTagged(refScriptBytes)

                    switch (scriptType) {
                        case 0:
                            throw new Error("native refScript not handled")
                        case 1:
                            return decodeScript(UplcProgramV1)
                        case 2:
                            return decodeScript(UplcProgramV2)
                        default:
                            throw new Error(
                                `unhandled scriptType ${scriptType}`
                            )
                    }
                } else {
                    return None
                }
            })()

            return new TxOutput(address, value, datum, refScript)
        } else if (isTuple(bytes)) {
            const [address, value, datumHash] = decodeTuple(
                bytes,
                [Address, Value],
                [DatumHash]
            )

            return new TxOutput(
                address,
                value,
                datumHash ? TxOutputDatum.Hash(datumHash) : None
            )
        } else {
            throw new Error("unexpected TxOutput encoding")
        }
    }

    /**
     * @param {UplcData} data
     * @returns {TxOutput}
     */
    static fromUplcData(data) {
        ConstrData.assert(data, 0, 4)

        return new TxOutput(
            Address.fromUplcData(data.fields[0]),
            Value.fromUplcData(data.fields[1]),
            TxOutputDatum.fromUplcData(data.fields[2])
            // The refScript hash isn't very useful
        )
    }

    /**
     * @returns {Object}
     */
    dump() {
        return {
            address: this.address.dump(),
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
            (!this.datum || this.datum.isHash()) &&
            !this.refScript &&
            !config.STRICT_BABBAGE
        ) {
            // this is needed to match eternl wallet (de)serialization (annoyingly eternl deserializes the tx and then signs its own serialization)
            // hopefully cardano-cli signs whatever serialization we choose (so we use the eternl variant in order to be compatible with both)

            const fields = [this.address.toCbor(), this.value.toCbor()]

            if (this.datum && this.datum.isHash()) {
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
        return new ConstrData(0, [
            this.address.toUplcData(),
            this.value.toUplcData(),
            this.datum ? this.datum.toUplcData() : new ConstrData(0, []),
            encodeOptionData(
                this.refScript ? new ByteArrayData(this.refScript.hash()) : None
            )
        ])
    }
}
