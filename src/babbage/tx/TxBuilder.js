import { bytesToHex, equalsBytes } from "@helios-lang/codec-utils"
import { None, expectSome, isNone } from "@helios-lang/type-utils"
import { UplcProgramV1, UplcProgramV2, UplcDataValue } from "@helios-lang/uplc"
import {
    MintingPolicyHash,
    PubKeyHash,
    ScriptHash,
    ValidatorHash
} from "../hashes/index.js"
import { Assets, AssetClass, Value } from "../money/index.js"
import { NativeScript } from "../native/index.js"
import { NetworkParamsHelper } from "../params/index.js"
import { timeToDate } from "../time/index.js"
import { Address } from "./Address.js"
import { DCert } from "./DCert.js"
import { StakingAddress } from "./StakingAddress.js"
import { Tx } from "./Tx.js"
import { TxInput } from "./TxInput.js"
import { TxMetadata } from "./TxMetadata.js"
import { TxOutput } from "./TxOutput.js"
import { TxOutputDatum } from "./TxOutputDatum.js"
import { TxRedeemer } from "./TxRedeemer.js"
import { config } from "./config.js"
import { TxBody } from "./TxBody.js"
import { TxId } from "./TxId.js"
import { ScriptPurpose } from "./ScriptPurpose.js"
import { encodeDefList, encodeInt, encodeMap } from "@helios-lang/cbor"
import { ListData } from "@helios-lang/uplc"
import { blake2b } from "@helios-lang/crypto"
import { TxWitnesses } from "./TxWitnesses.js"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 * @typedef {import("../hashes/index.js").MintingPolicyHashLike} MintingPolicyHashLike
 * @typedef {import("../money/index.js").AssetClassLike} AssetClassLike
 * @typedef {import("../money/index.js").ValueLike} ValueLike
 * @typedef {import("../params/index.js").NetworkParams} NetworkParams
 * @typedef {import("../time/index.js").TimeLike} TimeLike
 * @typedef {import("./Address.js").AddressLike} AddressLike
 * @typedef {import("./StakingAddress.js").StakingAddressLike} StakingAddressLike
 * @typedef {import("./TxMetadataAttr.js").TxMetadataAttr} TxMetadataAttr
 */

export class TxBuilder {
    /**
     * @private
     * @type {TxInput[]}
     */
    collateral

    /**
     * Unique datums
     * @private
     * @type {UplcData[]}
     */
    datums

    /**
     * @private
     * @type {DCert[]}
     */
    dcerts

    /**
     * @private
     * @type {TxInput[]}
     */
    inputs

    /**
     * @private
     * @type {{[key: number]: TxMetadataAttr}}
     */
    metadata

    /**
     * @private
     * @type {Assets}
     */
    mintedTokens

    /**
     * @private
     * @type {[MintingPolicyHash, UplcData][]}
     */
    mintingRedeemers

    /**
     * @private
     * @type {NativeScript[]}
     */
    nativeScripts

    /**
     * @private
     * @type {TxOutput[]}
     */
    outputs

    /**
     * @private
     * @type {TxInput[]}
     */
    refInputs

    /**
     * @private
     * @type {PubKeyHash[]}
     */
    signers

    /**
     * @private
     * @type {[TxInput, UplcData][]}
     */
    spendingRedeemers

    /**
     * Upon finalization the slot is calculated and stored in the body
     * bigint: slot, Date: regular time
     * @private
     * @type {Option<bigint | Date>}
     */
    validTo

    /**
     * Upon finalization the slot is calculated and stored in the body
     * bigint: slot, Date: regular time
     * @private
     * @type {Option<bigint | Date>}
     */
    validFrom

    /**
     * @private
     * @type {UplcProgramV1[]}
     */
    v1Scripts

    /**
     * @private
     * @type {UplcProgramV2[]}
     */
    v2RefScripts

    /**
     * @private
     * @type {UplcProgramV2[]}
     */
    v2Scripts

    /**
     * @private
     * @type {[StakingAddress, bigint][]}
     */
    withdrawals

    constructor() {
        this.reset()
    }

