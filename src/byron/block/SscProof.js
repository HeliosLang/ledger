import { ByteStream } from "@helios-lang/codec-utils"
import {
    decodeBytes,
    decodeTagged,
    encodeBytes,
    encodeInt,
    encodeTuple
} from "@helios-lang/cbor"
/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 */

/**
 * @typedef {"Commitments" | "Openings" | "Shares" | "Certificates"} SscProofKinds
 */

/**
 * @template {SscProofKinds} T
 * @typedef {T extends "Commitments" ? {
 *   "Commitments": {
 *     commitmentsHash: number[],
 *      certificatesHash: number[]
 *   }
 * } : T extends "Openings" ? {
 *   "Openings": {
 *     openingsHash: number[]
 *     certificatesHash: number[]
 *   }
 * } : T extends "Shares" ? {
 *   "Shares": {
 *     sharesHash: number[]
 *     certificatesHash: number[]
 *   }
 * } : {
 *   "Certificates": {
 *     certificatesHash: number[]
 *   }
 * }} SscProofProps
 */

/**
 * Ssc stands for Shared Seed Computation
 * Vss stands for Verifiable Secret Sharing
 * @template {SscProofKinds} [T=SscProofKinds]
 */
export class SscProof {
    /**
     * @readonly
     * @type {SscProofProps<T>}
     */
    props

    /**
     * @param {SscProofProps<T>} props
     */
    constructor(props) {
        this.props = props
    }

    /**
     * Creates a Commitments with the given hashes of the SSC commitments and certificates lists.
     * @param {number[]} commitmentsHash - Hash of the list of SSC commitments.
     * @param {number[]} certificatesHash - Hash of the list of SSC certificates.
     * @returns {SscProof<"Commitments">}
     */
    static Commitments(commitmentsHash, certificatesHash) {
        return new SscProof({
            Commitments: {
                commitmentsHash: commitmentsHash,
                certificatesHash: certificatesHash
            }
        })
    }

    /**
     * @param {number[]} openingsHash
     * @param {number[]} certificatesHash
     * @returns {SscProof<"Openings">}
     */
    static Openings(openingsHash, certificatesHash) {
        return new SscProof({
            Openings: {
                openingsHash,
                certificatesHash
            }
        })
    }

    /**
     * @param {number[]} sharesHash
     * @param {number[]} certificatesHash
     * @returns {SscProof<"Shares">}
     */
    static Shares(sharesHash, certificatesHash) {
        return new SscProof({ Shares: { sharesHash, certificatesHash } })
    }

    /**
     * @param {number[]} certificatesHash
     * @returns {SscProof<"Certificates">}
     */
    static Certificates(certificatesHash) {
        return new SscProof({ Certificates: { certificatesHash } })
    }

    /**
     * Decodes an SscProof from a CBOR byte stream.
     * @param {ByteArrayLike} bytes
     * @returns {SscProof}
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        const [tag, decodeItem] = decodeTagged(stream)

        switch (tag) {
            case 0:
                return SscProof.Commitments(
                    decodeItem(decodeBytes),
                    decodeItem(decodeBytes)
                )
            case 1:
                return SscProof.Openings(
                    decodeItem(decodeBytes),
                    decodeItem(decodeBytes)
                )
            case 2:
                return SscProof.Shares(
                    decodeItem(decodeBytes),
                    decodeItem(decodeBytes)
                )
            case 3:
                return SscProof.Certificates(decodeItem(decodeBytes))
            default:
                throw new Error(
                    `expected 0, 1, 2 or 3 tag for SscProof, got ${tag}`
                )
        }
    }

    /**
     * Checks if the proof is a Commitments.
     * @returns {this is SscProof<"Commitments">}
     */
    isCommitments() {
        return "Commitments" in this.props
    }

    /**
     * Checks if the proof is an Openings.
     * @returns {this is SscProof<"Openings">}
     */
    isOpenings() {
        return "Openings" in this.props
    }

    /**
     * Checks if the proof is a Shares.
     * @returns {this is SscProof<"Shares">}
     */
    isShares() {
        return "Shares" in this.props
    }

    /**
     * Checks if the proof is a Certificates.
     * @returns {this is SscProof<"Certificates">}
     */
    isCertificate() {
        return "Certificates" in this.props
    }

    /**
     * Encodes this SscProof to a CBOR byte stream.
     * @returns {number[]}
     */
    toCbor() {
        if (this.isCommitments()) {
            const props = this.props.Commitments

            return encodeTuple([
                encodeInt(0),
                encodeBytes(props.commitmentsHash),
                encodeBytes(props.certificatesHash)
            ])
        } else if (this.isOpenings()) {
            const props = this.props.Openings

            return encodeTuple([
                encodeInt(1),
                encodeBytes(props.openingsHash),
                encodeBytes(props.certificatesHash)
            ])
        } else if (this.isShares()) {
            const props = this.props.Shares

            return encodeTuple([
                encodeInt(2),
                encodeBytes(props.sharesHash),
                encodeBytes(props.certificatesHash)
            ])
        } else if (this.isCertificate()) {
            const props = this.props.Certificates

            return encodeTuple([
                encodeInt(3),
                encodeBytes(props.certificatesHash)
            ])
        } else {
            throw new Error("unhandled SscProof type")
        }
    }
}
