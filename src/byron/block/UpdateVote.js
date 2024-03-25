import {
    decodeBool,
    decodeBytes,
    decodeTuple,
    encodeBool,
    encodeBytes,
    encodeTuple
} from "@helios-lang/cbor"
import { ByteStream } from "@helios-lang/codec-utils"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 */

export class UpdateVote {
    /**
     * @param {number[]} voter
     * @param {number[]} proposalId
     * @param {boolean} vote
     * @param {number[]} signature
     */
    constructor(voter, proposalId, vote, signature) {
        this.voter = voter
        this.proposalId = proposalId
        this.vote = vote
        this.signature = signature
    }

    /**
     * @param {ByteArrayLike} bytes
     * @returns {UpdateVote}
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        const [voter, proposalId, vote, signature] = decodeTuple(stream, [
            decodeBytes,
            decodeBytes,
            decodeBool,
            decodeBytes
        ])

        return new UpdateVote(voter, proposalId, vote, signature)
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([
            encodeBytes(this.voter),
            encodeBytes(this.proposalId),
            encodeBool(this.vote),
            encodeBytes(this.signature)
        ])
    }
}
