import {
    decodeBytes,
    decodeInt,
    decodeMap,
    decodeString,
    decodeTag,
    decodeTuple,
    encodeBytes,
    encodeInt,
    encodeMap,
    encodeString,
    encodeTag,
    encodeTuple
} from "@helios-lang/cbor"
import { UpdateParametersProposal } from "./UpdateParametersProposal.js"
import { ByteStream } from "@helios-lang/codec-utils"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("@helios-lang/codec-utils").IntLike} IntLike
 */

/**
 * @typedef {{
 *   blockVersion: [IntLike, IntLike, IntLike],
 *   parameters: UpdateParametersProposal,
 *   softwareVersion: [string, IntLike]
 *   data: [string, [number[], number[], number[], number[]]]
 *   proposer: number[]
 *   signature: number[]
 * }} UpdateProposalProps
 */

export class UpdateProposal {
    /**
     *
     * @param {UpdateProposalProps} props
     */
    constructor({
        blockVersion,
        parameters,
        softwareVersion,
        data,
        proposer,
        signature
    }) {
        this.blockVersion = blockVersion
        this.parameters = parameters
        this.softwareVersion = softwareVersion
        this.data = data
        this.proposer = proposer
        this.signature = signature
    }

    /**
     *
     * @param {ByteArrayLike} bytes
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        const [
            blockVersion,
            parameters,
            softwareVersion,
            data,
            attributes,
            proposer,
            signature
        ] = decodeTuple(stream, [
            (s) => decodeTuple(s, [decodeInt, decodeInt, decodeInt]),
            UpdateParametersProposal,
            (s) => decodeTuple(s, [decodeString, decodeInt]),
            (s) => {
                if (decodeTag(s) != 258n) {
                    throw new Error("unexpected tag")
                }

                return decodeTuple(s, [
                    decodeString,
                    (s) =>
                        decodeTuple(s, [
                            decodeBytes,
                            decodeBytes,
                            decodeBytes,
                            decodeBytes
                        ])
                ])
            },
            (s) => decodeMap(s, decodeInt, decodeInt),
            decodeBytes,
            decodeBytes
        ])

        if (attributes.length != 0) {
            throw new Error("unexpected attributes")
        }

        return new UpdateProposal({
            blockVersion,
            parameters,
            softwareVersion,
            data,
            proposer,
            signature
        })
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([
            encodeTuple([
                encodeInt(this.blockVersion[0]),
                encodeInt(this.blockVersion[1]),
                encodeInt(this.blockVersion[2])
            ]),
            this.parameters.toCbor(),
            encodeTuple([
                encodeString(this.softwareVersion[0]),
                encodeInt(this.softwareVersion[1])
            ]),
            encodeTag(258).concat(
                encodeTuple([
                    encodeString(this.data[0]),
                    encodeTuple([
                        encodeBytes(this.data[1][0]),
                        encodeBytes(this.data[1][0]),
                        encodeBytes(this.data[1][0]),
                        encodeBytes(this.data[1][0])
                    ])
                ])
            ),
            encodeMap([]),
            encodeBytes(this.proposer),
            encodeBytes(this.signature)
        ])
    }
}
