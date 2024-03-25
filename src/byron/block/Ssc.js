import {
    decodeTagged,
    encodeInt,
    encodeList,
    encodeMap,
    encodeTag,
    encodeTuple
} from "@helios-lang/cbor"
import { SscCertificates } from "./SscCertificates.js"
import { SscCommitments } from "./SscCommitments.js"
import { SscOpenings } from "./SscOpenings.js"
import { SscShares } from "./SscShares.js"
import { ByteStream } from "@helios-lang/codec-utils"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 */

/**
 * @typedef {"Commitments" | "Openings" | "Shares" | "Certificates"} SscKinds
 */

/**
 * @template {SscKinds} T
 * @typedef {T extends "Commitments" ? {
 *   "Commitments": {
 *     commitments: SscCommitments
 *     certificates: SscCertificates
 *   }
 * } : T extends "Openings" ? {
 *   "Openings": {
 *     openings: SscOpenings
 *     certificates: SscCertificates
 *   }
 * } : T extends "Shares" ? {
 *   "Shares": {
 *     shares: SscShares
 *     certificates: SscCertificates
 *   }
 * } : {
 *   "Certificates": {
 *     certificates: SscCertificates
 *   }
 * }} SscProps
 */

/**
 * @template {SscKinds} [T=SscKinds]
 */
export class Ssc {
    /**
     * @readonly
     * @type {SscProps<T>}
     */
    props

    /**
     * @param {SscProps<T>} props
     */
    constructor(props) {
        this.props = props
    }

    /**
     * @param {SscCommitments} commitments
     * @param {SscCertificates} certificates
     * @returns {Ssc<"Commitments">}
     */
    static Commitments(commitments, certificates) {
        return new Ssc({
            Commitments: {
                commitments,
                certificates
            }
        })
    }

    /**
     * @param {SscOpenings} openings
     * @param {SscCertificates} certificates
     * @returns {Ssc<"Openings">}
     */
    static Openings(openings, certificates) {
        return new Ssc({
            Openings: {
                openings,
                certificates
            }
        })
    }

    /**
     * @param {SscShares} shares
     * @param {SscCertificates} certificates
     * @returns {Ssc<"Shares">}
     */
    static Shares(shares, certificates) {
        return new Ssc({
            Shares: {
                shares,
                certificates
            }
        })
    }

    /**
     * @param {SscCertificates} certificates
     * @returns {Ssc<"Certificates">}
     */
    static Certificates(certificates) {
        return new Ssc({ Certificates: { certificates } })
    }

    /**
     * @param {ByteArrayLike} bytes
     * @returns {Ssc}
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        const [tag, decodeItem] = decodeTagged(stream)

        switch (tag) {
            case 0: {
                const commitments = decodeItem(SscCommitments)
                const certificates = decodeItem(SscCertificates)

                return Ssc.Commitments(commitments, certificates)
            }
            case 1: {
                const openings = decodeItem(SscOpenings)
                const certificates = decodeItem(SscCertificates)

                return Ssc.Openings(openings, certificates)
            }
            case 2: {
                const shares = decodeItem(SscShares)
                const certificates = decodeItem(SscCertificates)

                return Ssc.Shares(shares, certificates)
            }
            case 3: {
                const certificates = decodeItem(SscCertificates)

                return Ssc.Certificates(certificates)
            }
            default:
                throw new Error("unexpected Byron Ssc tag")
        }
    }

    /**
     * @returns {this is Ssc<"Commitments">}
     */
    isCommitments() {
        return "Commitments" in this.props
    }

    /**
     * @returns {this is Ssc<"Openings">}
     */
    isOpenings() {
        return "Openings" in this.props
    }

    /**
     * @returns {this is Ssc<"Shares">}
     */
    isShares() {
        return "Shares" in this.props
    }

    /**
     * @returns {this is Ssc<"Certificates">}
     */
    isCertificate() {
        return "Certificates" in this.props
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        if (this.isCommitments()) {
            const props = this.props.Commitments

            return encodeTuple([
                encodeInt(0),
                props.commitments.toCbor(),
                props.certificates.toCbor()
            ])
        } else if (this.isOpenings()) {
            const props = this.props.Openings

            return encodeTuple([
                encodeInt(1),
                props.openings.toCbor(),
                props.certificates.toCbor()
            ])
        } else if (this.isShares()) {
            const props = this.props.Shares

            return encodeTuple([
                encodeInt(2),
                props.shares.toCbor(),
                props.certificates.toCbor()
            ])
        } else if (this.isCertificate()) {
            const props = this.props.Certificates

            return encodeTuple([encodeInt(3), props.certificates.toCbor()])
        } else {
            throw new Error("unhandled Ssc kind")
        }
    }
}
