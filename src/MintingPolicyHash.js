import { blake2b, encodeBech32 } from "@helios-lang/crypto"
import { ScriptHash } from "./ScriptHash.js"
import { decodeBytes } from "@helios-lang/cbor"
import { ByteArrayData, decodeUplcData } from "@helios-lang/uplc"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 */

/**
 * Represents a blake2b-224 hash of a minting policy script
 *
 * **Note**: to calculate this hash the script is first encoded as a CBOR byte-array and then prepended by a script version byte.
 */
export class MintingPolicyHash extends ScriptHash {
    /**
     * Can be 0 bytes in case of Ada
     * @param {ByteArrayLike} bytes
     */
    constructor(bytes) {
        super(bytes)

        if (!(this.bytes.length == 28 || this.bytes.length == 0)) {
            throw new Error(
                `expected 0 or 28 bytes for MintingPolicyHash, got ${this.bytes.length}`
            )
        }
    }

    /**
     * @param {MintingPolicyHash | ByteArrayLike} arg
     * @returns {MintingPolicyHash}
     */
    static from(arg) {
        return arg instanceof MintingPolicyHash
            ? arg
            : new MintingPolicyHash(arg)
    }

    /**
     * @param {number[]} bytes
     * @returns {MintingPolicyHash}
     */
    static fromCbor(bytes) {
        return new MintingPolicyHash(decodeBytes(bytes))
    }

    /**
     * @param {UplcData} data
     * @returns {MintingPolicyHash}
     */
    static fromUplcData(data) {
        return new MintingPolicyHash(ByteArrayData.expect(data).bytes)
    }

    /**
     * @param {string | number[]} bytes
     * @returns {MintingPolicyHash}
     */
    static fromUplcCbor(bytes) {
        return MintingPolicyHash.fromUplcData(decodeUplcData(bytes))
    }

    /**
     * Encodes as bech32 string using 'asset' as human readable part
     * @returns {string}
     */
    toBech32() {
        return encodeBech32("asset", blake2b(this.bytes, 20))
    }
}
