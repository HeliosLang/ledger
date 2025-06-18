import { UplcRuntimeError } from "@helios-lang/uplc"

export {
    compareStakingAddresses,
    compareStakingCredentials,
    convertSpendingCredentialToUplcData,
    convertStakingCredentialToUplcData,
    convertUplcDataToShelleyAddress,
    convertUplcDataToSpendingCredential,
    convertUplcDataToStakingAddress,
    convertUplcDataToStakingCredential,
    decodeAddress,
    decodeByronAddress,
    decodeShelleyAddress,
    decodeStakingAddress,
    decodeStakingCredential,
    encodeStakingCredential,
    isValidBech32Address,
    isValidBech32StakingAddress,
    makeAddress,
    makeByronAddress,
    makeDummyAddress,
    makeDummyShelleyAddress,
    makeDummyStakingAddress,
    makeShelleyAddress,
    makeStakingAddress,
    parseShelleyAddress,
    parseStakingAddress
} from "./address/index.js"
export {
    compareDatumHashes,
    compareMintingPolicyHashes,
    comparePubKeyHashes,
    compareStakingValidatorHashes,
    compareValidatorHashes,
    convertUplcDataToDatumHash,
    convertUplcDataToMintingPolicyHash,
    convertUplcDataToPubKeyHash,
    convertUplcDataToStakingValidatorHash,
    convertUplcDataToTxId,
    convertUplcDataToValidatorHash,
    decodeDatumHash,
    decodeMintingPolicyHash,
    decodePubKeyHash,
    decodeStakingValidatorHash,
    decodeTxId,
    decodeValidatorHash,
    hashDatum,
    isValidMintingPolicyHash,
    isValidPubKeyHash,
    isValidStakingValidatorHash,
    isValidTxId,
    isValidValidatorHash,
    makeDummyMintingPolicyHash,
    makeDummyPubKeyHash,
    makeDummyStakingValidatorHash,
    makeDummyTxId,
    makeDummyValidatorHash,
    makeDatumHash,
    makeMintingPolicyHash,
    makePubKeyHash,
    makeStakingValidatorHash,
    makeTxId,
    makeValidatorHash
} from "./hashes/index.js"
export {
    ADA,
    addValues,
    compareAssetClasses,
    convertUplcDataToAssetClass,
    convertUplcDataToValue,
    decodeAssetClass,
    decodeAssets,
    decodeValue,
    makeAssetClass,
    makeAssets,
    makeDummyAssetClass,
    makeTokenValue,
    makeValue,
    parseAssetClass,
    parseBlockfrostValue
} from "./money/index.js"
export {
    decodeNativeScript,
    hashNativeScript,
    makeAfterScript,
    makeAllScript,
    makeAnyScript,
    makeAtLeastScript,
    makeBeforeScript,
    makeSigScript,
    parseNativeScript
} from "./native/index.js"
export {
    BABBAGE_COST_MODEL_PARAMS_V1,
    BABBAGE_COST_MODEL_PARAMS_V2,
    BABBAGE_PARAMS,
    BABBAGE_NETWORK_PARAMS,
    CONWAY_GENESIS_PARAMS,
    DEFAULT_NETWORK_PARAMS,
    DEFAULT_CONWAY_PARAMS,
    SHELLEY_GENESIS_PARAMS,
    makeDefaultNetworkParamsHelper,
    makeNetworkParamsHelper
} from "./params/index.js"
export {
    convertUplcDataToPubKey,
    decodePubKey,
    decodeSignature,
    makeDummyPubKey,
    makeDummySignature,
    makePubKey,
    makeSignature
} from "./signature/index.js"
export {
    convertUplcDataToTimeRange,
    makeTimeRange,
    toTime
} from "./time/index.js"
export {
    DEFAULT_TX_OUTPUT_ENCODING_CONFIG,
    appendTxInput,
    calcRefScriptsSize,
    calcScriptDataHash,
    compareTxInputs,
    compareTxOutputIds,
    convertUplcDataToTxInput,
    convertUplcDataToTxOutput,
    convertUplcDataToTxOutputDatum,
    convertUplcDataToTxOutputId,
    decodeDCert,
    decodeTx,
    decodeTxBody,
    decodeTxInput,
    decodeTxMetadata,
    decodeTxMetadataAttr,
    decodeTxOutput,
    decodeTxOutputDatum,
    decodeTxOutputId,
    decodeTxRedeemer,
    decodeTxWitnesses,
    encodeTxMetadataAttr,
    isValidTxInputCbor,
    isValidTxOutputCbor,
    isValidTxOutputId,
    makeCertifyingPurpose,
    makeDelegationDCert,
    makeDeregistrationDCert,
    makeDummyTxOutputId,
    makeHashedTxOutputDatum,
    makeInlineTxOutputDatum,
    makeMintingPurpose,
    makeRegisterPoolDCert,
    makeRegistrationDCert,
    makeRetirePoolDCert,
    makeRewardingPurpose,
    makeScriptContextV2,
    makeSpendingPurpose,
    makeTx,
    makeTxBody,
    makeTxCertifyingRedeemer,
    makeTxInput,
    makeTxMetadata,
    makeTxMintingRedeemer,
    makeTxOutput,
    makeTxOutputDatum,
    makeTxOutputId,
    makeTxRewardingRedeemer,
    makeTxSpendingRedeemer,
    makeTxWitnesses,
    parseTxOutputId,
    UtxoAlreadySpentError,
    UtxoNotFoundError
} from "./tx/index.js"

/**
 * @import { BytesLike, IntLike } from "@helios-lang/codec-utils"
 * @import { JsonSafe } from "@helios-lang/type-utils"
 * @import {
 *   ByteArrayData,
 *   ConstrData,
 *   Cost,
 *   MapData,
 *   UplcData,
 *   UplcDataValue,
 *   UplcLogger,
 *   UplcProgram,
 *   UplcProgramV1,
 *   UplcProgramV2,
 *   UplcProgramV3
 * } from "@helios-lang/uplc"
 */

/**
 * @template {SpendingCredential} [SC=SpendingCredential]
 * @typedef {ByronAddress | ShelleyAddress<SC>} Address
 */

/**
 * @typedef {object} ByronAddress
 * Byron-era address
 *
 * @prop {"Address"} kind
 * @prop {"Byron"} era
 * @prop {number[]} bytes
 * @prop {bigint} checksum
 * @prop {(other: Address) => boolean} isEqual
 * @prop {() => string} toBase58
 * @prop {() => number[]} toCbor
 *
 * @prop {() => UplcData} toUplcData
 * Throws an error. Simplifies type-compatibility with ShelleyAddress, so you can simply call `Address.toUplcData()`
 *
 * @prop {() => string} toString
 * Alias for toBase58()
 */

/**
 * @template {SpendingCredential} [SC=SpendingCredential]
 * @typedef {object} ShelleyAddress
 * Wrapper for Cardano (post-Byron) address bytes. A `ShelleyAddress` consists of three parts internally:
 *   - Header (1 byte, see [CIP 19](https://cips.cardano.org/cips/cip19/))
 *   - Witness hash (28 bytes that represent the `PubKeyHash` or `ValidatorHash`)
 *   - Optional staking credential (0 or 28 bytes)
 *
 * @prop {"Address"} kind
 * @prop {"Shelley"} era
 * @prop {boolean} mainnet
 * @prop {"addr" | "addr_test"} bech32Prefix
 * @prop {SC} spendingCredential
 * @prop {StakingCredential | undefined} stakingCredential
 * @prop {number[]} bytes
 *
 * @prop {() => ShelleyAddress<SC>} copy
 * @prop {() => object} dump
 * @prop {(other: Address) => boolean} isEqual
 * @prop {() => string} toBech32
 * @prop {() => number[]} toCbor
 * @prop {() => string} toHex
 *
 * @prop {() => string} toString
 * Alias for toBech32()
 *
 * @prop {() => UplcData} toUplcData
 */

