/**
 * For compatibility with older eras
 * @type {string[]}
 */
export const COST_MODEL_PARAM_NAMES_V1 = /* @__PURE__ */ [
    "addInteger-cpu-arguments-intercept",
    "addInteger-cpu-arguments-slope",
    "addInteger-memory-arguments-intercept",
    "addInteger-memory-arguments-slope",
    "appendByteString-cpu-arguments-intercept",
    "appendByteString-cpu-arguments-slope",
    "appendByteString-memory-arguments-intercept",
    "appendByteString-memory-arguments-slope",
    "appendString-cpu-arguments-intercept",
    "appendString-cpu-arguments-slope",
    "appendString-memory-arguments-intercept",
    "appendString-memory-arguments-slope",
    "bData-cpu-arguments",
    "bData-memory-arguments",
    "blake2b_256-cpu-arguments-intercept",
    "blake2b_256-cpu-arguments-slope",
    "blake2b_256-memory-arguments",
    "cekApplyCost-exBudgetCPU",
    "cekApplyCost-exBudgetMemory",
    "cekBuiltinCost-exBudgetCPU",
    "cekBuiltinCost-exBudgetMemory",
    "cekConstCost-exBudgetCPU",
    "cekConstCost-exBudgetMemory",
    "cekDelayCost-exBudgetCPU",
    "cekDelayCost-exBudgetMemory",
    "cekForceCost-exBudgetCPU",
    "cekForceCost-exBudgetMemory",
    "cekLamCost-exBudgetCPU",
    "cekLamCost-exBudgetMemory",
    "cekStartupCost-exBudgetCPU",
    "cekStartupCost-exBudgetMemory",
    "cekVarCost-exBudgetCPU",
    "cekVarCost-exBudgetMemory",
    "chooseData-cpu-arguments",
    "chooseData-memory-arguments",
    "chooseList-cpu-arguments",
    "chooseList-memory-arguments",
    "chooseUnit-cpu-arguments",
    "chooseUnit-memory-arguments",
    "consByteString-cpu-arguments-intercept",
    "consByteString-cpu-arguments-slope",
    "consByteString-memory-arguments-intercept",
    "consByteString-memory-arguments-slope",
    "constrData-cpu-arguments",
    "constrData-memory-arguments",
    "decodeUtf8-cpu-arguments-intercept",
    "decodeUtf8-cpu-arguments-slope",
    "decodeUtf8-memory-arguments-intercept",
    "decodeUtf8-memory-arguments-slope",
    "divideInteger-cpu-arguments-constant",
    "divideInteger-cpu-arguments-model-arguments-intercept",
    "divideInteger-cpu-arguments-model-arguments-slope",
    "divideInteger-memory-arguments-intercept",
    "divideInteger-memory-arguments-minimum",
    "divideInteger-memory-arguments-slope",
    "encodeUtf8-cpu-arguments-intercept",
    "encodeUtf8-cpu-arguments-slope",
    "encodeUtf8-memory-arguments-intercept",
    "encodeUtf8-memory-arguments-slope",
    "equalsByteString-cpu-arguments-constant",
    "equalsByteString-cpu-arguments-intercept",
    "equalsByteString-cpu-arguments-slope",
    "equalsByteString-memory-arguments",
    "equalsData-cpu-arguments-intercept",
    "equalsData-cpu-arguments-slope",
    "equalsData-memory-arguments",
    "equalsInteger-cpu-arguments-intercept",
    "equalsInteger-cpu-arguments-slope",
    "equalsInteger-memory-arguments",
    "equalsString-cpu-arguments-constant",
    "equalsString-cpu-arguments-intercept",
    "equalsString-cpu-arguments-slope",
    "equalsString-memory-arguments",
    "fstPair-cpu-arguments",
    "fstPair-memory-arguments",
    "headList-cpu-arguments",
    "headList-memory-arguments",
    "iData-cpu-arguments",
    "iData-memory-arguments",
    "ifThenElse-cpu-arguments",
    "ifThenElse-memory-arguments",
    "indexByteString-cpu-arguments",
    "indexByteString-memory-arguments",
    "lengthOfByteString-cpu-arguments",
    "lengthOfByteString-memory-arguments",
    "lessThanByteString-cpu-arguments-intercept",
    "lessThanByteString-cpu-arguments-slope",
    "lessThanByteString-memory-arguments",
    "lessThanEqualsByteString-cpu-arguments-intercept",
    "lessThanEqualsByteString-cpu-arguments-slope",
    "lessThanEqualsByteString-memory-arguments",
    "lessThanEqualsInteger-cpu-arguments-intercept",
    "lessThanEqualsInteger-cpu-arguments-slope",
    "lessThanEqualsInteger-memory-arguments",
    "lessThanInteger-cpu-arguments-intercept",
    "lessThanInteger-cpu-arguments-slope",
    "lessThanInteger-memory-arguments",
    "listData-cpu-arguments",
    "listData-memory-arguments",
    "mapData-cpu-arguments",
    "mapData-memory-arguments",
    "mkCons-cpu-arguments",
    "mkCons-memory-arguments",
    "mkNilData-cpu-arguments",
    "mkNilData-memory-arguments",
    "mkNilPairData-cpu-arguments",
    "mkNilPairData-memory-arguments",
    "mkPairData-cpu-arguments",
    "mkPairData-memory-arguments",
    "modInteger-cpu-arguments-constant",
    "modInteger-cpu-arguments-model-arguments-intercept",
    "modInteger-cpu-arguments-model-arguments-slope",
    "modInteger-memory-arguments-intercept",
    "modInteger-memory-arguments-minimum",
    "modInteger-memory-arguments-slope",
    "multiplyInteger-cpu-arguments-intercept",
    "multiplyInteger-cpu-arguments-slope",
    "multiplyInteger-memory-arguments-intercept",
    "multiplyInteger-memory-arguments-slope",
    "nullList-cpu-arguments",
    "nullList-memory-arguments",
    "quotientInteger-cpu-arguments-constant",
    "quotientInteger-cpu-arguments-model-arguments-intercept",
    "quotientInteger-cpu-arguments-model-arguments-slope",
    "quotientInteger-memory-arguments-intercept",
    "quotientInteger-memory-arguments-minimum",
    "quotientInteger-memory-arguments-slope",
    "remainderInteger-cpu-arguments-constant",
    "remainderInteger-cpu-arguments-model-arguments-intercept",
    "remainderInteger-cpu-arguments-model-arguments-slope",
    "remainderInteger-memory-arguments-intercept",
    "remainderInteger-memory-arguments-minimum",
    "remainderInteger-memory-arguments-slope",
    "sha2_256-cpu-arguments-intercept",
    "sha2_256-cpu-arguments-slope",
    "sha2_256-memory-arguments",
    "sha3_256-cpu-arguments-intercept",
    "sha3_256-cpu-arguments-slope",
    "sha3_256-memory-arguments",
    "sliceByteString-cpu-arguments-intercept",
    "sliceByteString-cpu-arguments-slope",
    "sliceByteString-memory-arguments-intercept",
    "sliceByteString-memory-arguments-slope",
    "sndPair-cpu-arguments",
    "sndPair-memory-arguments",
    "subtractInteger-cpu-arguments-intercept",
    "subtractInteger-cpu-arguments-slope",
    "subtractInteger-memory-arguments-intercept",
    "subtractInteger-memory-arguments-slope",
    "tailList-cpu-arguments",
    "tailList-memory-arguments",
    "trace-cpu-arguments",
    "trace-memory-arguments",
    "unBData-cpu-arguments",
    "unBData-memory-arguments",
    "unConstrData-cpu-arguments",
    "unConstrData-memory-arguments",
    "unIData-cpu-arguments",
    "unIData-memory-arguments",
    "unListData-cpu-arguments",
    "unListData-memory-arguments",
    "unMapData-cpu-arguments",
    "unMapData-memory-arguments",
    "verifyEd25519Signature-cpu-arguments-intercept",
    "verifyEd25519Signature-cpu-arguments-slope",
    "verifyEd25519Signature-memory-arguments"
]

