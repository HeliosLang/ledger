import { encodeInt, encodeTuple } from "@helios-lang/cbor"
import { makeConstrData } from "@helios-lang/uplc"

/**
 * @import { ConstrData } from "@helios-lang/uplc"
 * @import { PoolParameters, RegisterPoolDCert } from "src/index.js"
 */

/**
 * @param {PoolParameters} params
 * @returns {RegisterPoolDCert}
 */
export function makeRegisterPoolDCert(params) {
    return new RegisterPoolDCertImpl(params)
}

/**
 * Confusingly the DCerts in the script context uses full StakingCredentials (which can be Staking Pointer), but the Cbor ledger format only encodes the StakingHash (presumably resolving Staking Ptrs to Staking Hashes)
 * @implements {RegisterPoolDCert}
 */
class RegisterPoolDCertImpl {
    /**
     * @readonly
     * @type {PoolParameters}
     */
    parameters

    /**
     * @param {PoolParameters} parameters
     */
    constructor(parameters) {
        this.parameters = parameters
    }

    /**
     * @type {"RegisterPoolDCert"}
     */
    get kind() {
        return "RegisterPoolDCert"
    }

    /**
     * @type {3}
     */
    get tag() {
        return 3
    }

    /**
     * @returns {object}
     */
    dump() {
        return {
            dcertType: "RegisterPool"
        }
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([encodeInt(3), this.parameters.toCbor()])
    }

    /**
     * @returns {ConstrData}
     */
    toUplcData() {
        return makeConstrData({
            tag: 3,
            fields: [
                this.parameters.id.toUplcData(),
                this.parameters.vrf.toUplcData()
            ]
        })
    }
}
