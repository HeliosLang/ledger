import { decodeBytes, encodeBytes } from "@helios-lang/cbor"
import { bytesToHex, dummyBytes, toBytes } from "@helios-lang/codec-utils"
import { blake2b } from "@helios-lang/crypto"
import {
    decodeUplcData,
    expectByteArrayData,
    makeByteArrayData
} from "@helios-lang/uplc"
import { makePubKeyHash } from "../hashes/index.js"

/**
 * @import { BytesLike } from "@helios-lang/codec-utils"
 * @import { ByteArrayData } from "@helios-lang/uplc"
 * @import { PubKey, PubKeyHash, PubKeyLike } from "../index.js"
 */
/**
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 */

/**
 * @param {PubKeyLike} arg
 * @returns {PubKey}
 */
export function makePubKey(arg) {
    if (typeof arg == "object" && "kind" in arg && arg.kind == "PubKey") {
        return arg
    } else {
        return new PubKeyImpl(arg)
    }
}

/**
 * @param {number} seed
 * @returns {PubKey}
 */
export function makeDummyPubKey(seed = 0) {
    return new PubKeyImpl(dummyBytes(32, seed))
}

/**
 * @param {BytesLike} bytes
 * @returns {PubKey}
 */
export function decodePubKey(bytes) {
    return new PubKeyImpl(decodeBytes(bytes))
}

/**
 * @param {UplcData} data
 * @returns {PubKey}
 */
export function convertUplcDataToPubKey(data) {
    return new PubKeyImpl(expectByteArrayData(data).bytes)
}

/**
 * @implements {PubKey}
 */
class PubKeyImpl {
    /**
     * @readonly
     * @type {number[]}
     */
    bytes

    /**
     * @param {BytesLike} props
     */
    constructor(props) {
        this.bytes = toBytes(props)

        if (this.bytes.length != 32) {
            throw new Error(`expected 32 for PubKey, got ${this.bytes.length}`)
        }
    }

    /**
     * @type {"PubKey"}
     */
    get kind() {
        return "PubKey"
    }

    /**
     * @returns {string}
     */
    dump() {
        return this.toHex()
    }

    /**
     * @returns {boolean}
     */
    isDummy() {
        return this.bytes.every((b) => b == 0)
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeBytes(this.bytes)
    }

    /**
     * @returns {PubKeyHash}
     */
    hash() {
        return makePubKeyHash(blake2b(this.bytes, 28))
    }

    /**
     * Hexadecimal representation.
     * @returns {string}
     */
    toHex() {
        return bytesToHex(this.bytes)
    }

    /**
     * @returns {ByteArrayData}
     */
    toUplcData() {
        return makeByteArrayData(this.bytes)
    }
}
