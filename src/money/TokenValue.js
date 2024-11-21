import { makeAssets } from "./Assets.js"
import { makeValue } from "./Value.js"

/**
 * @import { IntLike } from "@helios-lang/codec-utils"
 * @import { AssetClass, TokenValue, Value } from "../index.js"
 */

/**
 * @template [C=unknown]
 * @param {AssetClass<C>} assetClass
 * @param {bigint} qty
 * @returns {TokenValue<C>}
 */
export function makeTokenValue(assetClass, qty) {
    return new TokenValueImpl(assetClass, qty)
}

/**
 * Single asset class value (quantity can be more than 1)
 * For this special case we can preserve the context
 * @template [C=unknown]
 * @implements {TokenValue}
 *
 */
class TokenValueImpl {
    /**
     * @readonly
     * @type {AssetClass<C>}
     */
    assetClass

    /**
     * @readonly
     * @type {bigint}
     */
    quantity

    /**
     * @readonly
     * @type {Value}
     */
    value

    /**
     * @param {AssetClass<C>} assetClass
     * @param {IntLike} qty
     */
    constructor(assetClass, qty) {
        this.assetClass = assetClass
        this.quantity = BigInt(qty)
        this.value = makeValue(0n, makeAssets([[assetClass, qty]]))
    }

    /**
     * Multiplies a `TokenValue` by a whole number.
     * @param {IntLike} scalar
     * @returns {TokenValue<C>}
     */
    multiply(scalar) {
        const lovelace = this.value.lovelace // might've been mutated
        const s = BigInt(scalar)

        /**
         * @type {TokenValue<C>}
         */
        const t = makeTokenValue(this.assetClass, this.quantity * s)

        if (lovelace != 0n) {
            t.value.lovelace = lovelace * s
        }

        return t
    }
}
