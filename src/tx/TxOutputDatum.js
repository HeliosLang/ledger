import { None } from "@helios-lang/type-utils"
import { ConstrData, decodeUplcData } from "@helios-lang/uplc"
import { blake2b } from "@helios-lang/crypto"
import {
    decodeBytes,
    decodeTag,
    decodeTagged,
    encodeBytes,
    encodeInt,
    encodeTag,
    encodeTuple
} from "@helios-lang/cbor"
import { bytesToHex } from "@helios-lang/codec-utils"
import { DatumHash } from "../hashes/index.js"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 */

/**
 * @typedef {Option<TxOutputDatum> | DatumHash | UplcData} TxOutputDatumLike
 */

/**
 * @typedef {"Hash" | "Inline"} TxOutputDatumKinds
 */

/**
 * @template {TxOutputDatumKinds} T
 * @typedef {T extends "Inline" ? {
 *   "Inline": {
 *     data: UplcData
 *   }
 * } : {
 *   "Hash": {
 *     hash: DatumHash
 *     data?: UplcData
 *   }
 * }} TxOutputDatumProps
 */

/**
 * On-chain the TxOutputDatum has 3 variants (`none`, `hash` and `inline`), off-chain it is more convenient to treat it as an Option of two variants
 * @template {TxOutputDatumKinds} [T=TxOutputDatumKinds]
 */
export class TxOutputDatum {
    /**
     * @private
     * @type {TxOutputDatumProps<T>}
     */
    props

    /**
     * @private
     * @param {TxOutputDatumProps<T>} props
     */
    constructor(props) {
        this.props = props
    }

    /**
     * @overload
     * @param {DatumHash} hash
     * @returns {TxOutputDatum<"Hash">}
     */

    /**
     * @overload
     * @param {UplcData} data
     * @returns {TxOutputDatum<"Hash">}
     */

    /**
     * @param {DatumHash | UplcData} arg
     * @returns {TxOutputDatum<"Hash">}
     */
    static Hash(arg) {
        if (arg instanceof DatumHash) {
            return new TxOutputDatum({ Hash: { hash: arg } })
        } else {
            return new TxOutputDatum({
                Hash: {
                    data: arg,
                    hash: new DatumHash(blake2b(arg.toCbor()))
                }
            })
        }
    }

    /**
     * @param {UplcData} data
     * @returns {TxOutputDatum<"Inline">}
     */
    static Inline(data) {
        return new TxOutputDatum({ Inline: { data: data } })
    }

    /**
     * @type {typeof None}
     */
    static get None() {
        return None
    }

    /**
     * @param {TxOutputDatumLike} arg
     * @returns {Option<TxOutputDatum>}
     */
    static fromAlike(arg) {
        if (arg instanceof TxOutputDatum) {
            return arg
        } else if (arg instanceof DatumHash) {
            return TxOutputDatum.Hash(arg)
        } else if (arg === null || arg === undefined) {
            return None
        } else {
            return TxOutputDatum.Inline(arg)
        }
    }

    /**
     * @param {ByteArrayLike} bytes
     * @returns {TxOutputDatum}
     */
    static fromCbor(bytes) {
        const [type, decodeItem] = decodeTagged(bytes)

        switch (type) {
            case 0:
                return TxOutputDatum.Hash(decodeItem(DatumHash))
            case 1:
                return TxOutputDatum.Inline(
                    decodeItem((bytes) => {
                        const tag = decodeTag(bytes)
                        if (tag != 24n) {
                            throw new Error(`expected 24 as tag, got ${tag}`)
                        }

                        return decodeUplcData(decodeBytes(bytes))
                    })
                )
            default:
                throw new Error(`unhandled TxOutputDatum type ${type}`)
        }
    }

    /**
     * @param {UplcData} data
     * @returns {Option<TxOutputDatum>}
     */
    static fromUplcData(data) {
        const { tag, fields } = ConstrData.expect(data)

        switch (tag) {
            case 0:
                if (fields.length != 0) {
                    throw new Error(
                        `expected 0 fields for TxOutputDatum::None ConstrData, got ${fields.length} fields`
                    )
                }

                return None
            case 1:
                if (fields.length != 1) {
                    throw new Error(
                        `expected 1 field for TxOutputDatum::Hash ConstrData, got ${fields.length} fields`
                    )
                }

                return TxOutputDatum.Hash(DatumHash.fromUplcData(fields[0]))
            case 2:
                if (fields.length != 2) {
                    throw new Error(
                        `expected 1 field for TxOutputDatum::Inline ConstrData, got ${fields.length} fields`
                    )
                }

                return TxOutputDatum.Inline(fields[0])
            default:
                throw new Error(
                    `expected 0, 1 or 2 TxOutputDatum ConstrData tag, got ${tag}`
                )
        }
    }

    /**
     * @returns {this is TxOutputDatum<"Hash">}
     */
    isHash() {
        return "Hash" in this.props
    }

    /**
     * @returns {this is TxOutputDatum<"Inline">}
     */
    isInline() {
        return "Inline" in this.props
    }

    /**
     * THis is ok for methods, this doesn't work for getters
     * @this TxOutputDatum<"Inline">
     * @returns {string}
     */
    //helloMethod() {
    //  return this.props.Inline.hello
    //}

    /**
     * @type {T extends "Inline" ? UplcData : Option<UplcData>}
     */
    get data() {
        return /** @type {any} */ (
            "Hash" in this.props
                ? this.props.Hash?.data ?? None
                : this.props.Inline.data
        )
    }

    /**
     * @type {DatumHash}
     */
    get hash() {
        if ("Hash" in this.props) {
            return this.props.Hash.hash
        } else {
            return new DatumHash(blake2b(this.props.Inline.data.toCbor()))
        }
    }

    /**
     * @returns {Object}
     */
    dump() {
        if ("Hash" in this.props) {
            return {
                hash: this.props.Hash.hash.dump(),
                cbor: this.props.Hash?.data
                    ? bytesToHex(this.props.Hash.data.toCbor())
                    : null,
                schema: this.props.Hash?.data
                    ? JSON.parse(this.props.Hash.data.toSchemaJson())
                    : null
            }
        } else {
            return {
                inlineCbor: bytesToHex(this.props.Inline.data.toCbor()),
                inlineSchema: JSON.parse(this.props.Inline.data.toSchemaJson())
            }
        }
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        if ("Hash" in this.props) {
            return encodeTuple([encodeInt(0n), this.props.Hash.hash.toCbor()])
        } else {
            return encodeTuple([
                encodeInt(1n),
                encodeTag(24n).concat(
                    encodeBytes(this.props.Inline.data.toCbor())
                )
            ])
        }
    }

    /**
     * Used by script context emulation
     * @returns {ConstrData}
     */
    toUplcData() {
        if ("Hash" in this.props) {
            return new ConstrData(1, [this.props.Hash.hash.toUplcData()])
        } else {
            return new ConstrData(2, [this.props.Inline.data])
        }
    }
}
