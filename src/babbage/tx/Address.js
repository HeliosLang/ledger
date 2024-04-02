import { decodeBytes, encodeBytes } from "@helios-lang/cbor"
import { bytesToHex, toBytes } from "@helios-lang/codec-utils"
import { decodeBech32, encodeBech32 } from "@helios-lang/crypto"
import { expectSome, isSome, None } from "@helios-lang/type-utils"
import {
    ByteArrayData,
    ConstrData,
    decodeUplcData,
    encodeOptionData,
    UplcProgramV1,
    UplcProgramV2
} from "@helios-lang/uplc"
import {
    PubKeyHash,
    StakingHash,
    StakingValidatorHash,
    ValidatorHash
} from "../hashes/index.js"
import { config } from "./config.js"
import { SpendingCredential } from "./SpendingCredential.js"
import { StakingCredential } from "./StakingCredential.js"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 * @typedef {import("../hashes/index.js").StakingHashKind} StakingHashKind
 * @typedef {import("./SpendingCredential.js").SpendingCredentialKind} SpendingCredentialKind
 */

/**
 * @typedef {Address | ByteArrayLike} AddressLike
 */

/**
 * Wrapper for Cardano address bytes. An `Address` consists of three parts internally:
 *   * Header (1 byte, see [CIP 19](https://cips.cardano.org/cips/cip19/))
 *   * Witness hash (28 bytes that represent the `PubKeyHash` or `ValidatorHash`)
 *   * Optional staking credential (0 or 28 bytes)
 * @template [CSpending=unknown] - spending can have a context
 * @template [CStaking=unknown] - staking can have a separate context
 */
export class Address {
    /**
     * @readonly
     * @type {number[]}
     */
    bytes

    /**
     * @readonly
     * @type {CSpending}
     */
    spendingContext

    /**
     * @readonly
     * @type {CStaking}
     */
    stakingContext

    /**
     * @param {ByteArrayLike} bytes
     * @param {Option<CSpending>} spendingContext
     * @param {Option<CStaking>} stakingContext
     */
    constructor(bytes, spendingContext = None, stakingContext = None) {
        this.bytes = toBytes(bytes)

        if (!(this.bytes.length == 29 || this.bytes.length == 57)) {
            throw new Error(
                `expected 29 or 57 bytes for Address, got ${this.bytes.length}`
            )
        }

        if (spendingContext) {
            this.spendingContext = spendingContext
        }

        if (stakingContext) {
            this.stakingContext = stakingContext
        }
    }

    /**
     * Returns a dummy address (based on a PubKeyHash with all null bytes)
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static dummy(isTestnet = config.IS_TESTNET) {
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
     * @param {SpendingCredential} paymentCredential
     * @param {Option<StakingCredential>} stakingCredential
     * @param {boolean} isTestnet
     * @return {Address}
     */
    static fromCredentials(
        paymentCredential,
        stakingCredential,
        isTestnet = config.IS_TESTNET
    ) {
        return this.fromHashes(
            paymentCredential.hash,
            stakingCredential?.hash?.hash ?? None,
            isTestnet
        )
    }

    /**
     * Constructs an Address using either a `PubKeyHash` (i.e. simple payment address)
     * or `ValidatorHash` (i.e. script address),
     * without a staking hash.
     * @template {PubKeyHash | ValidatorHash} [TSpending=PubKeyHash | ValidatorHash]
     * @param {TSpending} hash
     * @param {boolean} isTestnet
     * @returns {(
     *   TSpending extends PubKeyHash ? Address<null, null> :
     *   TSpending extends ValidatorHash<infer CSpending> ? Address<CSpending, null> :
     *   Address<unknown, null>
     * )}
     */
    static fromHash(hash, isTestnet = config.IS_TESTNET) {
        return Address.fromHashes(hash, null, isTestnet)
    }

    /**
     * Constructs an Address using either a `PubKeyHash` (i.e. simple payment address)
     * or `ValidatorHash` (i.e. script address),
     * in combination with an optional staking hash (`PubKeyHash` or `StakingValidatorHash`).
     * @template {PubKeyHash | ValidatorHash} [TSpending=PubKeyHash | ValidatorHash]
     * @template {PubKeyHash | StakingValidatorHash} [TStaking=PubKeyHash | StakingValidatorHash]
     * @param {TSpending} spendingHash
     * @param {Option<TStaking>} stakingHash
     * @param {boolean} isTestnet
     * @returns {(
     *   TSpending extends PubKeyHash ? (
     *     TStaking extends PubKeyHash ? Address<null, null> :
     *     TStaking extends StakingValidatorHash<infer CStaking> ? Address<null, CStaking> :
     *     Address<null, unknown>
     *   ) : TSpending extends ValidatorHash<infer CSpending> ? (
     *     TStaking extends PubKeyHash ? Address<CSpending, null> :
     *     TStaking extends StakingValidatorHash<infer CStaking> ? Address<CSpending, CStaking> :
     *     Address<CSpending, unknown>
     *   ) : Address
     * )}
     */
    static fromHashes(
        spendingHash,
        stakingHash,
        isTestnet = config.IS_TESTNET
    ) {
        if (spendingHash instanceof PubKeyHash) {
            return /** @type {any} */ (
                Address.fromPubKeyHash(spendingHash, stakingHash, isTestnet)
            )
        } else if (spendingHash instanceof ValidatorHash) {
            return /** @type {any} */ (
                Address.fromValidatorHash(spendingHash, stakingHash, isTestnet)
            )
        } else {
            throw new Error("invalid Spending hash")
        }
    }

