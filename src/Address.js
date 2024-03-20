import { decodeBytes, encodeBytes } from "@helios-lang/cbor"
import {
    None,
    bytesToHex,
    hexToBytes,
    isSome,
    toBytes
} from "@helios-lang/codec-utils"
import { decodeBech32, encodeBech32 } from "@helios-lang/crypto"
import {
    ByteArrayData,
    ConstrData,
    decodeUplcData,
    encodeOptionData
} from "@helios-lang/uplc"
import { config } from "./config.js"
import { Credential } from "./Credential.js"
import { PubKeyHash } from "./PubKeyHash.js"
import { StakingValidatorHash } from "./StakingValidatorHash.js"
import { StakingCredential } from "./StakingCredential.js"
import { ValidatorHash } from "./ValidatorHash.js"
import { StakingHash } from "./StakingHash.js"

/**
 * @template T
 * @typedef {import("@helios-lang/codec-utils").Option<T>} Option
 */

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 */

/**
 * @typedef {Address | ByteArrayLike} AddressLike
 */

/**
 * Wrapper for Cardano address bytes. An `Address` consists of three parts internally:
 *   * Header (1 byte, see [CIP 19](https://cips.cardano.org/cips/cip19/))
 *   * Witness hash (28 bytes that represent the `PubKeyHash` or `ValidatorHash`)
 *   * Optional staking credential (0 or 28 bytes)
 */
export class Address {
    /**
     * @readonly
     * @type {number[]}
     */
    bytes

    /**
     * @readonly
     * @type {Credential}
     */
    credential

    /**
     * @readonly
     * @type {Option<StakingCredential>}
     */
    stakingCredential

    /**
     * @param {Exclude<AddressLike, Address>} bytes
     */
    constructor(bytes) {
        this.bytes = toBytes(bytes)

        if (!(this.bytes.length == 29 || this.bytes.length == 57)) {
            throw new Error(
                `expected 29 or 57 bytes for Address, got ${this.bytes.length}`
            )
        }

        this.credential = Credential.fromAddressBytes(this.bytes)
        this.stakingCredential = StakingCredential.fromAddressBytes(this.bytes)
    }

    /**
     * Returns a dummy address (based on a PubKeyHash with all null bytes)
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static dummy(isTestnet = config.isTestnet) {
        return Address.fromPubKeyHash(PubKeyHash.dummy(), None, isTestnet)
    }

    /**
     * @param {AddressLike} arg
     * @returns {Address}
     */
    static fromAlike(arg) {
        return arg instanceof Address
            ? arg
            : typeof arg == "string" && arg.startsWith("addr")
              ? Address.fromBech32(arg)
              : new Address(arg)
    }

    /**
     * Converts a Bech32 string into an `Address`.
     * @param {string} str
     * @returns {Address}
     */
    static fromBech32(str) {
        // ignore the prefix (encoded in the bytes anyway)
        let [prefix, bytes] = decodeBech32(str)

        let result = new Address(bytes)

        if (prefix != (result.isForTestnet() ? "addr_test" : "addr")) {
            throw new Error("invalid Address prefix")
        }

        return result
    }

    /**
     * Deserializes bytes into an `Address`.
     * @param {ByteArrayLike} bytes
     * @returns {Address}
     */
    static fromCbor(bytes) {
        return new Address(decodeBytes(bytes))
    }

    /**
     * @param {Credential} credential
     * @param {Option<StakingCredential>} stakingCredential
     * @param {boolean} isTestnet
     * @return {Address}
     */
    static fromCredentials(
        credential,
        stakingCredential,
        isTestnet = config.isTestnet
    ) {
        return this.fromHashes(
            credential.hash,
            stakingCredential?.hash?.hash ?? None,
            isTestnet
        )
    }

    /**
     * Constructs an Address using either a `PubKeyHash` (i.e. simple payment address)
     * or `ValidatorHash` (i.e. script address),
     * without a staking hash.
     * @param {PubKeyHash | ValidatorHash} hash
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromHash(hash, isTestnet = config.isTestnet) {
        return Address.fromHashes(hash, null, isTestnet)
    }

    /**
     * Constructs an Address using either a `PubKeyHash` (i.e. simple payment address)
     * or `ValidatorHash` (i.e. script address),
     * in combination with an optional staking hash (`PubKeyHash` or `StakingValidatorHash`).
     * @param {PubKeyHash | ValidatorHash} hash
     * @param {Option<PubKeyHash | StakingValidatorHash>} stakingHash
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromHashes(hash, stakingHash, isTestnet = config.isTestnet) {
        if (hash instanceof PubKeyHash) {
            return Address.fromPubKeyHash(hash, stakingHash, isTestnet)
        } else if (hash instanceof ValidatorHash) {
            return Address.fromValidatorHash(hash, stakingHash, isTestnet)
        } else {
            throw new Error("unexpected")
        }
    }

    /**
     * Simple payment address with an optional staking hash (`PubKeyHash` or `StakingValidatorHash`).
     * @private
     * @param {PubKeyHash} hash
     * @param {Option<PubKeyHash | StakingValidatorHash>} stakingHash
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromPubKeyHash(hash, stakingHash, isTestnet) {
        if (stakingHash) {
            if (stakingHash instanceof PubKeyHash) {
                return new Address(
                    [isTestnet ? 0x00 : 0x01]
                        .concat(hash.bytes)
                        .concat(stakingHash.bytes)
                )
            } else {
                return new Address(
                    [isTestnet ? 0x20 : 0x21]
                        .concat(hash.bytes)
                        .concat(stakingHash.bytes)
                )
            }
        } else {
            return new Address([isTestnet ? 0x60 : 0x61].concat(hash.bytes))
        }
    }

    /**
     * @param {ByteArrayLike} bytes
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromUplcCbor(bytes, isTestnet = config.isTestnet) {
        return Address.fromUplcData(decodeUplcData(bytes), isTestnet)
    }

    /**
     * @param {UplcData} data
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromUplcData(data, isTestnet = config.isTestnet) {
        ConstrData.assert(data, 0, 2)

        const credential = Credential.fromUplcData(data.fields[0])
        const stakingCredentialData = ConstrData.expect(
            data.fields[1],
            "invalid StakingCredential option within Address"
        )

        /**
         * @type {Option<StakingCredential>}
         */
        let stakingCredential = None

