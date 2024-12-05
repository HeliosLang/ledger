import { decodeBytes, encodeBytes, isBytes } from "@helios-lang/cbor"
import { bytesToHex, toBytes } from "@helios-lang/codec-utils"
import { decodeBech32, encodeBech32 } from "@helios-lang/crypto"
import {
    expectConstrData,
    makeConstrData,
    unwrapUplcDataOption,
    wrapUplcDataOption
} from "@helios-lang/uplc"
import {
    makeDummyPubKeyHash,
    makePubKeyHash,
    makeStakingValidatorHash,
    makeValidatorHash
} from "../hashes/index.js"
import { convertUplcDataToSpendingCredential } from "./SpendingCredential.js"
import {
    convertStakingCredentialToUplcData,
    convertUplcDataToStakingCredential
} from "./StakingCredential.js"

/**
 * @import { BytesLike } from "@helios-lang/codec-utils"
 * @import { ConstrData, UplcData } from "@helios-lang/uplc"
 * @import { Address, PubKeyHash, ShelleyAddress, ShelleyAddressLike, SpendingCredential, StakingCredential } from "../index.js"
 */

/**
 * Returns a dummy address (based on a PubKeyHash with dummy bytes)
 * @param {boolean} mainnet
 * @param {number} seed
 * @returns {ShelleyAddress<PubKeyHash>}
 */
export function makeDummyShelleyAddress(mainnet, seed = 0) {
    return makeShelleyAddress(mainnet, makeDummyPubKeyHash(seed))
}

/**
 * @overload
 * @param {string} bech32
 * @returns {ShelleyAddress}
 */
/**
 * @template {SpendingCredential} [SC=SpendingCredential]
 * @overload
 * @param {boolean} mainnet
 * @param {SC} spendingCredential
 * @returns {ShelleyAddress<SC>}
 */
/**
 * @template {SpendingCredential} [SC=SpendingCredential]
 * @overload
 * @param {boolean} mainnet
 * @param {SC} spendingCredential
 * @param {StakingCredential | undefined} stakingCredential
 * @returns {ShelleyAddress<SC>}
 */
/**
 * @overload
 * @param {ShelleyAddressLike} addr
 * @returns {ShelleyAddress}
 */
/**
 * @template {SpendingCredential} [SC=SpendingCredential]
 * @param {(
 *   [string]
 *   | [ShelleyAddressLike]
 *   | [boolean, SC]
 *   | [boolean, SC, StakingCredential | undefined]
 * )} args
 * @returns {ShelleyAddress<SC>}
 */
export function makeShelleyAddress(...args) {
    if (args.length == 1) {
        const arg = args[0]

        if (typeof arg == "string" && arg.startsWith("addr")) {
            // ignore the prefix (encoded in the bytes anyway)
            let [prefix, bytes] = decodeBech32(arg)

            let result = decodeShelleyAddress(bytes)

            if (prefix != result.bech32Prefix) {
                throw new Error("invalid Address prefix")
            }

            return /** @type {any} */ (result)
        } else if (
            typeof arg == "object" &&
            "kind" in arg &&
            arg.kind == "Address"
        ) {
            return /** @type {any} */ (arg)
        } else {
            return /** @type {any} */ (decodeShelleyAddress(arg))
        }
    } else if (args.length == 2) {
        return new ShelleyAddressImpl(args[0], args[1], undefined)
    } else if (args.length == 3) {
        return new ShelleyAddressImpl(args[0], args[1], args[2])
    } else {
        throw new Error("invalid makeShelleyAddress args")
    }
}

/**
 * @param {string} bech32
 * @returns {ShelleyAddress}
 */
export function parseShelleyAddress(bech32) {
    // ignore the prefix (encoded in the bytes anyway)
    let [prefix, bytes] = decodeBech32(bech32)

    let result = decodeShelleyAddress(bytes)

    if (prefix != result.bech32Prefix) {
        throw new Error("invalid Address prefix")
    }

    return result
}

/**
 * @param {boolean} mainnet
 * @param {UplcData} data
 * @returns {ShelleyAddress}
 */
export function convertUplcDataToShelleyAddress(mainnet, data) {
    const cData = expectConstrData(data, 0, 2)

    const paymentCredential = convertUplcDataToSpendingCredential(
        cData.fields[0]
    )
    const stakingCredentialData = unwrapUplcDataOption(cData.fields[1])

    /**
     * @type {StakingCredential | undefined}
     */
    const stakingCredential = stakingCredentialData
        ? convertUplcDataToStakingCredential(stakingCredentialData)
        : undefined

    return makeShelleyAddress(mainnet, paymentCredential, stakingCredential)
}

/**
 * Pointer addresses are on the deprecation path, so we can use the first byte to distinguish between wrapped CBOR bytes and unwrapped bytes
 * @param {BytesLike} bytes
 * @returns {ShelleyAddress}
 */
export function decodeShelleyAddress(bytes) {
    const innerBytes = isBytes(bytes) ? decodeBytes(bytes) : toBytes(bytes)

    const head = innerBytes[0]

    const mainnet = (head & 0b00001111) != 0

    const type = head & 0b11110000

    const firstPart = () => {
        return innerBytes.slice(1, 29)
    }

    const secondPart = () => {
        return innerBytes.slice(29, 57)
    }

    switch (type) {
        case 0x00:
            return makeShelleyAddress(
                mainnet,
                makePubKeyHash(firstPart()),
                makePubKeyHash(secondPart())
            )
        case 0x10:
            return makeShelleyAddress(
                mainnet,
                makeValidatorHash(firstPart()),
                makePubKeyHash(secondPart())
            )
        case 0x20:
            return makeShelleyAddress(
                mainnet,
                makePubKeyHash(firstPart()),
                makeStakingValidatorHash(secondPart())
            )
        case 0x30:
            return makeShelleyAddress(
                mainnet,
                makeValidatorHash(firstPart()),
                makePubKeyHash(secondPart())
            )
        case 0x60:
            return makeShelleyAddress(mainnet, makePubKeyHash(firstPart()))
        case 0x70:
            return makeShelleyAddress(mainnet, makeValidatorHash(firstPart()))
        default:
            throw new Error(`invalid Shelley Address header ${head}`)
    }
}

