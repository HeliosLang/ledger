import { ByteStream, bytesToHex, toBytes } from "@helios-lang/codec-utils"
import { ByteArrayData, ConstrData, decodeUplcData } from "@helios-lang/uplc"
import { blake2b, encodeBech32 } from "@helios-lang/crypto"
import {
    decodeBytes,
    decodeConstr,
    encodeBytes,
    encodeConstr
} from "@helios-lang/cbor"
import { MintingPolicyHash } from "../hashes/index.js"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 * @typedef {import("../hashes/index.js").MintingPolicyHashLike} MintingPolicyHashLike
 */
/**
 * @typedef {string | [
 *   MintingPolicyHashLike,
 *   ByteArrayLike
 * ] | {
 *   mph: MintingPolicyHashLike,
 *   tokenName: ByteArrayLike
 * }} AssetClassLike
 */

/**
 * Represents a `MintingPolicyHash` combined with a token name.
 */
export class AssetClass {
    /**
     * @type {MintingPolicyHash}
     */
    mph

    /**
     * @type {number[]}
     */
    tokenName

    /**
     * Intelligently converts arguments.
     *
     * The format for single argument string is "<hex-encoded-mph>.<hex-encoded-token-name>".
     * @param {MintingPolicyHashLike} mph
     * @param {ByteArrayLike} tokenName
     */
    constructor(mph, tokenName) {
        this.mph = MintingPolicyHash.fromAlike(mph)
        this.tokenName = toBytes(tokenName)
    }

    /**
     * @type {AssetClass}
     */
    static get ADA() {
        return new AssetClass("", "")
    }

    /**
     * @param {AssetClassLike} arg
     * @returns {AssetClass}
     */
    static fromAlike(arg) {
        if (arg instanceof AssetClass) {
            return arg
        } else if (typeof arg == "string") {
            return AssetClass.fromString(arg)
        } else if (Array.isArray(arg)) {
            return new AssetClass(arg[0], arg[1])
        } else {
            return new AssetClass(arg.mph, arg.tokenName)
        }
    }

    /**
     * Deserializes bytes into an `AssetClass`.
     * @param {ByteArrayLike} bytes
     * @returns {AssetClass}
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        const [tag, [mph, tokenName]] = decodeConstr(stream, [
            MintingPolicyHash,
            decodeBytes
        ])

        if (tag != 0) {
            throw new Error(
                `expected tag 0 for AssetClass ConstrData, got ${tag}`
            )
        }

        return new AssetClass(mph, tokenName)
    }

    /**
     * @param {string} s
     * @returns {AssetClass}
     */
    static fromString(s) {
        const parts = s.split(".")

        if (parts.length != 2) {
            throw new Error(
                `expected <mph>.<tokenName> in hex encoded AssetClass, got ${s}`
            )
        }

        return new AssetClass(parts[0], parts[1])
    }

    /**
     * @param {string | number[]} bytes
     * @returns {AssetClass}
     */
    static fromUplcCbor(bytes) {
        return AssetClass.fromUplcData(decodeUplcData(bytes))
    }

    /**
     *
     * @param {UplcData} data
     * @returns {AssetClass}
     */
    static fromUplcData(data) {
        ConstrData.assert(data, 0, 2)

        const mph = MintingPolicyHash.fromUplcData(data.fields[0])
        const tokenName = ByteArrayData.expect(data.fields[1]).bytes

        return new AssetClass(mph, tokenName)
    }

    /**
     * Converts an `AssetClass` instance into its CBOR representation.
     * @returns {number[]}
     */
    toCbor() {
        return encodeConstr(0, [this.mph.toCbor(), encodeBytes(this.tokenName)])
    }

    /**
     * Cip14 fingerprint
     * This involves a hash, so you can't use a fingerprint to calculate the underlying policy/tokenName.
     * @returns {string}
     */
    toFingerprint() {
        return encodeBech32(
            "asset",
            blake2b(this.mph.bytes.concat(this.tokenName), 20)
        )
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this.mph.toHex()}.${bytesToHex(this.tokenName)}`
    }

    /**
     * Used when generating script contexts for running programs
     * @returns {ConstrData}
     */
    toUplcData() {
        return new ConstrData(0, [
            this.mph.toUplcData(),
            new ByteArrayData(this.tokenName)
        ])
    }
}

/**
 * @param {[AssetClassLike] | [MintingPolicyHashLike, ByteArrayLike]} args
 * @returns {[MintingPolicyHash, number[]]}
 */
export function handleAssetClassArgs(...args) {
    if (args.length == 1) {
        const ac = AssetClass.fromAlike(args[0])
        return [ac.mph, ac.tokenName]
    } else {
        return [MintingPolicyHash.fromAlike(args[0]), toBytes(args[1])]
    }
}

/**
 * @param {[AssetClassLike, bigint | number] | [MintingPolicyHashLike, ByteArrayLike, bigint | number]} args
 * @returns {[MintingPolicyHash, number[], bigint]}
 */
export function handleAssetClassArgsWithQty(...args) {
    if (args.length == 2) {
        const ac = AssetClass.fromAlike(args[0])
        return [ac.mph, ac.tokenName, BigInt(args[1])]
    } else {
        return [
            MintingPolicyHash.fromAlike(args[0]),
            toBytes(args[1]),
            BigInt(args[2])
        ]
    }
}