/**
 * For compatibility with older eras
 * @type {string[]}
 */
export const COST_MODEL_PARAM_NAMES_V2 =
    /* @__PURE__ */ COST_MODEL_PARAM_NAMES_V1.slice(0, 133)
        .concat([
            "serialiseData-cpu-arguments-intercept",
            "serialiseData-cpu-arguments-slope",
            "serialiseData-memory-arguments-intercept",
            "serialiseData-memory-arguments-slope"
        ])
        .concat(COST_MODEL_PARAM_NAMES_V1.slice(137, 167))
        .concat([
            "verifyEcdsaSecp256k1Signature-cpu-arguments",
            "verifyEcdsaSecp256k1Signature-memory-arguments",
            "verifyEd25519Signature-cpu-arguments-intercept",
            "verifyEd25519Signature-cpu-arguments-slope",
            "verifyEd25519Signature-memory-arguments",
            "verifySchnorrSecp256k1Signature-cpu-arguments-intercept",
            "verifySchnorrSecp256k1Signature-cpu-arguments-slope",
            "verifySchnorrSecp256k1Signature-memory-arguments "
        ])

/**
 * @type {number[]}
 */
export const BABBAGE_COST_MODEL_PARAMS_V1 = /* @__PURE__ */ [
    197209, // addInteger-cpu-arguments-intercept
    0, // addInteger-cpu-arguments-slope
    1, // addInteger-memory-arguments-intercept
    1, // addInteger-memory-arguments-slope
    396231, // appendByteString-cpu-arguments-intercept
    621, // appendByteString-cpu-arguments-slope
    0, // appendByteString-memory-arguments-intercept
    1, // appendByteString-memory-arguments-slope
    150000, // appendString-cpu-arguments-intercept
    1000, // appendString-cpu-arguments-slope
    0, // appendString-memory-arguments-intercept
    1, // appendString-memory-arguments-slope
    150000, // bData-cpu-arguments
    32, // bData-memory-arguments
    2477736, // blake2b_256-cpu-arguments-intercept
    29175, // blake2b_256-cpu-arguments-slope
    4, // blake2b_256-memory-arguments
    29773, // cekApplyCost-exBudgetCPU
    100, // cekApplyCost-exBudgetMemory
    29773, // cekBuiltinCost-exBudgetCPU
    100, // cekBuiltinCost-exBudgetMemory
    29773, // cekConstCost-exBudgetCPU
    100, // cekConstCost-exBudgetMemory
    29773, // cekDelayCost-exBudgetCPU
    100, // cekDelayCost-exBudgetMemory
    29773, // cekForceCost-exBudgetCPU
    100, // cekForceCost-exBudgetMemory
    29773, // cekLamCost-exBudgetCPU
    100, // cekLamCost-exBudgetMemory
    100, // cekStartupCost-exBudgetCPU
    100, // cekStartupCost-exBudgetMemory
    29773, // cekVarCost-exBudgetCPU
    100, // cekVarCost-exBudgetMemory
    150000, // chooseData-cpu-arguments
    32, // chooseData-memory-arguments
    150000, // chooseList-cpu-arguments
    32, // chooseList-memory-arguments
    150000, // chooseUnit-cpu-arguments
    32, // chooseUnit-memory-arguments
    150000, // consByteString-cpu-arguments-intercept
    1000, // consByteString-cpu-arguments-slope
    0, // consByteString-memory-arguments-intercept
    1, // consByteString-memory-arguments-slope
    150000, // constrData-cpu-arguments
    32, // constrData-memory-arguments
    150000, // decodeUtf8-cpu-arguments-intercept
    1000, // decodeUtf8-cpu-arguments-slope
    0, // decodeUtf8-memory-arguments-intercept
    8, // decodeUtf8-memory-arguments-slope
    148000, // divideInteger-cpu-arguments-constant
    425507, // divideInteger-cpu-arguments-model-arguments-intercept
    118, // divideInteger-cpu-arguments-model-arguments-slope
    0, // divideInteger-memory-arguments-intercept
    1, // divideInteger-memory-arguments-minimum
    1, // divideInteger-memory-arguments-slope
    150000, // encodeUtf8-cpu-arguments-intercept
    1000, // encodeUtf8-cpu-arguments-slope
    0, // encodeUtf8-memory-arguments-intercept
    8, // encodeUtf8-memory-arguments-slope
    150000, // equalsByteString-cpu-arguments-constant
    112536, // equalsByteString-cpu-arguments-intercept
    247, // equalsByteString-cpu-arguments-slope
    1, // equalsByteString-memory-arguments
    150000, // equalsData-cpu-arguments-intercept
    10000, // equalsData-cpu-arguments-slope
    1, // equalsData-memory-arguments
    136542, // equalsInteger-cpu-arguments-intercept
    1326, // equalsInteger-cpu-arguments-slope
    1, // equalsInteger-memory-arguments
    1000, // equalsString-cpu-arguments-constant
    150000, // equalsString-cpu-arguments-intercept
    1000, // equalsString-cpu-arguments-slope
    1, // equalsString-memory-arguments
    150000, // fstPair-cpu-arguments
    32, // fstPair-memory-arguments
    150000, // headList-cpu-arguments
    32, // headList-memory-arguments
    150000, // iData-cpu-arguments
    32, // iData-memory-arguments
    1, // ifThenElse-cpu-arguments
    1, // ifThenElse-memory-arguments
    150000, // indexByteString-cpu-arguments
    1, // indexByteString-memory-arguments
    150000, // lengthOfByteString-cpu-arguments
    4, // lengthOfByteString-memory-arguments
    103599, // lessThanByteString-cpu-arguments-intercept
    248, // lessThanByteString-cpu-arguments-slope
    1, // lessThanByteString-memory-arguments
    103599, // lessThanEqualsByteString-cpu-arguments-intercept
    248, // lessThanEqualsByteString-cpu-arguments-slope
    1, // lessThanEqualsByteString-memory-arguments
    145276, // lessThanEqualsInteger-cpu-arguments-intercept
    1366, // lessThanEqualsInteger-cpu-arguments-slope
    1, // lessThanEqualsInteger-memory-arguments
    179690, // lessThanInteger-cpu-arguments-intercept
    497, // lessThanInteger-cpu-arguments-slope
    1, // lessThanInteger-memory-arguments
    150000, // listData-cpu-arguments
    32, // listData-memory-arguments
    150000, // mapData-cpu-arguments
    32, // mapData-memory-arguments
    150000, // mkCons-cpu-arguments
    32, // mkCons-memory-arguments
    150000, // mkNilData-cpu-arguments
    32, // mkNilData-memory-arguments
    150000, // mkNilPairData-cpu-arguments
    32, // mkNilPairData-memory-arguments
    150000, // mkPairData-cpu-arguments
    32, // mkPairData-memory-arguments
    148000, // modInteger-cpu-arguments-constant
    425507, // modInteger-cpu-arguments-model-arguments-intercept
    118, // modInteger-cpu-arguments-model-arguments-slope
    0, // modInteger-memory-arguments-intercept
    1, // modInteger-memory-arguments-minimum
    1, // modInteger-memory-arguments-slope
    61516, // multiplyInteger-cpu-arguments-intercept
    11218, // multiplyInteger-cpu-arguments-slope
    0, // multiplyInteger-memory-arguments-intercept
    1, // multiplyInteger-memory-arguments-slope
    150000, // nullList-cpu-arguments
    32, // nullList-memory-arguments
    148000, // quotientInteger-cpu-arguments-constant
    425507, // quotientInteger-cpu-arguments-model-arguments-intercept
    118, // quotientInteger-cpu-arguments-model-arguments-slope
    0, // quotientInteger-memory-arguments-intercept
    1, // quotientInteger-memory-arguments-minimum
    1, // quotientInteger-memory-arguments-slope
    148000, // remainderInteger-cpu-arguments-constant
    425507, // remainderInteger-cpu-arguments-model-arguments-intercept
    118, // remainderInteger-cpu-arguments-model-arguments-slope
    0, // remainderInteger-memory-arguments-intercept
    1, // remainderInteger-memory-arguments-minimum
    1, // remainderInteger-memory-arguments-slope
    2477736, // sha2_256-cpu-arguments-intercept
    29175, // sha2_256-cpu-arguments-slope
    4, // sha2_256-memory-arguments
    0, // sha3_256-cpu-arguments-intercept
    82363, // sha3_256-cpu-arguments-slope
    4, // sha3_256-memory-arguments
    150000, // sliceByteString-cpu-arguments-intercept
    5000, // sliceByteString-cpu-arguments-slope
    0, // sliceByteString-memory-arguments-intercept
    1, // sliceByteString-memory-arguments-slope
    150000, // sndPair-cpu-arguments
    32, // sndPair-memory-arguments
    197209, // subtractInteger-cpu-arguments-intercept
    0, // subtractInteger-cpu-arguments-slope
    1, // subtractInteger-memory-arguments-intercept
    1, // subtractInteger-memory-arguments-slope
    150000, // tailList-cpu-arguments
    32, // tailList-memory-arguments
    150000, // trace-cpu-arguments
    32, // trace-memory-arguments
    150000, // unBData-cpu-arguments
    32, // unBData-memory-arguments
    150000, // unConstrData-cpu-arguments
    32, // unConstrData-memory-arguments
    150000, // unIData-cpu-arguments
    32, // unIData-memory-arguments
    150000, // unListData-cpu-arguments
    32, // unListData-memory-arguments
    150000, // unMapData-cpu-arguments
    32, // unMapData-memory-arguments
    3345831, // verifyEd25519Signature-cpu-arguments-intercept
    1, // verifyEd25519Signature-cpu-arguments-slope
    1 // verifyEd25519Signature-memory-arguments
]

