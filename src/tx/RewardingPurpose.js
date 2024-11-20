import { makeConstrData } from "@helios-lang/uplc"
import { convertStakingCredentialToUplcData } from "../address/index.js"

/**
 * @import { ConstrData, UplcData } from "@helios-lang/uplc"
 * @import { RewardingPurpose, StakingCredential } from "src/index.js"
 */

/**
 *
 * @param {StakingCredential} stakingCredential
 * @returns {RewardingPurpose}
 */
export function makeRewardingPurpose(stakingCredential) {
    return new RewardingPurposeImpl(stakingCredential)
}

/**
 * Doesn't include functionality to make Tx UplcData as that is done external
 */
class RewardingPurposeImpl {
    /**
     * @readonly
     * @type {StakingCredential}
     */
    credential

    /**
     * @param {StakingCredential} stakingCredential
     */
    constructor(stakingCredential) {
        this.credential = stakingCredential
    }

    /**
     * @type {"RewardingPurpose"}
     */
    get kind() {
        return "RewardingPurpose"
    }

    /**
     * @returns {ConstrData}
     */
    toUplcData() {
        return makeConstrData({
            tag: 2,
            fields: [convertStakingCredentialToUplcData(this.credential)]
        })
    }

    /**
     * @param {UplcData} txData
     * @returns {UplcData}
     */
    toScriptContextUplcData(txData) {
        return makeConstrData({ tag: 0, fields: [txData, this.toUplcData()] })
    }
}
