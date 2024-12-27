import { encodeInt, encodeTuple } from "@helios-lang/cbor"
import { bytesToHex, toInt } from "@helios-lang/codec-utils"
import { expectDefined } from "@helios-lang/type-utils"
import { encodeCost, makeUplcDataValue } from "@helios-lang/uplc"
import { makeNetworkParamsHelper } from "../params/index.js"
import { makeScriptContextV2 } from "./ScriptContextV2.js"
import { makeCertifyingPurpose } from "./CertifyingPurpose.js"

/**
 * @import { IntLike } from "@helios-lang/codec-utils"
 * @import { Cost, UplcData } from "@helios-lang/uplc"
 * @import { NetworkParams, RedeemerDetailsWithArgs, RedeemerDetailsWithoutArgs, TxCertifyingRedeemer, Tx, TxInfo } from "../index.js"
 */

/**
 * @param {IntLike} dcertIndex
 * @param {UplcData} data
 * @param {Cost} cost
 * @returns {TxCertifyingRedeemer}
 */
export function makeTxCertifyingRedeemer(
    dcertIndex,
    data,
    cost = { mem: 0n, cpu: 0n }
) {
    const index = toInt(dcertIndex)

    if (index < 0) {
        throw new Error("negative TxCertifyingRedeemer dcert index not allowed")
    }

    return new TxCertifyingRedeemerImpl(index, data, cost)
}

/**
 * @implements {TxCertifyingRedeemer}
 */
class TxCertifyingRedeemerImpl {
    /**
     * @readonly
     * @type {number}
     */
    dcertIndex

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
     * @param {number} dcertIndex
     * @param {UplcData} data
     * @param {Cost} cost
     */
    constructor(dcertIndex, data, cost) {
        this.dcertIndex = dcertIndex
        this.data = data
        this.cost = cost
    }

    /**
     * @type {"TxCertifyingRedeemer"}
     */
    get kind() {
        return "TxCertifyingRedeemer"
    }

    /**
     * On-chain ConstrData tag
     * @type {number}
     */
    get tag() {
        return 3
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
            redeemerType: "Certifying",
            dcertIndex: this.dcertIndex,
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
        const dcert = expectDefined(
            tx.body.dcerts[this.dcertIndex],
            `tx.body.dcerts[${this.dcertIndex}] undefined in TxCertifyingRedeemer.getRedeemerDetailsWithoutArgs()`
        )

        const summary = `${dcert.kind} @${this.dcertIndex}`

        if (!("credential" in dcert)) {
            throw new Error("DCert without staking credential")
        }

        if (dcert.credential.kind != "StakingValidatorHash") {
            throw new Error(
                "expected StakingValidatorHash as DCert staking credential"
            )
        }

        const svh = dcert.credential

        return {
            summary,
            description: `certifying ${summary}`,
            script: expectDefined(
                tx.witnesses.findUplcProgram(svh),
                `tx.witnesses.findUplcProgram(${svh.toHex()}) undefined in TxCertifyingRedeemer.getRedeemerDetailsWithoutArgs()`
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

        const dcert = expectDefined(
            tx.body.dcerts[this.dcertIndex],
            `tx.body.dcerts[${this.dcertIndex}] undefined in TxCertifyingRedeemer.getRedeemerDetailsWithArgs()`
        )

        return {
            ...partialRes,
            args: [
                this.data,
                makeScriptContextV2(
                    txInfo,
                    makeCertifyingPurpose(dcert)
                ).toUplcData()
            ].map((a) => makeUplcDataValue(a))
        }
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([
            encodeInt(2),
            encodeInt(this.dcertIndex),
            this.data.toCbor(),
            encodeCost(this.cost)
        ])
    }
}