    /**
     * @param {{
     *   changeAddress: Address
     *   networkParams?: NetworkParams | NetworkParamsHelper
     *   spareUtxos?: TxInput[]
     * }} props
     * @returns {Tx}
     */
    build(props) {
        // extract arguments
        const changeAddress = props.changeAddress
        const networkParams = NetworkParamsHelper.fromAlikeOrDefault(
            props.networkParams
        )
        const spareUtxos = props.spareUtxos ?? []

        const { metadata, metadataHash } = this.buildMetadata()
        const { firstValidSlot, lastValidSlot } =
            this.buildValidityTimeRange(networkParams)

        // there is no check here to assure that there aren't any redundant scripts included, this is left up the validation of Tx itself

        // balance the non-ada assets, adding necessary change outputs
        this.balanceAssets(changeAddress)

        // balance collateral (if collateral wasn't already set manually)
        this.balanceCollateral(networkParams, changeAddress, spareUtxos.slice())

        // make sure that each output contains the necessary minimum amount of lovelace
        this.correctOutputs(networkParams)

        // balance the lovelace using maxTxFee as the fee
        const { changeOutput, fee } = this.balanceLovelace(
            networkParams,
            changeAddress,
            spareUtxos.slice()
        )

        // the final fee will never be higher than the current `fee`, so the inputs and outputs won't change, and we will get redeemers with the right indices
        // the scripts executed at this point will not see the correct txHash nor the correct fee
        const redeemers = this.buildRedeemers({
            networkParams,
            fee,
            firstValidSlot,
            lastValidSlot
        })

        const scriptDataHash = this.buildScriptDataHash(
            networkParams,
            redeemers
        )

        // TODO: correct the fee and the changeOutput

        return new Tx(
            new TxBody({
                inputs: this.inputs,
                outputs: this.outputs,
                refInputs: this.refInputs,
                collateral: this.collateral,
                collateralReturn: this.collateralReturn,
                minted: this.mintedTokens,
                withdrawals: this.withdrawals,
                fee,
                firstValidSlot,
                lastValidSlot,
                signers: this.signers,
                dcerts: this.dcerts,
                metadataHash,
                scriptDataHash
            }),
            new TxWitnesses({
                signatures: [],
                datums: this.datums,
                redeemers,
                nativeScripts: this.nativeScripts,
                v1Scripts: this.v1Scripts,
                v2Scripts: this.v2Scripts,
                v2RefScripts: this.v2RefScripts
            }),
            false,
            metadata
        )
    }

    reset() {
        this.collateral = []
        this.datums = []
        this.dcerts = []
        this.inputs = []
        this.metadata = {}
        this.mintedTokens = new Assets()
        this.mintingRedeemers = []
        this.nativeScripts = []
        this.outputs = []
        this.refInputs = []
        this.signers = []
        this.spendingRedeemers = []
        this.validTo = None
        this.validFrom = None
        this.v1Scripts = []
        this.v2RefScripts = []
        this.v2Scripts = []
        this.withdrawals = []
    }

    /**
     * @param {TxInput | TxInput[]} utxo
     * @returns {TxBuilder}
     */
    addCollateral(utxo) {
        if (Array.isArray(utxo)) {
            utxo.forEach((utxo) => this.addCollateral(utxo))
            return this
        } else {
            TxInput.append(this.collateral, utxo, true)
            return this
        }
    }

    /**
     * @param {DCert} dcert
     * @returns {TxBuilder}
     */
    addDCert(dcert) {
        this.dcerts.push(dcert)

        if (dcert.isDelegate() || dcert.isDeregister()) {
            const stakingHash = dcert.credential.expectStakingHash()

            if (stakingHash.isPubKey()) {
                this.addSigners(stakingHash.hash)
            }
        }

        return this
    }

    /**
     * @param {PubKeyHash[]} hash
     * @returns {TxBuilder}
     */
    addSigners(...hash) {
        hash.forEach((hash) => {
            if (!this.signers.some((prev) => prev.isEqual(hash))) {
                this.signers.push(hash)
            }
        })

        return this
    }

    /**
     * @param {NativeScript} script
     * @returns {TxBuilder}
     */
    attachNativeScript(script) {
        if (!this.hasNativeScript(script.hash())) {
            this.nativeScripts.push(script)
        }

        return this
    }

    /**
     * @param {UplcProgramV1 | UplcProgramV2} program
     */
    attachUplcProgram(program) {
        switch (program.plutusVersion) {
            case "PlutusScriptV1":
                this.addV1Script(program)
                break
            case "PlutusScriptV2":
                this.addV2Script(program)
                break
            default:
                throw new Error(`unhandled UplcProgram type`)
        }
    }

    /**
     * @overload
     * @param {AssetClassLike} assetClass
     * @param {bigint | number} quantity
     * @param {Option<UplcData>} redeemer - isn't required when minting from a Native script
     */

    /**
     * @template TRedeemer
     * @overload
     * @param {MintingPolicyHash<TRedeemer>} policy
     * @param {[ByteArrayLike, number | bigint][]} tokens
     * @param {TRedeemer} redeemer
     */

    /**
     * @overload
     * @param {MintingPolicyHashLike} policy
     * @param {[ByteArrayLike, number | bigint][]} tokens - list of pairs of [tokenName, quantity], tokenName can be list of bytes or hex-string
     * @param {Option<UplcData>} redeemer - isn't required when minting from a Native script
     */