    /**
     * Simple payment address with an optional staking hash (`PubKeyHash` or `StakingValidatorHash`).
     * @private
     * @template {PubKeyHash | StakingValidatorHash} [TStaking=PubKeyHash | StakingValidatorHash]
     * @param {PubKeyHash} paymentHash
     * @param {Option<TStaking>} stakingHash
     * @param {boolean} isTestnet
     * @returns {(
     *   TStaking extends PubKeyHash ? Address<null, null> :
     *   TStaking extends StakingValidatorHash<infer C> ? Address<null, C> :
     *   Address<null, unknown>
     * )}
     */
    static fromPubKeyHash(paymentHash, stakingHash, isTestnet) {
        if (stakingHash) {
            if (stakingHash instanceof PubKeyHash) {
                return /** @type {any} */ (
                    new Address(
                        [isTestnet ? 0x00 : 0x01]
                            .concat(paymentHash.bytes)
                            .concat(stakingHash.bytes),
                        None,
                        None
                    )
                )
            } else if (stakingHash instanceof StakingValidatorHash) {
                return /** @type {any} */ (
                    new Address(
                        [isTestnet ? 0x20 : 0x21]
                            .concat(paymentHash.bytes)
                            .concat(stakingHash.bytes),
                        None,
                        stakingHash.context
                    )
                )
            } else {
                throw new Error("invalid Staking hash")
            }
        } else {
            return /** @type {any} */ (
                new Address(
                    [isTestnet ? 0x60 : 0x61].concat(paymentHash.bytes),
                    None,
                    None
                )
            )
        }
    }

    /**
     * @param {ByteArrayLike} bytes
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromUplcCbor(bytes, isTestnet = config.IS_TESTNET) {
        return Address.fromUplcData(decodeUplcData(bytes), isTestnet)
    }

    /**
     * @param {UplcData} data
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromUplcData(data, isTestnet = config.IS_TESTNET) {
        ConstrData.assert(data, 0, 2)

        const paymentCredential = SpendingCredential.fromUplcData(
            data.fields[0]
        )
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

        return Address.fromCredentials(
            paymentCredential,
            stakingCredential,
            isTestnet
        )
    }

    /**
     * Simple script address with an optional staking hash (`PubKeyHash` or `StakingValidatorHash`).
     * @private
     * @template [CSpending=unknown]
     * @param {ValidatorHash<CSpending>} spendingHash
     * @template {PubKeyHash | StakingValidatorHash} [TStaking=PubKeyHash | StakingValidatorHash]pytho
     * @param {Option<TStaking>} stakingHash
     * @param {boolean} isTestnet
     * @returns {(
     *   TStaking extends (null | undefined | PubKeyHash) ? Address<CSpending, null> :
     *   TStaking extends StakingValidatorHash<infer CStaking> ? Address<CSpending, CStaking> :
     *   Address<CSpending, unknown>
     * )}
     */
    static fromValidatorHash(spendingHash, stakingHash, isTestnet) {
        if (isSome(stakingHash)) {
            if (stakingHash instanceof PubKeyHash) {
                return /** @type {any} */ (
                    new Address(
                        [isTestnet ? 0x10 : 0x11]
                            .concat(spendingHash.bytes)
                            .concat(stakingHash.bytes),
                        spendingHash.context,
                        null
                    )
                )
            } else if (stakingHash instanceof StakingValidatorHash) {
                return /** @type {any} */ (
                    new Address(
                        [isTestnet ? 0x30 : 0x31]
                            .concat(spendingHash.bytes)
                            .concat(stakingHash.bytes),
                        spendingHash.context,
                        stakingHash.context
                    )
                )
            } else {
                throw new Error("invalid StakingHash type")
            }
        } else {
            return /** @type {any} */ (
                new Address(
                    [isTestnet ? 0x70 : 0x71].concat(spendingHash.bytes),
                    spendingHash.context,
                    null
                )
            )
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
     * @type {SpendingCredential<SpendingCredentialKind, CSpending>}
     */
    get spendingCredential() {
        return SpendingCredential.fromAddressBytes(
            this.bytes,
            this.spendingContext
        )
    }

    /**
     * Returns the underlying `PubKeyHash` of a simple payment address, or `null` for a script address.
     * @type {Option<PubKeyHash>}
     */
    get pubKeyHash() {
        return this.spendingCredential.pubKeyHash
    }

    /**
     * @type {Option<StakingCredential<StakingHashKind, CStaking>>}
     */
    get stakingCredential() {
        return StakingCredential.fromAddressBytes(
            this.bytes,
            this.stakingContext
        )
    }

    /**
     * @type {Option<StakingHash<StakingHashKind, CStaking>>}
     */
    get stakingHash() {
        return this.stakingCredential ? this.stakingCredential.hash : None
    }

    /**
     * Returns the underlying `ValidatorHash` of a script address, or `null` for a regular payment address.
     * @type {Option<ValidatorHash<CSpending>>}
     */
    get validatorHash() {
        return this.spendingCredential.validatorHash
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
            this.spendingCredential.toUplcData(),
            encodeOptionData(this.stakingCredential?.toUplcData())
        ])
    }
}
