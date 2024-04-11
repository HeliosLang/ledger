import { ByteStream, toInt } from "@helios-lang/codec-utils"
import { None } from "@helios-lang/type-utils"
import { PubKeyHash } from "../hashes/index.js"
import {
    decodeInt,
    decodeList,
    decodeTagged,
    encodeDefList,
    encodeInt,
    encodeTuple
} from "@helios-lang/cbor"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("@helios-lang/codec-utils").IntLike} IntLike
 * @typedef {import("../hashes/index.js").PubKeyHashLike} PubKeyHashLike
 * @typedef {import("./NativeContext.js").NativeContext} NativeContext
 */

/**
 * So we can use the Allegra After/Before NativeScripts as children of Shelley NativeScripts
 * @template {NativeContext} [C=NativeContext]
 * @typedef {{
 *   eval: (ctx: C) => boolean
 *   toCbor: () => number[]
 *   toJson: () => Object
 * }} NativeScriptI
 */

/**
 * @typedef {"Sig" | "All" | "Any" | "AtLeast"} NativeScriptKind
 */

/**
 * @template {NativeScriptKind} K
 * @template {NativeContext} [C=NativeContext]
 * @typedef {K extends "Sig" ? {
 *   hash: PubKeyHash
 * } : K extends "All" ? {
 *   scripts: NativeScriptI<C>[]
 * } : K extends "Any" ? {
 *   scripts: NativeScriptI<C>[]
 * } : {
 *   nRequired: number
 *   scripts: NativeScriptI<C>[]
 * }} NativeScriptProps
 */

/**
 * @template {NativeScriptKind} [T=NativeScriptKind]
 * @template {NativeContext} [C=NativeContext]
 * @implements {NativeScriptI<NativeContext>}
 */
export class NativeScript {
    /**
     * @readonly
     * @type {T}
     */
    kind

    /**
     * @private
     * @readonly
     * @type {NativeScriptProps<T>}
     */
    props

    /**
     * @private
     * @param {T} kind
     * @param {NativeScriptProps<T>} props
     */
    constructor(kind, props) {
        this.kind = kind
        this.props = props
    }

    /**
     * @param {PubKeyHashLike} hash
     * @returns {NativeScript<"Sig">}
     */
    static Sig(hash) {
        return new NativeScript("Sig", { hash: PubKeyHash.new(hash) })
    }

    /**
     * @param {NativeScriptI[]} scripts
     * @returns {NativeScript<"All">}
     */
    static All(scripts) {
        return new NativeScript("All", { scripts })
    }

    /**
     * @param {NativeScriptI[]} scripts
     * @returns {NativeScript<"Any">}
     */
    static Any(scripts) {
        return new NativeScript("Any", { scripts })
    }

    /**
     * @param {IntLike} nRequired
     * @param {NativeScriptI[]} scripts
     * @returns {NativeScript<"AtLeast">}
     */
    static AtLeast(nRequired, scripts) {
        if (nRequired > scripts.length) {
            throw new Error("nRequired larger that number of scripts")
        }

        return new NativeScript("AtLeast", {
            scripts,
            nRequired: toInt(nRequired)
        })
    }

    /**
     * @param {ByteArrayLike} bytes
     * @param {(bytes: ByteArrayLike) => NativeScriptI} decodeChild - used by Allegra era to allow decoding of other NativeScript types (After and Before)
     * @returns {NativeScript}
     */
    static fromCbor(bytes, decodeChild = NativeScript.fromCbor) {
        const stream = ByteStream.from(bytes)

        if (stream.peekOne() == 0) {
            stream.shiftOne()
        }

        const [tag, decodeItem] = decodeTagged(stream)

        switch (tag) {
            case 0:
                return NativeScript.Sig(decodeItem(PubKeyHash))
            case 1:
                return NativeScript.All(
                    decodeItem((s) => decodeList(s, decodeChild))
                )
            case 2:
                return NativeScript.Any(
                    decodeItem((s) => decodeList(s, decodeChild))
                )
            case 3:
                return NativeScript.AtLeast(
                    decodeItem(decodeInt),
                    decodeItem((s) => decodeList(s, decodeChild))
                )
            default:
                throw new Error(`unexpected NativeScript tag ${tag}`)
        }
    }

