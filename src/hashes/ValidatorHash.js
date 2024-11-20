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
 * @import { ValidatorHash, ValidatorHashLike } from "src/index.js"
 */

/**
 * @template [C=unknown]
 * @param {ValidatorHashLike} hash
 * @param {C | undefined} context
 * @returns {ValidatorHash<C>}
 */
export function makeValidatorHash(hash, context = undefined) {
    if (typeof hash == "string" || Array.isArray(hash)) {
        return new ValidatorHashImpl(hash, context)
    } else if (
        typeof hash == "object" &&
        "kind" in hash &&
        hash.kind == "ValidatorHash"
    ) {
        if (context === undefined) {
            return /** @type {any} */ (hash)
        } else {
            return new ValidatorHashImpl(hash.bytes, context)
        }
    } else {
        return new ValidatorHashImpl(hash, context)
    }
}

/**
 * @param {number} seed
 * @returns {ValidatorHash<unknown>}
 */
export function makeDummyValidatorHash(seed = 0) {
    return new ValidatorHashImpl(dummyBytes(28, seed))
}

/**
 * @param {ValidatorHash} a
 * @param {ValidatorHash} b
 * @returns {number}
 */
export function compareValidatorHashes(a, b) {
    return compareBytes(a.bytes, b.bytes)
}

/**
 * @param {UplcData} data
 * @returns {ValidatorHash<unknown>}
 */
export function convertUplcDataToValidatorHash(data) {
    return makeValidatorHash(expectByteArrayData(data).bytes)
}

/**
 * @param {BytesLike} bytes
 * @returns {ValidatorHash<unknown>}
 */
export function decodeValidatorHash(bytes) {
    return makeValidatorHash(decodeBytes(bytes))
}

/**
 * @param {ValidatorHashLike} hash
 * @returns {boolean}
 */
export function isValidValidatorHash(hash) {
    try {
        makeValidatorHash(hash)
        return true
    } catch (e) {
        return false
    }
}

/**
 * @template [C=unknown]
 * @implements {ValidatorHash<C>}
 */
class ValidatorHashImpl {
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
     * @param {C | undefined} context
     */
    constructor(bytes, context = undefined) {
        this.bytes = toBytes(bytes)
        this.context = /** @type {any} */ (context)

        if (this.bytes.length != 28) {
            throw new Error(
                `expected 28 bytes for ValidatorHash, got ${this.bytes.length}`
            )
        }
    }

    /**
     * @type {"ValidatorHash"}
     */
    get kind() {
        return "ValidatorHash"
    }

    /**
     * @param {ValidatorHash} other
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
