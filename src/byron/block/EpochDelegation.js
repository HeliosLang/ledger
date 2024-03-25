import {
    decodeBytes,
    decodeInt,
    decodeTuple,
    encodeBytes,
    encodeInt,
    encodeTuple
} from "@helios-lang/cbor"
import { ByteStream } from "@helios-lang/codec-utils"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 */

export class EpochDelegation {
    /**
     * @param {number | bigint} epoch
     * @param {number[]} issuer
     * @param {number[]} delegate
     * @param {number[]} certificate
     */
    constructor(epoch, issuer, delegate, certificate) {
        this.epoch = Number(epoch)
        this.issuer = issuer
        this.delegate = delegate
        this.certificate = certificate
    }

    /**
     * @param {ByteArrayLike} bytes
     * @returns {EpochDelegation}
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        const [epoch, issuer, delegate, certificate] = decodeTuple(stream, [
            decodeInt,
            decodeBytes,
            decodeBytes,
            decodeBytes
        ])

        return new EpochDelegation(epoch, issuer, delegate, certificate)
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([
            encodeInt(this.epoch),
            encodeBytes(this.issuer),
            encodeBytes(this.delegate),
            encodeBytes(this.certificate)
        ])
    }
}
