import { decodeInt, decodeMap, encodeInt, encodeMap } from "@helios-lang/cbor"
import { blake2b } from "@helios-lang/crypto"
import { decodeTxMetadataAttr, encodeTxMetadataAttr } from "./TxMetadataAttr.js"

/**
 * @import { BytesLike } from "@helios-lang/codec-utils"
 * @import { TxMetadata, TxMetadataAttr } from "../index.js"
 */

/**
 *
 * @param {BytesLike} bytes
 * @returns {TxMetadata}
 */
export function decodeTxMetadata(bytes) {
    const attributes = Object.fromEntries(
        decodeMap(bytes, (s) => Number(decodeInt(s)), decodeTxMetadataAttr)
    )
    return new TxMetadataImpl(attributes)
}

/**
 * @param {{[key: number]: TxMetadataAttr}} attributes
 * @returns {TxMetadata}
 */
export function makeTxMetadata(attributes) {
    return new TxMetadataImpl(attributes)
}

class TxMetadataImpl {
    /**
     * @readonly
     * @type {{[key: number]: TxMetadataAttr}}
     */
    attributes

    /**
     * @param {{[key: number]: TxMetadataAttr}} attributes
     */
    constructor(attributes) {
        this.attributes = attributes
    }

    /**
     * @type {"TxMetadata"}
     */
    get kind() {
        return "TxMetadata"
    }

    /**
     * @type {number[]}
     */
    get keys() {
        return Object.keys(this.attributes)
            .map((key) => parseInt(key))
            .sort()
    }

    /**
     * @returns {Object}
     */
    dump() {
        let obj = {}

        for (let key of this.keys) {
            obj[key] = this.attributes[key]
        }

        return obj
    }

    /**
     * @returns {number[]}
     */
    hash() {
        return blake2b(this.toCbor())
    }

    /**
     * Sorts the keys before serializing
     * @returns {number[]}
     */
    toCbor() {
        return encodeMap(
            this.keys.map((key) => [
                encodeInt(BigInt(key)),
                encodeTxMetadataAttr(this.attributes[key])
            ])
        )
    }
}