/**
 * @param {string} str
 * @returns {boolean}
 */
export function isValidBech32Address(str) {
    try {
        parseShelleyAddress(str)
        return true
    } catch (_e) {
        return false
    }
}

/**
 * Wrapper for Cardano address bytes. An `Address` consists of three parts internally:
 *   - Header (1 byte, see [CIP 19](https://cips.cardano.org/cips/cip19/))
 *   - Witness hash (28 bytes that represent the `PubKeyHash` or `ValidatorHash`)
 *   - Optional staking credential (0 or 28 bytes)
 * @template {SpendingCredential} [SC=SpendingCredential]
 * @implements {ShelleyAddress<SC>}
 */
class ShelleyAddressImpl {
    /**
     * @readonly
     * @type {boolean}
     */
    mainnet

    /**
     * @readonly
     * @type {SC}
     */
    spendingCredential

    /**
     * @readonly
     * @type {StakingCredential | undefined}
     */
    stakingCredential

    /**
     * @param {boolean} mainnet
     * @param {SC} spendingCredential
     * @param {StakingCredential | undefined} stakingCredential
     */
    constructor(mainnet, spendingCredential, stakingCredential = undefined) {
        this.mainnet = mainnet
        this.spendingCredential = spendingCredential
        this.stakingCredential = stakingCredential
    }

    /**
     * @type {number[]}
     */
    get bytes() {
        if (this.stakingCredential) {
            if (this.spendingCredential.kind == "PubKeyHash") {
                if (this.stakingCredential.kind == "PubKeyHash") {
                    return [this.mainnet ? 0x01 : 0x00]
                        .concat(this.spendingCredential.bytes)
                        .concat(this.stakingCredential.bytes)
                } else {
                    return [this.mainnet ? 0x21 : 0x20]
                        .concat(this.spendingCredential.bytes)
                        .concat(this.stakingCredential.bytes)
                }
            } else {
                if (this.stakingCredential.kind == "PubKeyHash") {
                    return [this.mainnet ? 0x11 : 0x10]
                        .concat(this.spendingCredential.bytes)
                        .concat(this.stakingCredential.bytes)
                } else {
                    return [this.mainnet ? 0x31 : 0x30]
                        .concat(this.spendingCredential.bytes)
                        .concat(this.stakingCredential.bytes)
                }
            }
        } else if (this.spendingCredential.kind == "PubKeyHash") {
            return [this.mainnet ? 0x61 : 0x60].concat(
                this.spendingCredential.bytes
            )
        } else {
            return [this.mainnet ? 0x71 : 0x70].concat(
                this.spendingCredential.bytes
            )
        }
    }

    /**
     * @type {"Address"}
     */
    get kind() {
        return "Address"
    }

    /**
     * @type {"Shelley"}
     */
    get era() {
        return "Shelley"
    }

    /**
     * @type {"addr" | "addr_test"}
     */
    get bech32Prefix() {
        return this.mainnet ? "addr" : "addr_test"
    }

    /**
     * @returns {ShelleyAddress<SC>}
     */
    copy() {
        return new ShelleyAddressImpl(
            this.mainnet,
            this.spendingCredential,
            this.stakingCredential
        )
    }

    /**
     * @returns {object}
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
    isEqual(other) {
        if (other.era == "Shelley" && this.mainnet == other.mainnet) {
            if (
                this.spendingCredential.kind == "PubKeyHash" &&
                other.spendingCredential.kind == "PubKeyHash"
            ) {
                if (
                    !this.spendingCredential.isEqual(other.spendingCredential)
                ) {
                    return false
                }
            } else if (
                this.spendingCredential.kind == "ValidatorHash" &&
                other.spendingCredential.kind == "ValidatorHash"
            ) {
                if (
                    !this.spendingCredential.isEqual(other.spendingCredential)
                ) {
                    return false
                }
            } else {
                return false
            }

            if (this.stakingCredential === undefined) {
                return other.stakingCredential === undefined
            } else if (
                this.stakingCredential.kind == "PubKeyHash" &&
                other.stakingCredential?.kind == "PubKeyHash"
            ) {
                return this.stakingCredential.isEqual(other.stakingCredential)
            } else if (
                this.stakingCredential.kind == "StakingValidatorHash" &&
                other.stakingCredential?.kind == "StakingValidatorHash"
            ) {
                return this.stakingCredential.isEqual(other.stakingCredential)
            } else {
                return false
            }
        }

        return false
    }

    /**
     * Converts an `Address` into its Bech32 representation.
     * @returns {string}
     */
    toBech32() {
        return encodeBech32(this.bech32Prefix, this.bytes)
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
     * @returns {string}
     */
    toString() {
        return this.toBech32()
    }

    /**
     * @returns {UplcData}
     */
    toUplcData() {
        return makeConstrData(0, [
            this.spendingCredential.toUplcData(),
            wrapUplcDataOption(
                this.stakingCredential
                    ? convertStakingCredentialToUplcData(this.stakingCredential)
                    : undefined
            )
        ])
    }
}
