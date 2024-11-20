import { encodeInt, encodeTuple } from "@helios-lang/cbor"
import { bytesToHex, toInt } from "@helios-lang/codec-utils"
import { expectDefined } from "@helios-lang/type-utils"
import { encodeCost, makeUplcDataValue } from "@helios-lang/uplc"
import { makeNetworkParamsHelper } from "../params/index.js"
import { makeMintingPurpose } from "./MintingPurpose.js"
import { makeScriptContextV2 } from "./ScriptContextV2.js"

/**
 * @import { IntLike } from "@helios-lang/codec-utils"
 * @import { Cost, UplcData } from "@helios-lang/uplc"
 * @import { NetworkParams, RedeemerDetailsWithArgs, RedeemerDetailsWithoutArgs, Tx, TxInfo, TxMintingRedeemer } from "src/index.js"
 */

/**
 * @param {IntLike} policyIndex
 * @param {UplcData} data
 * @param {Cost} cost
 * @returns {TxMintingRedeemer}
 */
export function makeTxMintingRedeemer(
    policyIndex,
    data,
    cost = { mem: 0n, cpu: 0n }
) {
    const index = toInt(policyIndex)

    if (index < 0) {
        throw new Error("negative TxMintingRedeemer policy index not allowed")
    }

    return new TxMintingRedeemerImpl(index, data, cost)
}

/**
 * @implements {TxMintingRedeemer}
 */
class TxMintingRedeemerImpl {
    /**
     * @readonly
     * @type {number}
     */
    policyIndex

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
        this.policyIndex = policyIndex
        this.data = data
        this.cost = cost
    }

    /**
     * @type {"TxMintingRedeemer"}
     */
    get kind() {
        return "TxMintingRedeemer"
    }

    /**
     * On-chain ConstrData tag
     * @type {number}
     */
    get tag() {
        return 0
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
            redeemerType: "Minting",
            policyIndex: this.policyIndex,
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
        const mph = expectDefined(
            tx.body.minted.getPolicies()[this.policyIndex]
        )
        const summary = `mint @${this.policyIndex}`
        return {
            summary,
            description: `minting policy ${this.policyIndex} (${mph.toHex()})`,
            script: expectDefined(tx.witnesses.findUplcProgram(mph))
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
        const mph = expectDefined(
            tx.body.minted.getPolicies()[this.policyIndex]
        )
        const partialRes = this.getRedeemerDetailsWithoutArgs(tx)

        return {
            ...partialRes,
            args: [
                this.data,
                makeScriptContextV2(
                    txInfo,
                    makeMintingPurpose(mph)
                ).toUplcData()
            ].map((a) => makeUplcDataValue(a))
        }
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([
            encodeInt(1),
            encodeInt(this.policyIndex),
            this.data.toCbor(),
            encodeCost(this.cost)
        ])
    }
}
