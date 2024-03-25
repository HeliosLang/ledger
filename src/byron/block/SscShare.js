import {
    decodeBytes,
    decodeList,
    decodeTuple,
    encodeBytes,
    encodeList,
    encodeTuple
} from "@helios-lang/cbor"
import { ByteStream } from "@helios-lang/codec-utils"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 */

export class SscShare {
    /**
     * @param {number[]} addressId
     * @param {number[][]} decrypted
     */
    constructor(addressId, decrypted) {
        this.addressId = addressId
        this.decrypted = decrypted
    }

    /**
     * @param {ByteArrayLike} bytes
     * @returns {SscShare}
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        const [addressId, decrypted] = decodeTuple(stream, [
            decodeBytes,
            (stream) => decodeList(stream, decodeBytes)
        ])

        return new SscShare(addressId, decrypted)
    }
    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([
            encodeBytes(this.addressId),
            encodeList(this.decrypted.map((d) => encodeBytes(d)))
        ])
    }
}
