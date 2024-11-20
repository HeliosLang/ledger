import {
    decodeBytes,
    decodeString,
    decodeTuple,
    encodeBytes,
    encodeString,
    encodeTuple
} from "@helios-lang/cbor"
import { makeByteStream } from "@helios-lang/codec-utils"
import { blake2b } from "@helios-lang/crypto"

/**
 * @import { BytesLike } from "@helios-lang/codec-utils"
 * @import { PoolMetadata } from "src/index.js"
 *
 */

/**
 * @param {BytesLike} bytes
 * @returns {PoolMetadata}
 */
export function decodePoolMetadata(bytes) {
    const stream = makeByteStream({ bytes })

    const [url, _hash] = decodeTuple(stream, [decodeString, decodeBytes])

    // TODO: take into account the hash. Should this be the hash of the TxMetadata instead?
    return new PoolMetadataImpl(url)
}
/**
 * TODO: figure out what exactly the hash field is
 * @implements {PoolMetadata}
 */
class PoolMetadataImpl {
    /**
     * @param {string} url
     */
    constructor(url) {
        this.url = url
    }

    /**
     * @type {"PoolMetadata"}
     */
    get kind() {
        return "PoolMetadata"
    }

    toCbor() {
        const urlBytes = encodeString(this.url)
        const hash = blake2b(urlBytes) // TODO: why? is this correct?

        return encodeTuple([urlBytes, encodeBytes(hash)])
    }
}
