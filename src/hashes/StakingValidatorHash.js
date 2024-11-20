import { decodeBytes, encodeBytes } from "@helios-lang/cbor"
import {
    bytesToHex,
    compareBytes,
    dummyBytes,
    equalsBytes,
    toBytes
} from "@helios-lang/codec-utils"
import { expectByteArrayData, makeByteArrayData } from "@helios-lang/uplc"

/**
 * @import { BytesLike } from "@helios-lang/codec-utils"
 * @import { ByteArrayData, UplcData } from "@helios-lang/uplc"
 * @import { StakingValidatorHash, StakingValidatorHashLike } from "src/index.js"
 */

/**
 * @template [C=unknown]
 * @param {StakingValidatorHashLike} hash
 * @param {C | undefined} context
 * @returns {StakingValidatorHash<C>}
 */
export function makeStakingValidatorHash(hash, context = undefined) {
    if (typeof hash == "string" || Array.isArray(hash)) {
        return new StakingValidatorHashImpl(hash, context)
    } else if (
        typeof hash == "object" &&
        "kind" in hash &&
        hash.kind == "StakingValidatorHash"
    ) {
        if (context === undefined) {
            return /** @type {any} */ (hash)
        } else {
            return new StakingValidatorHashImpl(hash.bytes, context)
        }
    } else {
        return new StakingValidatorHashImpl(hash, context)
    }
}

/**
 * @param {number} seed
 * @returns {StakingValidatorHash<unknown>}
 */
export function makeDummyStakingValidatorHash(seed = 0) {
    return new StakingValidatorHashImpl(dummyBytes(28, seed))
}

/**
 * @param {StakingValidatorHash} a
 * @param {StakingValidatorHash} b
 * @returns {number}
 */
export function compareStakingValidatorHashes(a, b) {
    return compareBytes(a.bytes, b.bytes)
}

/**
 * @param {UplcData} data
 * @returns {StakingValidatorHash<unknown>}
 */
export function convertUplcDataToStakingValidatorHash(data) {
    return makeStakingValidatorHash(expectByteArrayData(data).bytes)
}

/**
 * @param {BytesLike} bytes
 * @returns {StakingValidatorHash<unknown>}
 */
export function decodeStakingValidatorHash(bytes) {
    return makeStakingValidatorHash(decodeBytes(bytes))
}

/**
 * @param {StakingValidatorHashLike} hash
 * @returns {boolean}
 */
export function isValidStakingValidatorHash(hash) {
    try {
        makeStakingValidatorHash(hash)
        return true
    } catch (e) {
        return false
    }
}

/**
 * @template [C=unknown]
 * @implements {StakingValidatorHash<C>}
 */
class StakingValidatorHashImpl {
    /**
     * @readonly
     * @type {number[]}
     */
    bytes

    /**
     * @readonly
     * @type {C}
     */
    context

    /**
     * @param {BytesLike} bytes
     * @param {C} context
     */
    constructor(bytes, context = /** @type {any} */ (undefined)) {
        this.bytes = toBytes(bytes)
        this.context = context

        if (this.bytes.length != 28) {
            throw new Error(
                `expected 28 bytes for StakingValidatorHash, got ${this.bytes.length}`
            )
        }
    }

    /**
     * @type {"StakingValidatorHash"}
     */
    get kind() {
        return "StakingValidatorHash"
    }

    /**
     * @param {StakingValidatorHash} other
     * @returns {boolean}
     */
    isEqual(other) {
        return equalsBytes(this.bytes, other.bytes)
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeBytes(this.bytes)
    }

    /**
     * @returns {string}
     */
    toHex() {
        return bytesToHex(this.bytes)
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.toHex()
    }

    /**
     * @returns {ByteArrayData}
     */
    toUplcData() {
        return makeByteArrayData(this.bytes)
    }
}
