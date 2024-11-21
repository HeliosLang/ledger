import { expectConstrData, makeConstrData } from "@helios-lang/uplc"
import {
    convertUplcDataToPubKeyHash,
    convertUplcDataToStakingValidatorHash,
    decodePubKeyHash,
    decodeStakingValidatorHash,
    makeDummyPubKeyHash
} from "../hashes/index.js"
import { decodeTagged, encodeInt, encodeTuple } from "@helios-lang/cbor"
import { compareBytes, makeByteStream } from "@helios-lang/codec-utils"

/**
 * @import { BytesLike } from "@helios-lang/codec-utils"
 * @import { ConstrData, UplcData } from "@helios-lang/uplc"
 * @import { PubKeyHash, StakingCredential, StakingValidatorHash } from "../index.js"
 */

/**
 * Used to sort txbody withdrawals.
 * @param {StakingCredential} a
 * @param {StakingCredential} b
 * @return {number}
 */
export function compareStakingCredentials(a, b) {
    return compareBytes(a.bytes, b.bytes)
}

/**
 * @param {UplcData} data
 * @returns {StakingCredential}
 */
export function convertUplcDataToStakingCredential(data) {
    const wrapper = expectConstrData(data, 0, 1)
    const cData = expectConstrData(wrapper.fields[0], undefined, 1)

    switch (cData.tag) {
        case 0:
            return convertUplcDataToPubKeyHash(cData.fields[0])
        case 1:
            return convertUplcDataToStakingValidatorHash(cData.fields[0])
        default:
            throw new Error(`unexpected Credential ConstrData tag ${cData.tag}`)
    }
}

/**
 * @param {StakingCredential} hash
 * @returns {ConstrData}
 */
export function convertStakingCredentialToUplcData(hash) {
    return makeConstrData(0, [
        makeConstrData(hash.kind == "StakingValidatorHash" ? 1 : 0, [
            hash.toUplcData()
        ])
    ])
}

/**
 * @param {BytesLike} bytes
 * @returns {StakingCredential}
 */
export function decodeStakingCredential(bytes) {
    const stream = makeByteStream({ bytes })

    const [tag, decodeItem] = decodeTagged(stream)

    switch (tag) {
        case 0:
            return decodeItem(decodePubKeyHash)
        case 1:
            return decodeItem(decodeStakingValidatorHash)
        default:
            throw new Error(
                `expected 0 or 1 StakingCredential cbor tag, got ${tag}`
            )
    }
}

/**
 * @param {StakingCredential} hash
 * @returns {number[]}
 */
export function encodeStakingCredential(hash) {
    return encodeTuple([
        encodeInt(hash.kind == "PubKeyHash" ? 0 : 1),
        hash.toCbor()
    ])
}
