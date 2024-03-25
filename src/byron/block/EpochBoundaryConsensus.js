import {
    decodeInt,
    decodeTuple,
    encodeInt,
    encodeTuple
} from "@helios-lang/cbor"
import { ByteStream } from "@helios-lang/codec-utils"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 */

export class EpochBoundaryConsensus {
    /**
     * @readonly
     * @type {number}
     */
    epochId

    /**
     * @readonly
     * @type {bigint}
     */
    difficulty

    /**
     * @param {bigint | number} epochId
     * @param {bigint | number} difficulty
     */
    constructor(epochId, difficulty) {
        this.epochId = Number(epochId)
        this.difficulty = BigInt(difficulty)
    }

    /**
     * @param {ByteArrayLike} bytes
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        const [epochId, [difficulty]] = decodeTuple(stream, [
            decodeInt,
            (stream) => decodeTuple(stream, [decodeInt])
        ])

        return new EpochBoundaryConsensus(epochId, difficulty)
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([
            encodeInt(this.epochId),
            encodeTuple([encodeInt(this.difficulty)])
        ])
    }
}
