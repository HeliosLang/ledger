import {
    decodeBytes,
    decodeInt,
    decodeTagged,
    decodeTuple,
    encodeBytes,
    encodeInt,
    encodeTuple
} from "@helios-lang/cbor"
import { ByteStream, toInt } from "@helios-lang/codec-utils"
import { EpochDelegation } from "./EpochDelegation.js"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("@helios-lang/codec-utils").IntLike} IntLike
 */

/**
 * @typedef {"GenesisKey" | "EpochRangeDelegation" | "EpochDelegation" } BlockSignatureKinds
 */

/**
 * @template {BlockSignatureKinds} T
 * @typedef {T extends "GenesisKey" ? {
 *   "GenesisKey": {
 *     signature: number[]
 *   }
 * } : T extends "EpochRangeDelegation" ? {
 *   "EpochRangeDelegation": {
 *     epochRange: [number, number],
 *     issuer: number[]
 *     delegate: number[]
 *     certificate: number[]
 *     signature: number[]
 *   }
 * } : {
 *   "EpochDelegation": {
 *     delegation: EpochDelegation
 *     signature: number[]
 *   }
 * }} BlockSignatureProps
 */

/**
 * @template {BlockSignatureKinds} [T=BlockSignatureKinds]
 */
export class BlockSignature {
    /**
     * @readonly
     * @type {BlockSignatureProps<T>}
     */
    props

    /**
     * @param {BlockSignatureProps<T>} props
     */
    constructor(props) {
        this.props = props
    }

    /**
     * @param {number[]} signature
     * @returns {BlockSignature<"GenesisKey">}
     */
    static GenesisKey(signature) {
        return new BlockSignature({ GenesisKey: { signature: signature } })
    }

    /**
     * @param {[IntLike, IntLike]} epochRange
     * @param {number[]} issuer
     * @param {number[]} delegate
     * @param {number[]} certificate
     * @param {number[]} signature
     * @returns {BlockSignature<"EpochRangeDelegation">}
     */
    static EpochRangeDelegation(
        epochRange,
        issuer,
        delegate,
        certificate,
        signature
    ) {
        return new BlockSignature({
            EpochRangeDelegation: {
                epochRange: [toInt(epochRange[0]), toInt(epochRange[1])],
                issuer,
                delegate,
                certificate,
                signature
            }
        })
    }

    /**
     * @param {EpochDelegation} delegation
     * @param {number[]} signature
     * @returns {BlockSignature<"EpochDelegation">}
     */
    static EpochDelegation(delegation, signature) {
        return new BlockSignature({
            EpochDelegation: {
                delegation,
                signature
            }
        })
    }

    /**
     * @param {ByteArrayLike} bytes
     * @returns {BlockSignature}
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        const [tag, decodeItem] = decodeTagged(stream)

        switch (tag) {
            case 0: {
                const signature = decodeItem(decodeBytes)
                return BlockSignature.GenesisKey(signature)
            }
            case 1: {
                const [[epochRange, issuer, delegate, certificate], signature] =
                    decodeItem((stream) =>
                        decodeTuple(stream, [
                            (stream) =>
                                decodeTuple(stream, [
                                    (stream) =>
                                        decodeTuple(stream, [
                                            decodeInt,
                                            decodeInt
                                        ]),
                                    decodeBytes,
                                    decodeBytes,
                                    decodeBytes
                                ]),
                            decodeBytes
                        ])
                    )

                return BlockSignature.EpochRangeDelegation(
                    epochRange,
                    issuer,
                    delegate,
                    certificate,
                    signature
                )
            }
            case 2: {
                const [delegation, signature] = decodeItem((stream) =>
                    decodeTuple(stream, [EpochDelegation, decodeBytes])
                )

                return BlockSignature.EpochDelegation(delegation, signature)
            }
            default:
                throw new Error(
                    `expected 0, 1 or 2 tag for byron BlockSignature, got ${tag}`
                )
        }
    }

    /**
     * @returns {this is BlockSignature<"GenesisKey">}
     */
    isGenesisKey() {
        return "GenesisKey" in this.props
    }

    /**
     * @returns {this is BlockSignature<"EpochRangeDelegation">}
     */
    isEpochRangeDelegation() {
        return "EpochRangeDelegation" in this.props
    }

    /**
     * @returns {this is BlockSignature<"EpochDelegation">}
     */
    isEpochDelegation() {
        return "EpochDelegation" in this.props
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        if (this.isGenesisKey()) {
            return encodeTuple([
                encodeInt(0),
                encodeBytes(this.props.GenesisKey.signature)
            ])
        } else if (this.isEpochRangeDelegation()) {
            const props = this.props.EpochRangeDelegation

            return encodeTuple([
                encodeInt(1),
                encodeTuple([
                    encodeTuple([
                        encodeTuple([
                            encodeInt(props.epochRange[0]),
                            encodeInt(props.epochRange[1])
                        ]),
                        encodeBytes(props.issuer),
                        encodeBytes(props.delegate),
                        encodeBytes(props.certificate)
                    ]),
                    encodeBytes(props.signature)
                ])
            ])
        } else if (this.isEpochDelegation()) {
            const props = this.props.EpochDelegation

            return encodeTuple([
                encodeInt(2),
                encodeTuple([
                    props.delegation.toCbor(),
                    encodeBytes(props.signature)
                ])
            ])
        } else {
            throw new Error("unhandled BlockSignature type")
        }
    }
}
