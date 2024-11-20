import { encodeInt, encodeTuple } from "@helios-lang/cbor"
import { makePubKeyHash } from "../hashes/index.js"

/**
 * @import {
 *   NativeContext,
 *   PubKeyHash,
 *   PubKeyHashLike,
 *   SigScript,
 *   SigScriptJsonSafe
 * } from "src/index.js"
 */

/**
 * @param {PubKeyHashLike} hash
 * @returns {SigScript}
 */
export function makeSigScript(hash) {
    return new SigScriptImpl(hash)
}

/**
 * @implements {SigScript}
 */
class SigScriptImpl {
    /**
     * @readonly
     * @type {PubKeyHash}
     */
    hash

    /**
     * @param {PubKeyHashLike} hash
     */
    constructor(hash) {
        this.hash = makePubKeyHash(hash)
    }

    /**
     * @type {"Sig"}
     */
    get kind() {
        return "Sig"
    }

    /**
     * @param {NativeContext} ctx
     * @returns {boolean}
     */
    eval(ctx) {
        return ctx.isSignedBy(this.hash)
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([encodeInt(0), this.hash.toCbor()])
    }

    /**
     * @returns {object}
     */
    toJsonSafe() {
        return {
            type: "sig",
            keyHash: this.hash.toHex()
        }
    }
}
