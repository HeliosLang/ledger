import {
    decodeInt,
    decodeTuple,
    encodeInt,
    encodeTuple,
    isTuple
} from "@helios-lang/cbor"
import { makeByteStream } from "@helios-lang/codec-utils"
import {
    expectByteArrayData,
    expectIntData,
    expectMapData,
    makeByteArrayData,
    makeIntData,
    makeMapData
} from "@helios-lang/uplc"
import { convertUplcDataToMintingPolicyHash } from "../hashes/MintingPolicyHash.js"
import { ADA } from "./AssetClass.js"
import { decodeAssets, makeAssets } from "./Assets.js"

/**
 * @import { BytesLike, IntLike } from "@helios-lang/codec-utils"
 * @import { MapData, UplcData } from "@helios-lang/uplc"
 * @import { AssetClass, AssetClassLike, Assets, AssetsLike, MintingPolicyHashLike, Value, ValueLike } from "../index.js"
 */

/**
 * @overload
 * @param {IntLike} lovelace
 * @param {AssetsLike} assets
 * @returns {Value}
 */
/**
 * @overload
 * @param {IntLike} lovelace
 * @returns {Value}
 */
/**
 * @overload
 * @param {AssetClassLike} assetClass
 * @param {IntLike} quantity
 * @returns {Value}
 */
/**
 * @overload
 * @param {MintingPolicyHashLike} mph
 * @param {BytesLike} tokenName
 * @param {IntLike} qty
 */
/**
 * @overload
 * @param {ValueLike} value
 * @returns {Value}
 */
/**
 * @param {(
 *   [IntLike, AssetsLike]
 *   | [IntLike]
 *   | [AssetClassLike, IntLike]
 *   | [MintingPolicyHashLike, BytesLike, IntLike]
 *   | [ValueLike]
 * )} args
 * @returns {Value}
 */
export function makeValue(...args) {
    if (args.length == 2) {
        const [a, b] = args
        if (typeof a == "number" || typeof a == "bigint") {
            return new ValueImpl(a, /** @type {any} */ (b))
        } else {
            return new ValueImpl(0n, makeAssets([[a, /** @type {any} */ (b)]]))
        }
    } else if (args.length == 3) {
        return new ValueImpl(0n, makeAssets([[args[0], [[args[1], args[2]]]]]))
    } else if (args.length == 1) {
        const arg = args[0]

        if (typeof arg == "number" || typeof arg == "bigint") {
            return new ValueImpl(arg)
        } else if (
            typeof arg == "object" &&
            "kind" in arg &&
            arg.kind == "Value"
        ) {
            return arg.copy()
        } else if (Array.isArray(arg)) {
            return new ValueImpl(arg[0], arg[1])
        } else if (typeof arg == "object" && "lovelace" in arg) {
            return new ValueImpl(arg.lovelace, arg.assets)
        } else {
            throw new Error(`unhandled makeValue() argument ${arg}`)
        }
    } else {
        throw new Error("invalid number of arguments")
    }
}

/**
 * @param {BytesLike} bytes
 * @returns {Value}
 */
export function decodeValue(bytes) {
    const stream = makeByteStream(bytes)

    if (isTuple(bytes)) {
        const [lovelace, assets] = decodeTuple(stream, [
            decodeInt,
            decodeAssets
        ])

        return makeValue(lovelace, assets)
    } else {
        return makeValue(decodeInt(stream))
    }
}

/**
 * Blockfrost has a special format for Value
 * @param {{unit: string, quantity: string}[]} list
 * @returns {Value}
 */
export function parseBlockfrostValue(list) {
    return list.reduce((sum, { unit, quantity }) => {
        const qty = BigInt(quantity)
        if (unit == "lovelace") {
            return sum.add(makeValue(qty))
        } else {
            const mph = unit.substring(0, 56)
            const tokenName = unit.substring(56)

            return sum.add(
                makeValue(0n, makeAssets([[mph, [[tokenName, qty]]]]))
            )
        }
    }, makeValue(0n))
}

/**
 * Converts a `UplcData` instance into a `Value`. Throws an error if it isn't in the right format.
 * @param {UplcData} data
 * @returns {Value}
 */
export function convertUplcDataToValue(data) {
    const mData = expectMapData(data)

    return mData.items.reduce((prev, [mphData, tokensData]) => {
        const mph = convertUplcDataToMintingPolicyHash(mphData)
        const tokens = expectMapData(tokensData)

        if (mph.bytes.length == 0) {
            if (
                tokens.items.length != 1 ||
                expectByteArrayData(tokens.items[0][0]).bytes.length != 0
            ) {
                throw new Error("bad ada token map")
            }

            return prev.add(makeValue(expectIntData(tokens.items[0][1]).value))
        } else {
            return tokens.items.reduce((prev, [tokenNameData, qtyData]) => {
                const tokenName = expectByteArrayData(tokenNameData).bytes
                const qty = expectIntData(qtyData).value

                return prev.add(makeValue(mph, tokenName, qty))
            }, prev)
        }
    }, makeValue(0n))
}

