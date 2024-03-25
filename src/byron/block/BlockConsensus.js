import {
    decodeBytes,
    decodeInt,
    decodeTuple,
    encodeBytes,
    encodeInt,
    encodeList,
    encodeTuple
} from "@helios-lang/cbor"
import { ByteStream } from "@helios-lang/codec-utils"
import { BlockSignature } from "./BlockSignature.js"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 */

export class BlockConsensus {
    /**
     * @param {bigint} slotId
     * @param {number[]} pubKey
     * @param {bigint} difficulty
     * @param {BlockSignature} signature
     */
    constructor(slotId, pubKey, difficulty, signature) {
        this.slotId = slotId
        this.pubKey = pubKey
        this.difficulty = difficulty
        this.signature = signature
    }

    /**
     * @param {ByteArrayLike} bytes
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        const [slotId, pubKey, [difficulty], signature] = decodeTuple(stream, [
            decodeInt,
            decodeBytes,
            (stream) => decodeTuple(stream, [decodeInt]),
            BlockSignature
        ])

        return new BlockConsensus(slotId, pubKey, difficulty, signature)
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([
            encodeInt(this.slotId),
            encodeBytes(this.pubKey),
            encodeList([encodeInt(this.difficulty)]),
            this.signature.toCbor()
        ])
    }
}
