import {
    decodeBytes,
    decodeInt,
    decodeTag,
    decodeTuple,
    encodeBytes,
    encodeInt,
    encodeTag,
    encodeTuple
} from "@helios-lang/cbor"
import {
    decodeBase58,
    decodeIntBE,
    encodeBase58,
    encodeIntBE,
    makeByteStream
} from "@helios-lang/codec-utils"

/**
 * @import { BytesLike, IntLike } from "@helios-lang/codec-utils"
 * @import { ByronAddress } from "src/index.js"
 */

/**
 * @overload
 * @param {string} base58
 * @returns {ByronAddress}
 *
 * @overload
 * @param {number[]} bytes
 * @param {IntLike} checksum
 * @returns {ByronAddress}
 *
 * @param {(
 *   [string]
 *   | [number[], IntLike]
 * )} args
 * @returns {ByronAddress}
 */
export function makeByronAddress(...args) {
    if (args.length == 1) {
        return decodeByronAddress(encodeIntBE(decodeBase58(args[0])))
    } else if (args.length == 2) {
        return new ByronAddressImpl(args[0], args[1])
    } else {
        throw new Error("invalid number of arguments")
    }
}

/**
 * @param {BytesLike} bytes
 * @returns {ByronAddress}
 */
export function decodeByronAddress(bytes) {
    const stream = makeByteStream({ bytes })

    const [bs, checksum] = decodeTuple(stream, [
        (s) => {
            if (decodeTag(s) != 24n) {
                throw new Error("unexpected TxOutput tag")
            }

            return decodeBytes(s)
        },
        decodeInt
    ])

    return new ByronAddressImpl(bs, checksum)
}

/**
 * @implements {ByronAddress}
 */
class ByronAddressImpl {
    /**
     * @readonly
     * @type {number[]}
     */
    bytes

    /**
     * CRC-32 (Cyclic Redundancy Check 32)
     * @readonly
     * @type {bigint}
     */
    checksum

    /**
     * @param {number[]} bytes
     * @param {IntLike} checksum
     */
    constructor(bytes, checksum) {
        // TODO: validate checksum and decompose bytes
        this.bytes = bytes
        this.checksum = BigInt(checksum)
    }

    /**
     * @type {"Address"}
     */
    get kind() {
        return "Address"
    }

    /**
     * @type {"Byron"}
     */
    get era() {
        return "Byron"
    }

    /**
     * @returns {string}
     */
    toBase58() {
        const cbor = this.toCbor()

        return encodeBase58(decodeIntBE(cbor))
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([
            encodeTag(24).concat(encodeBytes(this.bytes)),
            encodeInt(this.checksum)
        ])
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.toBase58()
    }
}
