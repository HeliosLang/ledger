import {
    DEFAULT_COST_MODEL_PARAMS_V1,
    DEFAULT_COST_MODEL_PARAMS_V2,
    DEFAULT_COST_MODEL_PARAMS_V3
} from "@helios-lang/uplc"

/**
 * @import { ConwayParams } from "src/index.js"
 */

/**
 * @returns {ConwayParams}
 */
export function DEFAULT_CONWAY_PARAMS() {
    return {
        collateralPercentage: 150,
        committeeMaxTermLength: 365,
        committeeMinSize: 0,
        costModels: {
            PlutusV1: DEFAULT_COST_MODEL_PARAMS_V1(),
            PlutusV2: DEFAULT_COST_MODEL_PARAMS_V2(),
            PlutusV3: DEFAULT_COST_MODEL_PARAMS_V3()
        },
        dRepActivity: 20,
        dRepDeposit: 500000000,
        dRepVotingThresholds: {
            committeeNoConfidence: 0.6,
            committeeNormal: 0.67,
            hardForkInitiation: 0.6,
            motionNoConfidence: 0.67,
            ppEconomicGroup: 0.67,
            ppGovGroup: 0.75,
            ppNetworkGroup: 0.67,
            ppTechnicalGroup: 0.67,
            treasuryWithdrawal: 0.67,
            updateToConstitution: 0.75
        },
        executionUnitPrices: {
            priceMemory: 5.77e-2,
            priceSteps: 7.21e-5
        },
        govActionDeposit: 100000000000,
        govActionLifetime: 30,
        maxBlockBodySize: 90112,
        maxBlockExecutionUnits: {
            memory: 62000000,
            steps: 20000000000
        },
        maxBlockHeaderSize: 1100,
        maxCollateralInputs: 3,
        maxTxExecutionUnits: {
            memory: 14000000,
            steps: 10000000000
        },
        maxTxSize: 16384,
        maxValueSize: 5000,
        minFeeRefScriptCostPerByte: 15,
        minPoolCost: 170000000,
        monetaryExpansion: 3.0e-3,
        poolPledgeInfluence: 0.3,
        poolRetireMaxEpoch: 18,
        poolVotingThresholds: {
            committeeNoConfidence: 0.51,
            committeeNormal: 0.51,
            hardForkInitiation: 0.51,
            motionNoConfidence: 0.51,
            ppSecurityGroup: 0.51
        },
        protocolVersion: {
            major: 9,
            minor: 0
        },
        stakeAddressDeposit: 2000000,
        stakePoolDeposit: 500000000,
        stakePoolTargetNum: 500,
        treasuryCut: 0.2,
        txFeeFixed: 155381,
        txFeePerByte: 44,
        utxoCostPerByte: 4310
    }
}