/**
 * @typedef {ShelleyAddress | BytesLike} ShelleyAddressLike
 */

/**
 * @typedef {PubKeyHash | ValidatorHash} SpendingCredential
 */

/**
 * @typedef {PubKeyHash | StakingValidatorHash} StakingCredential
 */

/**
 * @template {StakingCredential} [SC=StakingCredential]
 * @typedef {object} StakingAddress
 * Wrapper for Cardano stake address bytes. An StakingAddress consists of two parts internally:
 *   - Header (1 byte, see CIP 8)
 *   - Staking witness hash (28 bytes that represent the `PubKeyHash` or `StakingValidatorHash`)
 * Staking addresses are used to query the assets held by given staking credentials.
 *
 * @prop {"StakingAddress"} kind
 * @prop {boolean} mainnet
 * @prop {SC} stakingCredential
 * @prop {number[]} bytes
 * @prop {"stake" | "stake_test"} bech32Prefix
 * @prop {(other: StakingAddress) => boolean} isEqual
 * @prop {() => string} toBech32
 * @prop {() => number[]} toCbor
 * @prop {() => string} toHex
 *
 * @prop {() => string} toString
 * Alias for toBech32()
 *
 * @prop {() => ConstrData} toUplcData
 */

/**
 * @typedef {StakingAddress | BytesLike | ShelleyAddress | StakingCredential | PubKeyHash | ValidatorHash} StakingAddressLike
 */

/**
 * @template [C=unknown]
 * @typedef {object} AssetClass
 * @prop {"AssetClass"} kind
 * @prop {MintingPolicyHash<C>} mph
 * @prop {number[]} tokenName
 * @prop {(other: AssetClass<any>) => boolean} isEqual
 * @prop {(other: AssetClass<any>) => boolean} isGreaterThan
 * @prop {() => number[]} toCbor
 * @prop {() => string} toFingerprint
 * @prop {() => string} toString
 * @prop {() => ConstrData} toUplcData
 */

/**
 * @typedef {string | [
 *   MintingPolicyHashLike,
 *   BytesLike
 * ] | {
 *   mph: MintingPolicyHashLike,
 *   tokenName: BytesLike
 * }} AssetClassLike
 */

/**
 * @typedef {object} Assets
 * Represents a list of non-Ada tokens.
 *
 * @prop {"Assets"} kind
 * @prop {[MintingPolicyHash, [number[], bigint][]][]} assets
 * @prop {AssetClass[]} assetClasses
 * @prop {(other: Assets) => Assets} add
 * @prop {(assetClass: AssetClassLike, qty: IntLike) => void} addAssetClassQuantity
 * Mutates `this`
 *
 * @prop {(mph: MintingPolicyHashLike, tokenName: BytesLike, qty: IntLike) => void} addPolicyTokenQuantity
 * Mutates `this`
 *
 * @prop {(mph: MintingPolicyHashLike, tokens: [BytesLike, IntLike][]) => void} addPolicyTokens
 * Mutates 'this'.
 * Throws error if mph is already contained in 'this'.
 *
 * @prop {() => void} assertAllPositive
 * Throws an error if any contained quantity <= 0n
 *
 * @prop {() => void} assertSorted
 *
 * @prop {() => number} countTokens
 * Returns the number of unique tokens
 *
 * @prop {() => Assets} copy
 *
 * @prop {() => object} dump
 *
 * @prop {(assetClass: AssetClassLike) => bigint} getAssetClassQuantity
 * Returns 0n if not found
 *
 * @prop {(mph: MintingPolicyHashLike, tokenName: BytesLike) => bigint} getPolicyTokenQuantity
 * Returns 0n if not found
 *
 * @prop {() => MintingPolicyHash[]} getPolicies
 * Returns a list of all the minting policies.
 *
 * @prop {(policy: MintingPolicyHashLike) => [number[], bigint][]} getPolicyTokens
 * Returns an empty list if the policy isn't found
 *
 * @prop {(policy: MintingPolicyHashLike) => number[][]} getPolicyTokenNames
 * Returns an empty list if the policy isn't found
 *
 * @prop {(assetClass: AssetClassLike) => boolean} hasAssetClass
 * @prop {(mph: MintingPolicyHashLike, tokenName: BytesLike) => boolean} hasPolicyToken
 * @prop {() => boolean} isAllPositive
 * @prop {(other: Assets) => boolean} isEqual
 * @prop {(other: Assets) => boolean} isGreaterOrEqual
 * @prop {(other: Assets) => boolean} isGreaterThan
 * @prop {() => boolean} isZero
 * @prop {(scalar: IntLike) => Assets} multiply
 *
 * @prop {() => void} normalize
 * Removes zeroes and merges duplicates.
 * In-place algorithm.
 * Keeps the same order as much as possible.
 *
 * @prop {() => void} removeZeroes
 * Mutates `this`
 *
 * @prop {(shortestFirst?: boolean) => void} sort
 * Makes sure minting policies are in correct order, and for each minting policy make sure the tokens are in the correct order
 * Mutates `this`
 *
 * **`shortestFirst`**
 *
 * If `shortestFirst` is `true`:
 * tokens are sorted in shortest-first order.
 *
 * The shortest-first order (also called "canonical order") is required by some hardware wallets when calculating the tx hash.
 * But the lexicographical order (i.e. alphabetical order independent of length) is used when evaluating a validator script.
 *
 * @prop {(other: Assets) => Assets} subtract
 * @prop {() => number[]} toCbor
 *
 * @prop {(isInScriptContext?: boolean) => MapData} toUplcData
 * Used when generating redeemers, datums or script contexts for running programs.
 *
 * **`isInScriptContext`**
 *
 * If `isInScriptContext` is `true`:
 * for each minting policy, tokens are sorted in strict lexicographical order instead of shortest-first order.
 *
 * The shortest-first order (also called "canonical order") is required by some hardware wallets when calculating the tx hash.
 * But the lexicographical order (i.e. alphabetical order independent of length) is used when evaluating a validator script.
 */

/**
 * @typedef {[
 *     BytesLike,
 *     IntLike
 * ][] | Record<string, IntLike>} TokensLike
 */

/**
 * @typedef {Assets | [
 *   MintingPolicyHashLike,
 *   TokensLike
 * ][] | [
 *   AssetClassLike,
 *   IntLike
 * ][] | Record<string, TokensLike | IntLike>} AssetsLike
 */

/**
 * TODO: which class implements this?
 * @typedef {object} NativeContext
 * @prop {(slot: number) => boolean} isAfter
 * @prop {(slot: number) => boolean} isBefore
 * @prop {(hash: PubKeyHash) => boolean} isSignedBy
 */

/**
 * @typedef {(
 *   SigScriptJsonSafe
 *   | AllScriptJsonSafe
 *   | AnyScriptJsonSafe
 *   | AtLeastScriptJsonSafe
 *   | AfterScriptJsonSafe
 *   | BeforeScriptJsonSafe
 * )} NativeScriptJsonSafe
 */

/**
 * @typedef {{
 *   type: "sig"
 *   keyHash: string
 * }} SigScriptJsonSafe
 */

/**
 * @typedef {{
 *   type: "all"
 *   scripts: NativeScriptJsonSafe[]
 * }} AllScriptJsonSafe
 */

/**
 * @typedef {{
 *   type: "any"
 *   scripts: NativeScriptJsonSafe[]
 * }} AnyScriptJsonSafe
 */

/**
 * @typedef {{
 *   type: "atLeast"
 *   required: number
 *   scripts: NativeScriptJsonSafe[]
 * }} AtLeastScriptJsonSafe
 */

/**
 * @typedef {{
 *   type: "after"
 *   slot: number
 * }} AfterScriptJsonSafe
 */

