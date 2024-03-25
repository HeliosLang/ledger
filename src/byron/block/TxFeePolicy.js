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
import { ByteStream } from "@helios-lang/codec-utils"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 */

/**
 * @typedef {"Regular" | "Other"} TxFeePolicyKinds
 */

/**
 * @template {TxFeePolicyKinds} T
 * @typedef {T extends "Regular" ? {
 *   "Regular": {
 *     a: bigint
 *     b: bigint
 *   }
 * } : {
 *   "Other": {
 *     tag: number
 *     data: number[]
 *   }
 * }} TxFeePolicyProps
 */

/**
 * @template {TxFeePolicyKinds} [T=TxFeePolicyKinds]
 */
export class TxFeePolicy {
    /**
     * @readonly
     * @type {TxFeePolicyProps<T>}
     */
    props

    /**
     *
     * @param {TxFeePolicyProps<T>} props
     */
    constructor(props) {
        this.props = props
    }

    /**
     * @param {number | bigint} a
     * @param {number | bigint} b
     * @returns {TxFeePolicy<"Regular">}
     */
    static Regular(a, b) {
        return new TxFeePolicy({ Regular: { a: BigInt(a), b: BigInt(b) } })
    }

    /**
     * @param {number | bigint} tag
     * @param {number[]} data
     * @returns {TxFeePolicy<"Other">}
     */
    static Other(tag, data) {
        return new TxFeePolicy({ Other: { tag: Number(tag), data } })
    }

    /**
     *
     * @param {ByteArrayLike} bytes
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        const [tag, decodeItem] = decodeTagged(stream)

        switch (tag) {
            case 0: {
                const t24 = decodeItem(decodeTag)

                if (t24 != 24n) {
                    throw new Error("unexpected tag")
                }

                const payload = decodeItem(decodeBytes)

                const [a, b] = decodeTuple(payload, [decodeInt, decodeInt])

                return TxFeePolicy.Regular(a, b)
            }
            default: {
                if (tag <= 0) {
                    throw new Error("inavlid Byron TxFeePolicy CBOR tag")
                }

                const data = decodeItem(decodeBytes)

                return TxFeePolicy.Other(tag, data)
            }
        }
    }

    /**
     * @returns {this is TxFeePolicy<"Regular">}
     */
    isRegular() {
        return "Regular" in this.props
    }

    /**
     * @returns {this is TxFeePolicy<"Other">}
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
                        encodeTuple([encodeInt(props.a), encodeInt(props.b)])
                    )
                )
            ])
        } else if (this.isOther()) {
            const props = this.props.Other

            return encodeTuple([encodeInt(props.tag), encodeBytes(props.data)])
        } else {
            throw new Error("unhandle Byron TxFeePolicy type")
        }
    }
}
