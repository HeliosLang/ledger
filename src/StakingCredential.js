import { ConstrData } from "@helios-lang/uplc"
import { StakingHash } from "./StakingHash.js"
import { None } from "@helios-lang/codec-utils"
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
 * @typedef {StakingCredential | StakingHash | PubKeyHash | StakingValidatorHash} StakingCredentialLike
 */

export class StakingCredential {
    /**
     * @readonly
     * @type {StakingHash}
     */
    hash

    /**
     * @param {Exclude<StakingCredentialLike, StakingCredential>} hash
     */
    constructor(hash) {
        this.hash = StakingHash.fromAlike(hash)
    }

    /**
     * @param {number[]} bytes
     * @returns {Option<StakingCredential>}
     */
    static fromAddressBytes(bytes) {
        if (bytes.length > 29) {
            const head = bytes[0]
            const body = bytes.slice(29, 57)
            const type = head >> 4

            switch (type) {
                case 0:
                case 1:
                    return new StakingCredential(
                        new StakingHash(new PubKeyHash(body))
                    )
                case 2:
                case 3:
                    return new StakingCredential(
                        new StakingHash(new StakingValidatorHash(body))
                    )
                default:
                    throw new Error(`unhandled StakingCredential type ${type}`)
            }
        } else {
            return None
        }
    }

    /**
     * @param {StakingCredentialLike} arg
     * @returns {StakingCredential}
     */
    static fromAlike(arg) {
        return arg instanceof StakingCredential
            ? arg
            : new StakingCredential(arg)
    }

    /**
     * @param {UplcData} data
     */
    static fromUplcData(data) {
        ConstrData.assert(data, 0, 1)

        return new StakingCredential(StakingHash.fromUplcData(data.fields[0]))
    }

    /**
     * @type {number[]}
     */
    get bytes() {
        return this.hash.bytes
    }

    /**
     * @returns {ConstrData}
     */
    toUplcData() {
        return new ConstrData(0, [this.hash.toUplcData()])
    }
}