    /**
     * Mint a list of tokens associated with a given `MintingPolicyHash`.
     * Throws an error if the given `MintingPolicyHash` was already used in a previous call to `mint()`.
     * The token names can either by a list of bytes or a hexadecimal string.
     *
     * Also throws an error if the redeemer is `null`, and the minting policy isn't a known `NativeScript`.
     *
     * @template TRedeemer
     * @param {[
     *   AssetClassLike, bigint | number, Option<UplcData>
     * ] | [
     *   MintingPolicyHash<TRedeemer>, [ByteArrayLike, number | bigint][], TRedeemer
     * ] | [
     *   MintingPolicyHashLike, [ByteArrayLike, number | bigint][], Option<UplcData>
     * ]} args
     * @returns {TxBuilder}
     */
    mint(...args) {
        // handle the overloads
        const [mph, tokens] = (() => {
            const tokens = args[1]
            if (typeof tokens == "bigint" || typeof tokens == "number") {
                const assetClass = AssetClass.fromAlike(
                    /** @type {AssetClassLike} */ (args[0])
                )
                return [
                    assetClass.mph,
                    [
                        /** @type {[number[], bigint | number]} */ ([
                            assetClass.tokenName,
                            tokens
                        ])
                    ]
                ]
            } else if (Array.isArray(tokens)) {
                return [
                    MintingPolicyHash.fromAlike(
                        /** @type {MintingPolicyHashLike} */ (args[0])
                    ),
                    tokens
                ]
            } else {
                throw new Error("invalid arguments")
            }
        })()

        const redeemer = mph.context ? (/** @type {MintingPolicyHash<any, any>} */ (mph)).context.redeemer.toUplcData(/** @type {TRedeemer} */ (args[2])) : /** @type {Option<UplcData>} */ (args[2])

        this.mintedTokens.addTokens(mph, tokens)

        if (redeemer) {
            if (this.hasNativeScript(mph.bytes)) {
                throw new Error(
                    "redeemer not required when minting using a native script (hint: omit the redeemer)"
                )
            }

            if (!this.hasUplcScript(mph.bytes)) {
                throw new Error(
                    "mint is witnessed by unknown script (hint: attach the script before calling TxBuilder.mint())"
                )
            }

            this.addMintingRedeemer(mph, redeemer)
        } else {
            if (!this.hasNativeScript(mph.bytes)) {
                throw new Error(
                    "no redeemer specified for minted tokens (hint: if this policy is a NativeScript, attach that script before calling TxBuilder.mint())"
                )
            }
        }

        return this
    }

    /**
     * @overload
     * @param {AddressLike} address
     * @param {ValueLike} value
     *
     * @overload
     * @param {AddressLike} address
     * @param {ValueLike} value
     * @param {Option<TxOutputDatum>} datum
     *
     * @overload
     * @param {TxOutput | TxOutput[]} output
     */

    /**
     * @param {[AddressLike, ValueLike] | [AddressLike, ValueLike, Option<TxOutputDatum>] | [TxOutput | TxOutput[]]} args
     * @returns {TxBuilder}
     */
    pay(...args) {
        // handle overloads
        const outputs = (() => {
            if (args.length == 1) {
                return args[0]
            } else if (args.length == 2) {
                return new TxOutput(args[0], args[1])
            } else if (args.length == 3) {
                return new TxOutput(args[0], args[1], args[2])
            } else {
                throw new Error("invalid arguments")
            }
        })()

        if (Array.isArray(outputs)) {
            outputs.forEach((output) => this.pay(output))
            return this
        }

        const output = outputs
        this.addOutput(output)

        return this
    }

    /**
     * Include a reference input
     * @param {TxInput[]} utxos
     * @returns {TxBuilder}
     */
    refer(...utxos) {
        utxos.forEach((utxo) => {
            this.addRefInput(utxo)

            const refScript = utxo.output.refScript

            if (refScript) {
                if (refScript instanceof UplcProgramV2) {
                    this.addV2RefScript(refScript)
                } else {
                    throw new Error(
                        "UplcProgramV1 ref scripts aren't yet handled"
                    )
                }
            }
        })

        return this
    }

    /**
     * @overload
     * @param {number} key
     * @param {TxMetadataAttr} value
     *
     * @overload
     * @param {{[key: number]: TxMetadataAttr}} attributes
     */

    /**
     * @param {[number, TxMetadataAttr] | [{[key: number]: TxMetadataAttr}]} args
     * @returns {TxBuilder}
     */
    setMetadata(...args) {
        if (args.length == 2) {
            const [key, value] = args
            this.metadata[key] = value
        } else {
            Object.entries(args[0]).forEach(([key, value]) =>
                this.setMetadata(Number(key), value)
            )
        }

        return this
    }

