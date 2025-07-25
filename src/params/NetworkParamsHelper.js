import { toInt } from "@helios-lang/codec-utils"
import { expectDefined } from "@helios-lang/type-utils"
import { makeTxInput } from "../tx/TxInput.js"
import { parseTxOutputId } from "../tx/TxOutputId.js"
import { DEFAULT_NETWORK_PARAMS } from "./NetworkParams.js"

/**
 * @import { IntLike } from "@helios-lang/codec-utils"
 * @import { NetworkParams, NetworkParamsHelper, TxInput } from "../index.js"
 */

/**
 * @template {NetworkParams} [T=NetworkParams]
 * @param {T} params
 * @returns {NetworkParamsHelper<T>}
 */
export function makeNetworkParamsHelper(params) {
    return new NetworkParamsHelperImpl(params)
}

/**
 * @returns {NetworkParamsHelper<NetworkParams>}
 */
export function makeDefaultNetworkParamsHelper() {
    return new NetworkParamsHelperImpl(DEFAULT_NETWORK_PARAMS())
}

/**
 * Wrapper for the raw JSON containing all the current network parameters.
 *
 * NetworkParamsHelper is needed to be able to calculate script budgets and perform transaction building checks.
 * @template {NetworkParams} T
 * @implements {NetworkParamsHelper<T>}
 */
class NetworkParamsHelperImpl {
    /**
     * @readonly
     * @type {T}
     */
    params

    /**
     * @param {T} params
     */
    constructor(params) {
        this.params = params
    }

    /**
     * @type {number[]}
     */
    get costModelParamsV1() {
        return expectDefined(
            this.params?.costModelParamsV1,
            "'networkParams.costModelParamsV1' undefined"
        )
    }

    /**
     * @type {number[]}
     */
    get costModelParamsV2() {
        return expectDefined(
            this.params?.costModelParamsV2,
            "'networkParams.costModelParamsV2' undefined"
        )
    }

    /**
     * @type {number[]}
     */
    get costModelParamsV3() {
        return expectDefined(
            this.params?.costModelParamsV3,
            "'networkParams.costModelParamsV3' undefined"
        )
    }

    /**
     * @type {[number, number]} - a + b*txSize
     */
    get txFeeParams() {
        return [
            expectDefined(
                this.params?.txFeeFixed,
                "'networkParams.txFeeFixed' undefined"
            ),
            expectDefined(
                this.params?.txFeePerByte,
                "'networkParams.txFeePerByte' undefined"
            )
        ]
    }

    /**
     * @type {[number, number]} - [memPrice, cpuPrice]
     */
    get exFeeParams() {
        return [
            expectDefined(
                this.params?.exMemFeePerUnit,
                "'networkParams.exMemFeePerUnit' undefined"
            ),
            expectDefined(
                this.params?.exCpuFeePerUnit,
                "'networkParams.exCpuFeePerUnit' undefined"
            )
        ]
    }

    /**
     * @type {number}
     */
    get refScriptsFeePerByte() {
        return expectDefined(
            this.params?.refScriptsFeePerByte,
            "'networkParams.refScriptsFeePerByte' undefined"
        )
    }

    /**
     * @type {number}
     */
    get lovelacePerUtxoByte() {
        return expectDefined(
            this.params?.utxoDepositPerByte,
            "'networkParams.utxoDepositPerByte' undefined"
        )
    }

    /**
     * @type {number}
     */
    get minCollateralPct() {
        return expectDefined(
            this.params?.collateralPercentage,
            "'networkParams.collateralPercentage' undefined"
        )
    }

    /**
     * @type {number}
     */
    get maxCollateralInputs() {
        return expectDefined(
            this.params?.maxCollateralInputs,
            "'networkParams.maxCollateralInputs' undefined"
        )
    }

    /**
     * @type {[number, number]} - [mem, cpu]
     */
    get maxTxExecutionBudget() {
        return [
            expectDefined(
                this.params?.maxTxExMem,
                "'networkParams.maxTxExMem' undefined"
            ),
            expectDefined(
                this.params?.maxTxExCpu,
                "'networkParams.maxTxExCpu' undefined"
            )
        ]
    }

    /**
     * Tx balancing picks additional inputs by starting from maxTxFee.
     * This is done because the order of the inputs can have a huge impact on the tx fee, so the order must be known before balancing.
     * If there aren't enough inputs to cover the maxTxFee and the min deposits of newly created UTxOs, the balancing will fail.
     * TODO: make this private once we are in Conway era, because this should always take into account the cost of ref scripts
     * @type {bigint}
     */
    get maxTxFee() {
        const [a, b] = this.txFeeParams
        const [feePerMem, feePerCpu] = this.exFeeParams
        const [maxMem, maxCpu] = this.maxTxExecutionBudget

        return (
            BigInt(a) +
            BigInt(Math.ceil(b * this.maxTxSize)) +
            BigInt(Math.ceil(feePerMem * maxMem)) +
            BigInt(Math.ceil(feePerCpu * maxCpu))
        )
    }

    /**
     * @param {bigint} refScriptsSize
     * @returns {bigint}
     */
    calcMaxConwayTxFee(refScriptsSize) {
        const f = this.maxTxFee

        return f + refScriptsSize * BigInt(this.refScriptsFeePerByte)
    }

    /**
     * @type {number}
     */
    get maxTxSize() {
        return expectDefined(
            this.params?.maxTxSize,
            "'networkParams.maxTxSize' undefined"
        )
    }

    /**
     * @type {number}
     */
    get secondsPerSlot() {
        return expectDefined(
            this.params?.secondsPerSlot,
            "'networkParams.secondsPerSlot' undefined"
        )
    }

    /**
     * @type {bigint}
     */
    get stakeAddressDeposit() {
        return BigInt(
            expectDefined(
                this.params?.stakeAddrDeposit,
                "'networkParams.stakeAddrDeposit' undefined"
            )
        )
    }

    /**
     * @type {number}
     */
    get latestTipSlot() {
        return expectDefined(
            this.params?.refTipSlot,
            "'networkParams.refTipSlot' undefined"
        )
    }

    /**
     * @type {number}
     */
    get latestTipTime() {
        return expectDefined(
            this.params?.refTipTime,
            "'networkParams.refTipTime' undefined"
        )
    }

    /**
     * Calculates the time (in milliseconds in 01/01/1970) associated with a given slot number.
     * @param {IntLike} slot
     * @returns {number}
     */
    slotToTime(slot) {
        const slotDiff = toInt(slot) - this.latestTipSlot

        return this.latestTipTime + slotDiff * this.secondsPerSlot * 1000
    }

    /**
     * Calculates the slot number associated with a given time. Time is specified as milliseconds since 01/01/1970.
     * @param {IntLike} time Milliseconds since 1970
     * @returns {number}
     */
    timeToSlot(time) {
        const timeDiff = toInt(time) - this.latestTipTime

        return (
            this.latestTipSlot +
            Math.round(timeDiff / (1000 * this.secondsPerSlot))
        )
    }

    /**
     * @type {TxInput | undefined}
     */
    get defaultCollateralUTXO() {
        return this.params?.collateralUTXO
            ? makeTxInput(parseTxOutputId(this.params.collateralUTXO))
            : undefined
    }
}