/**
 * @type {number[]}
 */
export const BABBAGE_COST_MODEL_PARAMS_V2 = [
    205665, // addInteger-cpu-arguments-intercept
    812, // addInteger-cpu-arguments-slope
    1, // addInteger-memory-arguments-intercept
    1, // addInteger-memory-arguments-slope
    1000, // appendByteString-cpu-arguments-intercept
    571, // appendByteString-cpu-arguments-slope
    0, // appendByteString-memory-arguments-intercept
    1, // appendByteString-memory-arguments-slope
    1000, // appendString-cpu-arguments-intercept
    24177, // appendString-cpu-arguments-slope
    4, // appendString-memory-arguments-intercept
    1, // appendString-memory-arguments-slope
    1000, // bData-cpu-arguments
    32, // bData-memory-arguments
    117366, // blake2b_256-cpu-arguments-intercept
    10475, // blake2b_256-cpu-arguments-slope
    4, // blake2b_256-memory-arguments
    23000, // cekApplyCost-exBudgetCPU
    100, // cekApplyCost-exBudgetMemory
    23000, // cekBuiltinCost-exBudgetCPU
    100, // cekBuiltinCost-exBudgetMemory
    23000, // cekConstCost-exBudgetCPU
    100, // cekConstCost-exBudgetMemory
    23000, // cekDelayCost-exBudgetCPU
    100, // cekDelayCost-exBudgetMemory
    23000, // cekForceCost-exBudgetCPU
    100, // cekForceCost-exBudgetMemory
    23000, // cekLamCost-exBudgetCPU
    100, // cekLamCost-exBudgetMemory
    100, // cekStartupCost-exBudgetCPU
    100, // cekStartupCost-exBudgetMemory
    23000, // cekVarCost-exBudgetCPU
    100, // cekVarCost-exBudgetMemory
    19537, // chooseData-cpu-arguments
    32, // chooseData-memory-arguments
    175354, // chooseList-cpu-arguments
    32, // chooseList-memory-arguments
    46417, // chooseUnit-cpu-arguments
    4, // chooseUnit-memory-arguments
    221973, // consByteString-cpu-arguments-intercept
    511, // consByteString-cpu-arguments-slope
    0, // consByteString-memory-arguments-intercept
    1, // consByteString-memory-arguments-slope
    89141, // constrData-cpu-arguments
    32, // constrData-memory-arguments
    497525, // decodeUtf8-cpu-arguments-intercept
    14068, // decodeUtf8-cpu-arguments-slope
    4, // decodeUtf8-memory-arguments-intercept
    2, // decodeUtf8-memory-arguments-slope
    196500, // divideInteger-cpu-arguments-constant
    453240, // divideInteger-cpu-arguments-model-arguments-intercept
    220, // divideInteger-cpu-arguments-model-arguments-slope
    0, // divideInteger-memory-arguments-intercept
    1, // divideInteger-memory-arguments-minimum
    1, // divideInteger-memory-arguments-slope
    1000, // encodeUtf8-cpu-arguments-intercept
    28662, // encodeUtf8-cpu-arguments-slope
    4, // encodeUtf8-memory-arguments-intercept
    2, // encodeUtf8-memory-arguments-slope
    245000, // equalsByteString-cpu-arguments-constant
    216773, // equalsByteString-cpu-arguments-intercept
    62, // equalsByteString-cpu-arguments-slope
    1, // equalsByteString-memory-arguments
    1060367, // equalsData-cpu-arguments-intercept
    12586, // equalsData-cpu-arguments-slope
    1, // equalsData-memory-arguments
    208512, // equalsInteger-cpu-arguments-intercept
    421, // equalsInteger-cpu-arguments-slope
    1, // equalsInteger-memory-arguments
    187000, // equalsString-cpu-arguments-constant
    1000, // equalsString-cpu-arguments-intercept
    52998, // equalsString-cpu-arguments-slope
    1, // equalsString-memory-arguments
    80436, // fstPair-cpu-arguments
    32, // fstPair-memory-arguments
    43249, // headList-cpu-arguments
    32, // headList-memory-arguments
    1000, // iData-cpu-arguments
    32, // iData-memory-arguments
    80556, // ifThenElse-cpu-arguments
    1, // ifThenElse-memory-arguments
    57667, // indexByteString-cpu-arguments
    4, // indexByteString-memory-arguments
    1000, // lengthOfByteString-cpu-arguments
    10, // lengthOfByteString-memory-arguments
    197145, // lessThanByteString-cpu-arguments-intercept
    156, // lessThanByteString-cpu-arguments-slope
    1, // lessThanByteString-memory-arguments
    197145, // lessThanEqualsByteString-cpu-arguments-intercept
    156, // lessThanEqualsByteString-cpu-arguments-slope
    1, // lessThanEqualsByteString-memory-arguments
    204924, // lessThanEqualsInteger-cpu-arguments-intercept
    473, // lessThanEqualsInteger-cpu-arguments-slope
    1, // lessThanEqualsInteger-memory-arguments
    208896, // lessThanInteger-cpu-arguments-intercept
    511, // lessThanInteger-cpu-arguments-slope
    1, // lessThanInteger-memory-arguments
    52467, // listData-cpu-arguments
    32, // listData-memory-arguments
    64832, // mapData-cpu-arguments
    32, // mapData-memory-arguments
    65493, // mkCons-cpu-arguments
    32, // mkCons-memory-arguments
    22558, // mkNilData-cpu-arguments
    32, // mkNilData-memory-arguments
    16563, // mkNilPairData-cpu-arguments
    32, // mkNilPairData-memory-arguments
    76511, // mkPairData-cpu-arguments
    32, // mkPairData-memory-arguments
    196500, // modInteger-cpu-arguments-constant
    453240, // modInteger-cpu-arguments-model-arguments-intercept
    220, // modInteger-cpu-arguments-model-arguments-slope
    0, // modInteger-memory-arguments-intercept
    1, // modInteger-memory-arguments-minimum
    1, // modInteger-memory-arguments-slope
    69522, // multiplyInteger-cpu-arguments-intercept
    11687, // multiplyInteger-cpu-arguments-slope
    0, // multiplyInteger-memory-arguments-intercept
    1, // multiplyInteger-memory-arguments-slope
    60091, // nullList-cpu-arguments
    32, // nullList-memory-arguments
    196500, // quotientInteger-cpu-arguments-constant
    453240, // quotientInteger-cpu-arguments-model-arguments-intercept
    220, // quotientInteger-cpu-arguments-model-arguments-slope
    0, // quotientInteger-memory-arguments-intercept
    1, // quotientInteger-memory-arguments-minimum
    1, // quotientInteger-memory-arguments-slope
    196500, // remainderInteger-cpu-arguments-constant
    453240, // remainderInteger-cpu-arguments-model-arguments-intercept
    220, // remainderInteger-cpu-arguments-model-arguments-slope
    0, // remainderInteger-memory-arguments-intercept
    1, // remainderInteger-memory-arguments-minimum
    1, // remainderInteger-memory-arguments-slope
    1159724, // serialiseData-cpu-arguments-intercept
    392670, // serialiseData-cpu-arguments-slope
    0, // serialiseData-memory-arguments-intercept
    2, // serialiseData-memory-arguments-slope
    806990, // sha2_256-cpu-arguments-intercept
    30482, // sha2_256-cpu-arguments-slope
    4, // sha2_256-memory-arguments
    1927926, // sha3_256-cpu-arguments-intercept
    82523, // sha3_256-cpu-arguments-slope
    4, // sha3_256-memory-arguments
    265318, // sliceByteString-cpu-arguments-intercept
    0, // sliceByteString-cpu-arguments-slope
    4, // sliceByteString-memory-arguments-intercept
    0, // sliceByteString-memory-arguments-slope
    85931, // sndPair-cpu-arguments
    32, // sndPair-memory-arguments
    205665, // subtractInteger-cpu-arguments-intercept
    812, // subtractInteger-cpu-arguments-slope
    1, // subtractInteger-memory-arguments-intercept
    1, // subtractInteger-memory-arguments-slope
    41182, // tailList-cpu-arguments
    32, // tailList-memory-arguments
    212342, // trace-cpu-arguments
    32, // trace-memory-arguments
    31220, // unBData-cpu-arguments
    32, // unBData-memory-arguments
    32696, // unConstrData-cpu-arguments
    32, // unConstrData-memory-arguments
    43357, // unIData-cpu-arguments
    32, // unIData-memory-arguments
    32247, // unListData-cpu-arguments
    32, // unListData-memory-arguments
    38314, // unMapData-cpu-arguments
    32, // unMapData-memory-arguments
    35892428, // verifyEcdsaSecp256k1Signature-cpu-arguments
    10, // verifyEcdsaSecp256k1Signature-memory-arguments
    57996947, // verifyEd25519Signature-cpu-arguments-intercept
    18975, // verifyEd25519Signature-cpu-arguments-slope
    10, // verifyEd25519Signature-memory-arguments
    38887044, // verifySchnorrSecp256k1Signature-cpu-arguments-intercept
    32947, // verifySchnorrSecp256k1Signature-cpu-arguments-slope
    10 // verifySchnorrSecp256k1Signature-memory-arguments
]

export {
    DEFAULT_COST_MODEL_PARAMS_V1,
    DEFAULT_COST_MODEL_PARAMS_V2,
    DEFAULT_COST_MODEL_PARAMS_V3
} from "@helios-lang/uplc"
