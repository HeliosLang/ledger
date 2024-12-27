import {
    decodeInt,
    decodeTagged,
    encodeInt,
    encodeTuple
} from "@helios-lang/cbor"
import { bytesToHex, toInt } from "@helios-lang/codec-utils"
import { expectDefined } from "@helios-lang/type-utils"
import { encodeCost, makeUplcDataValue } from "@helios-lang/uplc"
import { makeNetworkParamsHelper } from "../params/index.js"
import { makeScriptContextV2 } from "./ScriptContextV2.js"
import { makeRewardingPurpose } from "./RewardingPurpose.js"

/**
 * @import { IntLike } from "@helios-lang/codec-utils"
 * @import { Cost, UplcData } from "@helios-lang/uplc"
 * @import { NetworkParams, RedeemerDetailsWithoutArgs, RedeemerDetailsWithArgs, Tx, TxInfo, TxRewardingRedeemer } from "../index.js"
 */

/**
 * @param {IntLike} withdrawalIndex
 * @param {UplcData} data
 * @param {Cost} cost
 * @returns {TxRewardingRedeemer}
 */
export function makeTxRewardingRedeemer(
    withdrawalIndex,
    data,
    cost = { mem: 0n, cpu: 0n }
) {
    const index = toInt(withdrawalIndex)

    if (index < 0) {
        throw new Error(
            "negative TxRewardingRedeemer withdrawal index not allowed"
        )
    }

    return new TxRewardingRedeemerImpl(index, data, cost)
}

/**
 * @implements {TxRewardingRedeemer}
 */
class TxRewardingRedeemerImpl {
    /**
     * @readonly
     * @type {number}
     */
    withdrawalIndex

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
     * @param {number} policyIndex
     * @param {UplcData} data
     * @param {Cost} cost
     */
    constructor(policyIndex, data, cost) {
        this.withdrawalIndex = policyIndex
        this.data = data
        this.cost = cost
    }

    /**
     * @type {"TxRewardingRedeemer"}
     */
    get kind() {
        return "TxRewardingRedeemer"
    }

    /**
     * On-chain ConstrData tag
     * @type {number}
     */
    get tag() {
        return 2
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
     * @returns {Object}
     */
    dump() {
        return {
            redeemerType: "Rewarding",
            withdrawalIndex: this.withdrawalIndex,
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
        const svh = expectDefined(
            tx.body.withdrawals[this.withdrawalIndex],
            `tx.body.withdrawals[${this.withdrawalIndex}] undefined in TxRewardingRedeemer.getRedeemerDetailsWithoutArgs()`
        )[0].stakingCredential

        if (svh.kind != "StakingValidatorHash") {
            throw new Error("expected StakingValidatorHash")
        }

        const summary = `rewards @${this.withdrawalIndex}`
        return {
            summary,
            description: `withdrawing ${summary} (${svh.toHex()})`,
            script: expectDefined(tx.witnesses.findUplcProgram(svh), `tx.witnesses.findUplcProgram(${svh.toHex()}) undefined in TxRewardingRedeemer.getRedeemerDetailsWithoutArgs()`)
        }
    }

    /**
     * Extracts script-evaluation details for a specific redeemer from the transaction
     *  With the `txInfo` argument, the
     * `args` for evaluating the redeemer are also included in the result.
     * @param {Tx} tx
     * @param {TxInfo} txInfo
     * @returns {RedeemerDetailsWithArgs}
     */
    getRedeemerDetailsWithArgs(tx, txInfo) {
        const partialRes = this.getRedeemerDetailsWithoutArgs(tx)
        const svh = expectDefined(
            tx.body.withdrawals[this.withdrawalIndex],
            `tx.body.withdrawals[${this.withdrawalIndex}] undefined in TxRewardingRedeemer.getRedeemerDetailsWithArgs()`
        )[0].stakingCredential

        return {
            ...partialRes,
            args: [
                this.data,
                makeScriptContextV2(
                    txInfo,
                    makeRewardingPurpose(svh)
                ).toUplcData()
            ].map((a) => makeUplcDataValue(a))
        }
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([
            encodeInt(3),
            encodeInt(this.withdrawalIndex),
            this.data.toCbor(),
            encodeCost(this.cost)
        ])
    }
}
