import { decodeBytes } from "@helios-lang/cbor"
import { ByteArrayData, decodeUplcData } from "@helios-lang/uplc"
import { ScriptHash } from "./ScriptHash.js"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 * @typedef {import("./Hash.js").Hash} Hash
 */

/**
 * @typedef {StakingValidatorHash | ByteArrayLike} StakingValidatorHashLike
 */

/**
 * Represents a blake2b-224 hash of a staking script.
 *
 * **Note**: before hashing, the staking script is first encoded as a CBOR byte-array and then prepended by a script version byte.
 * @implements {Hash}
 */
export class StakingValidatorHash extends ScriptHash {
    /**
     * @param {Exclude<StakingValidatorHashLike, StakingValidatorHash>} bytes
     */
    constructor(bytes) {
        super(bytes)

        if (this.bytes.length != 28) {
            throw new Error(
                `expected 28 bytes for StakingValidatorHash, got ${this.bytes.length}`
            )
        }
    }

    /**
     * @param {StakingValidatorHashLike} arg
     * @returns {StakingValidatorHash}
     */
    static fromAlike(arg) {
        return arg instanceof StakingValidatorHash
            ? arg
            : new StakingValidatorHash(arg)
    }

    /**
     * @param {ByteArrayLike} bytes
     * @returns {StakingValidatorHash}
     */
    static fromCbor(bytes) {
        return new StakingValidatorHash(decodeBytes(bytes))
    }

    /**
     * @param {UplcData} data
     * @returns {StakingValidatorHash}
     */
    static fromUplcData(data) {
        return new StakingValidatorHash(ByteArrayData.expect(data).bytes)
    }

    /**
     * @param {ByteArrayLike} bytes
     * @returns {StakingValidatorHash}
     */
    static fromUplcCbor(bytes) {
        return StakingValidatorHash.fromUplcData(decodeUplcData(bytes))
    }
}
