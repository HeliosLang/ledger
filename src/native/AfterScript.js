import { encodeInt, encodeTuple } from "@helios-lang/cbor"
import { toInt } from "@helios-lang/codec-utils"

/**
 * @import { IntLike } from "@helios-lang/codec-utils"
 * @import { AfterScript, AfterScriptJsonSafe, NativeContext } from "src/index.js"
 */

/**
 * @param {IntLike} slot
 * @returns {AfterScript}
 */
export function makeAfterScript(slot) {
    const s = toInt(slot)

    return new AfterScriptImpl(s)
}

/**
 * @implements {AfterScript}
 */
class AfterScriptImpl {
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
     * @type {"After"}
     */
    get kind() {
        return "After"
    }

    /**
     * @param {NativeContext} ctx
     * @returns {boolean}
     */
    eval(ctx) {
        return ctx.isAfter(this.slot)
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([encodeInt(4), encodeInt(this.slot)])
    }

    /**
     * @returns {AfterScriptJsonSafe}
     */
    toJsonSafe() {
        return {
            type: "after",
            slot: this.slot
        }
    }
}
