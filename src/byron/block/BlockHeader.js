import {
    decodeBytes,
    decodeInt,
    decodeTuple,
    encodeBytes,
    encodeInt,
    encodeTuple
} from "@helios-lang/cbor"
import { ByteStream } from "@helios-lang/codec-utils"
import { BlockConsensus } from "./BlockConsensus.js"
import { BlockProof } from "./BlockProof.js"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 */

/**
 * @typedef {{
 *   protocolMagic: number | bigint
 *   prevBlock: number[]
 *   bodyProof: BlockProof
 *   consensusData: BlockConsensus
 * }} BlockHeaderProps
 */

export class BlockHeader {
    /**
     * @param {BlockHeaderProps} props
     */
    constructor({ protocolMagic, prevBlock, bodyProof, consensusData }) {
        this.protocolMagic = Number(protocolMagic)
        this.prevBlock = prevBlock
        this.bodyProof = bodyProof
        this.consensusData = consensusData
    }

    /**
     * @param {ByteArrayLike} bytes
     * @returns {BlockHeader}
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        const [protocolMagic, prevBlock, bodyProof, consensusData] =
            decodeTuple(stream, [
                decodeInt,
                decodeBytes,
                BlockProof,
                BlockConsensus
            ])

        return new BlockHeader({
            protocolMagic,
            prevBlock,
            bodyProof,
            consensusData
        })
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([
            encodeInt(this.protocolMagic),
            encodeBytes(this.prevBlock),
            this.bodyProof.toCbor(),
            this.consensusData.toCbor()
        ])
    }
}
