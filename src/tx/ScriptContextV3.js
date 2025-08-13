import {    
    makeConstrData,
    makeIntData,
    makeListData,
    makeMapData
} from "@helios-lang/uplc"
import { hashDatum, makeDummyTxId, makeTxId } from "../hashes/index.js"
import { makeAssets, makeValue } from "../money/index.js"
import { makeMintingPurpose } from "./MintingPurpose.js"
import { makeRewardingPurpose } from "./RewardingPurpose.js"
import { makeCertifyingPurpose } from "./CertifyingPurpose.js"
import { ALWAYS } from "../time/index.js"

/**
 * @import { UplcData } from "@helios-lang/uplc"
 * @import { ScriptContextV3, ScriptPurpose, SpendingPurposeV3, TxInfo } from "../index.js"
 */

/**
 * @param {TxInfo} txInfo
 * @param {UplcData} redeemerData
 * @param {ScriptPurpose | SpendingPurposeV3} purpose
 * @returns {ScriptContextV3}
 */
export function makeScriptContextV3(txInfo, redeemerData, purpose) {
    return new ScriptContextV3Impl(txInfo, redeemerData, purpose)
}

/**
 * @implements {ScriptContextV3}
 */
class ScriptContextV3Impl {
    /**
     * @readonly
     * @type {TxInfo}
     */
    txInfo

    /**
     * @readonly
     * @type {UplcData}
     */
    redeemerData

    /**
     * @readonly
     * @type {ScriptPurpose | SpendingPurposeV3}
     */
    purpose

    /**
     * @param {TxInfo} txInfo
     * @param {UplcData} redeemerData
     * @param {ScriptPurpose | SpendingPurposeV3} purpose
     */
    constructor(txInfo, redeemerData, purpose) {
        this.txInfo = txInfo
        this.redeemerData = redeemerData
        this.purpose = purpose
    }

    /**
     * @type {"ScriptContextV3"}
     */
    get kind() {
        return "ScriptContextV3"
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

        const txData = makeConstrData(0, [
            makeListData(inputs.map((input) => input.toUplcDataV3())),
            makeListData(refInputs.map((input) => input.toUplcDataV3())),
            makeListData(outputs.map((output) => output.toUplcData())),
            makeValue(fee).toUplcData(),
            minted.toUplcData(true), // in UPLC V3, the 0 lovelace is no longer added to the minted value
            makeListData(dcerts.map((cert) => cert.toUplcData())),
            makeMapData(
                withdrawals.map(([sa, q]) => [sa.toUplcData(), makeIntData(q)])
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
                        // here the regular SpendingPurpose is used, not the SpendingPurposeV3 containing the datum, but utxoId.toUplcDataV3() must be called internally,
                        return [
                            makeConstrData(1, [
                                inputs[redeemer.inputIndex].id.toUplcDataV3()
                            ]),
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
                        // TODO: add voting and proposing redeemers
                    } else {
                        throw new Error(`unhandled TxRedeemer kind`)
                    }
                })
            ),
            makeMapData(datums.map((d) => [hashDatum(d).toUplcData(), d])),
            txId.toUplcDataV3(),
            makeMapData([]), // votes
            makeListData([]), // proposal procedures
            makeConstrData(1, []), // current treasury amount
            makeConstrData(1, []) // treasury donation
        ])

        // TODO: add ScriptInfo field?
        return makeConstrData({
            tag: 0,
            fields: [txData, this.redeemerData, this.purpose.toUplcData()],
            dataPath: "[ScriptContext]"
        })
    }
}
