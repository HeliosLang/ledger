import { decodeBytes } from "@helios-lang/cbor"
import {
    ByteArrayData,
    UplcProgramV1,
    UplcProgramV2,
    decodeUplcData
} from "@helios-lang/uplc"
import { ScriptHash } from "./ScriptHash.js"
import { compareBytes, equalsBytes } from "@helios-lang/codec-utils"
import { None } from "@helios-lang/type-utils"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 
 * @typedef {import("./Hash.js").Hash} Hash
 */

/**
 * @template TStrict
 * @template TPermissive
 * @typedef {import("./Cast.js").Cast<TStrict, TPermissive>} Cast
 */

/**
 * @typedef {ValidatorHash | ByteArrayLike} ValidatorHashLike
 */

/**
 * @template TDatumStrict
 * @template TDatumPermissive
 * @template TRedeemer
 * @typedef {{
 *   program: UplcProgramV1 | UplcProgramV2
 *   datum: Cast<TDatumStrict, TDatumPermissive>
 *   redeemer: Cast<any, TRedeemer>
 * }} ValidatorHashContext
 */

/**
 * Represents a blake2b-224 hash of a spending validator script (first encoded as a CBOR byte-array and prepended by a script version byte).
 * @template [TDatumStrict=UplcData]
 * @template [TDatumPermissive=UplcData]
 * @template [TRedeemer=UplcData]
 * @implements {Hash}
 */
export class ValidatorHash extends ScriptHash {
    /**
     * @param {Exclude<ValidatorHashLike, ValidatorHash>} bytes
     * @param {Option<ValidatorHashContext<TDatumStrict, TDatumPermissive, TRedeemer>>} context
     */
    constructor(bytes, context = None) {
        super(bytes)

        if (this.bytes.length != 28) {
            throw new Error(
                `expected 28 bytes for ValidatorHash, got ${this.bytes.length}`
            )
        }

        this.context = context
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
