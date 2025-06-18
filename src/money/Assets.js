import {
    decodeBytes,
    decodeInt,
    decodeMap,
    encodeBytes,
    encodeInt,
    encodeMap
} from "@helios-lang/cbor"
import {
    bytesToHex,
    compareBytes,
    decodeUtf8,
    isValidUtf8,
    makeByteStream,
    toBytes
} from "@helios-lang/codec-utils"
import { makeByteArrayData, makeIntData, makeMapData } from "@helios-lang/uplc"
import {
    compareMintingPolicyHashes,
    decodeMintingPolicyHash,
    makeMintingPolicyHash
} from "../hashes/index.js"
import { makeAssetClass } from "./AssetClass.js"

/**
 * TODO: move this somewhere else
 *   1. 100
 *   2. 222
 *   3. 333
 *   4. 444
 */
const CIP68_PREFIXES = ["000643b0", "000de140", "0014df10", "001BC280"]

/**
 * @import { BytesLike, IntLike } from "@helios-lang/codec-utils"
 * @import { JsonSafe } from "@helios-lang/type-utils"
 * @import { MapData } from "@helios-lang/uplc"
 * @import { AssetClass, AssetClassLike, Assets, AssetsLike, MintingPolicyHash, MintingPolicyHashLike, TokensLike } from "../index.js"
 */

/**
 * **Note**: the assets are normalized by removing entries with 0 tokens, and merging all entries with the same MintingPolicyHash and token name.
 * @param {AssetsLike} arg
 * @returns {Assets}
 */
export function makeAssets(arg = []) {
    if (typeof arg == "object" && "kind" in arg && arg.kind == "Assets") {
        return /** @type {any} */ (arg)
    } else {
        /**
         * @type {[MintingPolicyHash, [number[], bigint][]][]}
         */
        const assets = (Array.isArray(arg) ? arg : Object.entries(arg)).map(
            ([mphOrAssetClass, tokensOrQty]) => {
                if (
                    typeof tokensOrQty == "number" ||
                    typeof tokensOrQty == "bigint" ||
                    typeof tokensOrQty == "string"
                ) {
                    const qty = BigInt(tokensOrQty)
                    const assetClass = makeAssetClass(mphOrAssetClass)

                    /**
                     * @type {[MintingPolicyHash, [number[], bigint][]]}
                     */
                    const entry = [
                        assetClass.mph,
                        [[assetClass.tokenName, qty]]
                    ]

                    return entry
                } else {
                    const mph = mphOrAssetClass
                    const tokens = tokensOrQty

                    /**
                     * @type {[MintingPolicyHash, [number[], bigint][]]}
                     */
                    const entry = [
                        makeMintingPolicyHash(mph),
                        (Array.isArray(tokens)
                            ? tokens
                            : Object.entries(tokens)
                        ).map(([tokenName, qty]) => [
                            toBytes(tokenName),
                            BigInt(qty)
                        ])
                    ]

                    return entry
                }
            }
        )

        return /** @type {any} */ (new AssetsImpl(assets))
    }
}

/**
 * @param {BytesLike} bytes
 * @returns {Assets}
 */
export function decodeAssets(bytes) {
    const stream = makeByteStream(bytes)

    return new AssetsImpl(
        decodeMap(stream, decodeMintingPolicyHash, (innerBytes) =>
            decodeMap(innerBytes, decodeBytes, decodeInt)
        )
    )
}

/**
 * Represents a list of non-Ada tokens.
 * @implements {Assets}
 */
class AssetsImpl {
    /**
     * @type {[MintingPolicyHash, [number[], bigint][]][]}
     */
    assets

    /**
     * @param {[MintingPolicyHash, [number[], bigint][]][]} assets
     */
    constructor(assets) {
        this.assets = assets
        this.normalize()
    }

    /**
     * @type {"Assets"}
     */
    get kind() {
        return "Assets"
    }

    /**
     * @type {AssetClass[]}
     */
    get assetClasses() {
        /**
         * @type {AssetClass[]}
         */
        const assetClasses = []

        for (let [mph, tokens] of this.assets) {
            for (let [tokenName] of tokens) {
                assetClasses.push(makeAssetClass(mph, tokenName))
            }
        }

        return assetClasses
    }

    /**
     * @param {Assets} other
     * @returns {Assets}
     */
    add(other) {
        return this.applyBinOp(other, (a, b) => a + b)
    }

