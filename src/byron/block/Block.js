import {
    decodeBytes,
    decodeInt,
    decodeList,
    decodeTagged,
    decodeTuple,
    encodeBytes,
    encodeInt,
    encodeList,
    encodeTuple
} from "@helios-lang/cbor"
import { ByteStream } from "@helios-lang/codec-utils"
import { BlockBody } from "./BlockBody.js"
import { BlockHeader } from "./BlockHeader.js"
import { EpochBoundaryHeader } from "./EpochBoundaryHeader.js"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("./StakeHolderId.js").StakeHolderId} StakeHolderId
 */

/**
 * @typedef {"EpochBoundary" | "Main"} BlockKinds
 */

/**
 * @template {BlockKinds} T
 * @typedef {T extends "EpochBoundary" ? {
 *   "EpochBoundary": {
 *     header: EpochBoundaryHeader
 *     body: StakeHolderId[]
 *   }
 * } : {
 *   "Main": {
 *     header: BlockHeader
 *     body: BlockBody
 *   }
 * }} BlockProps
 */

/**
 * @template {BlockKinds} [T=BlockKinds]
 */
export class Block {
    /**
     * @readonly
     * @type {BlockProps<T>}
     */
    props

    /**
     * @param {BlockProps<T>} props
     */
    constructor(props) {
        this.props = props
    }

    /**
     *
     * @param {EpochBoundaryHeader} header
     * @param {StakeHolderId[]} body
     * @returns {Block<"EpochBoundary">}
     */
    static EpochBoundary(header, body) {
        return new Block({
            EpochBoundary: {
                header: header,
                body: body
            }
        })
    }

    /**
     * @param {BlockHeader} header
     * @param {BlockBody} body
     * @returns {Block<"Main">}
     */
    static Main(header, body) {
        return new Block({
            Main: {
                header: header,
                body: body
            }
        })
    }

    /**
     * @param {ByteArrayLike} bytes
     * @returns {Block}
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        const [tag, decodeItem] = decodeTagged(stream)

        switch (tag) {
            case 0: {
                const [header, body, _extra] = decodeItem((stream) =>
                    decodeTuple(stream, [
                        EpochBoundaryHeader,
                        (stream) => decodeList(stream, decodeBytes),
                        (stream) => decodeList(stream, decodeInt)
                    ])
                )

                if (_extra.length != 0) {
                    throw new Error(
                        "unexpected extra data (according to spec this field isn't actually used during byron era)"
                    )
                }

                return Block.EpochBoundary(header, body)
            }
            case 1: {
                const [header, body, _extra] = decodeItem((stream) =>
                    decodeTuple(stream, [
                        BlockHeader,
                        BlockBody,
                        (stream) => decodeList(stream, decodeInt)
                    ])
                )

                if (_extra.length != 0) {
                    throw new Error(
                        "unexpected extra data (according to spec this field isn't actually used during byron era)"
                    )
                }

                return Block.Main(header, body)
            }
            default:
                throw new Error(`expected 0 or 1 byron Block tag, got ${tag}`)
        }
    }

    /**
     * @returns {this is Block<"EpochBoundary">}
     */
    isEpochBoundary() {
        return "EpochBoundary" in this.props
    }

    /**
     * @returns {this is Block<"Main">}
     */
    isMain() {
        return "Main" in this.props
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        if (this.isEpochBoundary()) {
            return encodeTuple([
                encodeInt(0),
                encodeTuple([
                    this.props.EpochBoundary.header.toCbor(),
                    encodeList(
                        this.props.EpochBoundary.body.map((id) =>
                            encodeBytes(id)
                        )
                    ),
                    encodeList([])
                ])
            ])
        } else if (this.isMain()) {
            return encodeTuple([
                encodeInt(1),
                encodeTuple([
                    this.props.Main.header.toCbor(),
                    this.props.Main.body.toCbor(),
                    encodeList([])
                ])
            ])
        } else {
            throw new Error("unhandled block kind")
        }
    }
}