/**
 * @typedef {{
 *   type: "before"
 *   slot: number
 * }} BeforeScriptJsonSafe
 */

/**
 * @typedef {(
 *   SigScript
 *   | AllScript
 *   | AnyScript
 *   | AtLeastScript
 *   | AfterScript
 *   | BeforeScript
 * )} NativeScript
 */

/**
 * @typedef {object} SigScript
 * A NativeScript that validates a transaction if it signed by a given PubKeyHash
 *
 * @prop {"Sig"} kind
 * @prop {PubKeyHash} hash
 * @prop {(ctx: NativeContext) => boolean} eval
 * @prop {() => number[]} toCbor
 * @prop {() => SigScriptJsonSafe} toJsonSafe
 */

/**
 * @typedef {object} AllScript
 * A NativeScript that validates a transaction if all child NativeScripts validate it
 *
 * @prop {"All"} kind
 * @prop {NativeScript[]} scripts
 * @prop {(ctx: NativeContext) => boolean} eval
 * @prop {() => number[]} toCbor
 * @prop {() => AllScriptJsonSafe} toJsonSafe
 */

/**
 * @typedef {object} AnyScript
 * A NativeScript that validates a transaction if any child NativeScript validates it
 *
 * @prop {"Any"} kind
 * @prop {NativeScript[]} scripts
 * @prop {(ctx: NativeContext) => boolean} eval
 * @prop {() => number[]} toCbor
 * @prop {() => AnyScriptJsonSafe} toJsonSafe
 */

/**
 * @typedef {object} AtLeastScript
 * A NativeScript that validates a transaction if at least nRequired child NativeScripts validate it
 *
 * @prop {"AtLeast"} kind
 * @prop {number} nRequired
 * @prop {NativeScript[]} scripts
 * @prop {(ctx: NativeContext) => boolean} eval
 * @prop {() => number[]} toCbor
 * @prop {() => AtLeastScriptJsonSafe} toJsonSafe
 */

/**
 * @typedef {object} AfterScript
 * A NativeScript that validates a transaction if the current time range validity interval is after the given slot
 *
 * @prop {"After"} kind
 * @prop {number} slot
 * @prop {(ctx: NativeContext) => boolean} eval
 * @prop {() => number[]} toCbor
 * @prop {() => AfterScriptJsonSafe} toJsonSafe
 */

/**
 * @typedef {object} BeforeScript
 * A NativeScript that validates a transaction if the current time range validity interval is before the given slot
 *
 * @prop {"Before"} kind
 * @prop {number} slot
 * @prop {(ctx: NativeContext) => boolean} eval
 * @prop {() => number[]} toCbor
 * @prop {() => BeforeScriptJsonSafe} toJsonSafe
 */

/**
 * @typedef {object} DatumHash
 * Represents a blake2b-256 (32 bytes) hash of datum data.
 *
 * @prop {"DatumHash"} kind
 * @prop {number[]} bytes
 * @prop {() => string} dump
 * Alias for toHex()
 *
 * @prop {(other: DatumHash) => boolean} isEqual
 * @prop {() => number[]} toCbor
 * @prop {() => string} toHex
 *
 * @prop {() => string} toString
 * Alias for toHex()
 *
 * @prop {() => ByteArrayData} toUplcData
 */

/**
 * @typedef {DatumHash | BytesLike} DatumHashLike
 */

/**
 * @typedef {object} PubKeyHash
 * Represents a blake2b-224 (28 bytes) hash of a PubKey
 * **Note**: A `PubKeyHash` can also be used as the second part of a payment `Address`, or to construct a `StakeAddress`.
 *
 * @prop {"PubKeyHash"} kind
 * @prop {number[]} bytes
 * @prop {() => string} dump
 * @prop {(other: PubKeyHash) => boolean} isEqual
 * @prop {() => number[]} toCbor
 * @prop {() => string} toHex
 *
 * @prop {() => string} toString
 * Alias for toHex()
 *
 * @prop {() => ByteArrayData} toUplcData
 */

/**
 * @typedef {PubKeyHash | BytesLike} PubKeyHashLike
 */

/**
 * @typedef {{
 *   activeSlotsCoeff: number
 *   protocolParams: {
 *     protocolVersion: {
 *       minor: number
 *       major: number
 *     }
 *     decentralisationParam: number
 *     eMax: number
 *     extraEntropy: {
 *       tag: string
 *     }
 *     maxTxSize: number
 *     maxBlockBodySize: number
 *     maxBlockHeaderSize: number
 *     minFeeA: number
 *     minFeeB: number
 *     minUTxOValue: number
 *     poolDeposit: number
 *     minPoolCost: number
 *     keyDeposit: number
 *     nOpt: number
 *     rho: number
 *     tau: number
 *     a0: number
 *   }
 *   genDelegs: {
 *     [key: string]: {
 *       delegate: string
 *       vrf: string
 *     }
 *   }
 *   updateQuorum: number
 *   networkId: string
 *   initialFunds: {}
 *   maxLovelaceSupply: number
 *   networkMagic: number
 *   epochLength: number
 *   systemStart: string
 *   slotsPerKESPeriod: number
 *   slotLength: number
 *   maxKESEvolutions: number
 *   securityParam: number
 * }} ShelleyGenesisParams
 */

/**
 * @template [C=unknown]
 * @typedef {MintingPolicyHash<C> | StakingValidatorHash<C> | ValidatorHash<C>} ScriptHash
 */

/**
 * @template [C=unknown]
 * @typedef {object} MintingPolicyHash
 * Represents a blake2b-224 hash of a minting policy script.
 *
 * **Note**: to calculate this hash the script is first encoded as a CBOR byte-array and then prepended by a script version byte.
 *
 * `C` is some optional context:
 *   - `null`: unwitnessed or witnessed by NativeScript
 *   - `unknown`: witnessed or unwitnessed (default)
 *   - `{program: ..., redeemer: ...}`: witnessed by UplcProgram
 *
 * @prop {number[]} bytes
 * @prop {C} context
 * @prop {"MintingPolicyHash"} kind
 * @prop {(other: MintingPolicyHash) => boolean} isEqual
 * @prop {() => number[]} toCbor
 * @prop {() => string} toHex
 *
 * @prop {() => string} toString
 * Alias for toHex()
 *
 * @prop {() => ByteArrayData} toUplcData
 */

/**
 * @typedef {MintingPolicyHash | BytesLike} MintingPolicyHashLike
 */

/**
 * @template [C=unknown]
 * @typedef {object} StakingValidatorHash
 * Represents a blake2b-224 (28 bytes) hash of a staking validator script (first encoded as a CBOR byte-array and prepended by a script version byte).
 *
 * @prop {number[]} bytes
 * @prop {C} context
 * @prop {"StakingValidatorHash"} kind
 * @prop {(other: StakingValidatorHash) => boolean} isEqual
 * @prop {() => number[]} toCbor
 * @prop {() => string} toHex
 *
 * @prop {() => string} toString
 * Alias for toHex()
 *
 * @prop {() => ByteArrayData} toUplcData
 */

/**
 * @typedef {StakingValidatorHash | BytesLike} StakingValidatorHashLike
 */

/**
 * @template [C=unknown]
 * @typedef {object} ValidatorHash
 * Represents a blake2b-224 (28 bytes) hash of a spending validator script (first encoded as a CBOR byte-array and prepended by a script version byte).
 *
 * @prop {number[]} bytes
 * @prop {C} context
 * @prop {"ValidatorHash"} kind
 * @prop {(other: ValidatorHash) => boolean} isEqual
 * @prop {() => number[]} toCbor
 * @prop {() => string} toHex
 *
 * @prop {() => string} toString
 * Alias for toHex()
 *
 * @prop {() => ByteArrayData} toUplcData
 */

