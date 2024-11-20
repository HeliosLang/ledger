import { encodeInt, encodeTuple } from "@helios-lang/cbor"
import { makeConstrData } from "@helios-lang/uplc"
import {
    convertStakingCredentialToUplcData,
    encodeStakingCredential
} from "../address/index.js"

/**
 * @import { ConstrData, UplcData } from "@helios-lang/uplc"
 * @import { RegistrationDCert, StakingCredential } from "src/index.js"
 */

/**
 * @typedef {"Register" | "Deregister" | "Delegate" | "RegisterPool" | "RetirePool" } DCertKind
 */

/**
 * @param {StakingCredential} credential
 * @returns {RegistrationDCert}
 */
export function makeRegistrationDCert(credential) {
    return new RegistrationDCertImpl(credential)
}
/**
 * Confusingly the DCerts in the script context uses full StakingCredentials (which can be Staking Pointer), but the Cbor ledger format only encodes the StakingHash (presumably resolving Staking Ptrs to Staking Hashes)
 * @implements {RegistrationDCert}
 */
class RegistrationDCertImpl {
    /**
     * @readonly
     * @type {StakingCredential}
     */
    credential

    /**
     * @param {StakingCredential} credential
     */
    constructor(credential) {
        this.credential = credential
    }

    /**
     * @type {"RegistrationDCert"}
     */
    get kind() {
        return "RegistrationDCert"
    }

    /**
     * @type {0}
     */
    get tag() {
        return 0
    }

    /**
     * @returns {object}
     */
    dump() {
        return {
            dcertType: "Register"
        }
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([
            encodeInt(0),
            encodeStakingCredential(this.credential)
        ])
    }

    /**
     * @returns {ConstrData}
     */
    toUplcData() {
        return makeConstrData({
            tag: 0,
            fields: [convertStakingCredentialToUplcData(this.credential)]
        })
    }
}