    /**
     * Add a UTxO instance as an input to the transaction being built.
     * Throws an error if the UTxO is locked at a script address but a redeemer isn't specified (unless the script is a known `NativeScript`).
     * @param {TxInput | TxInput[]} utxos
     * @param {Option<UplcData>} redeemer
     * @returns {TxBuilder}
     */
    spend(utxos, redeemer = None) {
        if (Array.isArray(utxos)) {
            utxos.forEach((utxo) => this.spend(utxo, redeemer))

            return this
        }

        const utxo = utxos

        const origOutput = utxo.output
        const paymentCredential = utxo.address.paymentCredential
        const datum = origOutput?.datum

        // add the input (also sorts the inputs)
        this.addInput(utxo)

        if (redeemer) {
            if (!paymentCredential.isValidator()) {
                throw new Error(
                    "input isn't locked by a script, (hint: omit the redeemer)"
                )
            }

            if (!this.hasUplcScript(paymentCredential.validatorHash.bytes)) {
                throw new Error(
                    "input is locked by an unknown script (hint: attach the script before calling TxBuilder.spend()"
                )
            }

            this.addSpendingRedeemer(utxo, redeemer)

            if (!datum) {
                throw new Error("expected non-null datum")
            }

            this.addDatum(datum.data)
        } else if (paymentCredential.isValidator()) {
            // redeemerless spending from a validator is only possible if it is a native script
            if (!this.hasNativeScript(paymentCredential.validatorHash.bytes)) {
                throw new Error(
                    "input is locked by a script, but redeemer isn't specified (hint: if this is a NativeScript, attach that script before calling TxBuiilder.spend())"
                )
            }
        }

        return this
    }

    /**
     * Set the start of the valid time range by specifying a slot.
     * @param {bigint | number} slot
     * @returns {TxBuilder}
     */
    validFromSlot(slot) {
        this.validFrom = BigInt(slot)

        return this
    }

    /**
     * Set the start of the valid time range by specifying a time.
     * @param {TimeLike} time
     * @returns {TxBuilder}
     */
    validFromTime(time) {
        this.validFrom = timeToDate(time)

        return this
    }

    /**
     * Set the end of the valid time range by specifying a slot.
     * @param {bigint | number} slot
     * @returns {TxBuilder}
     */
    validToSlot(slot) {
        this.validTo = BigInt(slot)

        return this
    }

    /**
     * Set the end of the valid time range by specifying a time.
     * @param {TimeLike} time
     * @returns {TxBuilder}
     */
    validToTime(time) {
        this.validTo = timeToDate(time)

        return this
    }

    /**
     * @param {StakingAddressLike} addr
     * @param {bigint | number} lovelace
     * @returns {TxBuilder}
     */
    withdraw(addr, lovelace) {
        const stakingAddress = StakingAddress.fromAlike(addr)

        /**
         * @type {[StakingAddress, bigint]}
         */
        const entry = [stakingAddress, BigInt(lovelace)]

        const i = this.withdrawals.findIndex(([prev]) =>
            prev.isEqual(stakingAddress)
        )

        if (i == -1) {
            this.withdrawals.push(entry)
        } else {
            // should we throw an error here instead?
            this.withdrawals[i] = entry
        }

        this.withdrawals.sort(([a], [b]) => StakingAddress.compare(a, b))

        return this
    }

    /**
     * Private methods
     */

    /**
     * Doesn't throw an error if already added before
     * @param {UplcData} data
     */
    addDatum(data) {
        if (!this.hasDatum(data)) {
            this.datums.push(data)
        }
    }

    /**
     * Sorts the inputs immediately upon adding
     * @private
     * @param {TxInput} input
     */
    addInput(input) {
        TxInput.append(this.inputs, input, true)
    }

    /**
     * Index is calculated later
     * @private
     * @param {MintingPolicyHashLike} policy
     * @param {UplcData} data
     */
    addMintingRedeemer(policy, data) {
        const mph = MintingPolicyHash.fromAlike(policy)

        if (this.hasMintingRedeemer(mph)) {
            throw new Error("redeemer already added")
        }

        this.mintingRedeemers.push([mph, data])
    }

    /**
     * Sorts that assets in the output if not already sorted (mutates `output`s) (needed by the Flint wallet)
     * Throws an error if any the value entries are non-positive
     * Throws an error if the output doesn't include a datum but is sent to a non-nativescript validator
     * @private
     * @param {TxOutput} output
     */
    addOutput(output) {
        output.value.assertAllPositive()

        const paymentCredential = output.address.paymentCredential

        if (
            isNone(output.datum) &&
            paymentCredential.isValidator() &&
            !this.hasNativeScript(paymentCredential.validatorHash.bytes)
        ) {
            throw new Error(
                "TxOutput must include datum when sending to validator which isn't a known NativeScript (hint: add the NativeScript to this transaction first)"
            )
        }

        // sort the tokens in the outputs, needed by the flint wallet
        output.value.assets.sort()

        this.outputs.push(output)
    }

    /**
     * @param {TxInput} utxo
     */
    addRefInput(utxo) {
        TxInput.append(this.refInputs, utxo, true)
    }

