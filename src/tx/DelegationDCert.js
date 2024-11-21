import { encodeInt, encodeTuple } from "@helios-lang/cbor"
import { makeConstrData } from "@helios-lang/uplc"
import {
    convertStakingCredentialToUplcData,
    encodeStakingCredential
} from "../address/index.js"

/**
 * @import { ConstrData } from "@helios-lang/uplc"
 * @import { DelegationDCert, PubKeyHash, StakingCredential } from "../index.js"
 */

/**
 * @param {StakingCredential} credential
 * @param {PubKeyHash} poolId
 * @returns {DelegationDCert}
 */
export function makeDelegationDCert(credential, poolId) {
    return new DelegationDCertImpl(credential, poolId)
}

/**
 * Confusingly the DCerts in the script context uses full StakingCredentials (which can be Staking Pointer), but the Cbor ledger format only encodes the StakingHash (presumably resolving Staking Ptrs to Staking Hashes)
 * @implements {DelegationDCert}
 */
class DelegationDCertImpl {
    /**
     * @readonly
     * @type {StakingCredential}
     */
    credential

    /**
     * @readonly
     * @type {PubKeyHash}
     */
    poolId

    /**
     * @param {StakingCredential} credential
     * @param {PubKeyHash} poolId
     */
    constructor(credential, poolId) {
        this.credential = credential
        this.poolId = poolId
    }

    /**
     * @type {"DelegationDCert"}
     */
    get kind() {
        return "DelegationDCert"
    }

    /**
     * @type {2}
     */
    get tag() {
        return 2
    }

    /**
     * @returns {object}
     */
    dump() {
        return {
            dcertType: "Delegate"
        }
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([
            encodeInt(2),
            encodeStakingCredential(this.credential),
            this.poolId.toCbor()
        ])
    }

    /**
     * @returns {ConstrData}
     */
    toUplcData() {
        return makeConstrData({
            tag: 2,
            fields: [
                convertStakingCredentialToUplcData(this.credential),
                this.poolId.toUplcData()
            ]
        })
    }
}
