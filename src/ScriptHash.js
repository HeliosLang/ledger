/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 * @typedef {import("./Hash.js").Hash} Hash
 */

import { decodeBytes, encodeBytes } from "@helios-lang/cbor"
import { bytesToHex, toBytes } from "@helios-lang/codec-utils"
import { ByteArrayData, decodeUplcData } from "@helios-lang/uplc"

/**
 * @implements {Hash}
 */
export class ScriptHash {
    /**
     * @readonly
     * @type {number[]}
     */
    bytes

    /**
     *
     * @param {ByteArrayLike} bytes
     */
    constructor(bytes) {
        this.bytes = toBytes(bytes)
    }

    /**
     * @param {ScriptHash | ByteArrayLike} arg
     * @returns {ScriptHash}
     */
    static from(arg) {
        return arg instanceof ScriptHash ? arg : new ScriptHash(arg)
    }

    /**
     * @param {number[]} bytes
     * @returns {ScriptHash}
     */
    static fromCbor(bytes) {
        return new ScriptHash(decodeBytes(bytes))
    }

    /**
     * @param {UplcData} data
     * @returns {ScriptHash}
     */
    static fromUplcData(data) {
        return new ScriptHash(ByteArrayData.expect(data).bytes)
    }

    /**
     * @param {string | number[]} bytes
     * @returns {ScriptHash}
     */
    static fromUplcCbor(bytes) {
        return ScriptHash.fromUplcData(decodeUplcData(bytes))
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
        return new ByteArrayData(this.bytes)
    }
}