    /**
     * Index is calculated later
     * @private
     * @param {TxInput} utxo
     * @param {UplcData} data
     */
    addSpendingRedeemer(utxo, data) {
        if (this.hasSpendingRedeemer(utxo)) {
            throw new Error("redeemer already added")
        }

        this.spendingRedeemers.push([utxo, data])
    }

    /**
     * @private
     * @param {UplcProgramV1} script
     */
    addV1Script(script) {
        const h = script.hash()
        if (!this.v1Scripts.some((prev) => equalsBytes(prev.hash(), h))) {
            this.v1Scripts.push(script)
        }
    }

    /**
     * @private
     * @param {UplcProgramV2} script
     */
    addV2Script(script) {
        const h = script.hash()
        if (!this.v2Scripts.some((prev) => equalsBytes(prev.hash(), h))) {
            this.v2Scripts.push(script)
        }
    }

    /**
     * @private
     * @param {UplcProgramV2} script
     */
    addV2RefScript(script) {
        const h = script.hash()
        if (!this.v2RefScripts.some((prev) => equalsBytes(prev.hash(), h))) {
            this.v2RefScripts.push(script)
        }
    }

    /**
     * @private
     * @param {number[] | MintingPolicyHash | ValidatorHash} hash
     * @returns {UplcProgramV1 | UplcProgramV2}
     */
    getUplcScript(hash) {
        const bytes = Array.isArray(hash) ? hash : hash.bytes

        const v2Script = this.v2Scripts
            .concat(this.v2RefScripts)
            .find((s) => equalsBytes(s.hash(), bytes))

        if (v2Script) {
            return v2Script
        }

        const v1Script = this.v1Scripts.find((s) =>
            equalsBytes(s.hash(), bytes)
        )

        if (v1Script) {
            return v1Script
        }

        if (hash instanceof MintingPolicyHash) {
            throw new Error(
                `script for minting policy ${hash.toHex()} not found`
            )
        } else if (hash instanceof ValidatorHash) {
            throw new Error(`script for validator ${hash.toHex()} not found`)
        } else {
            throw new Error(`script for ${bytesToHex(hash)} not found`)
        }
    }

    /**
     * @param {UplcData} data
     * @returns {boolean}
     */
    hasDatum(data) {
        return this.datums.some((prev) => prev.isEqual(data))
    }

    /**
     * @returns {boolean}
     */
    hasMetadata() {
        return Object.keys(this.metadata).length > 0
    }

    /**
     * @private
     * @param {MintingPolicyHash} mph
     * @returns {boolean}
     */
    hasMintingRedeemer(mph) {
        return this.mintingRedeemers.some(([prev]) => prev.isEqual(mph))
    }

    /**
     * @private
     * @param {number[]} hash
     * @returns {boolean}
     */
    hasNativeScript(hash) {
        return this.nativeScripts.some((s) => equalsBytes(s.hash(), hash))
    }

    /**
     * @returns {boolean}
     */
    hasUplcScripts() {
        return (
            this.v1Scripts.length > 0 ||
            this.v2Scripts.length > 0 ||
            this.v2RefScripts.length > 0
        )
    }

    /**
     * @private
     * @param {number[]} hash
     * @returns {boolean}
     */
    hasUplcScript(hash) {
        return (
            this.hasV1Script(hash) ||
            this.hasV2RefScript(hash) ||
            this.hasV2Script(hash)
        )
    }

    /**
     * @private
     * @param {number[]} hash
     * @returns {boolean}
     */
    hasV1Script(hash) {
        return this.v1Scripts.some((s) => equalsBytes(s.hash(), hash))
    }

    /**
     * @private
     * @param {number[]} hash
     * @returns {boolean}
     */
    hasV2RefScript(hash) {
        return this.v2RefScripts.some((s) => equalsBytes(s.hash(), hash))
    }

    /**
     * @private
     * @param {number[]} hash
     * @returns {boolean}
     */
    hasV2Script(hash) {
        return this.v2Scripts.some((s) => equalsBytes(s.hash(), hash))
    }

    /**
     * @private
     * @param {number[]} hash
     * @returns {boolean}
     */
    hasScript(hash) {
        return (
            this.hasNativeScript(hash) ||
            this.hasV1Script(hash) ||
            this.hasV2RefScript(hash) ||
            this.hasV2Script(hash)
        )
    }

    /**
     * @private
     * @param {TxInput} utxo
     * @returns {boolean}
     */
    hasSpendingRedeemer(utxo) {
        return this.spendingRedeemers.some(([prev]) => prev.isEqual(utxo))
    }

    /**
     * @private
     * @returns {Value}
     */
    sumInputValue() {
        return this.inputs.reduce(
            (prev, input) => prev.add(input.value),
            new Value()
        )
    }

