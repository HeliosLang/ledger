import { decodeBytes, encodeBytes } from "@helios-lang/cbor"
import {
    bytesToHex,
    compareBytes,
    dummyBytes,
    toBytes
} from "@helios-lang/codec-utils"
import {
    expectByteArrayData,
    expectConstrData,
    makeByteArrayData,
    makeConstrData
} from "@helios-lang/uplc"

/**
 * @import { BytesLike } from "@helios-lang/codec-utils"
 * @import { ConstrData, UplcData } from "@helios-lang/uplc"
 * @import { TxId, TxIdLike } from "../index.js"
 */

/**
 * @param {number} seed - defaults to -1 so the TxId is [255, 255, 255, ...] and thus sorts to end in dummy transactions which generates max execution budget for certain operations
 * @returns {TxId}
 */
export function makeDummyTxId(seed = -1) {
    if (seed == -1) {
        return new TxIdImpl(new Array(32).fill(255))
    } else {
        return new TxIdImpl(dummyBytes(32, seed))
    }
}

/**
 * @param {TxIdLike} arg
 * @returns {TxId}
 */
export function makeTxId(arg) {
    if (typeof arg == "object" && "kind" in arg && arg.kind == "TxId") {
        return arg
    } else {
        return new TxIdImpl(arg)
    }
}

/**
 * @param {UplcData} data
 * @returns {TxId}
 */
export function convertUplcDataToTxId(data) {
    return new TxIdImpl(
        expectByteArrayData(expectConstrData(data, 0, 1).fields[0]).bytes
    )
}

/**
 * @param {BytesLike} bytes
 * @returns {TxId}
 */
export function decodeTxId(bytes) {
    return new TxIdImpl(decodeBytes(bytes))
}

/**
 * @param {BytesLike} bytes
 * @returns {boolean}
 */
export function isValidTxId(bytes) {
    try {
        new TxIdImpl(bytes)
        return true
    } catch (e) {
        return false
    }
}

/**
 * @implements {TxId}
 */
class TxIdImpl {
    /**
     * @readonly
     * @type {number[]}
     */
    bytes

    /**
     * @param {BytesLike} bytes
     */
    constructor(bytes) {
        this.bytes = toBytes(bytes)

        if (this.bytes.length != 32) {
            throw new Error(
                `expected 32 bytes for TxId, got ${this.bytes.length}`
            )
        }
    }

    /**
     * @type {"TxId"}
     */
    get kind() {
        return "TxId"
    }

    /**
     * @param {TxId} other
     * @returns {boolean}
     */
    isEqual(other) {
        return compareBytes(this.bytes, other.bytes) == 0
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
     * @returns {number[]}
     */
    toCbor() {
        return encodeBytes(this.bytes)
    }

    /**
     * @returns {ConstrData}
     */
    toUplcData() {
        return makeConstrData(0, [makeByteArrayData(this.bytes)])
    }
}
