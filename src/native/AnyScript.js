import { encodeDefList, encodeInt, encodeTuple } from "@helios-lang/cbor"

/**
 * @import { AnyScript, AnyScriptJsonSafe, NativeContext, NativeScript } from "src/index.js"
 */

/**
 * @param {NativeScript[]} scripts
 * @returns {AnyScript}
 */
export function makeAnyScript(scripts) {
    return new AnyScriptImpl(scripts)
}

/**
 * @implements {AnyScript}
 */
class AnyScriptImpl {
    /**
     * @readonly
     * @type {NativeScript[]}
     */
    scripts

    /**
     *
     * @param {NativeScript[]} scripts
     */
    constructor(scripts) {
        this.scripts = scripts
    }

    /**
     * @type {"Any"}
     */
    get kind() {
        return "Any"
    }

    /**
     * @param {NativeContext} ctx
     * @returns {boolean}
     */
    eval(ctx) {
        return this.scripts.some((s) => s.eval(ctx))
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([encodeInt(2), encodeDefList(this.scripts)])
    }

    /**
     * @returns {AnyScriptJsonSafe}
     */
    toJsonSafe() {
        return {
            type: "any",
            scripts: this.scripts.map((s) => s.toJsonSafe())
        }
    }
}
