import { decodeBytes } from "@helios-lang/cbor"
import { ByteArrayData, decodeUplcData } from "@helios-lang/uplc"
import { ScriptHash } from "./ScriptHash.js"
import { compareBytes, equalsBytes } from "@helios-lang/codec-utils"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 * @typedef {import("./Hash.js").Hash} Hash
 */

/**
 * @typedef {ValidatorHash | ByteArrayLike} ValidatorHashLike
 */

/**
 * Represents a blake2b-224 hash of a spending validator script (first encoded as a CBOR byte-array and prepended by a script version byte).
 * @implements {Hash}
 */
export class ValidatorHash extends ScriptHash {
    /**
     * @param {Exclude<ValidatorHashLike, ValidatorHash>} bytes
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
     * @param {ValidatorHashLike} arg
     * @returns {ValidatorHash}
     */
    static fromAlike(arg) {
        return arg instanceof ValidatorHash ? arg : new ValidatorHash(arg)
    }

    /**
     * @param {ByteArrayLike} bytes
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
     * @param {ByteArrayLike} bytes
     * @returns {ValidatorHash}
     */
    static fromUplcCbor(bytes) {
        return ValidatorHash.fromUplcData(decodeUplcData(bytes))
    }

    /**
     * @param {ValidatorHash} a
     * @param {ValidatorHash} b
     * @returns {number}
     */
    static compare(a, b) {
        return compareBytes(a.bytes, b.bytes)
    }

    /**
     * @param {ValidatorHash} other
     * @returns {boolean}
     */
    isEqual(other) {
        return equalsBytes(this.bytes, other.bytes)
    }
}
