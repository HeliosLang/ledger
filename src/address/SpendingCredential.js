import { expectConstrData, makeConstrData } from "@helios-lang/uplc"
import {
    convertUplcDataToPubKeyHash,
    convertUplcDataToValidatorHash
} from "../hashes/index.js"

/**
 * @import { UplcData } from "@helios-lang/uplc"
 * @import { SpendingCredential } from "../index.js"
 */

/**
 * @param {SpendingCredential} hash
 * @returns {UplcData}
 */
export function convertSpendingCredentialToUplcData(hash) {
    return makeConstrData({
        tag: hash.kind == "ValidatorHash" ? 1 : 0,
        fields: [hash.toUplcData()]
    })
}

/**
 * @param {UplcData} data
 * @returns {SpendingCredential}
 */
export function convertUplcDataToSpendingCredential(data) {
    const cData = expectConstrData(data, undefined, 1)

    switch (cData.tag) {
        case 0:
            return convertUplcDataToPubKeyHash(cData.fields[0])
        case 1:
            return convertUplcDataToValidatorHash(cData.fields[0])
        default:
            throw new Error(`unexpected Credential ConstrData tag ${cData.tag}`)
    }
}