    /**
     * Throws error if any part of the sum is negative (i.e. more is burned than input)
     * @private
     * @returns {Value}
     */
    sumInputAndMintedValue() {
        return this.sumInputValue()
            .add(new Value(0n, this.mintedTokens))
            .assertAllPositive()
    }

    /**
     * Excludes lovelace
     * @returns {Assets}
     */
    sumInputAndMintedAssets() {
        return this.sumInputAndMintedValue().assets
    }

    /**
     * @returns {Value}
     */
    sumOutputValue() {
        return this.outputs.reduce(
            (prev, output) => prev.add(output.value),
            new Value()
        )
    }

    /**
     * Excludes lovelace
     * @returns {Assets}
     */
    sumOutputAssets() {
        return this.sumOutputValue().assets
    }

    /**
     * Private builder methods
     */

    /**
     * @private
     * @param {Address} changeAddress
     */
    balanceAssets(changeAddress) {
        if (changeAddress.paymentCredential.isValidator()) {
            throw new Error("can't send change to validator")
        }

        const inputAssets = this.sumInputAndMintedAssets()

        const outputAssets = this.sumOutputAssets()

        if (inputAssets.isEqual(outputAssets)) {
            return
        } else if (outputAssets.isGreaterThan(inputAssets)) {
            throw new Error("not enough input assets")
        } else {
            const diff = inputAssets.subtract(outputAssets)

            if (config.MAX_ASSETS_PER_CHANGE_OUTPUT) {
                const maxAssetsPerOutput = config.MAX_ASSETS_PER_CHANGE_OUTPUT

                let changeAssets = new Assets()
                let tokensAdded = 0

                diff.getPolicies().forEach((mph) => {
                    const tokens = diff.getPolicyTokens(mph)
                    tokens.forEach(([token, quantity], i) => {
                        changeAssets.addComponent(mph, token, quantity)
                        tokensAdded += 1
                        if (tokensAdded == maxAssetsPerOutput) {
                            this.addOutput(
                                new TxOutput(
                                    changeAddress,
                                    new Value(0n, changeAssets)
                                )
                            )
                            changeAssets = new Assets()
                            tokensAdded = 0
                        }
                    })
                })

                // If we are here and have No assets, they we're done
                if (!changeAssets.isZero()) {
                    this.addOutput(
                        new TxOutput(changeAddress, new Value(0n, changeAssets))
                    )
                }
            } else {
                const changeOutput = new TxOutput(
                    changeAddress,
                    new Value(0n, diff)
                )

                this.addOutput(changeOutput)
            }
        }
    }

    /**
     * @private
     * @param {NetworkParamsHelper} networkParams
     * @param {Address} changeAddress
     * @param {TxInput[]} spareUtxos
     */
    balanceCollateral(networkParams, changeAddress, spareUtxos) {
        // don't do this step if collateral was already added explicitly
        if (this.collateral.length > 0 || !this.hasUplcScripts()) {
            return
        }

        // simply use the maxTxFee for now (only about 2.4ADA)
        const baseFee = networkParams.maxTxFee

        const minCollateral =
            (baseFee * BigInt(networkParams.minCollateralPct) + 100n) / 100n // integer division that rounds up

        let collateral = 0n
        /**
         * @type {TxInput[]}
         */
        const collateralInputs = []

        /**
         * @param {TxInput[]} inputs
         */
        function addCollateralInputs(inputs) {
            // first try using the UTxOs that already form the inputs, but are locked at script
            const cleanInputs = inputs
                .filter(
                    (utxo) =>
                        !utxo.address.validatorHash &&
                        utxo.value.assets.isZero()
                )
                .sort((a, b) => Number(a.value.lovelace - b.value.lovelace))

            for (let input of cleanInputs) {
                if (collateral > minCollateral) {
                    break
                }

                while (
                    collateralInputs.length >= networkParams.maxCollateralInputs
                ) {
                    collateralInputs.shift()
                }

                collateralInputs.push(input)
                collateral += input.value.lovelace
            }
        }

        addCollateralInputs(this.inputs.slice())
        addCollateralInputs(spareUtxos.map((utxo) => utxo))

        // create the collateral return output if there is enough lovelace
        const changeOutput = new TxOutput(changeAddress, new Value(0n))
        changeOutput.correctLovelace(networkParams)

        if (collateral < minCollateral) {
            throw new Error("unable to find enough collateral input")
        } else {
            if (collateral > minCollateral + changeOutput.value.lovelace) {
                changeOutput.value = new Value(0n)

                changeOutput.correctLovelace(networkParams)

                if (collateral > minCollateral + changeOutput.value.lovelace) {
                    changeOutput.value = new Value(collateral - minCollateral)
                    this.collateralReturn = changeOutput
                } else {
                    console.log(
                        `not setting collateral return: collateral input too low (${collateral})`
                    )
                }
            }
        }

        collateralInputs.forEach((utxo) => {
            this.addCollateral(utxo)
        })
    }

