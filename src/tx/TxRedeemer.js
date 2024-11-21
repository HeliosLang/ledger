import { decodeInt, decodeTagged } from "@helios-lang/cbor"
import { decodeCost, decodeUplcData } from "@helios-lang/uplc"
import { makeTxCertifyingRedeemer } from "./TxCertifyingRedeemer.js"
import { makeTxMintingRedeemer } from "./TxMintingRedeemer.js"
import { makeTxRewardingRedeemer } from "./TxRewardingRedeemer.js"
import { makeTxSpendingRedeemer } from "./TxSpendingRedeemer.js"

/**
 * @import { BytesLike } from "@helios-lang/codec-utils"
 * @import { TxRedeemer } from "../index.js"
 */

/**
 * @param {BytesLike} bytes
 * @returns {TxRedeemer}
 */
export function decodeTxRedeemer(bytes) {
    const [tag, decodeItem] = decodeTagged(bytes)

    switch (tag) {
        case 0: {
            const inputIndex = decodeItem(decodeInt)
            const data = decodeItem(decodeUplcData)
            const cost = decodeItem(decodeCost)

            return makeTxSpendingRedeemer(inputIndex, data, cost)
        }
        case 1: {
            const policyIndex = decodeItem(decodeInt)
            const data = decodeItem(decodeUplcData)
            const cost = decodeItem(decodeCost)

            return makeTxMintingRedeemer(policyIndex, data, cost)
        }
        case 2:
            const dcertIndex = decodeItem(decodeInt)
            const data = decodeItem(decodeUplcData)
            const cost = decodeItem(decodeCost)

            return makeTxCertifyingRedeemer(dcertIndex, data, cost)
        case 3: {
            const withdrawalIndex = decodeItem(decodeInt)
            const data = decodeItem(decodeUplcData)
            const cost = decodeItem(decodeCost)

            return makeTxRewardingRedeemer(withdrawalIndex, data, cost)
        }
        default:
            throw new Error(`unhandled TxRedeemer tag ${tag}`)
    }
}

/**
 *
 * @param {TxRedeemer} a
 * @param {TxRedeemer} b
 * @returns {number}
 */
export function compareTxRedeemers(a, b) {
    if (a.kind == "TxMintingRedeemer" && b.kind == "TxMintingRedeemer") {
        return a.policyIndex - b.policyIndex
    } else if (
        a.kind == "TxSpendingRedeemer" &&
        b.kind == "TxSpendingRedeemer"
    ) {
        return a.inputIndex - b.inputIndex
    } else if (
        a.kind == "TxRewardingRedeemer" &&
        b.kind == "TxRewardingRedeemer"
    ) {
        return a.withdrawalIndex - b.withdrawalIndex
    } else if (
        a.kind == "TxCertifyingRedeemer" &&
        b.kind == "TxCertifyingRedeemer"
    ) {
        return a.dcertIndex - b.dcertIndex
    } else if (a.kind == b.kind) {
        throw new Error(`unhandled TxRedeemer kind ${a.kind}`)
    } else {
        return a.tag - b.tag
    }
}
