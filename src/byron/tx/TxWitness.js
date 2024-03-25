import { ByteStream } from "@helios-lang/codec-utils"
import {
    decodeBytes,
    decodeInt,
    decodeTag,
    decodeTagged,
    decodeTuple,
    encodeBytes,
    encodeInt,
    encodeTag,
    encodeTuple
} from "@helios-lang/cbor"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 */

/**
 * Enum-like structure for transaction witness kinds.
 * @typedef {"PubKey" | "Unknown1" | "Unknown2" | "Other"} TxWitnessKinds
 */

/**
 * Represents transaction witness properties with a detailed structure for each kind.
 * @template {TxWitnessKinds} T
 * @typedef {T extends "PubKey" ? {
 *  "PubKey": {
 *     pubKey: number[],
 *     signature: number[]
 *   }
 * } : T extends "Unknown1" ? {
 *   "Unknown1": {
 *     i0: number
 *     h0: number[]
 *     i1: number
 *     h1: number[]
 *   }
 * } : T extends "Unknown2" ? {
 *   "Unknown2": {
 *     pubKey: number[]
 *     signature: number[]
 *   }
 * } : T extends "Other" ? {
 *   "Other": {
 *      tag: number
 *     data: number[]
 *   }
 * } : never} TxWitnessProps
 */

/**
 * Represents transaction witness properties with detailed structure for each kind.
 * @template {TxWitnessKinds} T
 */
export class TxWitness {
    /**
     * @readonly
     * @type {TxWitnessProps<T>}
     */
    props

    /**
     * Constructs a TxWitness instance.
     * @param {TxWitnessProps<T>} props The properties of the witness, varying by type.
     */
    constructor(props) {
        this.props = props
    }

    /**
     * @param {number[]} pubKey
     * @param {number[]} signature
     * @returns {TxWitness<"PubKey">}
     */
    static PubKey(pubKey, signature) {
        return new TxWitness({ PubKey: { pubKey, signature } })
    }

    /**
     * TODO: figure out what this fields are for, and think of better names
     * @param {number | bigint} i0
     * @param {number[]} h0
     * @param {number | bigint} i1
     * @param {number[]} h1
     * @returns {TxWitness<"Unknown1">}
     */
    static Unknown1(i0, h0, i1, h1) {
        return new TxWitness({
            Unknown1: { i0: Number(i0), h0, i1: Number(i1), h1 }
        })
    }

    /**
     * @param {number[]} pubKey
     * @param {number[]} signature
     * @returns {TxWitness<"Unknown2">}
     */
    static Unknown2(pubKey, signature) {
        return new TxWitness({ Unknown2: { pubKey, signature } })
    }

    /**
     * @param {number} tag
     * @param {number[]} data - Cbor encoded data
     * @returns {TxWitness<"Other">}
     */
    static Other(tag, data) {
        return new TxWitness({ Other: { tag, data } })
    }

    /**
     * @param {ByteArrayLike} bytes
     * @returns {TxWitness}
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        const [tag, decodeItem] = decodeTagged(stream)

        switch (tag) {
            case 0: {
                const [pubKey, signature] = decodeItem((stream) => {
                    if (decodeTag(stream) != 24n) {
                        throw new Error("unexpected tag")
                    }

                    const bytes = decodeBytes(stream)
                    return decodeTuple(bytes, [decodeBytes, decodeBytes])
                })
                return TxWitness.PubKey(pubKey, signature)
            }
            case 1: {
                const [[i0, h0], [i1, h1]] = decodeItem((stream) => {
                    if (decodeTag(stream) != 24n) {
                        throw new Error("unexpected tag")
                    }

                    const bytes = decodeBytes(stream)
                    return decodeTuple(bytes, [
                        (stream) =>
                            decodeTuple(stream, [decodeInt, decodeBytes]),
                        (stream) =>
                            decodeTuple(stream, [decodeInt, decodeBytes])
                    ])
                })
                return TxWitness.Unknown1(i0, h0, i1, h1)
            }
            case 2: {
                const [pubKey, signature] = decodeItem((stream) => {
                    if (decodeTag(stream) != 24n) {
                        throw new Error("unexpected tag")
                    }

                    const bytes = decodeBytes(stream)
                    return decodeTuple(bytes, [decodeBytes, decodeBytes])
                })

                return TxWitness.Unknown2(pubKey, signature)
            }
            default: {
                if (tag <= 2) {
                    throw new Error("invalid tag")
                }

                const data = decodeItem(decodeBytes)
                return TxWitness.Other(tag, data)
            }
        }
    }

    /**
     * @returns {this is TxWitness<"PubKey">}
     */
    isPubKey() {
        return "PubKey" in this.props
    }

    /**
     * @returns {this is TxWitness<"Unknown1">}
     */
    isUnknown1() {
        return "Unknown1" in this.props
    }

    /**
     * @returns {this is TxWitness<"Unknown2">}
     */
    isUnknown2() {
        return "Unknown2" in this.props
    }

    /**
     * @returns {this is TxWitness<"Other">}
     */
    isOther() {
        return "Other" in this.props
    }

    /**
     *
     * @returns {number[]}
     */
    toCbor() {
        if (this.isPubKey()) {
            const props = this.props.PubKey
            return encodeTuple([
                encodeInt(0),
                encodeTag(24).concat(
                    encodeTuple([
                        encodeBytes(props.pubKey),
                        encodeBytes(props.signature)
                    ])
                )
            ])
        } else if (this.isUnknown1()) {
            const props = this.props.Unknown1
            return encodeTuple([
                encodeInt(1),
                encodeTag(24).concat(
                    encodeTuple([
                        encodeTuple([
                            encodeInt(props.i0),
                            encodeBytes(props.h0)
                        ]),
                        encodeTuple([
                            encodeInt(props.i1),
                            encodeBytes(props.h1)
                        ])
                    ])
                )
            ])
        } else if (this.isUnknown2()) {
            const props = this.props.Unknown2
            return encodeTuple([
                encodeInt(2),
                encodeTag(24).concat(
                    encodeTuple([
                        encodeBytes(props.pubKey),
                        encodeBytes(props.signature)
                    ])
                )
            ])
        } else if (this.isOther()) {
            const props = this.props.Other

            return encodeTuple([encodeInt(props.tag), encodeBytes(props.data)])
        } else {
            throw new Error("unhandled TxWitness type")
        }
    }
}