/**
 * @typedef {ValidatorHash | BytesLike} ValidatorHashLike
 */

/**
 * The raw JSON can be downloaded from the following CDN locations:
 *
 *  - Preview: [https://network-status.helios-lang.io/preview/config](https://network-status.helios-lang.io/preview/config)
 *  - Preprod: [https://network-status.helios-lang.io/preprod/config](https://network-status.helios-lang.io/preprod/config)
 *  - Mainnet: [https://network-status.helios-lang.io/mainnet/config](https://network-status.helios-lang.io/mainnet/config)
 *
 * These JSONs are updated every 15 minutes.
 *
 * Only include the minimum fields needed. flattened so it can be extended more easily
 *
 * NetworkParams are a summary of the Era-specific params, relevant for tx building and validation
 * @typedef {{
 *   txFeeFixed: number
 *   txFeePerByte: number
 *   exMemFeePerUnit: number
 *   exCpuFeePerUnit: number
 *   utxoDepositPerByte: number
 *   refScriptsFeePerByte: number
 *   collateralPercentage: number
 *   maxCollateralInputs: number
 *   maxTxExMem: number
 *   maxTxExCpu: number
 *   maxTxSize: number
 *   secondsPerSlot: number
 *   stakeAddrDeposit: number
 *   refTipSlot: number
 *   refTipTime: number
 *   costModelParamsV1: number[]
 *   costModelParamsV2: number[]
 *   costModelParamsV3: number[]
 * }} NetworkParams
 */

/**
 * @typedef {{
 *   collateralPercentage: number
 *   maxCollateralInputs: number
 *   maxValueSize: number
 * }} CommonAlonzoBabbageParams
 */

/**
 * @typedef {CommonAlonzoBabbageParams & {
 *   executionUnitPrices: {
 *     priceMemory: number
 *     priceSteps: number
 *   }
 *   maxBlockBodySize: number
 *   maxBlockExecutionUnits: {
 *     memory: number
 *     steps: number
 *   }
 *   maxBlockHeaderSize: number
 *   maxTxExecutionUnits: {
 *     memory: number
 *     steps: number
 *   }
 *   maxTxSize: number
 *   minPoolCost: number
 *   monetaryExpansion: number
 *   poolPledgeInfluence: number
 *   poolRetireMaxEpoch: number
 *   protocolVersion: {
 *     major: number
 *     minor: number
 *   }
 *   stakeAddressDeposit: number
 *   stakePoolDeposit: number
 *   stakePoolTargetNum: number
 *   treasuryCut: number
 *   txFeeFixed: number
 *   txFeePerByte: number
 *   utxoCostPerByte: number
 * }} CommonBabbageConwayParams
 */

/**
 * @typedef {CommonBabbageConwayParams & {
 *   costModels: {
 *     PlutusV1: number[]
 *     PlutusV2: number[]
 *   }
 * }} BabbageParams
 */

/**
 * @typedef {{
 *   poolVotingThresholds: {
 *     committeeNormal: number
 *     committeeNoConfidence: number
 *     hardForkInitiation: number
 *     motionNoConfidence: number
 *     ppSecurityGroup: number
 *   }
 *   dRepVotingThresholds: {
 *     motionNoConfidence: number
 *     committeeNormal: number
 *     committeeNoConfidence: number
 *     updateToConstitution: number
 *     hardForkInitiation: number
 *     ppNetworkGroup: number
 *     ppEconomicGroup: number
 *     ppTechnicalGroup: number
 *     ppGovGroup: number
 *     treasuryWithdrawal: number
 *   }
 *   committeeMinSize: number
 *   committeeMaxTermLength: number
 *   govActionLifetime: number
 *   govActionDeposit: number
 *   dRepDeposit: number
 *   dRepActivity: number
 *   minFeeRefScriptCostPerByte: number
 *   plutusV3CostModel: number[]
 *   constitution: {
 *     anchor: {
 *         dataHash: string
 *         url: string
 *     }
 *     script: string
 *   }
 *   committee: {
 *     members: Record<string, number>
 *     threshold: {
 *       numerator: number
 *       denominator: number
 *     }
 *   }
 * }} ConwayGenesisParams
 */

/**
 * @typedef {CommonBabbageConwayParams & {
 *   committeeMaxTermLength: number
 *   committeeMinSize: number
 *   costModels: {
 *     PlutusV1: number[]
 *     PlutusV2: number[]
 *     PlutusV3: number[]
 *   }
 *   dRepActivity: number
 *   dRepDeposit: number
 *   dRepVotingThresholds: {
 *     committeeNoConfidence: number
 *     committeeNormal: number
 *     hardForkInitiation: number
 *     motionNoConfidence: number
 *     ppEconomicGroup: number
 *     ppGovGroup: number
 *     ppNetworkGroup: number
 *     ppTechnicalGroup: number
 *     treasuryWithdrawal: number
 *     updateToConstitution: number
 *   }
 *   govActionDeposit: number
 *   govActionLifetime: number
 *   minFeeRefScriptCostPerByte: number
 *   poolVotingThresholds: {
 *     committeeNoConfidence: number
 *     committeeNormal: number
 *     hardForkInitiation: number
 *     motionNoConfidence: number
 *     ppSecurityGroup: number
 *   }
 * }} ConwayParams
 */

/**
 * @template {NetworkParams} [T=NetworkParams]
 * @typedef {object} NetworkParamsHelper
 * @prop {T} params
 * @prop {number[]} costModelParamsV1
 * @prop {number[]} costModelParamsV2
 * @prop {number[]} costModelParamsV3
 * @prop {[number, number]} txFeeParams
 * @prop {[number, number]} exFeeParams
 * @prop {number} refScriptsFeePerByte
 * @prop {number} lovelacePerUtxoByte
 * @prop {number} minCollateralPct
 * @prop {number} maxCollateralInputs
 * @prop {[number, number]} maxTxExecutionBudget
 *
 * @prop {bigint} maxTxFee
 * Tx balancing picks additional inputs by starting from maxTxFee.
 * This is done because the order of the inputs can have a huge impact on the tx fee, so the order must be known before balancing.
 * If there aren't enough inputs to cover the maxTxFee and the min deposits of newly created UTxOs, the balancing will fail.
 * TODO: make this private once we are in Conway era, because this should always take into account the cost of ref scripts
 *
 * @prop {number} maxTxSize
 * @prop {number} secondsPerSlot
 * @prop {bigint} stakeAddressDeposit
 * @prop {number} latestTipSlot
 * @prop {number} latestTipTime
 * @prop {(slot: IntLike) => number} slotToTime
 * @prop {(time: IntLike) => number} timeToSlot
 * @prop {(refScriptsSize: bigint) => bigint} calcMaxConwayTxFee
 */

/**
 * Implemented in @helios-lang/contract-utils
 * @template TStrict
 * @template TPermissive
 * @typedef {{
 *   toUplcData: (x: TPermissive | UplcData) => UplcData
 *   fromUplcData: (d: UplcData) => TStrict
 * }} UplcDataConverter
 */

/**
 * @typedef {object} TxId
 * @prop {"TxId"} kind
 * @prop {number[]} bytes
 * @prop {(other: TxId) => boolean} isEqual
 * @prop {() => number[]} toCbor
 * @prop {() => string} toHex
 * @prop {() => string} toString
 * Alias for toHex
 *
 * @prop {() => ConstrData} toUplcData
 */

/**
 * @typedef {TxId | BytesLike} TxIdLike
 */

/**
 * @typedef {object} TxOutputId
 * @prop {"TxOutputId"} kind
 * @prop {TxId} txId
 * @prop {number} index
 * @prop {(other: TxOutputId) => boolean} isEqual
 * @prop {() => number[]} toCbor
 * @prop {() => string} toString
 * @prop {() => ConstrData} toUplcData
 */

