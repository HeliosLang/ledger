import { makeByteStream } from "@helios-lang/codec-utils"
import { makeByronAddress, decodeByronAddress } from "./ByronAddress.js"
import {
    makeDummyShelleyAddress,
    makeShelleyAddress,
    decodeShelleyAddress
} from "./ShelleyAddress.js"

/**
 * @import { BytesLike } from "@helios-lang/codec-utils"
 * @import { Address } from "src/index.js"
 */

/**
 * Alias for makeShelleyAddress
 */
export const makeAddress = makeShelleyAddress

/**
 * Alias for makeDummyShelleyAddress
 */
export const makeDummyAddress = makeDummyShelleyAddress

/**
 * @overload
 * @param {string} bech32OrBase58
 * @returns {Address}
 *
 * @overload
 * @param {BytesLike} cbor
 * @returns {Address}
 *
 * @param {string | BytesLike} arg
 * @returns {Address}
 */
export function decodeAddress(arg) {
    if (typeof arg == "string") {
        if (arg.startsWith("addr")) {
            return makeShelleyAddress(arg)
        } else {
            return makeByronAddress(arg)
        }
    } else {
        const bytes = makeByteStream({ bytes: arg })

        const isByron = (bytes.peekOne() & 0b11110000) == 0b10000000

        if (isByron) {
            return decodeByronAddress(bytes)
        } else {
            return decodeShelleyAddress(bytes)
        }
    }
}
