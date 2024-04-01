import { None } from "@helios-lang/type-utils"
import { ConstrData } from "@helios-lang/uplc"
import {
    PubKeyHash,
    StakingHash,
    StakingValidatorHash
} from "../hashes/index.js"

/**
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 */

/**
 * @typedef {StakingCredential | StakingHash | PubKeyHash | StakingValidatorHash} StakingCredentialLike
 */

/**
 * TODO: implement support for staking pointers
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
                        StakingHash.PubKey(new PubKeyHash(body))
                    )
                case 2:
                case 3:
                    return new StakingCredential(
                        StakingHash.Validator(new StakingValidatorHash(body))
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
     * @returns {StakingHash}
     */
    expectStakingHash() {
        return this.hash
    }

    /**
     * Only valid for Staking hashes
     * XXX: this is quite confusing, if only staking hashes are serialized into transactions, how can staking pointers be available inside the scriptcontext in validators?
     * @returns {number[]}
     */
    toCbor() {
        return this.hash.toCbor()
    }

    /**
     * @returns {ConstrData}
     */
    toUplcData() {
        return new ConstrData(0, [this.hash.toUplcData()])
    }
}