/**
 * @typedef {TxOutputId | string | [TxId | BytesLike, IntLike] | {txId: TxId | BytesLike, utxoIdx: IntLike}} TxOutputIdLike
 */

/**
 * @typedef {object} PoolMetadata
 * @prop {"PoolMetadata"} kind
 * @prop {string} url
 * @prop {() => number[]} toCbor
 */

/**
 * @typedef {object} SingleAddrPoolRelay
 * @prop {"SingleAddrPoolRelay"} kind
 * @prop {number} [port]
 * @prop {number[]} [ipv4]
 * @prop {number[]} [ipv6]
 * @prop {() => number[]} toCbor
 */

/**
 * @typedef {object} SingleNamePoolRelay
 * @prop {"SingleNamePoolRelay"} kind
 * @prop {number} [port]
 * @prop {string} record
 * @prop {() => number[]} toCbor
 */

/**
 * @typedef {object} MultiNamePoolRelay
 * @prop {"MultiNamePoolRelay"} kind
 * @prop {string} record
 * @prop {() => number[]} toCbor
 */

/**
 * @typedef {SingleAddrPoolRelay | SingleNamePoolRelay | MultiNamePoolRelay} PoolRelay
 */

/**
 * @typedef {object} PoolParameters
 * @prop {PubKeyHash} id
 * @prop {PubKeyHash} vrf
 * @prop {bigint} pledge
 * @prop {number} margin
 * @prop {StakingAddress} rewardAccount
 * @prop {PubKeyHash[]} owners
 * @prop {PoolRelay[]} relays
 * @prop {PoolMetadata | undefined} metadata
 * @prop {() => number[]} toCbor
 */

/**
 * @typedef {object} RegistrationDCert
 * @prop {"RegistrationDCert"} kind
 * @prop {StakingCredential} credential
 * @prop {0} tag
 * @prop {() => object} dump
 * @prop {() => number[]} toCbor
 * @prop {() => ConstrData} toUplcData
 */

/**
 * @typedef {object} DeregistrationDCert
 * @prop {"DeregistrationDCert"} kind
 * @prop {StakingCredential} credential
 * @prop {1} tag
 * @prop {() => object} dump
 * @prop {() => number[]} toCbor
 * @prop {() => ConstrData} toUplcData
 */

/**
 * @typedef {object} DelegationDCert
 * @prop {"DelegationDCert"} kind
 * @prop {StakingCredential} credential
 * @prop {PubKeyHash} poolId
 * @prop {2} tag
 * @prop {() => object} dump
 * @prop {() => number[]} toCbor
 * @prop {() => ConstrData} toUplcData
 */

/**
 * @typedef {object} RegisterPoolDCert
 * @prop {"RegisterPoolDCert"} kind
 * @prop {PoolParameters} parameters
 * @prop {3} tag
 * @prop {() => object} dump
 * @prop {() => number[]} toCbor
 * @prop {() => ConstrData} toUplcData
 */

/**
 * @typedef {object} RetirePoolDCert
 * @prop {"RetirePoolDCert"} kind
 * @prop {PubKeyHash} poolId
 * @prop {number} epoch
 * @prop {4} tag
 * @prop {() => object} dump
 * @prop {() => number[]} toCbor
 * @prop {() => ConstrData} toUplcData
 */

/**
 * @typedef {RegistrationDCert | DeregistrationDCert | DelegationDCert | RegisterPoolDCert | RetirePoolDCert} DCert
 */

/**
 * @typedef {object} MintingPurpose
 * @prop {"MintingPurpose"} kind
 * @prop {MintingPolicyHash} policy
 * @prop {() => ConstrData} toUplcData
 * @prop {(txData: UplcData) => UplcData} toScriptContextUplcData
 */

/**
 * @typedef {object} SpendingPurpose
 * @prop {"SpendingPurpose"} kind
 * @prop {TxOutputId} utxoId
 * @prop {() => ConstrData} toUplcData
 * @prop {(txData: UplcData) => UplcData} toScriptContextUplcData
 */

/**
 * @typedef {object} RewardingPurpose
 * @prop {"RewardingPurpose"} kind
 * @prop {StakingCredential} credential
 * @prop {() => ConstrData} toUplcData
 * @prop {(txData: UplcData) => UplcData} toScriptContextUplcData
 */

/**
 * @typedef {object} CertifyingPurpose
 * @prop {"CertifyingPurpose"} kind
 * @prop {DCert} dcert
 * @prop {() => ConstrData} toUplcData
 * @prop {(txData: UplcData) => UplcData} toScriptContextUplcData
 */

/**
 * @typedef {MintingPurpose | SpendingPurpose | RewardingPurpose | CertifyingPurpose} ScriptPurpose
 */

/**
 * @typedef {object} ScriptContextV2
 * @prop {"ScriptContextV2"} kind
 * @prop {TxInfo} txInfo
 * @prop {ScriptPurpose} purpose
 * @prop {() => UplcData} toUplcData
 */

/**
 * Most fields are optional to make it easier to create dummy ScriptContexts for unit testing
 * @typedef {{
 *   inputs: TxInput[]
 *   refInputs?: TxInput[]
 *   outputs: TxOutput[]
 *   fee?: IntLike
 *   minted?: Assets
 *   dcerts?: DCert[]
 *   withdrawals?: [StakingAddress, IntLike][]
 *   validityTimerange?: TimeRange
 *   signers?: PubKeyHash[]
 *   redeemers?: TxRedeemer[]
 *   datums?: UplcData[]
 *   id?: TxId
 * }} TxInfo
 */

/**
 * @template {SpendingCredential} [SC=SpendingCredential]
 * @typedef {object} TxInput
 * TxInput represents UTxOs that are available for spending
 *
 * @prop {"TxInput"} kind
 * @prop {TxOutputId} id
 * @prop {Address<SC>} address
 * @prop {Value} value
 * @prop {TxOutputDatum | undefined} datum
 *
 * @prop {TxOutput<SC>} output
 * Throws an error if the TxInput hasn't been recovered
 *
 * @prop {() => object} dump
 *
 * @prop {(network: {getUtxo(id: TxOutputId): Promise<TxInput>}) => Promise<void>} recover
 * The output itself isn't stored in the ledger, so must be recovered after deserializing blocks/transactions
 *
 * @prop {() => TxInput<SC>} copy
 * Deep copy of the TxInput so that Network interfaces don't allow accidental mutation of the underlying data
 *
 * @prop {(other: TxInput<any>) => boolean} isEqual
 *
 * @prop {(full?: boolean) => number[]} toCbor
 * Ledger format is without original output (so full = false)
 * full = true is however useful for complete deserialization of the TxInput (and then eg. using it in off-chain applications)
 *
 * @prop {() => ConstrData} toUplcData
 * Full representation (as used in ScriptContext)
 */

/**
 * Sadly the cbor encoding can be done in a variety of ways, for which a config must be passed around `toCbor()` calls
 *   - strictBabbage: if true -> slighly more verbose TxOutput encoding
 * @typedef {{
 *   strictBabbage?: boolean
 * }} TxOutputEncodingConfig
 */

/**
 * @template {SpendingCredential} [SC=SpendingCredential]
 * @typedef {object} TxOutput
 * Represents a transaction output that is used when building a transaction.
 *
 * @prop {"TxOutput"} kind
 * @prop {Address<SC>} address
 * @prop {Value} value
 * @prop {TxOutputDatum | undefined} datum
 * @prop {UplcProgramV1 | UplcProgramV2 | undefined} refScript
 * @prop {TxOutputEncodingConfig} encodingConfig
 *
 * @prop {() => TxOutput<SC>} copy
 * Deep copy of the TxOnput so that Network interfaces don't allow accidental mutation of the underlying data
 *
 * @prop {() => object} dump
 * @prop {() => number[]} toCbor
 * @prop {() => ConstrData} toUplcData
 * @prop {(params: NetworkParams) => bigint} calcDeposit
 * @prop {(params: NetworkParams, updater?: (output: TxOutput<SC>) => void) => void} correctLovelace
 */

