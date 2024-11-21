import { decodeBytes, encodeBytes } from "@helios-lang/cbor"
import {
    bytesToHex,
    compareBytes,
    dummyBytes,
    equalsBytes,
    toBytes
} from "@helios-lang/codec-utils"
import { decodeUplcData, makeByteArrayData } from "@helios-lang/uplc"
import { expectByteArrayData } from "@helios-lang/uplc"

/**
 * @import { BytesLike } from "@helios-lang/codec-utils"
 * @import { ByteArrayData, UplcData } from "@helios-lang/uplc"
 * @import { PubKeyHash, PubKeyHashLike } from "../index.js"
 */

/**
 * @param {PubKeyHashLike} arg
 * @returns {PubKeyHash}
 */
export function makePubKeyHash(arg) {
    if (typeof arg == "string") {
        return new PubKeyHashImpl(arg)
    } else if ("kind" in arg) {
        if (arg.kind != "PubKeyHash") {
            throw new Error("not a PubKeyHash")
        }

        return arg
    } else {
        return new PubKeyHashImpl(arg)
    }
}

/**
 * Creates a PubKeyHash with dummy bytes, which can be used for testing.
 * @param {number} seed
 * @returns {PubKeyHash}
 */
export function makeDummyPubKeyHash(seed = 0) {
    return new PubKeyHashImpl(dummyBytes(28, seed))
}

/**
 * Decodes CBOR bytes as a PubKeyHash
 * @param {BytesLike} bytes
 * @returns {PubKeyHash}
 */
export function decodePubKeyHash(bytes) {
    return new PubKeyHashImpl(decodeBytes(bytes))
}

/**
 *
 * @param {UplcData | BytesLike} data
 * @returns {PubKeyHash}
 */
export function convertUplcDataToPubKeyHash(data) {
    if (typeof data == "string") {
        return convertUplcDataToPubKeyHash(decodeUplcData(data))
    } else if ("kind" in data) {
        return new PubKeyHashImpl(expectByteArrayData(data).bytes)
    } else {
        return convertUplcDataToPubKeyHash(decodeUplcData(data))
    }
}

/**
 *
 * @param {PubKeyHash} a
 * @param {PubKeyHash} b
 * @returns
 */
export function comparePubKeyHashes(a, b) {
    return compareBytes(a.bytes, b.bytes)
}

/**
 * @param {PubKeyHashLike} arg
 * @returns {boolean}
 */
export function isValidPubKeyHash(arg) {
    try {
        makePubKeyHash(arg)
        return true
    } catch (e) {
        return false
    }
}

/**
 * Represents a blake2b-224 hash of a PubKey
 *
 * **Note**: A `PubKeyHash` can also be used as the second part of a payment `Address`, or to construct a `StakeAddress`.
 * @implements {PubKeyHash}
 */
class PubKeyHashImpl {
    /**
     * @readonly
     * @type {number[]}
     */
    bytes

    /**
     * @param {Exclude<PubKeyHashLike, PubKeyHash>} bytes
     */
    constructor(bytes) {
        this.bytes = toBytes(bytes)

        if (this.bytes.length != 28) {
            throw new Error(
                `expected 28 bytes for PubKeyHash, got ${this.bytes.length}`
            )
        }
    }

    /**
     * @type {"PubKeyHash"}
     */
    get kind() {
        return "PubKeyHash"
    }

    /**
     * Diagnostic representation
     * @returns {string}
     */
    dump() {
        return this.toHex()
    }

    /**
     * @param {PubKeyHash} other
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
     * Hexadecimal representation.
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
