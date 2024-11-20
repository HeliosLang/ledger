import { decodeInt, decodeList, decodeTagged } from "@helios-lang/cbor"
import { makeByteStream } from "@helios-lang/codec-utils"
import { JSON } from "@helios-lang/type-utils"
import { decodePubKeyHash } from "../hashes/index.js"
import { makeAfterScript } from "./AfterScript.js"
import { makeAllScript } from "./AllScript.js"
import { makeAnyScript } from "./AnyScript.js"
import { makeAtLeastScript } from "./AtLeastScript.js"
import { makeBeforeScript } from "./BeforeScript.js"
import { makeSigScript } from "./SigScript.js"
import { blake2b } from "@helios-lang/crypto"

/**
 * @import { BytesLike } from "@helios-lang/codec-utils"
 * @import { JsonSafe } from "@helios-lang/type-utils"
 * @import { NativeScript } from "src/index.js"
 */

/**
 * @param {BytesLike} bytes
 * @returns {NativeScript}
 */
export function decodeNativeScript(bytes) {
    const stream = makeByteStream({ bytes })

    if (stream.peekOne() == 0) {
        stream.shiftOne()
    }

    const [tag, decodeItem] = decodeTagged(stream)

    switch (tag) {
        case 0:
            return makeSigScript(decodeItem(decodePubKeyHash))
        case 1:
            return makeAllScript(
                decodeItem((s) => decodeList(s, decodeNativeScript))
            )
        case 2:
            return makeAnyScript(
                decodeItem((s) => decodeList(s, decodeNativeScript))
            )
        case 3:
            return makeAtLeastScript(
                decodeItem(decodeInt),
                decodeItem((s) => decodeList(s, decodeNativeScript))
            )
        case 4:
            return makeAfterScript(decodeItem(decodeInt))
        case 5:
            return makeBeforeScript(decodeItem(decodeInt))
        default:
            throw new Error(`unexpected NativeScript tag ${tag}`)
    }
}

/**
 * @param {string | JsonSafe} json
 * @returns {NativeScript}
 */
export function parseNativeScript(json) {
    const obj = typeof json == "string" ? JSON.parse(json) : json

    if (typeof obj != "object") {
        throw new Error("invalid NativeScript json, not an object")
    }

    if (obj === null) {
        throw new Error("invalid NativeScript json, object is null")
    }

    if (!("type" in obj)) {
        throw new Error("invalid NativeScript json, .type undefined")
    }

    const type = obj.type

    if (typeof type != "string") {
        throw new Error("invalid NativeScript json, .type isn't a string")
    }

    switch (type) {
        case "sig": {
            const keyHash = obj.keyHash

            if (typeof keyHash != "string") {
                throw new Error(
                    "invalid SigScript json, .keyHash isn't a string "
                )
            }

            return makeSigScript(keyHash)
        }
        case "all": {
            const scripts = obj.scripts

            if (!Array.isArray(scripts)) {
                throw new Error(
                    "invalid AllScript json, .scripts isn't an array"
                )
            }

            return makeAllScript(scripts.map(parseNativeScript))
        }
        case "any": {
            const scripts = obj.scripts

            if (!Array.isArray(scripts)) {
                throw new Error(
                    "invalid AnyScript json, .scripts isn't an array"
                )
            }

            return makeAnyScript(scripts.map(parseNativeScript))
        }
        case "atLeast": {
            const n = obj.required

            if (typeof n != "number") {
                throw new Error(
                    "invalid AtLeastScript, .required isn't a number"
                )
            }

            const scripts = obj.scripts

            if (!Array.isArray(scripts)) {
                throw new Error(
                    "invalid AtLeastScript json, .scripts isn't an array"
                )
            }

            return makeAtLeastScript(n, scripts.map(parseNativeScript))
        }
        case "after": {
            const slot = obj.slot

            if (typeof slot != "number") {
                throw new Error(
                    "invalid AfterScript json, .slot isn't a number"
                )
            }

            return makeAfterScript(slot)
        }
        case "before": {
            const slot = obj.slot

            if (typeof slot != "number") {
                throw new Error(
                    "invalid BeforeScript json, .slot isn't a number"
                )
            }

            return makeBeforeScript(slot)
        }
        default:
            throw new Error(
                `invalid NativeScript json, unrecognized type '${type}'`
            )
    }
}

/**
 * Calculates the blake2b-224 (28 bytes) hash of the NativeScript.
 *
 * **Note**: before calculating the hash a 0 byte is prepended to the CBOR bytes
 * @param {NativeScript} nativeScript
 * @returns {number[]}
 */
export function hashNativeScript(nativeScript) {
    const bytes = nativeScript.toCbor()
    bytes.unshift(0)
    return blake2b(bytes, 28)
}