/**
 * @typedef {object} InlineTxOutputDatum
 * @prop {"InlineTxOutputDatum"} kind
 * @prop {UplcData} data
 * @prop {DatumHash} hash
 * @prop {() => InlineTxOutputDatum} copy
 * @prop {() => object} dump
 * @prop {() => number[]} toCbor
 *
 * @prop {() => ConstrData} toUplcData
 * Used by script context emulation
 */

/**
 * @typedef {object} HashedTxOutputDatum
 * @prop {"HashedTxOutputDatum"} kind
 * @prop {UplcData | undefined} data
 * @prop {DatumHash} hash
 * @prop {() => HashedTxOutputDatum} copy
 * @prop {() => object} dump
 * @prop {() => number[]} toCbor
 *
 * @prop {() => ConstrData} toUplcData
 * Used by script context emulation
 */

/**
 * @typedef {InlineTxOutputDatum | HashedTxOutputDatum} TxOutputDatum
 */

/**
 * @typedef {(TxOutputDatum | undefined) | DatumHash | UplcData} TxOutputDatumLike
 */

/**
 * @template T
 * @typedef {{hash: T} | {inline: T}} TxOutputDatumCastable
 */

/**
 * TxMetadataAttr is a simple JSON schema object
 * @typedef {string | number | {
 *   list: TxMetadataAttr[]
 * } | {
 *   map: [TxMetadataAttr, TxMetadataAttr][]
 * }} TxMetadataAttr
 */

/**
 * @typedef {object} TxMetadata
 * @prop {"TxMetadata"} kind
 * @prop {{[key: number]: TxMetadataAttr}} attributes
 * @prop {number[]} keys
 * @prop {() => object} dump
 * @prop {() => number[]} hash
 * @prop {() => number[]} toCbor
 */

/**
 * @typedef {Object} RedeemerDetailsWithoutArgs
 * @property {string} summary - a short label indicating the part of the txn unlocked by the redeemer
 * @property {string} description - a more complete specifier of the redeemer
 * @property {UplcProgramV1 | UplcProgramV2} script - the UplcProgram validating the redeemer
 */

/**
 * @typedef {Object} RedeemerDetailsWithArgs
 * @property {string} summary - a short label indicating the part of the txn unlocked by the redeemer
 * @property {string} description - a more complete specifier of the redeemer
 * @property {UplcProgramV1 | UplcProgramV2} script - the UplcProgram validating the redeemer
 * @property {UplcDataValue[]} args - the arguments to the script, included if `txInfo` is provided
 */

/**
 * @typedef {object} TxMintingRedeemer
 * @prop {"TxMintingRedeemer"} kind
 * @prop {number} policyIndex
 * @prop {UplcData} data
 * @prop {Cost} cost
 *
 * @prop {number} tag
 * On-chain ConstrData tag
 *
 * @prop {(params: NetworkParams) => bigint} calcExFee
 *
 * @prop {() => object} dump
 *
 * @prop {(tx: Tx) => RedeemerDetailsWithoutArgs} getRedeemerDetailsWithoutArgs
 * Extracts script details for a specific redeemer on a transaction.
 *
 * @prop {(tx: Tx, txInfo: TxInfo) => RedeemerDetailsWithArgs} getRedeemerDetailsWithArgs
 * Extracts script-evaluation details for a specific redeemer from the transaction
 *
 * @prop {() => number[]} toCbor
 */

/**
 * @typedef {object} TxSpendingRedeemer
 * @prop {"TxSpendingRedeemer"} kind
 * @prop {number} inputIndex
 * @prop {UplcData} data
 * @prop {Cost} cost
 *
 * @prop {number} tag
 * On-chain ConstrData tag
 *
 * @prop {(params: NetworkParams) => bigint} calcExFee
 *
 * @prop {() => object} dump
 *
 * @prop {(tx: Tx) => RedeemerDetailsWithoutArgs} getRedeemerDetailsWithoutArgs
 * Extracts script details for a specific redeemer on a transaction.
 *
 * @prop {(tx: Tx, txInfo: TxInfo) => RedeemerDetailsWithArgs} getRedeemerDetailsWithArgs
 * Extracts script-evaluation details for a specific redeemer from the transaction
 *
 * @prop {() => number[]} toCbor
 */

/**
 * @typedef {object} TxRewardingRedeemer
 * @prop {"TxRewardingRedeemer"} kind
 *
 * @prop {number} withdrawalIndex
 * @prop {UplcData} data
 * @prop {Cost} cost
 * @prop {number} tag
 * On-chain ConstrData tag
 *
 * @prop {(params: NetworkParams) => bigint} calcExFee
 *
 * @prop {() => object} dump
 *
 * @prop {(tx: Tx) => RedeemerDetailsWithoutArgs} getRedeemerDetailsWithoutArgs
 * Extracts script details for a specific redeemer on a transaction.
 *
 * @prop {(tx: Tx, txInfo: TxInfo) => RedeemerDetailsWithArgs} getRedeemerDetailsWithArgs
 * Extracts script-evaluation details for a specific redeemer from the transaction
 *
 * @prop {() => number[]} toCbor
 */

/**
 * @typedef {object} TxCertifyingRedeemer
 * @prop {"TxCertifyingRedeemer"} kind
 * @prop {number} dcertIndex
 * @prop {UplcData} data
 * @prop {Cost} cost
 * @prop {number} tag
 * On-chain ConstrData tag
 *
 * @prop {(params: NetworkParams) => bigint} calcExFee
 *
 * @prop {() => object} dump
 *
 * @prop {(tx: Tx) => RedeemerDetailsWithoutArgs} getRedeemerDetailsWithoutArgs
 * Extracts script details for a specific redeemer on a transaction.
 *
 * @prop {(tx: Tx, txInfo: TxInfo) => RedeemerDetailsWithArgs} getRedeemerDetailsWithArgs
 * Extracts script-evaluation details for a specific redeemer from the transaction
 *
 * @prop {() => number[]} toCbor
 */

/**
 * @typedef {TxMintingRedeemer | TxSpendingRedeemer | TxRewardingRedeemer | TxCertifyingRedeemer} TxRedeemer
 */

/**
 * @typedef {object} Value
 * Represents a collection of tokens.
 *
 * @prop {"Value"} kind
 * @prop {bigint} lovelace
 * @prop {Assets} assets
 * @prop {AssetClass[]} assetClasses
 * @prop {(other: Value) => Value} add
 * @prop {() => Value} assertAllPositive
 * Throws an error if any of the `Value` entries is negative.
 * Used when building transactions because transactions can't contain negative values.
 *
 * @prop {() => Value} copy
 * Deep copy
 *
 * @prop {() => object} dump
 *
 * @prop {(other: Value) => boolean} isEqual
 * Checks if two `Value` instances are equal (`Assets` need to be in the same order).
 *
 * @prop {(other: Value) => boolean} isGreaterOrEqual
 * Checks if a `Value` instance is strictly greater or equal to another `Value` instance. Returns false if any asset is missing.
 *
 * @prop {(other: Value) => boolean} isGreaterThan
 * Checks if a `Value` instance is strictly greater than another `Value` instance. Returns false if any asset is missing.
 *
 * @prop {(scalar: IntLike) => Value} multiply
 * Multiplies a `Value` by a whole number.
 *
 * @prop {(other: Value) => Value} subtract
 * Substracts one `Value` instance from another. Returns a new `Value` instance.
 *
 * @prop {() => number[]} toCbor
 *
 * @prop {(isInScriptContext?: boolean) => MapData} toUplcData
 * Used when building datums, redeerms, or script contexts.
 *
 * **`isInScriptContext`**
 *
 * If `isInScriptContext` is `true`, the first entry in the returned map is always the lovelace entry.
 * If the `Value` doesn't contain any lovelace, a `0` lovelace entry is prepended.
 *
 * Also, the tokens of any minting policy in [`Value.assets`](#assets), are sorted in lexicographic order instead of shortest-first order.
 *
 * These changes are required to ensure validator script evaluation in Helios is identical to script evaluation in the reference node (and thus the same execution budget is obtained).
 */

