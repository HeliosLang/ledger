import { decodeList, decodeTag, encodeList, encodeTag } from "@helios-lang/cbor"
import { SscCommitment } from "./SscCommitment.js"
import { ByteStream } from "@helios-lang/codec-utils"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 */

export class SscCommitments {
    /**
     * @param {SscCommitment[]} commitments
     */
    constructor(commitments) {
        this.commitments = commitments
    }

    /**
     *
     * @param {ByteArrayLike} bytes
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        const tag = decodeTag(stream)

        if (tag != 258n) {
            throw new Error(
                `expected tag 258 for Byron Ssc Commitments, got ${tag}`
            )
        }

        return new SscCommitments(decodeList(stream, SscCommitment))
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTag(258).concat(encodeList(this.commitments))
    }
}
