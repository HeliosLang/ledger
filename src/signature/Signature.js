import {
    decodeBytes,
    decodeTuple,
    encodeBytes,
    encodeTuple
} from "@helios-lang/cbor"
import {
    bytesToHex,
    dummyBytes,
    makeByteStream,
    toBytes
} from "@helios-lang/codec-utils"
import { Ed25519 } from "@helios-lang/crypto"
import { decodePubKey, makeDummyPubKey, makePubKey } from "./PubKey.js"

/**
 * @import { BytesLike } from "@helios-lang/codec-utils"
 * @import { PubKey, PubKeyHash, PubKeyLike, Signature } from "src/index.js"
 */

/**
 * @param {PubKeyLike} pubKey
 * @param {BytesLike} bytes
 * @returns {Signature}
 */
export function makeSignature(pubKey, bytes) {
    return new SignatureImpl(pubKey, bytes)
}

/**
 * @param {number} seed
 * @returns {Signature}
 */
export function makeDummySignature(seed = 0) {
    return new SignatureImpl(makeDummyPubKey(seed), dummyBytes(64, seed))
}

/**
 * @param {BytesLike} bytes
 * @returns {Signature}
 */
export function decodeSignature(bytes) {
    const stream = makeByteStream({ bytes })

    const [pubKey, signatureBytes] = decodeTuple(stream, [
        decodePubKey,
        decodeBytes
    ])

    return new SignatureImpl(pubKey, signatureBytes)
}

/**
 * Represents a Ed25519 signature.
 *
 * Also contains a reference to the PubKey that did the signing.
 * @implements {Signature}
 */
class SignatureImpl {
    /**
     * @readonly
     * @type {PubKey}
     */
    pubKey

    /**
     * @readonly
     * @type {number[]}
     */
    bytes

    /**
     * @param {PubKeyLike} pubKey
     * @param {BytesLike} bytes
     */
    constructor(pubKey, bytes) {
        this.pubKey = makePubKey(pubKey)
        this.bytes = toBytes(bytes)
    }

    /**
     * @type {"Signature"}
     */
    get kind() {
        return "Signature"
    }

    /**
     * @type {PubKeyHash}
     */
    get pubKeyHash() {
        return this.pubKey.hash()
    }

    /**
     * Diagnostic representation
     * @returns {Object}
     */
    dump() {
        return {
            pubKey: this.pubKey.dump,
            pubKeyHash: this.pubKeyHash.dump(),
            signature: bytesToHex(this.bytes)
        }
    }

    /**
     * @returns {boolean}
     */
    isDummy() {
        return this.pubKey.isDummy() && this.bytes.every((b) => b == 0)
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([this.pubKey.toCbor(), encodeBytes(this.bytes)])
    }

    /**
     * Throws error if incorrect
     * @param {number[]} msg
     * @returns {void}
     */
    verify(msg) {
        if (this.bytes === null) {
            throw new Error("signature can't be null")
        } else {
            if (this.pubKey === null) {
                throw new Error("pubKey can't be null")
            } else {
                if (!Ed25519.verify(this.bytes, msg, this.pubKey.bytes)) {
                    throw new Error("incorrect signature")
                }
            }
        }
    }
}
