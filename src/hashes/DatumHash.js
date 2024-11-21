import { decodeBytes, encodeBytes } from "@helios-lang/cbor"
import {
    bytesToHex,
    compareBytes,
    equalsBytes,
    toBytes
} from "@helios-lang/codec-utils"
import { blake2b } from "@helios-lang/crypto"
import { expectByteArrayData, makeByteArrayData } from "@helios-lang/uplc"

/**
 * @import { BytesLike } from "@helios-lang/codec-utils"
 * @import { ByteArrayData, UplcData } from "@helios-lang/uplc"
 * @import { DatumHash, DatumHashLike } from "../index.js"
 */

/**
 * @param {DatumHash} a
 * @param {DatumHash} b
 * @returns {number}
 */
export function compareDatumHashes(a, b) {
    return compareBytes(a.bytes, b.bytes)
}

/**
 * @param {UplcData} data
 * @returns {DatumHash}
 */
export function convertUplcDataToDatumHash(data) {
    return new DatumHashImpl(expectByteArrayData(data).bytes)
}

/**
 * @param {BytesLike} bytes
 * @returns {DatumHash}
 */
export function decodeDatumHash(bytes) {
    return new DatumHashImpl(decodeBytes(bytes))
}

/**
 * @param {UplcData} data
 * @returns {DatumHash}
 */
export function hashDatum(data) {
    return new DatumHashImpl(blake2b(data.toCbor()))
}

/**
 * @param {DatumHashLike} bytes
 * @returns {DatumHash}
 */
export function makeDatumHash(bytes) {
    return new DatumHashImpl(bytes)
}

/**
 * Represents a blake2b-256 hash of datum data.
 * @implements {DatumHash}
 */
class DatumHashImpl {
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
                `expected 32 bytes for DatumHash, got ${this.bytes.length} bytes`
            )
        }
    }

    /**
     * @type {"DatumHash"}
     */
    get kind() {
        return "DatumHash"
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
