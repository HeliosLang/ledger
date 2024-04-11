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
import { ByteStream, toInt } from "@helios-lang/codec-utils"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("@helios-lang/codec-utils").IntLike} IntLike
 */

/**
 * @typedef {"Regular" | "Other"} TxInputKinds
 */

/**
 * @template {TxInputKinds} T
 * @typedef {T extends "Regular" ? {
 *   "Regular": {
 *     txId: number[]
 *     utxoIdx: number
 *   }
 * } : {
 *   "Other": {
 *      tag: number
 *      data: number[]
 *   }
 * }} TxInputProps
 */

/**
 * @template {TxInputKinds} [T=TxInputKinds]
 */
export class TxInput {
    /**
     * @readonly
     * @type {TxInputProps<T>}
     */
    props

    /**
     * @param {TxInputProps<T>} props
     */
    constructor(props) {
        this.props = props
    }

    /**
     * @param {number[]} txId
     * @param {IntLike} utxoIdx
     * @returns {TxInput<"Regular">}
     */
    static Regular(txId, utxoIdx) {
        return new TxInput({ Regular: { txId, utxoIdx: toInt(utxoIdx) } })
    }

    /**
     * @param {IntLike} tag
     * @param {number[]} data
     * @returns {TxInput<"Other">}
     */
    static Other(tag, data) {
        return new TxInput({ Other: { tag: toInt(tag), data } })
    }

    /**
     * @param {ByteArrayLike} bytes
     * @returns {TxInput}
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        const [tag, decodeItem] = decodeTagged(stream)

        switch (tag) {
            case 0: {
                if (decodeItem(decodeTag) != 24n) {
                    throw new Error("unexpected TxInput tag")
                }

                const payload = decodeItem(decodeBytes)

                const [txId, utxoIdx] = decodeTuple(payload, [
                    decodeBytes,
                    decodeInt
                ])

                return TxInput.Regular(txId, utxoIdx)
            }
            case 1: {
                if (tag <= 0) {
                    throw new Error("invalid TxInput tag")
                }

                const data = decodeItem(decodeBytes)

                return TxInput.Other(tag, data)
            }
            default:
                throw new Error("unexpected TxInput tag")
        }
    }

    /**
     * @returns {this is TxInput<"Regular">}
     */
    isRegular() {
        return "Regular" in this.props
    }

    /**
     * @returns {this is TxInput<"Other">}
     */
    isOther() {
        return "Other" in this.props
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        if (this.isRegular()) {
            const props = this.props.Regular

            return encodeTuple([
                encodeInt(0),
                encodeTag(24).concat(
                    encodeBytes(
                        encodeTuple([
                            encodeBytes(props.txId),
                            encodeInt(props.utxoIdx)
                        ])
                    )
                )
            ])
        } else if (this.isOther()) {
            const props = this.props.Other

            return encodeTuple([encodeInt(props.tag), encodeBytes(props.data)])
        } else {
            throw new Error("unhandled Byreon TxInput kind")
        }
    }
}