    /**
     * @param {AssetClassLike} assetClass
     * @param {IntLike} qty
     * @returns {void}
     */
    addAssetClassQuantity(assetClass, qty) {
        const ac = makeAssetClass(assetClass)

        this.addPolicyTokenQuantity(ac.mph, ac.tokenName, qty)
    }

    /**
     * @param {MintingPolicyHashLike} policy
     * @param {BytesLike} tokenName
     * @param {IntLike} qty
     */
    addPolicyTokenQuantity(policy, tokenName, qty) {
        const mph = makeMintingPolicyHash(policy)
        const tokenNameBytes = toBytes(tokenName)
        const qty_ = BigInt(qty)

        if (qty == 0n) {
            return
        }

        const entry = this.assets.find((asset) => mph.isEqual(asset[0]))

        if (entry) {
            const token = entry[1].find(
                (pair) => compareBytes(pair[0], tokenNameBytes) == 0
            )

            if (token) {
                token[1] += qty_
            } else {
                entry[1].push([tokenNameBytes, qty_])
            }
        } else {
            this.assets.push([mph, [[tokenNameBytes, qty_]]])
        }

        this.removeZeroes()
    }

    /**
     * Mutates 'this'.
     * Throws error if mph is already contained in 'this'.
     * @param {MintingPolicyHashLike} mph
     * @param {[BytesLike, IntLike][]} tokens
     */
    addPolicyTokens(mph, tokens) {
        const mph_ = makeMintingPolicyHash(mph)

        for (let asset of this.assets) {
            if (asset[0].isEqual(mph_)) {
                throw new Error(`MultiAsset already contains ${mph_.toHex()}`)
            }
        }

        this.assets.push([
            mph_,
            tokens.map(([tokenName, qty]) => [toBytes(tokenName), BigInt(qty)])
        ])

        // sort immediately
        this.sort()
    }

    /**
     * @private
     * @param {Assets} other
     * @param {(a: bigint, b: bigint) => bigint} op
     * @returns {Assets}
     */
    applyBinOp(other, op) {
        let res = makeAssets()

        for (let [mph, tokens] of this.assets) {
            for (let [tokenName, quantity] of tokens) {
                res.addPolicyTokenQuantity(mph, tokenName, op(quantity, 0n))
            }
        }

        for (let [mph, tokens] of other.assets) {
            for (let [tokenName, quantity] of tokens) {
                res.addPolicyTokenQuantity(mph, tokenName, op(0n, quantity))
            }
        }

        return res
    }

    /**
     * Throws an error if any contained quantity <= 0n
     */
    assertAllPositive() {
        if (!this.isAllPositive()) {
            throw new Error("non-positive token amounts detected")
        }
    }

    assertSorted() {
        this.assets.forEach((b, i) => {
            if (i > 0) {
                const a = this.assets[i - 1]

                if (compareMintingPolicyHashes(a[0], b[0]) >= 0) {
                    throw new Error(
                        `assets not sorted (${a[0].toHex()} vs ${b[0].toHex()})`
                    )
                }

                b[1].forEach((bb, j) => {
                    if (j > 0) {
                        const aa = b[1][j - 1]

                        if (compareBytes(aa[0], bb[0], true) >= 0) {
                            throw new Error("tokens not sorted")
                        }
                    }
                })
            }
        })
    }

    /**
     * @returns {number}
     */
    countTokens() {
        return this.assets.reduce(
            (prev, [_mph, tokens]) => prev + tokens.length,
            0
        )
    }

    /**
     * @returns {Assets}
     */
    copy() {
        return makeAssets(this.assets.slice())
    }

    /**
     * @returns {object}
     */
    dump() {
        return Object.fromEntries(
            this.assets.map(([mph, tokens]) => [
                mph.toHex(),
                Object.fromEntries(
                    tokens.map(([tokenName, qty]) => {
                        const hasCip68Prefix = CIP68_PREFIXES.includes(
                            bytesToHex(tokenName.slice(0, 4))
                        )

                        return [
                            bytesToHex(tokenName),
                            {
                                name: hasCip68Prefix
                                    ? decodeUtf8(tokenName.slice(4))
                                    : isValidUtf8(tokenName)
                                      ? decodeUtf8(tokenName)
                                      : undefined,
                                quantity: qty.toString()
                            }
                        ]
                    })
                )
            ])
        )
    }