/**
 * @typedef {Value | IntLike | [IntLike, AssetsLike] | {lovelace: IntLike, assets?: AssetsLike}} ValueLike
 */

/**
 * @template [C=unknown]
 * @typedef {object} TokenValue
 * Single asset class value (quantity can be more than 1)
 * For this special case we can preserve the context
 *
 * @prop {AssetClass<C>} assetClass
 * @prop {bigint} quantity
 * @prop {Value} value
 *
 * @prop {(scalar: IntLike) => TokenValue<C>} multiply
 * Multiplies a `TokenValue` by a whole number.
 */

/**
 * Number representations are always milliseconds since 1970
 * @typedef {number | bigint | Date}  TimeLike
 */

/**
 * Default TimeRange includes both `start` and `end`.
 * @typedef {{
 *   excludeStart?: boolean
 *   excludeEnd?: boolean
 * }} TimeRangeOptions
 */

/**
 * @typedef {TimeRange | [TimeLike, TimeLike] | {
 *     start?: TimeLike
 *     excludeStart?: boolean
 *     end?: TimeLike
 *     excludeEnd?: boolean
 *   }} TimeRangeLike
 */

/**
 * @typedef {object} TimeRange
 * @prop {"TimeRange"} kind
 * @prop {number} start
 * @prop {boolean} includeStart
 * @prop {number} end
 * @prop {boolean} includeEnd
 * @prop {number | undefined} finiteStart
 * @prop {number | undefined} finiteEnd
 * @prop {() => string} toString
 * @prop {() => ConstrData} toUplcData
 */

/**
 * @template TDatumPermissive
 * @typedef {{
 *   datum: UplcDataConverter<any, TDatumPermissive>
 * }} DatumPaymentContext
 */

/**
 * @template TRedeemerStrict
 * @template TRedeemerPermissive
 * @typedef {{
 *   program: UplcProgramV1 | UplcProgramV2
 *   redeemer: UplcDataConverter<TRedeemerStrict, TRedeemerPermissive>
 * }} MintingContext
 */

/**
 * @template TDatumStrict
 * @template TDatumPermissive
 * @template TRedeemerStrict
 * @template TRedeemerPermissive
 * @typedef {DatumPaymentContext<TDatumPermissive> & {
 *   program: UplcProgramV1 | UplcProgramV2
 *   datum: UplcDataConverter<TDatumStrict, TDatumPermissive>
 *   redeemer: UplcDataConverter<TRedeemerStrict, TRedeemerPermissive>
 * }} SpendingContext
 */

/**
 * @template TRedeemerStrict
 * @template TRedeemerPermissive
 * @typedef {{
 *   program: UplcProgramV1 | UplcProgramV2
 *   redeemer: UplcDataConverter<TRedeemerStrict, TRedeemerPermissive>
 * }} StakingContext
 */

/**
 * @typedef {object} PubKey
 * @prop {"PubKey"} kind
 * @prop {number[]} bytes
 * @prop {() => string} dump
 * @prop {() => PubKeyHash} hash
 * @prop {() => boolean} isDummy
 * @prop {() => number[]} toCbor
 * @prop {() => string} toHex
 * @prop {() => string} toString
 * Alias for toHex()
 *
 * @prop {() => ByteArrayData} toUplcData
 */

/**
 * @typedef {PubKey | BytesLike} PubKeyLike
 */

/**
 * @typedef {object} Signature
 * Represents a Ed25519 signature.
 * Also contains a reference to the PubKey that did the signing.
 *
 * @prop {"Signature"} kind
 * @prop {PubKey} pubKey
 * @prop {number[]} bytes
 * @prop {PubKeyHash} pubKeyHash
 * @prop {() => object} dump
 * @prop {() => boolean} isDummy
 * @prop {() => number[]} toCbor
 *
 * @prop {(msg: number[]) => void} verify
 * Throws an error if incorrect
 */

/**
 * @typedef {object} TxBodyEncodingConfig
 * @prop {boolean} [inputsAsSet]
 * Defaults to true
 *
 * @prop {boolean} [dcertsAsSet]
 * Defaults to true
 *
 * @prop {boolean} [collateralInputsAsSet]
 * Defaults to true
 *
 * @prop {boolean} [signersAsSet]
 * Defaults to true
 *
 * @prop {boolean} [refInputsAsSet]
 * Defaults to true
 */

/**
 * @typedef {object} TxBody
 * Note: inputs, minted assets, and withdrawals need to be sorted in order to form a valid transaction
 *
 * @prop {"TxBody"} kind
 * @prop {TxBodyEncodingConfig} encodingConfig
 * @prop {TxInput[]} inputs
 * Optionally encoded as set.
 *
 * @prop {TxOutput[]} outputs
 * @prop {bigint} fee
 * @prop {number | undefined} firstValidSlot
 * @prop {number | undefined} lastValidSlot
 * @prop {DCert[]} dcerts
 * Optionally encoded as set.
 *
 * @prop {[StakingAddress, bigint][]} withdrawals
 * Withdrawals must be sorted by address
 * Stake rewarding redeemers must point to the sorted withdrawals
 *
 * @prop {Assets} minted
 * Internally the assets must be sorted by mintingpolicyhash
 * Minting redeemers must point to the sorted minted assets
 *
 * @prop {number[] | undefined} scriptDataHash
 * @prop {TxInput[]} collateral
 * Optionally encoded as set.
 * TODO: rename to `collateralInputs`
 *
 * @prop {PubKeyHash[]} signers
 * Optionally encoded as set.
 *
 * @prop {TxOutput| undefined} collateralReturn
 *
 * @prop {bigint} totalCollateral
 *
 * @prop {TxInput[]} refInputs
 * Optionally encoded as set.
 *
 * @prop {number[] | undefined} metadataHash
 *
 * @prop {ScriptHash[]} allScriptHashes
 * Used to validate if all the necessary scripts are included TxWitnesses (and that there are not redundant scripts)
 *
 * @prop {() => number} countUniqueSigners
 * Calculates the number of dummy signatures needed to get precisely the right tx size.
 *
 * @prop {() => object} dump
 * @prop {(params: NetworkParams) => TimeRange} getValidityTimeRange
 * @prop {(slot: IntLike) => boolean} isValidSlot
 * Used by (indirectly) by emulator to check if slot range is valid.
 * Note: firstValidSlot == lastValidSlot is allowed
 *
 * @prop {(network: {getUtxo: (id: TxOutputId) => Promise<TxInput>}) => Promise<void>} recover
 *  A serialized tx throws away input information
 * This must be refetched from the network if the tx needs to be analyzed
 * This must be done for the regular inputs because the datums are needed for correct budget calculation and min required signatures determination
 * This must be done for the reference inputs because they impact the budget calculation
 * This must be done for the collateral inputs as well, so that the minium required signatures can be determined correctly
 *
 * @prop {() => Value} sumInputValue
 *
 * @prop {() => Value} sumInputAndMintedValue
 * Throws error if any part of the sum is negative (i.e. more is burned than input)
 *
 * @prop {() => Assets} sumInputAndMintedAssets
 * Excludes lovelace
 *
 * @prop {() => Value} sumOutputValue
 *
 * @prop {() => Assets} sumOutputAssets
 * Excludes lovelace
 *
 * @prop {() => number[]} toCbor
 *
 * @prop {(params: NetworkParams, redeemers: TxRedeemer[], datums: UplcData[], txId: TxId) => TxInfo} toTxInfo
 * Returns the on-chain Tx representation
 *
 * @prop {() => void} sortOutputs
 * Not done in the same routine as sortInputs(), because balancing of assets happens after redeemer indices are set
 *
 * @prop {() => number[]} hash
 * The bytes that form the TxId
 */

