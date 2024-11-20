import {
    makeByteArrayData,
    makeConstrData,
    makeIntData,
    makeListData,
    makeMapData
} from "@helios-lang/uplc"
import { hashDatum, makeDummyTxId } from "../hashes/index.js"
import { makeAssets, makeValue } from "../money/index.js"
import { makeMintingPurpose } from "./MintingPurpose.js"
import { makeSpendingPurpose } from "./SpendingPurpose.js"
import { makeRewardingPurpose } from "./RewardingPurpose.js"
import { makeCertifyingPurpose } from "./CertifyingPurpose.js"
import { ALWAYS } from "../time/index.js"

/**
 * @import { UplcData } from "@helios-lang/uplc"
 * @import { ScriptContextV2, ScriptPurpose, TxInfo } from "src/index.js"
 */

/**
 * @param {TxInfo} txInfo
 * @param {ScriptPurpose} purpose
 * @returns {ScriptContextV2}
 */
export function makeScriptContextV2(txInfo, purpose) {
    return new ScriptContextV2Impl(txInfo, purpose)
}

/**
 * @implements {ScriptContextV2}
 */
class ScriptContextV2Impl {
    /**
     * @readonly
     * @type {TxInfo}
     */
    txInfo

    /**
     * @readonly
     * @type {ScriptPurpose}
     */
    purpose

    /**
     * @param {TxInfo} txInfo
     * @param {ScriptPurpose} purpose
     */
    constructor(txInfo, purpose) {
        this.txInfo = txInfo
        this.purpose = purpose
    }

    /**
     * @type {"ScriptContextV2"}
     */
    get kind() {
        return "ScriptContextV2"
    }

    /**
     * @returns {UplcData}
     */
    toUplcData() {
        const inputs = this.txInfo.inputs
        const refInputs = this.txInfo.refInputs ?? []
        const outputs = this.txInfo.outputs
        const fee = this.txInfo.fee ?? 0n
        const minted = this.txInfo.minted ?? makeAssets([])
        const dcerts = this.txInfo.dcerts ?? []
        const withdrawals = this.txInfo.withdrawals ?? []
        const validityTimerange = this.txInfo.validityTimerange ?? ALWAYS
        const signers = this.txInfo.signers ?? []
        const redeemers = this.txInfo.redeemers ?? []
        const datums = this.txInfo.datums ?? []
        const txId = this.txInfo.id ?? makeDummyTxId()

        const txData = makeConstrData({
            tag: 0,
            fields: [
                makeListData(inputs.map((input) => input.toUplcData())),
                makeListData(refInputs.map((input) => input.toUplcData())),
                makeListData(outputs.map((output) => output.toUplcData())),
                makeValue(fee).toUplcData(),
                // NOTE: all other Value instances in ScriptContext contain some lovelace, but `minted` can never contain any lovelace, yet cardano-node always prepends 0 lovelace to the `minted` MapData
                makeValue(0n, minted).toUplcData(true),
                makeListData(dcerts.map((cert) => cert.toUplcData())),
                makeMapData(
                    withdrawals.map(([sa, q]) => [
                        sa.toUplcData(),
                        makeIntData(q)
                    ])
                ),
                validityTimerange.toUplcData(),
                makeListData(signers.map((signer) => signer.toUplcData())),
                makeMapData(
                    redeemers.map((redeemer) => {
                        if (redeemer.kind == "TxMintingRedeemer") {
                            return [
                                makeMintingPurpose(
                                    minted.getPolicies()[redeemer.policyIndex]
                                ).toUplcData(),
                                redeemer.data
                            ]
                        } else if (redeemer.kind == "TxSpendingRedeemer") {
                            return [
                                makeSpendingPurpose(
                                    inputs[redeemer.inputIndex].id
                                ).toUplcData(),
                                redeemer.data
                            ]
                        } else if (redeemer.kind == "TxRewardingRedeemer") {
                            return [
                                makeRewardingPurpose(
                                    withdrawals[redeemer.withdrawalIndex][0]
                                        .stakingCredential
                                ).toUplcData(),
                                redeemer.data
                            ]
                        } else if (redeemer.kind == "TxCertifyingRedeemer") {
                            return [
                                makeCertifyingPurpose(
                                    dcerts[redeemer.dcertIndex]
                                ).toUplcData(),
                                redeemer.data
                            ]
                        } else {
                            throw new Error(`unhandled TxRedeemer kind`)
                        }
                    })
                ),
                makeMapData(datums.map((d) => [hashDatum(d).toUplcData(), d])),
                makeConstrData({
                    tag: 0,
                    fields: [makeByteArrayData(txId.bytes)]
                })
            ]
        })

        return makeConstrData({
            tag: 0,
            fields: [txData, this.purpose.toUplcData()]
        })
    }
}