    /**
     * Returns 0n if not found
     * @param {AssetClassLike} assetClass
     * @returns {bigint}
     */
    getAssetClassQuantity(assetClass) {
        const ac = makeAssetClass(assetClass)

        return this.getPolicyTokenQuantity(ac.mph, ac.tokenName)
    }

    /**
     * Returns 0n if not found
     * @param {MintingPolicyHashLike} policy
     * @param {BytesLike} tokenName
     * @returns {bigint}
     */
    getPolicyTokenQuantity(policy, tokenName) {
        const mph = makeMintingPolicyHash(policy)
        const tokenNameBytes = toBytes(tokenName)

        const entry = this.assets.find((asset) => mph.isEqual(asset[0]))

        if (entry) {
            const token = entry[1].find(
                (pair) => compareBytes(pair[0], tokenNameBytes) == 0
            )
            return token ? token[1] : 0n
        } else {
            return 0n
        }
    }

    /**
     * Returns a list of all the minting policies.
     * @returns {MintingPolicyHash[]}
     */
    getPolicies() {
        return this.assets.map(([mph, _tokens]) => mph)
    }

    /**
     * Returns empty if mph not found
     * @param {MintingPolicyHashLike} policy
     * @returns {[number[], bigint][]}
     */
    getPolicyTokens(policy) {
        const mph = makeMintingPolicyHash(policy)

        const entry = this.assets.find((entry) => entry[0].isEqual(mph))

        return entry ? entry[1] : []
    }

    /**
     * Returns an empty array if policy isn't found
     * @param {MintingPolicyHashLike} policy
     * @returns {number[][]}
     */
    getPolicyTokenNames(policy) {
        const mph = makeMintingPolicyHash(policy)

        for (let [otherMph, tokens] of this.assets) {
            if (otherMph.isEqual(mph)) {
                return tokens.map(([tokenName, _qty]) => tokenName)
            }
        }

        return []
    }

    /**
     * @param {AssetClassLike} assetClass
     * @returns {boolean}
     */
    hasAssetClass(assetClass) {
        const ac = makeAssetClass(assetClass)
        return this.hasPolicyToken(ac.mph, ac.tokenName)
    }

    /**
     * @param {MintingPolicyHashLike} policy
     * @param {BytesLike} tokenName
     * @returns {boolean}
     */
    hasPolicyToken(policy, tokenName) {
        const mph = makeMintingPolicyHash(policy)
        const tokenNameBytes = toBytes(tokenName)

        const entry = this.assets.find((asset) => mph.isEqual(asset[0]))

        if (entry) {
            return (
                entry[1].findIndex(
                    (pair) => compareBytes(pair[0], tokenNameBytes) == 0
                ) != -1
            )
        } else {
            return false
        }
    }

    /**
     * @returns {boolean}
     */
    isAllPositive() {
        for (let [_mph, tokens] of this.assets) {
            for (let [_tokenName, qty] of tokens) {
                if (qty < 0n) {
                    return false
                } else if (qty == 0n) {
                    throw new Error("unexpected")
                }
            }
        }

        return true
    }

    /**
     * @param {Assets} other
     * @returns {boolean}
     */
    isEqual(other) {
        for (let [mph, tokens] of this.assets) {
            for (let [tokenName, qty] of tokens) {
                if (qty != other.getPolicyTokenQuantity(mph, tokenName)) {
                    return false
                }
            }
        }

        for (let [mph, tokens] of other.assets) {
            for (let [tokenName, qty] of tokens) {
                if (qty != this.getPolicyTokenQuantity(mph, tokenName)) {
                    return false
                }
            }
        }

        return true
    }

    /**
     * @param {Assets} other
     * @returns {boolean}
     */
    isGreaterOrEqual(other) {
        if (this.isZero()) {
            return other.isZero()
        }

        if (
            this.assets.some(([mph, tokens]) =>
                tokens.some(
                    ([tokenName, qty]) =>
                        qty < other.getPolicyTokenQuantity(mph, tokenName)
                )
            )
        ) {
            return false
        }

        if (
            other.assets.some(([mph, tokens]) =>
                tokens.some(
                    ([tokenName]) => !this.hasPolicyToken(mph, tokenName)
                )
            )
        ) {
            return false
        }

        return true
    }

