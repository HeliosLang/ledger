import {
    decodeBytes,
    decodeMap,
    encodeBytes,
    encodeMap
} from "@helios-lang/cbor"
import { ByteStream, compareBytes } from "@helios-lang/codec-utils"
import { SscShare } from "./SscShare.js"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 */

export class SscShares {
    /**
     * @param {SscShare[]} shares
     */
    constructor(shares) {
        this.shares = shares
    }

    /**
     * @param {ByteArrayLike} bytes
     * @returns {SscShares}
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        const m = decodeMap(stream, decodeBytes, SscShare)

        if (
            !m.every(([key, value]) => compareBytes(key, value.addressId) == 0)
        ) {
            throw new Error("addressId inconsistency in Byron SscShares")
        }

        return new SscShares(m.map(([_key, value]) => value))
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeMap(
            this.shares.map((share) => [
                encodeBytes(share.addressId),
                share.toCbor()
            ])
        )
    }
}
