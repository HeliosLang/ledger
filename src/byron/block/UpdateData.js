import {
    decodeList,
    decodeListOption,
    decodeTuple,
    encodeList,
    encodeTuple
} from "@helios-lang/cbor"
import { ByteStream } from "@helios-lang/codec-utils"
import { None } from "@helios-lang/type-utils"
import { UpdateProposal } from "./UpdateProposal.js"
import { UpdateVote } from "./UpdateVote.js"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 */

export class UpdateData {
    /**
     * @param {Option<UpdateProposal>} proposal
     * @param {UpdateVote[]} votes
     */
    constructor(proposal, votes) {
        this.proposal = proposal
        this.votes = votes
    }

    /**
     * @param {ByteArrayLike} bytes
     * @returns {UpdateData}
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        const [proposal, votes] = decodeTuple(stream, [
            (stream) => decodeListOption(stream, UpdateProposal),
            (stream) => decodeList(stream, UpdateVote)
        ])

        return new UpdateData(proposal, votes)
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([
            encodeList(this.proposal ? [this.proposal] : []),
            encodeList(this.votes)
        ])
    }
}
