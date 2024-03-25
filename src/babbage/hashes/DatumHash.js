import { decodeBytes, encodeBytes } from "@helios-lang/cbor"
import { bytesToHex, toBytes } from "@helios-lang/codec-utils"
import { ByteArrayData, decodeUplcData } from "@helios-lang/uplc"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 * @typedef {import("./Hash.js").Hash} Hash
 */

/**
 * @typedef {DatumHash | ByteArrayLike} DatumHashLike
 */

/**
 * Represents a blake2b-256 hash of datum data.
 * @implements {Hash}
 */
export class DatumHash {
    /**
     * @readonly
     * @type {number[]}
     */
    bytes

    /**
     * @param {Exclude<DatumHashLike, DatumHash>} bytes
     */
    constructor(bytes) {
        this.bytes = toBytes(bytes)

        if (this.bytes.length != 32) {
            throw new Error(
                `expected 32 bytes for DatumHash, got ${this.bytes.length} bytes`
            )
        }
    }

    /**
     * @param {DatumHashLike} arg
     * @returns {DatumHash}
     */
    static fromAlike(arg) {
        return arg instanceof DatumHash ? arg : new DatumHash(arg)
    }

    /**
     * @param {ByteArrayLike} bytes
     * @returns {DatumHash}
     */
    static fromCbor(bytes) {
        return new DatumHash(decodeBytes(bytes))
    }

    /**
     * @param {UplcData} data
     * @returns {DatumHash}
     */
    static fromUplcData(data) {
        return new DatumHash(ByteArrayData.expect(data).bytes)
    }

    /**
     * @param {ByteArrayLike} bytes
     * @returns {DatumHash}
     */
    static fromUplcCbor(bytes) {
        return DatumHash.fromUplcData(decodeUplcData(bytes))
    }

    /**
     * @returns {string}
     */
    dump() {
        return bytesToHex(this.bytes)
    }

    /**
     * @param {DatumHash} other
     */
    isEqual(other) {
        return ByteArrayData.compare(this.bytes, other.bytes) == 0
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
        return new ByteArrayData(this.bytes)
    }
}
