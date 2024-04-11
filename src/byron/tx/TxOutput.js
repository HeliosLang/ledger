import {
    decodeInt,
    decodeTuple,
    encodeInt,
    encodeTuple
} from "@helios-lang/cbor"
import { ByteStream } from "@helios-lang/codec-utils"
import { Address } from "./Address.js"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("@helios-lang/codec-utils").IntLike} IntLike
 */

export class TxOutput {
    /**
     * @param {Address} address
     * @param {IntLike} lovelace
     */
    constructor(address, lovelace) {
        this.address = address
        this.lovelace = lovelace
    }

    /**
     * @param {ByteArrayLike} bytes
     * @returns {TxOutput}
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)
        const [address, lovelace] = decodeTuple(stream, [Address, decodeInt])

        return new TxOutput(address, lovelace)
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([this.address, encodeInt(this.lovelace)])
    }
}
