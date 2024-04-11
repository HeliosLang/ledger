import { decodeBytes, encodeBytes } from "@helios-lang/cbor"
import {
    bytesToHex,
    compareBytes,
    equalsBytes,
    toBytes
} from "@helios-lang/codec-utils"
import { decodeBech32, encodeBech32 } from "@helios-lang/crypto"
import { ConstrData } from "@helios-lang/uplc"
import {
    PubKeyHash,
    StakingHash,
    StakingValidatorHash,
    ValidatorHash
} from "../hashes/index.js"
import { config } from "./config.js"
import { Address } from "./Address.js"
import { StakingCredential } from "./StakingCredential.js"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 * @typedef {import("../hashes/index.js").StakingHashLike} StakingHashLike
 * @typedef {import("./StakingCredential.js").StakingCredentialLike} StakingCredentialLike
 */

/**
 * @typedef {StakingAddress | ByteArrayLike | Address | StakingCredential | PubKeyHash | ValidatorHash} StakingAddressLike
 */

/**
 * Wrapper for Cardano stake address bytes. An StakingAddress consists of two parts internally:
 *   - Header (1 byte, see CIP 8)
 *   - Staking witness hash (28 bytes that represent the `PubKeyHash` or `StakingValidatorHash`)
 *
 * Staking addresses are used to query the assets held by given staking credentials.
 *
 * TODO: handle staking pointers?
 */
export class StakingAddress {
    /**
     * @readonly
     * @type {number[]}
     */
    bytes

    /**
     * @param {ByteArrayLike} bytes
     */
    constructor(bytes) {
        this.bytes = toBytes(bytes)

        if (this.bytes.length != 29) {
            throw new Error(
                `expected 29 bytes for StakingAddress, got ${this.bytes.length} bytes`
            )
        }
    }

    /**
     * Convert a regular `Address` into a `StakingAddress`.
     * Throws an error if the Address doesn't have a staking credential.
     * @param {Address} addr
     * @returns {StakingAddress}
     */
    static fromAddress(addr) {
        const sh = addr.stakingHash

        if (sh) {
            return StakingAddress.fromHash(sh, addr.isForTestnet())
        } else {
            throw new Error("address doesn't have a staking part")
        }
    }

    /**
     * @param {StakingAddressLike} arg
     * @param {boolean} isTestnet
     * @returns {StakingAddress}
     */
    static new(arg, isTestnet = config.IS_TESTNET) {
        return arg instanceof StakingAddress
            ? arg
            : arg instanceof StakingCredential
              ? StakingAddress.fromCredential(arg)
              : arg instanceof PubKeyHash
                ? StakingAddress.fromPubKeyHash(arg, isTestnet)
                : arg instanceof ValidatorHash
                  ? StakingAddress.fromStakingValidatorHash(arg, isTestnet)
                  : arg instanceof Address
                    ? StakingAddress.fromAddress(arg)
                    : new StakingAddress(arg)
    }

    /**
     * @param {string} str
     * @returns {StakingAddress}
     */
    static fromBech32(str) {
        const [prefix, bytes] = decodeBech32(str)

        const result = new StakingAddress(bytes)

        const expectedPrefix = result.isForTestnet() ? "stake_test" : "stake"

        if (prefix != expectedPrefix) {
            throw new Error("invalid StakingAddress prefix")
        }

        return result
    }

    /**
     * @param {ByteArrayLike} bytes
     * @returns {StakingAddress}
     */
    static fromCbor(bytes) {
        return new StakingAddress(decodeBytes(bytes))
    }

    /**
     * @param {StakingCredentialLike} stakingCredential
     * @param {boolean} isTestnet
     * @returns {StakingAddress}
     */
    static fromCredential(stakingCredential, isTestnet = config.IS_TESTNET) {
        const sh = StakingCredential.new(stakingCredential).expectStakingHash()
        return StakingAddress.fromHash(sh, isTestnet)
    }

    /**
     * Converts a `PubKeyHash` or `StakingValidatorHash` into `StakingAddress`.
     * @param {StakingHashLike} hash
     * @param {boolean} isTestnet
     * @returns {StakingAddress}
     */
    static fromHash(hash, isTestnet = config.IS_TESTNET) {
        const hash_ = StakingHash.new(hash).hash

        if (hash_ instanceof PubKeyHash) {
            return StakingAddress.fromPubKeyHash(hash_, isTestnet)
        } else {
            return StakingAddress.fromStakingValidatorHash(hash_, isTestnet)
        }
    }

    /**
     * Address with only staking part (regular PubKeyHash)
     * @private
     * @param {PubKeyHash} hash
     * @param {boolean} isTestnet
     * @returns {StakingAddress}
     */
    static fromPubKeyHash(hash, isTestnet = config.IS_TESTNET) {
        return new StakingAddress([isTestnet ? 0xe0 : 0xe1].concat(hash.bytes))
    }

    /**
     * Address with only staking part (script StakingValidatorHash)
     * @private
     * @param {StakingValidatorHash} hash
     * @param {boolean} isTestnet
     * @returns {StakingAddress}
     */
    static fromStakingValidatorHash(hash, isTestnet = config.IS_TESTNET) {
        return new StakingAddress([isTestnet ? 0xf0 : 0xf1].concat(hash.bytes))
    }

    /**
     * On-chain a StakingAddress is represented as a StakingCredential
     * @param {UplcData} data
     * @returns {StakingAddress}
     */
    static fromUplcData(data) {
        const stakingCredential = StakingCredential.fromUplcData(data)
        return StakingAddress.fromCredential(stakingCredential)
    }

    /**
     * Doesn't take into account the header byte
     * @param {StakingAddress} a
     * @param {StakingAddress} b
     * @returns {number}
     */
    static compare(a, b) {
        return compareBytes(a.stakingHash.bytes, b.stakingHash.bytes)
    }

    /**
     * Returns the underlying `StakingHash`.
     * @returns {StakingHash}
     */
    get stakingHash() {
        const type = this.bytes[0]

        if (type == 0xe0 || type == 0xe1) {
            return StakingHash.PubKey(new PubKeyHash(this.bytes.slice(1)))
        } else if (type == 0xf0 || type == 0xf1) {
            return StakingHash.Validator(
                new StakingValidatorHash(this.bytes.slice(1))
            )
        } else {
            throw new Error("bad StakingAddress header")
        }
    }

    /**
     * @param {StakingAddress} other
     * @returns {boolean}
     */
    isEqual(other) {
        return equalsBytes(this.bytes, other.bytes)
    }

    /**
     * Returns `true` if the given `StakingAddress` is a testnet address.
     * @returns {boolean}
     */
    isForTestnet() {
        return new Address(this.bytes).isForTestnet()
    }

    /**
     * Converts a `StakingAddress` into its Bech32 representation.
     * @returns {string}
     */
    toBech32() {
        return encodeBech32(
            this.isForTestnet() ? "stake_test" : "stake",
            this.bytes
        )
    }

    /**
     * Converts a `StakingAddress` into its CBOR representation.
     * @returns {number[]}
     */
    toCbor() {
        return encodeBytes(this.bytes)
    }

    /**
     * StakingAddress is represented as StakingCredential on-chain
     * @returns {StakingCredential}
     */
    toCredential() {
        return StakingCredential.new(this.stakingHash)
    }

    /**
     * Converts a `StakingAddress` into its hexadecimal representation.
     * @returns {string}
     */
    toHex() {
        return bytesToHex(this.bytes)
    }

    /**
     * @returns {ConstrData}
     */
    toUplcData() {
        return this.toCredential().toUplcData()
    }
}
