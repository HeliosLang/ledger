import { decodeTagged, encodeInt, encodeTuple } from "@helios-lang/cbor"
import { ByteStream } from "@helios-lang/codec-utils"
import { None } from "@helios-lang/type-utils"
import { ConstrData } from "@helios-lang/uplc"
import { PubKeyHash } from "./PubKeyHash.js"
import { StakingValidatorHash } from "./StakingValidatorHash.js"
import { ValidatorHash } from "./ValidatorHash.js"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
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
     * @param {ByteArrayLike} bytes
     * @returns {StakingHash}
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        const [tag, decodeItem] = decodeTagged(stream)

        switch (tag) {
            case 0:
                return new StakingHash(decodeItem(PubKeyHash))
            case 1:
                return new StakingHash(decodeItem(ValidatorHash))
            default:
                throw new Error(
                    `expected 0 or 1 StakingHash cbor tag, got ${tag}`
                )
        }
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
     * @type {number}
     */
    get tag() {
        return this.isPubKey() ? 0 : 1
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
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([encodeInt(this.tag), this.hash.toCbor()])
    }

    /**
     * @returns {ConstrData}
     */
    toUplcData() {
        return new ConstrData(this.tag, [this.hash.toUplcData()])
    }
}
