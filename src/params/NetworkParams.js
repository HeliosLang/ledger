import {
    BABBAGE_COST_MODEL_PARAMS_V1,
    BABBAGE_COST_MODEL_PARAMS_V2,
    DEFAULT_COST_MODEL_PARAMS_V1,
    DEFAULT_COST_MODEL_PARAMS_V2,
    DEFAULT_COST_MODEL_PARAMS_V3
} from "./costmodel.js"

/**
 * @import { NetworkParams } from "src/index.js"
 */

/**
 * TODO: also for preview and preprod (refTipSlot/Time will be)
 * Keep the babbage params for testing
 * @returns {NetworkParams}
 */
export function BABBAGE_NETWORK_PARAMS() {
    return {
        txFeeFixed: 155381,
        txFeePerByte: 44,
        exMemFeePerUnit: 0.0577,
        exCpuFeePerUnit: 0.0000721,
        utxoDepositPerByte: 4310,
        collateralPercentage: 150,
        maxCollateralInputs: 3,
        maxTxExMem: 14000000,
        maxTxExCpu: 10000000000,
        maxTxSize: 16384,
        secondsPerSlot: 1,
        stakeAddrDeposit: 2000000,
        refTipSlot: 113163674,
        refTipTime: 1704729965000,
        refScriptsFeePerByte: 0,
        costModelParamsV1: BABBAGE_COST_MODEL_PARAMS_V1,
        costModelParamsV2: BABBAGE_COST_MODEL_PARAMS_V2,
        costModelParamsV3: []
    }
}

/**
 * @returns {NetworkParams}
 */
export function DEFAULT_NETWORK_PARAMS() {
    return {
        collateralPercentage: 150,
        costModelParamsV1: DEFAULT_COST_MODEL_PARAMS_V1(),
        costModelParamsV2: DEFAULT_COST_MODEL_PARAMS_V2(),
        costModelParamsV3: DEFAULT_COST_MODEL_PARAMS_V3(),
        exMemFeePerUnit: 5.77e-2,
        exCpuFeePerUnit: 7.21e-5,
        maxCollateralInputs: 3,
        maxTxExCpu: 10000000000,
        maxTxExMem: 14000000,
        maxTxSize: 16384,
        refScriptsFeePerByte: 15,
        refTipSlot: 113163674,
        refTipTime: 1704729965000,
        secondsPerSlot: 1,
        stakeAddrDeposit: 2000000,
        txFeeFixed: 155381,
        txFeePerByte: 44,
        utxoDepositPerByte: 4310
    }
}
