import { None } from "@helios-lang/type-utils"
import { ConstrData } from "@helios-lang/uplc"
import { PubKeyHash, ValidatorHash } from "../hashes/index.js"

/**
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 * @typedef {import("../hashes/index.js").PubKeyHashLike} PubKeyHashLike
 * @typedef {import("../hashes/index.js").ValidatorHashLike} ValidatorHashLike
 */

/**
 * @typedef {"PubKey" | "Validator"} PaymentCredentialKind
 */

/**
 * @template {PaymentCredentialKind} T
 * @typedef {T extends "PubKey" ? {
 *   hash: PubKeyHash
 * } : {
 *   hash: ValidatorHash
 * }} PaymentCredentialProps
 */

/**
 * @typedef {PaymentCredential | PubKeyHash | ValidatorHash} PaymentCredentialLike
 */

/**
 * @template {PaymentCredentialKind} [T=PaymentCredentialKind]
 */
export class PaymentCredential {
    /**
     * @private
     * @readonly
     * @type {T}
     */
    kind

    /**
     * @readonly
     * @type {PaymentCredentialProps<T>}
     */
    props

    /**
     * @private
     * @param {T} kind
     * @param {PaymentCredentialProps<T>} props
     */
    constructor(kind, props) {
        this.kind = kind
        this.props = props
    }

    /**
     * @param {PubKeyHashLike} hash
     * @returns {PaymentCredential<"PubKey">}
     */
    static PubKey(hash) {
        return new PaymentCredential("PubKey", {
            hash: PubKeyHash.fromAlike(hash)
        })
    }

    /**
     * @param {ValidatorHashLike} hash
     * @returns {PaymentCredential<"Validator">}
     */
    static Validator(hash) {
        return new PaymentCredential("Validator", {
            hash: ValidatorHash.fromAlike(hash)
        })
    }

    /**
     * @param {number[]} bytes
     * @returns {PaymentCredential}
     */
    static fromAddressBytes(bytes) {
        if (bytes.length < 29) {
            throw new Error(
                `expected at least 29 bytes, got ${bytes.length} bytes`
            )
        }

        const head = bytes[0]
        const paymentPart = bytes.slice(1, 29)

        const type = head >> 4

        if (type % 2 == 1) {
            return PaymentCredential.Validator(paymentPart)
        } else {
            return PaymentCredential.PubKey(paymentPart)
        }
    }

    /**
     * @param {PaymentCredentialLike} arg
     * @returns {PaymentCredential}
     */
    static fromAlike(arg) {
        return arg instanceof PaymentCredential
            ? arg
            : arg instanceof PubKeyHash
              ? PaymentCredential.PubKey(arg)
              : PaymentCredential.Validator(arg)
    }

    /**
     *
     * @param {UplcData} data
     * @returns {PaymentCredential}
     */
    static fromUplcData(data) {
        ConstrData.assert(data, 0, 1)

        switch (data.tag) {
            case 0:
                return PaymentCredential.PubKey(
                    PubKeyHash.fromUplcData(data.fields[0])
                )
            case 1:
                return PaymentCredential.Validator(
                    ValidatorHash.fromUplcData(data.fields[0])
                )
            default:
                throw new Error(
                    `unexpected Credential ConstrData tag ${data.tag}`
                )
        }
    }

    /**
     * @returns {this is PaymentCredential<"PubKey">}
     */
    isPubKey() {
        return this.kind == "PubKey"
    }

    /**
     * @returns {this is PaymentCredential<"Validator">}
     */
    isValidator() {
        return this.kind == "Validator"
    }

    /**
     * @type {number[]}
     */
    get bytes() {
        return this.props.hash.bytes
    }

    /**
     * @type {T extends "PubKey" ? PubKeyHash : T extends "Validator" ? ValidatorHash : (PubKeyHash | ValidatorHash)}
     */
    get hash() {
        return /** @type {any} */ (this.props.hash)
    }

    /**
     * @type {T extends "PubKey" ? PubKeyHash : T extends "Validator" ? typeof None : Option<PubKeyHash>}
     */
    get pubKeyHash() {
        return /** @type {any} */ (this.isPubKey() ? this.props.hash : None)
    }

    /**
     * @type {T extends "Validator" ? ValidatorHash : T extends "PubKey" ? typeof None : Option<ValidatorHash>}
     */
    get validatorHash() {
        return /** @type {any} */ (this.isValidator() ? this.props.hash : None)
    }

    /**
     * @returns {UplcData}
     */
    toUplcData() {
        return new ConstrData(this.isValidator() ? 1 : 0, [
            this.hash.toUplcData()
        ])
    }
}
