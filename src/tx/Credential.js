import { None } from "@helios-lang/type-utils"
import { ConstrData } from "@helios-lang/uplc"
import { PubKeyHash, ValidatorHash } from "../hashes/index.js"

/**
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 */

/**
 * @typedef {Credential | PubKeyHash | ValidatorHash} CredentialLike
 */

export class Credential {
    /**
     * @readonly
     * @type {PubKeyHash | ValidatorHash}
     */
    hash

    /**
     * @param {Exclude<CredentialLike, Credential>} hash
     */
    constructor(hash) {
        this.hash = hash
    }

    /**
     * @param {number[]} bytes
     * @returns {Credential}
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
            return new Credential(new ValidatorHash(paymentPart))
        } else {
            return new Credential(new PubKeyHash(paymentPart))
        }
    }

    /**
     * @param {CredentialLike} arg
     * @returns {Credential}
     */
    static fromAlike(arg) {
        return arg instanceof Credential ? arg : new Credential(arg)
    }

    /**
     *
     * @param {UplcData} data
     * @returns {Credential}
     */
    static fromUplcData(data) {
        ConstrData.assert(data, 0, 1)

        switch (data.tag) {
            case 0:
                return new Credential(PubKeyHash.fromUplcData(data.fields[0]))
            case 1:
                return new Credential(
                    ValidatorHash.fromUplcData(data.fields[0])
                )
            default:
                throw new Error(
                    `unexpected Credential ConstrData tag ${data.tag}`
                )
        }
    }

    /**
     * @type {number[]}
     */
    get bytes() {
        return this.hash.bytes
    }

    /**
     * @type {Option<PubKeyHash>}
     */
    get pubKeyHash() {
        return this.hash instanceof PubKeyHash ? this.hash : None
    }

    /**
     * @type {Option<ValidatorHash>}
     */
    get validatorHash() {
        return this.hash instanceof ValidatorHash ? this.hash : None
    }

    /**
     * @returns {boolean}
     */
    isPubKey() {
        return this.hash instanceof PubKeyHash
    }

    /**
     * @returns {boolean}
     */
    isValidator() {
        return this.hash instanceof ValidatorHash
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
