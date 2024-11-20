import { decodeBytes, encodeBytes } from "@helios-lang/cbor"
import {
    bytesToHex,
    compareBytes,
    dummyBytes,
    equalsBytes,
    toBytes
} from "@helios-lang/codec-utils"
import { blake2b, encodeBech32 } from "@helios-lang/crypto"
import { expectByteArrayData, makeByteArrayData } from "@helios-lang/uplc"

/**
 * @import { BytesLike } from "@helios-lang/codec-utils"
 * @import { ByteArrayData, UplcData } from "@helios-lang/uplc"
 * @import { MintingPolicyHash, MintingPolicyHashLike } from "src/index.js"
 */

/**
 * @template [C=unknown]
 * @param {MintingPolicyHashLike} hash
 * @param {C | undefined} context
 * @returns {MintingPolicyHash<C>}
 */
export function makeMintingPolicyHash(hash, context = undefined) {
    if (typeof hash == "string" || Array.isArray(hash)) {
        return new MintingPolicyHashImpl(hash, context)
    } else if (
        typeof hash == "object" &&
        "kind" in hash &&
        hash.kind == "MintingPolicyHash"
    ) {
        if (context === undefined) {
            return /** @type {any} */ (hash)
        } else {
            return new MintingPolicyHashImpl(hash.bytes, context)
        }
    } else {
        return new MintingPolicyHashImpl(hash, context)
    }
}

/**
 * @param {number} seed
 * @returns {MintingPolicyHash<unknown>}
 */
export function makeDummyMintingPolicyHash(seed = 0) {
    return new MintingPolicyHashImpl(dummyBytes(28, seed))
}

/**
 * @param {MintingPolicyHash} a
 * @param {MintingPolicyHash} b
 * @returns {number}
 */
export function compareMintingPolicyHashes(a, b) {
    return compareBytes(a.bytes, b.bytes)
}

/**
 * @param {UplcData} data
 * @returns {MintingPolicyHash<unknown>}
 */
export function convertUplcDataToMintingPolicyHash(data) {
    return makeMintingPolicyHash(expectByteArrayData(data).bytes)
}

/**
 * @param {BytesLike} bytes
 * @returns {MintingPolicyHash<unknown>}
 */
export function decodeMintingPolicyHash(bytes) {
    return makeMintingPolicyHash(decodeBytes(bytes))
}

/**
 * @param {MintingPolicyHashLike} hash
 * @returns {boolean}
 */
export function isValidMintingPolicyHash(hash) {
    try {
        makeMintingPolicyHash(hash)
        return true
    } catch (e) {
        return false
    }
}

/**
 * @template [C=unknown]
 * @implements {MintingPolicyHash<C>}
 */
class MintingPolicyHashImpl {
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

        if (!(this.bytes.length == 28 || this.bytes.length == 0)) {
            throw new Error(
                `expected 0 or 28 bytes for MintingPolicyHash, got ${this.bytes.length}`
            )
        }
    }

    /**
     * @type {"MintingPolicyHash"}
     */
    get kind() {
        return "MintingPolicyHash"
    }

    /**
     * @param {MintingPolicyHash} other
     * @returns {boolean}
     */
    isEqual(other) {
        return equalsBytes(this.bytes, other.bytes)
    }

    /**
     * @returns {string}
     */
    toBech32() {
        return encodeBech32("asset", blake2b(this.bytes, 20))
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
