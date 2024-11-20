import { encodeInt, encodeTuple } from "@helios-lang/cbor"
import { makeConstrData } from "@helios-lang/uplc"
import {
    convertStakingCredentialToUplcData,
    encodeStakingCredential
} from "../address/index.js"

/**
 * @import { ConstrData } from "@helios-lang/uplc"
 * @import { DeregistrationDCert, StakingCredential } from "src/index.js"
 */

/**
 * @param {StakingCredential} credential
 * @returns {DeregistrationDCert}
 */
export function makeDeregistrationDCert(credential) {
    return new DeregistrationDCertImpl(credential)
}

/**
 * Confusingly the DCerts in the script context uses full StakingCredentials (which can be Staking Pointer), but the Cbor ledger format only encodes the StakingHash (presumably resolving Staking Ptrs to Staking Hashes)
 * @implements {DeregistrationDCert}
 */
class DeregistrationDCertImpl {
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
     * @type {"DeregistrationDCert"}
     */
    get kind() {
        return "DeregistrationDCert"
    }

    /**
     * @type {1}
     */
    get tag() {
        return 1
    }

    /**
     * @returns {object}
     */
    dump() {
        return {
            dcertType: "Deregister"
        }
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([
            encodeInt(1),
            encodeStakingCredential(this.credential)
        ])
    }

    /**
     * @returns {ConstrData}
     */
    toUplcData() {
        return makeConstrData({
            tag: 1,
            fields: [convertStakingCredentialToUplcData(this.credential)]
        })
    }
}