    /**
     * Calculates fee and balances transaction by sending an output back to changeAddress.
     * Assumes the changeOutput is always needed.
     * Sets the fee to the max possible tx fee (will be lowered later)
     * Throws error if transaction can't be balanced.
     * Shouldn't be used directly
     * @private
     * @param {NetworkParamsHelper} networkParams
     * @param {Address} changeAddress
     * @param {TxInput[]} spareUtxos - used when there are yet enough inputs to cover everything (eg. due to min output lovelace requirements, or fees)
     * @returns {{changeOutput: TxOutput, fee: bigint}}
     */
    balanceLovelace(networkParams, changeAddress, spareUtxos) {
        // don't include the changeOutput in this value
        let nonChangeOutputValue = this.sumOutputValue()

        // assume a change output is always needed
        const changeOutput = new TxOutput(changeAddress, new Value(0n))

        changeOutput.correctLovelace(networkParams)

        this.addOutput(changeOutput)

        const minLovelace = changeOutput.value.lovelace

        let fee = networkParams.maxTxFee
        let inputValue = this.sumInputAndMintedValue()
        let feeValue = new Value(fee)

        nonChangeOutputValue = feeValue.add(nonChangeOutputValue)

        // stake certificates
        const stakeAddrDeposit = new Value(networkParams.stakeAddressDeposit)
        this.dcerts.forEach((dcert) => {
            if (dcert.isRegister()) {
                // in case of stake registrations, count stake key deposits as additional output ADA
                nonChangeOutputValue =
                    nonChangeOutputValue.add(stakeAddrDeposit)
            } else if (dcert.isDeregister()) {
                // in case of stake de-registrations, count stake key deposits as additional input ADA
                inputValue = inputValue.add(stakeAddrDeposit)
            }
        })

        // this is quite restrictive, but we really don't want to touch UTxOs containing assets just for balancing purposes
        const spareAssetUTxOs = spareUtxos.some(
            (utxo) => !utxo.value.assets.isZero()
        )
        spareUtxos = spareUtxos.filter((utxo) => utxo.value.assets.isZero())

        // use some spareUtxos if the inputValue doesn't cover the outputs and fees
        const totalOutputValue = nonChangeOutputValue.add(changeOutput.value)
        while (!inputValue.isGreaterOrEqual(totalOutputValue)) {
            let spare = spareUtxos.pop()

            if (spare === undefined) {
                if (spareAssetUTxOs) {
                    throw new Error(`UTxOs too fragmented`)
                } else {
                    throw new Error(
                        `need ${totalOutputValue.lovelace} lovelace, but only have ${inputValue.lovelace}`
                    )
                }
            } else {
                this.addInput(spare)

                inputValue = inputValue.add(spare.value)
            }
        }

        // use to the exact diff, which is >= minLovelace
        const diff = inputValue.subtract(nonChangeOutputValue)

        if (!diff.assets.isZero()) {
            throw new Error("unexpected unbalanced assets")
        }

        if (diff.lovelace < minLovelace) {
            throw new Error(
                `diff.lovelace=${diff.lovelace} ${typeof diff.lovelace} vs minLovelace=${minLovelace} ${typeof minLovelace}`
            )
        }

        changeOutput.value = diff

        // we can mutate the lovelace value of 'changeOutput' until we have a balanced transaction with precisely the right fee

        return { changeOutput, fee }
    }

    /**
     * @private
     * @returns {{
     *   metadata: Option<TxMetadata>, metadataHash: Option<number[]>
     * }}
     */
    buildMetadata() {
        if (this.hasMetadata()) {
            const metadata = new TxMetadata(this.metadata)
            const metadataHash = metadata.hash()

            return { metadata, metadataHash }
        } else {
            return { metadata: None, metadataHash: None }
        }
    }

    /**
     * Redeemers are returned sorted: first the minting redeemers then the spending redeemers
     * (I'm not sure if the sorting is actually necessary)
     * TODO: return profiling information?
     * @private
     * @param {{
     *   fee: bigint
     *   networkParams: NetworkParamsHelper
     *   firstValidSlot: Option<bigint>
     *   lastValidSlot: Option<bigint>
     * }} execContext
     * @returns {TxRedeemer[]}
     */
    buildRedeemers(execContext) {
        const dummyRedeemers = this.buildMintingRedeemers().concat(
            this.buildSpendingRedeemers()
        )

        // we have all the information to create a dummy tx
        const dummyTx = this.buildDummyTxBody(
            execContext.fee,
            execContext.firstValidSlot,
            execContext.lastValidSlot
        )

        const txData = dummyTx.toTxUplcData(
            execContext.networkParams,
            dummyRedeemers,
            this.datums,
            TxId.dummy()
        )

        // rebuild the redeemers now that we can generate the correct ScriptContext
        const redeemers = this.buildMintingRedeemers({ txData }).concat(
            this.buildSpendingRedeemers({ txData })
        )

        return redeemers
    }

