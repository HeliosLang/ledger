import { encodeInt, encodeTuple } from "@helios-lang/cbor"
import { toInt } from "@helios-lang/codec-utils"

/**
 * @import { IntLike } from "@helios-lang/codec-utils"
 * @import { BeforeScript, BeforeScriptJsonSafe, NativeContext } from "src/index.js"
 */

/**
 * @param {IntLike} slot
 * @returns {BeforeScript}
 */
export function makeBeforeScript(slot) {
    const s = toInt(slot)

    return new BeforeScriptImpl(s)
}

/**
 * @implements {BeforeScript}
 */
class BeforeScriptImpl {
    /**
     * @readonly
     * @type {number}
     */
    slot

    /**
     * @param {number} slot
     */
    constructor(slot) {
        this.slot = slot
    }

    /**
     * @type {"Before"}
     */
    get kind() {
        return "Before"
    }

    /**
     * @param {NativeContext} ctx
     * @returns {boolean}
     */
    eval(ctx) {
        return ctx.isBefore(this.slot)
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([encodeInt(5), encodeInt(this.slot)])
    }

    /**
     * @returns {BeforeScriptJsonSafe}
     */
    toJsonSafe() {
        return {
            type: "before",
            slot: this.slot
        }
    }
}
