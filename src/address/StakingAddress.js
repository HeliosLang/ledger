import { decodeBytes, encodeBytes, isBytes } from "@helios-lang/cbor"
import {
    bytesToHex,
    compareBytes,
    equalsBytes,
    toBytes
} from "@helios-lang/codec-utils"
import { decodeBech32, encodeBech32 } from "@helios-lang/crypto"
import {
    makeDummyPubKeyHash,
    makePubKeyHash,
    makeStakingValidatorHash
} from "../hashes/index.js"
import {
    convertStakingCredentialToUplcData,
    convertUplcDataToStakingCredential
} from "./StakingCredential.js"

/**
 * @import { BytesLike } from "@helios-lang/codec-utils"
 * @import { ConstrData, UplcData } from "@helios-lang/uplc"
 * @import { PubKeyHash, StakingAddress, StakingCredential } from "../index.js"
 */

/**
 * @param {boolean} mainnet
 * @param {number} seed
 * @returns {StakingAddress<PubKeyHash>}
 */
export function makeDummyStakingAddress(mainnet, seed = 0) {
    return new StakingAddressImpl(mainnet, makeDummyPubKeyHash(seed))
}

/**
 * @overload
 * @param {string} bech32
 * @returns {StakingAddress}
 */
/**
 * @template {StakingCredential} [SC=StakingCredential]
 * @overload
 * @param {boolean} mainnet
 * @param {SC} stakingCredential
 * @returns {StakingAddress<SC>}
 */
/**
 * @template {StakingCredential} [SC=StakingCredential]
 * @param {(
 *   [string]
 *   | [boolean, SC]
 * )} args
 * @returns {StakingAddress<SC>}
 */
export function makeStakingAddress(...args) {
    if (args.length == 1) {
        return /** @type {any} */ (parseStakingAddress(args[0]))
    } else {
        return new StakingAddressImpl(args[0], args[1])
    }
}

/**
 * @param {string} str
 * @returns {StakingAddress}
 */
export function parseStakingAddress(str) {
    if (str.startsWith("stake")) {
        const [prefix, bytes] = decodeBech32(str)

        const result = decodeStakingAddress(bytes)

        if (prefix != result.bech32Prefix) {
            throw new Error("invalid StakingAddress prefix")
        }

        return result
    } else {
        return decodeStakingAddress(str)
    }
}

/**
 * @param {BytesLike} bytes
 * @returns {StakingAddress}
 */
export function decodeStakingAddress(bytes) {
    const innerBytes = isBytes(bytes) ? decodeBytes(bytes) : toBytes(bytes)

    const head = innerBytes[0]

    const mainnet = (head & 0b00001111) != 0

    const type = head & 0b11110000

    const hashBytes = innerBytes.slice(1, 29)

    switch (type) {
        case 0xe0:
            return makeStakingAddress(mainnet, makePubKeyHash(hashBytes))
        case 0xf0:
            return makeStakingAddress(
                mainnet,
                makeStakingValidatorHash(hashBytes)
            )
        default:
            throw new Error(`invalid Staking Address header ${head}`)
    }
}

/**
 * Doesn't take into account the header byte
 * @param {StakingAddress} a
 * @param {StakingAddress} b
 * @returns {number}
 */
export function compareStakingAddresses(a, b) {
    return compareBytes(a.stakingCredential.bytes, b.stakingCredential.bytes)
}

/**
 * On-chain a StakingAddress is represented as a StakingCredential
 * @param {boolean} mainnet
 * @param {UplcData} data
 * @returns {StakingAddress}
 */
export function convertUplcDataToStakingAddress(mainnet, data) {
    const stakingCredential = convertUplcDataToStakingCredential(data)
    return makeStakingAddress(mainnet, stakingCredential)
}

/**
 * @param {string} str
 * @returns {boolean}
 */
export function isValidBech32StakingAddress(str) {
    try {
        parseStakingAddress(str)
        return true
    } catch (_e) {
        return false
    }
}

/**
 * Wrapper for Cardano stake address bytes. An StakingAddress consists of two parts internally:
 *   - Header (1 byte, see CIP 8)
 *   - Staking witness hash (28 bytes that represent the `PubKeyHash` or `StakingValidatorHash`)
 *
 * Staking addresses are used to query the assets held by given staking credentials.
 *
 * TODO: handle staking pointers?
 * @template {StakingCredential} [SC=StakingCredential] - staking can have a context with a program and a redeemer
 * @implements {StakingAddress<SC>}
 */
class StakingAddressImpl {
    /**
     * @readonly
     * @type {boolean}
     */
    mainnet

    /**
     * @readonly
     * @type {SC}
     */
    stakingCredential

    /**
     * @param {boolean} mainnet
     * @param {SC} stakingCredential
     */
    constructor(mainnet, stakingCredential) {
        this.mainnet = mainnet
        this.stakingCredential = stakingCredential
    }

    /**
     * @type {"StakingAddress"}
     */
    get kind() {
        return "StakingAddress"
    }

    /**
     * @type {"stake" | "stake_test"}
     */
    get bech32Prefix() {
        return this.mainnet ? "stake" : "stake_test"
    }

    get bytes() {
        if (this.stakingCredential.kind == "PubKeyHash") {
            return [this.mainnet ? 0xe1 : 0xe0].concat(
                this.stakingCredential.bytes
            )
        } else {
            return [this.mainnet ? 0xf1 : 0xf0].concat(
                this.stakingCredential.bytes
            )
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
     * Converts a `StakingAddress` into its Bech32 representation.
     * @returns {string}
     */
    toBech32() {
        return encodeBech32(this.bech32Prefix, this.bytes)
    }

    /**
     * Converts a `StakingAddress` into its CBOR representation.
     * @returns {number[]}
     */
    toCbor() {
        return encodeBytes(this.bytes)
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
        return convertStakingCredentialToUplcData(this.stakingCredential)
    }
}