/**
 * @param {(Value | {value: Value})[]} values
 * @returns {Value}
 */
export function addValues(values) {
    let s = makeValue(0n)

    values.forEach((v) => {
        s = s.add(
            "kind" in v && v.kind == "Value" ? v : /** @type {any} */ (v).value
        )
    })

    return s
}

/**
 * Represents a collection of tokens.
 * @implements {Value}
 */
class ValueImpl {
    /**
     * Mutatable which is useful in case of tx balancing
     * @type {bigint}
     */
    lovelace

    /**
     * @type {Assets}
     */
    assets

    /**
     * @param {IntLike} lovelace
     * @param {AssetsLike} assets
     */
    constructor(lovelace = 0n, assets = []) {
        this.lovelace = BigInt(lovelace)
        this.assets = makeAssets(assets)
    }

    /**
     * @type {"Value"}
     */
    get kind() {
        return "Value"
    }

    /**
     * Only include AssetClass.ADA if lovelace != 0n
     * @type {AssetClass[]}
     */
    get assetClasses() {
        return (this.lovelace == 0n ? [] : [ADA]).concat(
            this.assets.assetClasses
        )
    }

    /**
     * Adds two `Value` instances together. Returns a new `Value` instance.
     * @param {Value} other
     * @returns {Value}
     */
    add(other) {
        return makeValue(
            this.lovelace + other.lovelace,
            this.assets.add(other.assets)
        )
    }

    /**
     * Throws an error if any of the `Value` entries is negative.
     *
     * Used when building transactions because transactions can't contain negative values.
     * @returns {Value} - returns this
     */
    assertAllPositive() {
        if (this.lovelace < 0n) {
            throw new Error("negative lovelace")
        }

        this.assets.assertAllPositive()

        return this
    }

    /**
     * Deep copy
     * @returns {Value}
     */
    copy() {
        return makeValue(this.lovelace, this.assets.copy())
    }

    /**
     * @returns {object}
     */
    dump() {
        return {
            lovelace: this.lovelace.toString(),
            assets: this.assets.dump()
        }
    }

    /**
     * Checks if two `Value` instances are equal (`Assets` need to be in the same order).
     * @param {Value} other
     * @returns {boolean}
     */
    isEqual(other) {
        return (
            this.lovelace == other.lovelace && this.assets.isEqual(other.assets)
        )
    }

    /**
     * Checks if a `Value` instance is strictly greater or equal to another `Value` instance. Returns false if any asset is missing.
     * @param {Value} other
     * @returns {boolean}
     */
    isGreaterOrEqual(other) {
        return (
            this.lovelace >= other.lovelace &&
            this.assets.isGreaterOrEqual(other.assets)
        )
    }
    /**
     * Checks if a `Value` instance is strictly greater than another `Value` instance. Returns false if any asset is missing.
     * @param {Value} other
     * @returns {boolean}
     */
    isGreaterThan(other) {
        return (
            this.lovelace > other.lovelace &&
            this.assets.isGreaterThan(other.assets)
        )
    }

    /**
     * Multiplies a `Value` by a whole number.
     * @param {IntLike} scalar
     * @returns {Value}
     */
    multiply(scalar) {
        const s = BigInt(scalar)
        return makeValue(this.lovelace * s, this.assets.multiply(s))
    }

    /**
     * Substracts one `Value` instance from another. Returns a new `Value` instance.
     * @param {Value} other
     * @returns {Value}
     */
    subtract(other) {
        return makeValue(
            this.lovelace - other.lovelace,
            this.assets.subtract(other.assets)
        )
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        if (this.assets.isZero()) {
            return encodeInt(this.lovelace)
        } else {
            return encodeTuple([encodeInt(this.lovelace), this.assets.toCbor()])
        }
    }

    /**
     * Used when building script context
     * @param {boolean} isInScriptContext
     * @returns {MapData}
     */
    toUplcData(isInScriptContext = false) {
        const map = this.assets.toUplcData(isInScriptContext)

        if (this.lovelace != 0n || isInScriptContext) {
            map.items.unshift([
                makeByteArrayData([]),
                makeMapData([
                    [makeByteArrayData([]), makeIntData(this.lovelace)]
                ])
            ])
        }

        return map
    }
}