    /**
     * @param {string | Object} json
     * @param {(json: string | Object) => NativeScriptI} decodeChild
     * @returns {NativeScript}
     */
    static fromJson(json, decodeChild = NativeScript.fromJson) {
        const obj = typeof json == "string" ? JSON.parse(json) : json

        const type = obj.type

        if (!type) {
            throw new Error("invalid NativeScript")
        }

        switch (type) {
            case "sig": {
                const keyHash = obj.keyHash

                if (!keyHash) {
                    throw new Error("invalid NativeScript.Sig")
                }

                return NativeScript.Sig(keyHash)
            }
            case "all": {
                /**
                 * @type {Object[]}
                 */
                const scripts = obj.scripts

                if (!scripts) {
                    throw new Error("invalid NativeScript.All")
                }

                return NativeScript.All(scripts.map(decodeChild))
            }
            case "any": {
                /**
                 * @type {Object[]}
                 */
                const scripts = obj.scripts

                if (!scripts) {
                    throw new Error("invalid NativeScript.Any")
                }

                return NativeScript.Any(scripts.map(decodeChild))
            }
            case "atLeast": {
                const n = obj.required

                if (typeof n != "number") {
                    throw new Error("invalid NativeScript.AtLeast")
                }

                /**
                 * @type {Object[]}
                 */
                const scripts = obj.scripts

                if (!scripts) {
                    throw new Error("invalid NativeAtLeast script")
                }

                return NativeScript.AtLeast(n, scripts.map(decodeChild))
            }
            default:
                throw new Error(`unrecognized NativeScript type '${type}'`)
        }
    }

    /**
     * @typedef {"Sig"} NativeScriptKindWithHash
     * @type {T extends NativeScriptKindWithHash ? PubKeyHash : T extends Exclude<NativeScriptKind, NativeScriptKindWithHash> ? never : Option<PubKeyHash>}
     */
    get hash() {
        return /** @type {any} */ (this.isSig() ? this.props.hash : None)
    }

    /**
     * @typedef {"AtLeast"} NativeScriptKindWithNRequired
     * @type {T extends NativeScriptKindWithNRequired ? number : T extends Exclude<NativeScriptKind, NativeScriptKindWithNRequired> ? never : Option<number>}
     */
    get nRequired() {
        return /** @type {any} */ (
            this.isAtLeast() ? this.props.nRequired : None
        )
    }

    /**
     * @typedef {"All" | "Any" | "AtLeast"} NativeScriptKindWithScripts
     * @type {T extends NativeScriptKindWithScripts ? NativeScriptI[] : T extends Exclude<NativeScriptKind, NativeScriptKindWithScripts> ? never : Option<NativeScriptI[]>}
     */
    get scripts() {
        return /** @type {any} */ (
            this.isAll() || this.isAny() || this.isAtLeast()
                ? this.props.scripts
                : None
        )
    }

    /**
     * @param {C} ctx
     * @returns {boolean}
     */
    eval(ctx) {
        if (this.isSig()) {
            return ctx.isSignedBy(this.props.hash)
        } else if (this.isAll()) {
            return this.props.scripts.every((s) => s.eval(ctx))
        } else if (this.isAny()) {
            return this.props.scripts.some((s) => s.eval(ctx))
        } else if (this.isAtLeast()) {
            const props = this.props
            return (
                props.scripts.reduce((n, s) => n + Number(s.eval(ctx)), 0) >=
                props.nRequired
            )
        } else {
            throw new Error(`unhandled NativeScript kind ${this.kind}`)
        }
    }

    /**
     * @returns {this is NativeScript<"Sig">}
     */
    isSig() {
        return this.kind == "Sig"
    }

    /**
     * @returns {this is NativeScript<"All">}
     */
    isAll() {
        return this.kind == "All"
    }

    /**
     * @returns {this is NativeScript<"Any">}
     */
    isAny() {
        return this.kind == "Any"
    }

    /**
     * @returns {this is NativeScript<"AtLeast">}
     */
    isAtLeast() {
        return this.kind == "AtLeast"
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        if (this.isSig()) {
            return encodeTuple([encodeInt(0), this.props.hash.toCbor()])
        } else if (this.isAll()) {
            return encodeTuple([
                encodeInt(1),
                encodeDefList(this.props.scripts)
            ])
        } else if (this.isAny()) {
            return encodeTuple([
                encodeInt(2),
                encodeDefList(this.props.scripts)
            ])
        } else if (this.isAtLeast()) {
            const props = this.props

            return encodeTuple([
                encodeInt(3),
                encodeInt(props.nRequired),
                encodeDefList(props.scripts)
            ])
        } else {
            throw new Error(`unhandled NativeScript kind ${this.kind}`)
        }
    }

    /**
     * @returns {Object}
     */
    toJson() {
        if (this.isSig()) {
            return {
                type: "sig",
                keyHash: this.props.hash.toHex()
            }
        } else if (this.isAll()) {
            return {
                type: "all",
                scripts: this.props.scripts.map((s) => s.toJson())
            }
        } else if (this.isAny()) {
            return {
                type: "any",
                scripts: this.props.scripts.map((s) => s.toJson())
            }
        } else if (this.isAtLeast()) {
            const props = this.props

            return {
                type: "atLeast",
                required: props.nRequired,
                scripts: props.scripts.map((s) => s.toJson())
            }
        } else {
            throw new Error(`unhandled NativeScript kind ${this.kind}`)
        }
    }
}
