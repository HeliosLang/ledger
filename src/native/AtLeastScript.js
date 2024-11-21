import { encodeDefList, encodeInt, encodeTuple } from "@helios-lang/cbor"
import { toInt } from "@helios-lang/codec-utils"

/**
 * @import { IntLike } from "@helios-lang/codec-utils"
 * @import { AtLeastScript, AtLeastScriptJsonSafe, NativeContext, NativeScript } from "../index.js"
 */

/**
 * Throws an error if nRequired is < 1 or > scripts.length
 * @param {IntLike} nRequired
 * @param {NativeScript[]} scripts
 * @returns {AtLeastScript}
 */
export function makeAtLeastScript(nRequired, scripts) {
    const n = scripts.length
    const nr = toInt(nRequired)

    if (nr < 1 || nr > n) {
        throw new Error(
            `nRequired (${nr}) out of bounds, must be >= 1 and <= scripts.length (${n})`
        )
    }

    return new AtLeastScriptImpl(nr, scripts)
}

/**
 * @implements {AtLeastScript}
 */
class AtLeastScriptImpl {
    /**
     * @readonly
     * @type {number}
     */
    nRequired

    /**
     * @readonly
     * @type {NativeScript[]}
     */
    scripts

    /**
     * @param {number} nRequired
     * @param {NativeScript[]} scripts
     */
    constructor(nRequired, scripts) {
        this.scripts = scripts
        this.nRequired = nRequired
    }

    /**
     * @type {"AtLeast"}
     */
    get kind() {
        return "AtLeast"
    }

    /**
     * @param {NativeContext} ctx
     * @returns {boolean}
     */
    eval(ctx) {
        const n = this.scripts.reduce((count, s) => {
            if (s.eval(ctx)) {
                return count + 1
            } else {
                return count
            }
        }, 0)

        return n >= this.nRequired
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([
            encodeInt(3),
            encodeInt(this.nRequired),
            encodeDefList(this.scripts)
        ])
    }

    /**
     * @returns {AtLeastScriptJsonSafe}
     */
    toJsonSafe() {
        return {
            type: "atLeast",
            required: this.nRequired,
            scripts: this.scripts.map((s) => s.toJsonSafe())
        }
    }
}