    /**
     * @private
     * @param {bigint} fee
     * @param {Option<bigint>} firstValidSlot
     * @param {Option<bigint>} lastValidSlot
     * @returns {TxBody}
     */
    buildDummyTxBody(fee, firstValidSlot, lastValidSlot) {
        return new TxBody({
            inputs: this.inputs,
            outputs: this.outputs,
            refInputs: this.refInputs,
            fee,
            firstValidSlot,
            lastValidSlot,
            signers: this.signers,
            dcerts: this.dcerts,
            withdrawals: this.withdrawals,
            minted: this.mintedTokens
        })
    }

    /**
     * @typedef {{
     *   txData: UplcData
     * }} RedeemerExecContext
     */

    /**
     * The execution itself might depend on the redeemers, so we must also be able to return the redeemers without any execution first
     * @private
     * @param {Option<RedeemerExecContext>} execContext - execution and budget calculation is only performed when this is set
     * @returns {TxRedeemer[]}
     */
    buildMintingRedeemers(execContext = None) {
        return this.mintingRedeemers.map(([mph, data]) => {
            const i = this.mintedTokens
                .getPolicies()
                .findIndex((mph_) => mph_.isEqual(mph))
            let redeemer = TxRedeemer.Minting(i, data)
            const script = this.getUplcScript(mph)

            if (execContext) {
                const purpose = ScriptPurpose.Minting(redeemer, mph)
                const scriptContext = purpose.toScriptContextUplcData(
                    execContext.txData
                )
                const args = [redeemer.data, scriptContext]

                const profile = script.eval(
                    args.map((a) => new UplcDataValue(a))
                )

                redeemer = TxRedeemer.Minting(i, data, profile.cost)
            }

            return redeemer
        })
    }

    /**
     * @private
     * @param {Option<RedeemerExecContext>} execContext - execution and budget calculation is only performed when this is set
     * @returns {TxRedeemer[]}
     */
    buildSpendingRedeemers(execContext = None) {
        return this.spendingRedeemers.map(([utxo, data]) => {
            const vh = expectSome(utxo.address.validatorHash)
            const i = this.inputs.findIndex((inp) => inp.isEqual(utxo))
            let redeemer = TxRedeemer.Spending(i, data)

            const script = this.getUplcScript(vh)

            if (execContext) {
                const datum = expectSome(utxo.datum?.data)
                const purpose = ScriptPurpose.Spending(redeemer, utxo.id)
                const scriptContext = purpose.toScriptContextUplcData(
                    execContext.txData
                )

                const args = [datum, data, scriptContext]

                const profile = script.eval(
                    args.map((a) => new UplcDataValue(a))
                )

                redeemer = TxRedeemer.Spending(i, data, profile.cost)
            }

            return redeemer
        })
    }

    /**
     * @private
     * @param {NetworkParamsHelper} networkParams
     * @param {TxRedeemer[]} redeemers
     * @returns {Option<number[]>} - returns null if there are no redeemers
     */
    buildScriptDataHash(networkParams, redeemers) {
        if (redeemers.length > 0) {
            let bytes = encodeDefList(redeemers)

            if (this.datums.length > 0) {
                bytes = bytes.concat(new ListData(this.datums).toCbor())
            }

            // language view encodings?
            let sortedCostParams = networkParams.sortedV2CostParams

            bytes = bytes.concat(
                encodeMap([
                    [
                        encodeInt(1),
                        encodeDefList(
                            sortedCostParams.map((cp) => encodeInt(BigInt(cp)))
                        )
                    ]
                ])
            )

            return blake2b(bytes)
        } else {
            return None
        }
    }

    /**
     * @private
     * @param {NetworkParamsHelper} networkParams
     * @returns {{
     *   firstValidSlot: Option<bigint>
     *   lastValidSlot: Option<bigint>
     * }}
     */
    buildValidityTimeRange(networkParams) {
        /**
         * @param {bigint | Date} slotOrTime
         */
        function slotOrTimeToSlot(slotOrTime) {
            if (slotOrTime instanceof Date) {
                return networkParams.timeToSlot(slotOrTime.getTime())
            } else {
                return slotOrTime
            }
        }

        return {
            firstValidSlot: this.validFrom
                ? slotOrTimeToSlot(this.validFrom)
                : None,
            lastValidSlot: this.validTo ? slotOrTimeToSlot(this.validTo) : None
        }
    }

    /**
     * Makes sure each output contains the necessary min lovelace.
     * @private
     * @param {NetworkParamsHelper} networkParams
     */
    correctOutputs(networkParams) {
        this.outputs.forEach((output) => output.correctLovelace(networkParams))
    }
}