    /**
     * Strict gt, if other contains assets this one doesn't contain => return false
     * @param {Assets} other
     * @returns {boolean}
     */
    isGreaterThan(other) {
        if (this.isZero()) {
            return false
        }

        if (
            this.assets.some(([mph, tokens]) =>
                tokens.some(
                    ([tokenName, qty]) =>
                        qty <= other.getPolicyTokenQuantity(mph, tokenName)
                )
            )
        ) {
            return false
        }

        if (
            other.assets.some(([mph, tokens]) =>
                tokens.some(
                    ([tokenName]) => !this.hasPolicyToken(mph, tokenName)
                )
            )
        ) {
            return false
        }

        return true
    }

    /**
     * @returns {boolean}
     */
    isZero() {
        return this.assets.length == 0
    }

    /**
     * @param {IntLike} scalar
     * @returns {Assets}
     */
    multiply(scalar) {
        const s = BigInt(scalar)

        return makeAssets(
            this.assets.map(([mph, tokens]) => {
                return /** @type {[MintingPolicyHash, [number[], bigint][]]} */ ([
                    mph,
                    tokens.map(([token, qty]) => [token, qty * s])
                ])
            })
        )
    }

    /**
     * Removes zeroes and merges duplicates.
     * In-place algorithm.
     * Keeps the same order as much as possible.
     */
    normalize() {
        /**
         * @type {Map<string, Map<string, bigint>>}
         */
        const assets = new Map()

        for (let [mph, tokens] of this.assets) {
            let outerPrev = assets.get(mph.toHex())

            if (!outerPrev) {
                outerPrev = new Map()
            }

            for (let [tokenName, qty] of tokens) {
                let innerPrev = outerPrev.get(bytesToHex(tokenName))

                if (!innerPrev) {
                    innerPrev = 0n
                }

                innerPrev += qty

                outerPrev.set(bytesToHex(tokenName), innerPrev)
            }

            assets.set(mph.toHex(), outerPrev)
        }

        const entries = Array.from(assets.entries())

        this.assets = entries.map(([rawMph, rawTokens]) => {
            const tokens = Array.from(rawTokens.entries())

            return [
                makeMintingPolicyHash(rawMph),
                tokens.map(([rawTokenName, rawQty]) => [
                    toBytes(rawTokenName),
                    rawQty
                ])
            ]
        })
    }

    /**
     * Mutates 'this'
     */
    removeZeroes() {
        for (let asset of this.assets) {
            asset[1] = asset[1].filter((token) => token[1] != 0n)
        }

        this.assets = this.assets.filter((asset) => asset[1].length != 0)
    }

    /**
     * Makes sure minting policies are in correct order, and for each minting policy make sure the tokens are in the correct order
     * Mutates 'this'
     * @param {boolean} [shortestFirst] defaults to true (canonical sort)
     */
    sort(shortestFirst = true) {
        this.assets.sort(([a], [b]) => {
            return compareMintingPolicyHashes(a, b)
        })

        this.assets.forEach(([_mph, tokens]) => {
            tokens.sort(([a], [b]) => {
                return compareBytes(a, b, shortestFirst)
            })
        })
    }

    /**
     * @param {Assets} other
     * @returns {Assets}
     */
    subtract(other) {
        return this.applyBinOp(other, (a, b) => a - b)
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeMap(
            this.assets.map(([mph, tokens]) => {
                return [
                    mph.toCbor(),
                    encodeMap(
                        tokens.map(([tokenName, qty]) => [
                            encodeBytes(tokenName),
                            encodeInt(qty)
                        ])
                    )
                ]
            })
        )
    }

    /**
     * Used when generating script contexts for running programs
     * @param {boolean} [isInScriptContext] if true: tokens are in strict lexicographical order
     * @returns {MapData}
     */
    toUplcData(isInScriptContext = false) {
        return makeMapData(
            this.assets.map(([mph, tokens]) => [
                mph.toUplcData(),
                makeMapData(
                    (isInScriptContext
                        ? tokens.sort((a, b) => compareBytes(a[0], b[0], false))
                        : tokens
                    ).map(([tokenName, qty]) => [
                        makeByteArrayData(tokenName),
                        makeIntData(qty)
                    ])
                )
            ])
        )
    }
}
