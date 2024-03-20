import { None } from "@helios-lang/codec-utils"
import { ConstrData } from "@helios-lang/uplc"
import { PubKeyHash } from "./PubKeyHash.js"
import { StakingValidatorHash } from "./StakingValidatorHash.js"

/**
 * @template T
 * @typedef {import("@helios-lang/codec-utils").Option<T>} Option
 */

/**
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 */

/**
 * @typedef {StakingHash | PubKeyHash | StakingValidatorHash} StakingHashLike
 */

/**
 * Similar to Credential, wrapper for StakingValidatorHash | PubKeyHash
 */
export class StakingHash {
    /**
     * @readonly
     * @type {PubKeyHash | StakingValidatorHash}
     */
    hash

    /**
     * @param {Exclude<StakingHashLike, StakingHash>} hash
     */
    constructor(hash) {
        this.hash = hash
    }

    /**
     * @param {StakingHashLike} arg
     * @returns {StakingHash}
     */
    static fromAlike(arg) {
        return arg instanceof StakingHash ? arg : new StakingHash(arg)
    }

    /**
     *
     * @param {UplcData} data
     */
    static fromUplcData(data) {
        ConstrData.assert(data, None, 1)

        switch (data.tag) {
            case 0:
                return new StakingHash(PubKeyHash.fromUplcData(data.fields[0]))
            case 1:
                return new StakingHash(
                    StakingValidatorHash.fromUplcData(data.fields[0])
                )
            default:
                throw new Error(
                    `expected 0 or 1 StakingHash ConstrData tag, got ${data.tag}`
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
     * @type {Option<StakingValidatorHash>}
     */
    get stakingValidatorHash() {
        return this.hash instanceof StakingValidatorHash ? this.hash : None
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
    isStakingValidator() {
        return this.hash instanceof StakingValidatorHash
    }

    /**
     * @returns {ConstrData}
     */
    toUplcData() {
        return new ConstrData(this.isPubKey() ? 0 : 1, [this.hash.toUplcData()])
    }
}
