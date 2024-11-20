import { encodeDefList, encodeInt, encodeTuple } from "@helios-lang/cbor"

/**
 * @import { AllScript, AllScriptJsonSafe, NativeContext, NativeScript } from "src/index.js"
 */

/**
 * @param {NativeScript[]} scripts
 * @returns {AllScript}
 */
export function makeAllScript(scripts) {
    return new AllScriptImpl(scripts)
}

/**
 * @implements {AllScript}
 */
class AllScriptImpl {
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
     * @type {"All"}
     */
    get kind() {
        return "All"
    }

    /**
     * @param {NativeContext} ctx
     * @returns {boolean}
     */
    eval(ctx) {
        return this.scripts.every((s) => s.eval(ctx))
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([encodeInt(1), encodeDefList(this.scripts)])
    }

    /**
     * @returns {AllScriptJsonSafe}
     */
    toJsonSafe() {
        return {
            type: "all",
            scripts: this.scripts.map((s) => s.toJsonSafe())
        }
    }
}