        // for some weird reason Option::None has index 1
        if (stakingCredentialData.tag == 1) {
            stakingCredential = None
        } else if (stakingCredentialData.tag == 0) {
            stakingCredentialData.expectFields(
                1,
                "invalid StakingCredential option content within Address"
            )

            stakingCredential = StakingCredential.fromUplcData(
                stakingCredentialData.fields[0]
            )
        } else {
            throw new Error("unexpected")
        }

        return Address.fromCredentials(credential, stakingCredential, isTestnet)
    }

    /**
     * Simple script address with an optional staking hash (`PubKeyHash` or `StakingValidatorHash`).
     * @private
     * @param {ValidatorHash} hash
     * @param {Option<PubKeyHash | StakingValidatorHash>} stakingHash
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromValidatorHash(hash, stakingHash, isTestnet) {
        if (isSome(stakingHash)) {
            if (stakingHash instanceof PubKeyHash) {
                return new Address(
                    [isTestnet ? 0x10 : 0x11]
                        .concat(hash.bytes)
                        .concat(stakingHash.bytes)
                )
            } else {
                return new Address(
                    [isTestnet ? 0x30 : 0x31]
                        .concat(hash.bytes)
                        .concat(stakingHash.bytes)
                )
            }
        } else {
            return new Address([isTestnet ? 0x70 : 0x71].concat(hash.bytes))
        }
    }

    /**
     * Used to sort txbody withdrawals.
     * @param {Address} a
     * @param {Address} b
     * @param {boolean} stakingHashesOnly
     * @return {number}
     */
    static compare(a, b, stakingHashesOnly = false) {
        if (stakingHashesOnly) {
            if (isSome(a.stakingHash) && isSome(b.stakingHash)) {
                return ByteArrayData.compare(
                    a.stakingHash.bytes,
                    b.stakingHash.bytes
                )
            } else {
                throw new Error("can't compare undefined stakingHashes")
            }
        } else {
            throw new Error("not yet implemented")
        }
    }

    /**
     * Returns the underlying `PubKeyHash` of a simple payment address, or `null` for a script address.
     * @type {Option<PubKeyHash>}
     */
    get pubKeyHash() {
        return this.credential.pubKeyHash
    }

    /**
     * @type {Option<StakingHash>}
     */
    get stakingHash() {
        return this.stakingCredential ? this.stakingCredential.hash : None
    }

    /**
     * Returns the underlying `ValidatorHash` of a script address, or `null` for a regular payment address.
     * @type {Option<ValidatorHash>}
     */
    get validatorHash() {
        return this.credential.validatorHash
    }

    /**
     * @returns {Object}
     */
    dump() {
        return {
            hex: this.toHex(),
            bech32: this.toBech32()
        }
    }

    /**
     * @param {Address} other
     * @returns {boolean}
     */
    equals(other) {
        return ByteArrayData.compare(this.bytes, other.bytes) == 0
    }

    /**
     * Returns `true` if the given `Address` is a testnet address.
     * @returns {boolean}
     */
    isForTestnet() {
        let type = this.bytes[0] & 0b00001111

        return type == 0
    }

    /**
     * Converts an `Address` into its Bech32 representation.
     * @returns {string}
     */
    toBech32() {
        return encodeBech32(
            this.isForTestnet() ? "addr_test" : "addr",
            this.bytes
        )
    }

    /**
     * Converts an `Address` into its CBOR representation.
     * @returns {number[]}
     */
    toCbor() {
        return encodeBytes(this.bytes)
    }

    /**
     * Converts a `Address` into its hexadecimal representation.
     * @returns {string}
     */
    toHex() {
        return bytesToHex(this.bytes)
    }

    /**
     * @returns {UplcData}
     */
    toUplcData() {
        return new ConstrData(0, [
            this.credential.toUplcData(),
            encodeOptionData(this.stakingCredential?.toUplcData())
        ])
    }
}