/**
 * @typedef {object} TxWitnessesEncodingConfig
 * @prop {boolean} [signaturesAsSet]
 * Defaults to true
 *
 * @prop {boolean} [nativeScriptsAsSet]
 * Defaults to true
 *
 * @prop {boolean} [v1ScriptsAsSet]
 * Defaults to true
 *
 * @prop {boolean} [datumsAsSet]
 * Defaults to true
 *
 * @prop {boolean} [v2ScriptsAsSet]
 * Defaults to true
 *
 * @prop {boolean} [v3ScriptsAsSet]
 * Defaults to true
 *
 */

/**
 * @typedef {object} TxWitnesses
 * Represents the pubkey signatures, and datums/redeemers/scripts that are witnessing a transaction.
 *
 * @prop {"TxWitnesses"} kind
 * @prop {TxWitnessesEncodingConfig} encodingConfig
 * @prop {Signature[]} signatures
 * Optionally encoded as set
 *
 * @prop {UplcData[]} datums
 * Optionally encoded as set
 *
 * @prop {TxRedeemer[]} redeemers
 * @prop {NativeScript[]} nativeScripts
 * Optionally encoded as set
 *
 * @prop {UplcProgramV1[]} v1Scripts
 * Optionally encoded as set
 *
 * @prop {UplcProgramV2[]} v2Scripts
 * Optionally encoded as set
 *
 * @prop {UplcProgramV3[]} v3Scripts
 * Optionally encoded as set
 *
 * @prop {UplcProgramV2[]} v2RefScripts
 * @prop {(NativeScript | UplcProgram)[]} allScripts
 *
 * @prop {(n: number) => void} addDummySignatures
 * Used to calculate the correct min fee
 *
 * @prop {(signature: Signature) => void} addSignature
 * @prop {(params: NetworkParams) => bigint} calcExFee
 * @prop {() => number} countNonDummySignatures
 * @prop {() => object} dump
 * @prop {(hash: number[] | MintingPolicyHash | ValidatorHash | StakingValidatorHash) => (UplcProgramV1 | UplcProgramV2)} findUplcProgram
 * @prop {() => boolean} isSmart
 * @prop {(refScriptsInRefInputs: (UplcProgramV1 | UplcProgramV2)[]) => void} recover
 * @prop {(n: number) => void} removeDummySignatures
 * @prop {() => number[]} toCbor
 *
 * @prop {(bodyBytes: number[]) => void} verifySignatures
 * Throws error if some signatures are incorrect
 */

/**
 * @typedef {object} TxValidationOptions
 * @prop {boolean} [strict=false] can be left as false for inspecting general transactions. The TxBuilder always uses strict=true.
 * @prop {boolean} [verbose=false] provides more details of transaction-budget usage when the transaction is close to the limit
 * @prop {UplcLogger} [logOptions] hooks for script logging during transaction execution
 */

/**
 * @typedef {object} Tx
 * Represents a Cardano transaction. For transaction-building, see {@link TxBuilder} instead.
 *
 * @prop {"Tx"} kind
 * @prop {TxBody} body
 * @prop {TxWitnesses} witnesses
 * @prop {TxMetadata | undefined} metadata
 *
 * @prop {(forFeeCalculation?: boolean) => number} calcSize
 * Number of bytes of CBOR encoding of Tx
 * Is used for two things:
 *   - tx fee calculation
 *   - tx size validation
 *
 * @prop {(signature: Signature, verify?: boolean) => Tx} addSignature
 * Adds a signature created by a wallet. Only available after the transaction has been finalized.
 * Optionally verifies that the signature is correct (defaults to true)
 *
 * @prop {(signatures: Signature[], verify?: boolean) => Tx} addSignatures
 * Adds multiple signatures at once. Only available after the transaction has been finalized.
 * Optionally verifies each signature is correct (defaults to true)
 *
 * @prop {(params: NetworkParams, recalcMinBaseFee?: boolean) => bigint} calcMinCollateral
 * Returns a quantity in lovelace
 *
 * @prop {(params: NetworkParams) => bigint} calcMinFee
 * Returns a quantity in lovelace
 *
 * @prop {() => Tx} clearMetadata
 * Creates a new Tx without the metadata for client-side signing where the client can't know the metadata before tx-submission.
 *
 * @prop {() => object} dump
 * @prop {() => TxId} id
 * @prop {() => boolean} isSmart
 *
 * @prop {() => boolean} isValid
 * Indicates if the necessary signatures are present and valid
 *
 * @prop {string | UplcRuntimeError | false | undefined} hasValidationError
 * Indicates if a built transaction has passed all consistency checks.
 *   - `null` if the transaction hasn't been validated yet
 *   - `false` when the transaction is valid
 *   - a `string` with the error message if any validation check failed
 *   - a UplcRuntimeError in case of any UPLC script failure
 *
 * @prop {(slot: bigint) => boolean} isValidSlot
 * Used by emulator to check if tx is valid.
 *
 * @prop {(network: {getUtxo: (id: TxOutputId) => Promise<TxInput>}) => Promise<void>} recover
 * Restores input information after deserializing a CBOR-encoded transaction
 * A serialized tx throws away input information
 * This must be refetched from the network if the tx needs to be analyzed
 *
 * @prop {(forFeeCalculation?: boolean) => number[]} toCbor
 * Serializes a transaction.
 * Note: Babbage still follows Alonzo for the Tx size fee.
 *   According to https://github.com/IntersectMBO/cardano-ledger/blob/cardano-ledger-spec-2023-04-03/eras/alonzo/impl/src/Cardano/Ledger/Alonzo/Tx.hs#L316,
 *   the `isValid` field is omitted when calculating the size of the tx for fee calculation. This is to stay compatible with Mary (?why though, the txFeeFixed could've been changed instead?)
 *
 * @prop {(params: NetworkParams, options?: TxValidationOptions) => void} validate
 * Throws an error if the tx isn't valid
 * Checks that are performed:
 *   - size of tx <= params.maxTxSize
 *   - body.fee >= calculated min fee
 *   - value is conserved (minus what is burned, plus what is minted)
 *   - enough collateral if smart
 *   - no collateral if not smart
 *   - all necessary scripts are attached
 *   - no redundant scripts are attached (only checked if strict=true)
 *   - each redeemer must have enough ex budget
 *   - total ex budget can't exceed max tx ex budget for either mem or cpu
 *   - each output contains enough lovelace (minDeposit)
 *   - the assets in the output values are correctly sorted (only checked if strict=true, because only needed by some wallets)
 *   - inputs are in the correct order
 *   - ref inputs are in the correct order
 *   - minted assets are in the correct order
 *   - staking withdrawals are in the correct order
 *   - metadatahash corresponds to metadata
 *   - metadatahash is null if there isn't any metadata
 *   - script data hash is correct
 * Checks that aren't performed:
 *   - all necessary signatures are included (must done after tx has been signed)
 *   - validity time range, which can only be checked upon submission
 *
 * @prop {(params: NetworkParams, options?: TxValidationOptions) => Tx} validateUnsafe
 * Validates the transaction without throwing an error if it isn't valid
 * If the transaction doesn't validate, the tx's `validationError` will be set
 *
 * @prop {() => void} validateSignatures
 * Throws an error if all necessary signatures haven't yet been added
 * Separate from the other validation checks
 * If valid: this.valid is mutated to true
 */
