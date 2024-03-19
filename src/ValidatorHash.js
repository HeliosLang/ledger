import { decodeBytes, encodeBytes } from "@helios-lang/cbor"
import { bytesToHex, toBytes } from "@helios-lang/codec-utils"
import { ByteArrayData, decodeUplcData } from "@helios-lang/uplc"
import { ScriptHash } from "./ScriptHash.js"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 * @typedef {import("./Hash.js").Hash} Hash
 */

/**
 * Represents a blake2b-224 hash of a spending validator script (first encoded as a CBOR byte-array and prepended by a script version byte).
 * @implements {Hash}
 */
export class ValidatorHash extends ScriptHash {
    /**
     * @param {ByteArrayLike} bytes
     */
    constructor(bytes) {
        super(bytes)

        if (this.bytes.length != 28) {
            throw new Error(
                `expected 28 bytes for ValidatorHash, got ${this.bytes.length}`
            )
        }
    }

    /**
     * @param {ValidatorHash | ByteArrayLike} arg
     * @returns {ValidatorHash}
     */
    static from(arg) {
        return arg instanceof ValidatorHash ? arg : new ValidatorHash(arg)
    }

    /**
     * @param {number[]} bytes
     * @returns {ValidatorHash}
     */
    static fromCbor(bytes) {
        return new ValidatorHash(decodeBytes(bytes))
    }

    /**
     * @param {UplcData} data
     * @returns {ValidatorHash}
     */
    static fromUplcData(data) {
        return new ValidatorHash(ByteArrayData.expect(data).bytes)
    }

    /**
     * @param {string | number[]} bytes
     * @returns {ValidatorHash}
     */
    static fromUplcCbor(bytes) {
        return ValidatorHash.fromUplcData(decodeUplcData(bytes))
    }
}
