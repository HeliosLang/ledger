/**
 * @import { ConwayGenesisParams } from "src/index.js"
 */

/**
 * @type {ConwayGenesisParams}
 */
export const CONWAY_GENESIS_PARAMS = {
    poolVotingThresholds: {
        committeeNormal: 0.51,
        committeeNoConfidence: 0.51,
        hardForkInitiation: 0.51,
        motionNoConfidence: 0.51,
        ppSecurityGroup: 0.51
    },
    dRepVotingThresholds: {
        motionNoConfidence: 0.67,
        committeeNormal: 0.67,
        committeeNoConfidence: 0.6,
        updateToConstitution: 0.75,
        hardForkInitiation: 0.6,
        ppNetworkGroup: 0.67,
        ppEconomicGroup: 0.67,
        ppTechnicalGroup: 0.67,
        ppGovGroup: 0.75,
        treasuryWithdrawal: 0.67
    },
    committeeMinSize: 7,
    committeeMaxTermLength: 146,
    govActionLifetime: 6,
    govActionDeposit: 100000000000,
    dRepDeposit: 500000000,
    dRepActivity: 20,
    minFeeRefScriptCostPerByte: 15,
    plutusV3CostModel: [
        100788, 420, 1, 1, 1000, 173, 0, 1, 1000, 59957, 4, 1, 11183, 32,
        201305, 8356, 4, 16000, 100, 16000, 100, 16000, 100, 16000, 100, 16000,
        100, 16000, 100, 100, 100, 16000, 100, 94375, 32, 132994, 32, 61462, 4,
        72010, 178, 0, 1, 22151, 32, 91189, 769, 4, 2, 85848, 123203, 7305,
        -900, 1716, 549, 57, 85848, 0, 1, 1, 1000, 42921, 4, 2, 24548, 29498,
        38, 1, 898148, 27279, 1, 51775, 558, 1, 39184, 1000, 60594, 1, 141895,
        32, 83150, 32, 15299, 32, 76049, 1, 13169, 4, 22100, 10, 28999, 74, 1,
        28999, 74, 1, 43285, 552, 1, 44749, 541, 1, 33852, 32, 68246, 32, 72362,
        32, 7243, 32, 7391, 32, 11546, 32, 85848, 123203, 7305, -900, 1716, 549,
        57, 85848, 0, 1, 90434, 519, 0, 1, 74433, 32, 85848, 123203, 7305, -900,
        1716, 549, 57, 85848, 0, 1, 1, 85848, 123203, 7305, -900, 1716, 549, 57,
        85848, 0, 1, 955506, 213312, 0, 2, 270652, 22588, 4, 1457325, 64566, 4,
        20467, 1, 4, 0, 141992, 32, 100788, 420, 1, 1, 81663, 32, 59498, 32,
        20142, 32, 24588, 32, 20744, 32, 25933, 32, 24623, 32, 43053543, 10,
        53384111, 14333, 10, 43574283, 26308, 10, 16000, 100, 16000, 100,
        962335, 18, 2780678, 6, 442008, 1, 52538055, 3756, 18, 267929, 18,
        76433006, 8868, 18, 52948122, 18, 1995836, 36, 3227919, 12, 901022, 1,
        166917843, 4307, 36, 284546, 36, 158221314, 26549, 36, 74698472, 36,
        333849714, 1, 254006273, 72, 2174038, 72, 2261318, 64571, 4, 207616,
        8310, 4, 1293828, 28716, 63, 0, 1, 1006041, 43623, 251, 0, 1
    ],
    constitution: {
        anchor: {
            dataHash:
                "ca41a91f399259bcefe57f9858e91f6d00e1a38d6d9c63d4052914ea7bd70cb2",
            url: "ipfs://bafkreifnwj6zpu3ixa4siz2lndqybyc5wnnt3jkwyutci4e2tmbnj3xrdm"
        },
        script: "fa24fb305126805cf2164c161d852a0e7330cf988f1fe558cf7d4a64"
    },
    committee: {
        members: {
            "scriptHash-df0e83bde65416dade5b1f97e7f115cc1ff999550ad968850783fe50": 580,
            "scriptHash-b6012034ba0a7e4afbbf2c7a1432f8824aee5299a48e38e41a952686": 580,
            "scriptHash-ce8b37a72b178a37bbd3236daa7b2c158c9d3604e7aa667e6c6004b7": 580,
            "scriptHash-f0dc2c00d92a45521267be2d5de1c485f6f9d14466d7e16062897cf7": 580,
            "scriptHash-349e55f83e9af24813e6cb368df6a80d38951b2a334dfcdf26815558": 580,
            "scriptHash-84aebcfd3e00d0f87af918fc4b5e00135f407e379893df7e7d392c6a": 580,
            "scriptHash-e8165b3328027ee0d74b1f07298cb092fd99aa7697a1436f5997f625": 580
        },
        threshold: {
            numerator: 2,
            denominator: 3
        }
    }
}
