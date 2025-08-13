import { encodeInt, encodeTuple } from "@helios-lang/cbor"
import { bytesToHex, toInt } from "@helios-lang/codec-utils"
import { expectDefined } from "@helios-lang/type-utils"
import { encodeCost, makeUplcDataValue } from "@helios-lang/uplc"
import { makeNetworkParamsHelper } from "../params/index.js"
import { makeScriptContextV2 } from "./ScriptContextV2.js"
import { makeScriptContextV3 } from "./ScriptContextV3.js"
import { makeSpendingPurpose } from "./SpendingPurpose.js"
import { makeSpendingPurposeV3 } from "./SpendingPurposeV3.js"

/**
 * @import { IntLike } from "@helios-lang/codec-utils"
 * @import { Cost, UplcData } from "@helios-lang/uplc"
 * @import { NetworkParams, RedeemerDetailsWithoutArgs, RedeemerDetailsWithArgs, Tx, TxInfo, TxSpendingRedeemer } from "../index.js"
 */

/**
 * @param {IntLike} inputIndex
 * @param {UplcData} data
 * @param {Cost} cost - defaults to zero so cost can be calculated after construction
 * @returns {TxSpendingRedeemer}
 */
export function makeTxSpendingRedeemer(
    inputIndex,
    data,
    cost = { mem: 0n, cpu: 0n }
) {
    const index = toInt(inputIndex)

    if (index < 0) {
        throw new Error("negative TxRedeemer spending index not allowed")
    }

    return new TxSpendingRedeemerImpl(index, data, cost)
}

/**
 * @implements {TxSpendingRedeemer}
 */
class TxSpendingRedeemerImpl {
    /**
     * @readonly
     * @type {number}
     */
    inputIndex

    /**
     * @readonly
     * @type {UplcData}
     */
    data

    /**
     * @readonly
     * @type {Cost}
     */
    cost

    /**
     * @param {number} inputIndex
     * @param {UplcData} data
     * @param {Cost} cost
     */
    constructor(inputIndex, data, cost = { mem: 0n, cpu: 0n }) {
        this.inputIndex = inputIndex
        this.data = data
        this.cost = cost
    }

    /**
     * @type {"TxSpendingRedeemer"}
     */
    get kind() {
        return "TxSpendingRedeemer"
    }

    /**
     * On-chain ConstrData tag
     * @type {number}
     */
    get tag() {
        return 1
    }

    /**
     * @param {NetworkParams} params
     * @returns {bigint}
     */
    calcExFee(params) {
        const helper = makeNetworkParamsHelper(params)

        const { mem, cpu } = this.cost
        const [memFee, cpuFee] = helper.exFeeParams

        return BigInt(Math.ceil(Number(mem) * memFee + Number(cpu) * cpuFee))
    }

    /**
     * @returns {object}
     */
    dump() {
        return {
            redeemerType: "Spending",
            inputIndex: this.inputIndex,
            json: this.data.toSchemaJson(),
            cbor: bytesToHex(this.data.toCbor()),
            exUnits: {
                mem: this.cost.mem.toString(),
                cpu: this.cost.cpu.toString()
            }
        }
    }

    /**
     * Extracts script details for a specific redeemer on a transaction.
     * @param {Tx} tx
     * @returns {RedeemerDetailsWithoutArgs}
     */
    getRedeemerDetailsWithoutArgs(tx) {
        const utxo = expectDefined(
            tx.body.inputs[this.inputIndex],
            `tx.body.inputs[${this.inputIndex}] undefined in TxSpendingRedeemer.getRedeemerDetailsWithoutArgs()`
        )

        const summary = `input @${this.inputIndex}`
        const address = utxo.address

        if (address.era == "Byron") {
            throw new Error("Byron address not supported")
        }

        const spendingCredential = address.spendingCredential

        if (spendingCredential.kind != "ValidatorHash") {
            throw new Error(
                "expected Address with ValidatorHash as spending credential"
            )
        }

        return {
            summary,
            description: `spending tx.inputs[${this.inputIndex}] (from UTxO ${utxo.id.toString()})`,
            script: expectDefined(
                tx.witnesses.findUplcProgram(spendingCredential),
                `tx.witnesses.findUplcProgram(${spendingCredential.toHex()}) undefined in TxSpendingRedeemer.getRedeemerDetailsWithoutArgs()`
            )
        }
    }

    /**
     * Extracts script-evaluation details for a specific redeemer from the transaction
     * With the `txInfo` argument, the
     * `args` for evaluating the redeemer are also included in the result.
     * @param {Tx} tx
     * @param {TxInfo} txInfo
     * @returns {RedeemerDetailsWithArgs}
     */
    getRedeemerDetailsWithArgs(tx, txInfo) {
        const partialRes = this.getRedeemerDetailsWithoutArgs(tx)

        const utxo = expectDefined(
            tx.body.inputs[this.inputIndex],
            `tx.body.inputs[${this.inputIndex}] undefined in TxSpendingRedeemer.getRedeemerDetailsWithArgs()`
        )
        const datumData = expectDefined(
            utxo.datum?.data,
            `utxo.datum.data undefined in TxSpendingRedeemer.getRedeemerDetailsWithArgs()`
        )

        const script = partialRes.script

        const args = (() => {
            switch (script.plutusVersion) {
                case "PlutusScriptV1":
                    throw new Error("PlutusScriptV1 not yet supported")
                case "PlutusScriptV2":
                    return [
                        datumData,
                        this.data,
                        makeScriptContextV2(
                            txInfo,
                            makeSpendingPurpose(utxo.id)
                        ).toUplcData()
                    ].map((a) => makeUplcDataValue(a))
                case "PlutusScriptV3":
                    return [
                        makeScriptContextV3(
                            txInfo,
                            this.data,
                            makeSpendingPurposeV3(utxo.id, datumData)
                        ).toUplcData()
                    ].map((a) => makeUplcDataValue(a))
            }
        })()

        return {
            ...partialRes,
            args
        }
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([
            encodeInt(0),
            encodeInt(this.inputIndex),
            this.data.toCbor(),
            encodeCost(this.cost)
        ])
    }
}
