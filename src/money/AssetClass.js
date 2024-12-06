import {
    bytesToHex,
    compareBytes,
    equalsBytes,
    makeByteStream,
    toBytes
} from "@helios-lang/codec-utils"
import {
    decodeBytes,
    decodeConstr,
    encodeBytes,
    encodeConstr
} from "@helios-lang/cbor"
import { blake2b, encodeBech32 } from "@helios-lang/crypto"
import {
    expectByteArrayData,
    expectConstrData,
    makeByteArrayData,
    makeConstrData
} from "@helios-lang/uplc"
import {
    compareMintingPolicyHashes,
    convertUplcDataToMintingPolicyHash,
    decodeMintingPolicyHash,
    makeDummyMintingPolicyHash,
    makeMintingPolicyHash
} from "../hashes/index.js"

/**
 * @import { BytesLike } from "@helios-lang/codec-utils"
 * @import { ConstrData, UplcData } from "@helios-lang/uplc"
 * @import { AssetClass, AssetClassLike, MintingPolicyHash } from "../index.js"
 */

/**
 * @template [C=unknown]
 * @overload
 * @param {MintingPolicyHash<C>} mph
 * @param {BytesLike} tokenName
 * @returns {AssetClass<C>}
 */
/**
 * @overload
 * @param {AssetClassLike} arg
 * @returns {AssetClass}
 */
/**
 * @template [C=unknown]
 * @param {(
 *   [MintingPolicyHash<C>, BytesLike]
 *   | [AssetClassLike]
 * )} args
 * @returns {AssetClass<C>}
 */
export function makeAssetClass(...args) {
    if (args.length == 2) {
        return new AssetClassImpl(args[0], toBytes(args[1]))
    } else {
        const arg = args[0]

        if (
            typeof arg == "object" &&
            "kind" in arg &&
            arg.kind == "AssetClass"
        ) {
            return /** @type {any} */ (arg)
        } else if (typeof arg == "string") {
            return /** @type {any} */ (parseAssetClass(arg))
        } else if (Array.isArray(arg)) {
            return /** @type {any} */ (
                new AssetClassImpl(
                    makeMintingPolicyHash(arg[0]),
                    toBytes(arg[1])
                )
            )
        } else {
            return /** @type {any} */ (
                new AssetClassImpl(
                    makeMintingPolicyHash(arg.mph),
                    toBytes(arg.tokenName)
                )
            )
        }
    }
}

/**
 * @param {number} seed
 * @param {BytesLike} tokenName
 * @returns {AssetClass}
 */
export function makeDummyAssetClass(seed = 0, tokenName = []) {
    return new AssetClassImpl(
        makeDummyMintingPolicyHash(seed),
        toBytes(tokenName)
    )
}

/**
 * @param {string} s
 * @returns {AssetClass}
 */
export function parseAssetClass(s) {
    const parts = s.split(".")

    if (parts.length != 2) {
        throw new Error(
            `expected <mph>.<tokenName> in hex encoded AssetClass, got ${s}`
        )
    }

    return new AssetClassImpl(
        makeMintingPolicyHash(parts[0]),
        toBytes(parts[1])
    )
}

/**
 * @param {AssetClass} a
 * @param {AssetClass} b
 * @returns {number}
 */
export function compareAssetClasses(a, b) {
    const i = compareMintingPolicyHashes(a.mph, b.mph)

    if (i != 0) {
        return i
    }

    return compareBytes(a.tokenName, b.tokenName)
}

/**
 *
 * @param {UplcData} data
 * @returns {AssetClass}
 */
export function convertUplcDataToAssetClass(data) {
    const cData = expectConstrData(data, 0, 2)

    const mph = convertUplcDataToMintingPolicyHash(cData.fields[0])
    const tokenName = expectByteArrayData(cData.fields[1]).bytes

    return new AssetClassImpl(mph, tokenName)
}

/**
 * Deserializes bytes into an `AssetClass`.
 * @param {BytesLike} bytes
 * @returns {AssetClass}
 */
export function decodeAssetClass(bytes) {
    const stream = makeByteStream(bytes)

    const [tag, [mph, tokenName]] = decodeConstr(stream, [
        decodeMintingPolicyHash,
        decodeBytes
    ])

    if (tag != 0) {
        throw new Error(`expected tag 0 for AssetClass ConstrData, got ${tag}`)
    }

    return new AssetClassImpl(mph, tokenName)
}

/**
 * @template [C=unknown]
 * @implements {AssetClass<C>}
 */
class AssetClassImpl {
    /**
     * @readonly
     * @type {MintingPolicyHash<C>}
     */
    mph

    /**
     * @readonly
     * @type {number[]}
     */
    tokenName

    /**
     * @param {MintingPolicyHash<C>} mph
     * @param {number[]} tokenName
     */
    constructor(mph, tokenName) {
        this.mph = mph
        this.tokenName = tokenName
    }

    /**
     * @type {"AssetClass"}
     */
    get kind() {
        return "AssetClass"
    }

    /**
     * @param {AssetClass} other
     * @returns {boolean}
     */
    isEqual(other) {
        return (
            this.mph.isEqual(other.mph) &&
            equalsBytes(this.tokenName, other.tokenName)
        )
    }

    /**
     * @param {AssetClass} other
     * @returns {boolean}
     */
    isGreaterThan(other) {
        return compareAssetClasses(this, other) > 0
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
        return makeConstrData(0, [
            this.mph.toUplcData(),
            makeByteArrayData(this.tokenName)
        ])
    }
}

/**
 * @type {AssetClass}
 */
export const ADA = parseAssetClass(".")
