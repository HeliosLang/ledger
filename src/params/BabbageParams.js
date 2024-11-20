import {
    BABBAGE_COST_MODEL_PARAMS_V1,
    BABBAGE_COST_MODEL_PARAMS_V2
} from "./costmodel.js"

/**
 * @import { BabbageParams } from "src/index.js"
 */

/**
 * @type {BabbageParams}
 */
export const BABBAGE_PARAMS = {
    collateralPercentage: 150,
    costModels: {
        PlutusV1: BABBAGE_COST_MODEL_PARAMS_V1,
        PlutusV2: BABBAGE_COST_MODEL_PARAMS_V2
    },
    executionUnitPrices: { priceMemory: 0.0577, priceSteps: 0.0000721 },
    maxBlockBodySize: 90112,
    maxBlockExecutionUnits: { memory: 62000000, steps: 20000000000 },
    maxBlockHeaderSize: 1100,
    maxCollateralInputs: 3,
    maxTxExecutionUnits: { memory: 14000000, steps: 10000000000 },
    maxTxSize: 16384,
    maxValueSize: 5000,
    minPoolCost: 170000000,
    monetaryExpansion: 0.003,
    poolPledgeInfluence: 0.3,
    poolRetireMaxEpoch: 18,
    protocolVersion: { major: 8, minor: 0 },
    stakeAddressDeposit: 2000000,
    stakePoolDeposit: 500000000,
    stakePoolTargetNum: 500,
    treasuryCut: 0.2,
    txFeeFixed: 155381,
    txFeePerByte: 44,
    utxoCostPerByte: 4310
}
