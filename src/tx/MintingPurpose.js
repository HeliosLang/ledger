import { makeConstrData } from "@helios-lang/uplc"

/**
 * @import { ConstrData, UplcData } from "@helios-lang/uplc"
 * @import { MintingPolicyHash, MintingPurpose } from "../index.js"
 */

/**
 *
 * @param {MintingPolicyHash} policy
 * @returns {MintingPurpose}
 */
export function makeMintingPurpose(policy) {
    return new MintingPurposeImpl(policy)
}

/**
 * Doesn't include functionality to make Tx UplcData as that is done external
 */
class MintingPurposeImpl {
    /**
     * @readonly
     * @type {MintingPolicyHash}
     */
    policy

    /**
     * @param {MintingPolicyHash} policy
     */
    constructor(policy) {
        this.policy = policy
    }

    /**
     * @type {"MintingPurpose"}
     */
    get kind() {
        return "MintingPurpose"
    }

    /**
     * @returns {ConstrData}
     */
    toUplcData() {
        return makeConstrData({ tag: 0, fields: [this.policy.toUplcData()] })
    }

    /**
     * @param {UplcData} txData
     * @returns {UplcData}
     */
    toScriptContextUplcData(txData) {
        return makeConstrData({ tag: 0, fields: [txData, this.toUplcData()] })
    }
}
