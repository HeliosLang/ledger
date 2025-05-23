import {
    decodeBytes,
    decodeInt,
    decodeList,
    decodeMap,
    decodeObjectIKey,
    decodeSet,
    encodeBytes,
    encodeDefList,
    encodeInt,
    encodeMap,
    encodeObjectIKey,
    encodeSet,
    isSet
} from "@helios-lang/cbor"
import { bytesToHex, toInt } from "@helios-lang/codec-utils"
import { blake2b } from "@helios-lang/crypto"
import { expectDefined } from "@helios-lang/type-utils"
import { decodeStakingAddress } from "../address/index.js"
import { decodePubKeyHash } from "../hashes/index.js"
import { decodeAssets, makeAssets, makeValue } from "../money/index.js"
import { makeNetworkParamsHelper } from "../params/index.js"
import { makeTimeRange } from "../time/index.js"
import { decodeDCert } from "./DCert.js"
import { decodeTxInput } from "./TxInput.js"
import { decodeTxOutput } from "./TxOutput.js"

/**
 * @import { BytesLike, IntLike } from "@helios-lang/codec-utils"
 * @import { UplcData } from "@helios-lang/uplc"
 * @import { Assets, DCert, NetworkParams, PubKeyHash, ScriptHash, StakingAddress, TimeRange, TxBody, TxBodyEncodingConfig, TxId, TxInfo, TxInput, TxOutput, TxOutputId, TxRedeemer, Value } from "../index.js"
 */

/**
 * @typedef {{
 *   encodingConfig?: TxBodyEncodingConfig
 *   inputs: TxInput[]
 *   outputs: TxOutput[]
 *   fee: bigint
 *   firstValidSlot?: number
 *   lastValidSlot?: number
 *   dcerts: DCert[]
 *   withdrawals: [StakingAddress, bigint][]
 *   minted: Assets
 *   scriptDataHash?: number[]
 *   collateral?: TxInput[]
 *   signers: PubKeyHash[]
 *   collateralReturn?: TxOutput
 *   totalCollateral?: bigint
 *   refInputs: TxInput[]
 *   metadataHash?: number[]
 * }} TxBodyProps
 */

/**
 * @param {object} props
 * @param {TxBodyEncodingConfig} [props.encodingConfig]
 * @param {TxInput[]} props.inputs
 * @param {TxOutput[]} props.outputs
 * @param {bigint} props.fee
 * @param {number} [props.firstValidSlot]
 * @param {number} [props.lastValidSlot]
 * @param {DCert[]} props.dcerts
 * @param {[StakingAddress, bigint][]} props.withdrawals
 * @param {Assets} props.minted
 * @param {number[]} [props.scriptDataHash]
 * @param {TxInput[]} [props.collateral]
 * @param {PubKeyHash[]} props.signers
 * @param {TxOutput} [props.collateralReturn]
 * @param {bigint} [props.totalCollateral]
 * @param {TxInput[]} props.refInputs
 * @param {number[]} [props.metadataHash]
 * @returns {TxBody}
 */
export function makeTxBody(props) {
    return new TxBodyImpl(props)
}

/**
 * @param {BytesLike} bytes
 * @returns {TxBody}
 */
export function decodeTxBody(bytes) {
    let inputsEncodedAsSet = false
    let dcertsEncodedAsSet = false
    let collateralInputsEncodedAsSet = false
    let signersEncodedAsSet = false
    let refInputsEncodedAsSet = false

    const {
        0: inputs,
        1: outputs,
        2: fee,
        3: lastValidSlot,
        4: dcerts,
        5: withdrawals,
        7: metadataHash,
        8: firstValidSlot,
        9: minted,
        11: scriptDataHash,
        13: collateralInputs,
        14: signers,
        15: _networkId,
        16: collateralReturn,
        17: totalCollateral,
        18: refInputs
    } = decodeObjectIKey(bytes, {
        0: (s) => {
            inputsEncodedAsSet = isSet(s)
            return decodeSet(s, decodeTxInput)
        },
        1: (s) => decodeList(s, decodeTxOutput),
        2: decodeInt,
        3: decodeInt,
        4: (s) => {
            dcertsEncodedAsSet = isSet(s)
            return decodeSet(s, decodeDCert)
        },
        5: (s) => decodeMap(s, decodeStakingAddress, decodeInt),
        7: decodeBytes,
        8: decodeInt,
        9: decodeAssets,
        11: decodeBytes,
        13: (s) => {
            collateralInputsEncodedAsSet = isSet(s)
            return decodeSet(s, decodeTxInput)
        },
        14: (s) => {
            signersEncodedAsSet = isSet(s)
            return decodeSet(s, decodePubKeyHash)
        },
        15: decodeInt,
        16: decodeTxOutput,
        17: decodeInt,
        18: (s) => {
            refInputsEncodedAsSet = isSet(s)
            return decodeSet(s, decodeTxInput)
        }
    })

    return new TxBodyImpl({
        encodingConfig: {
            inputsAsSet: inputsEncodedAsSet,
            dcertsAsSet: dcertsEncodedAsSet,
            collateralInputsAsSet: collateralInputsEncodedAsSet,
            signersAsSet: signersEncodedAsSet,
            refInputsAsSet: refInputsEncodedAsSet
        },
        inputs: expectDefined(inputs, "inputs undefined in decodeTxBody()"),
        outputs: expectDefined(outputs, "outputs undefined in decodeTxBody()"),
        fee: expectDefined(fee, "fee undefined in decodeTxBody()"),
        firstValidSlot:
            firstValidSlot !== undefined ? Number(firstValidSlot) : undefined,
        lastValidSlot:
            lastValidSlot !== undefined ? Number(lastValidSlot) : undefined,
        dcerts: dcerts ?? [],
        withdrawals: withdrawals ?? [],
        metadataHash,
        minted: minted ?? makeAssets(),
        scriptDataHash,
        collateral: collateralInputs ?? [],
        signers: signers ?? [],
        collateralReturn,
        totalCollateral: totalCollateral ?? 0n,
        refInputs: refInputs ?? []
    })
}

/**
 * Note: inputs, minted assets, and withdrawals need to be sorted in order to form a valid transaction
 * @implements {TxBody}
 */
class TxBodyImpl {
    /**
     * @readonly
     * @type {TxBodyEncodingConfig}
     */
    encodingConfig

    /**
     * Inputs must be sorted before submitting (first by TxId, then by utxoIndex)
     * Spending redeemers must point to the sorted inputs
     * @readonly
     * @type {TxInput[]}
     */
    inputs

    /**
     * @readonly
     * @type {TxOutput[]}
     */
    outputs

    /**
     * Lovelace fee, mutated as part of final balancing
     * @type {bigint}
     */
    fee

    /**
     * @readonly
     * @type {number | undefined}
     */
    firstValidSlot

    /**
     * @readonly
     * @type {number | undefined}
     */
    lastValidSlot

    /**
     * TODO: ensure these are properly sorted
     * @readonly
     * @type {DCert[]}
     */
    dcerts

    /**
     * Withdrawals must be sorted by address
     * Stake rewarding redeemers must point to the sorted withdrawals
     * @readonly
     * @type {[StakingAddress, bigint][]}
     */
    withdrawals

    /**
     * Internally the assets must be sorted by mintingpolicyhash
     * Minting redeemers must point to the sorted minted assets
     * @readonly
     * @type {Assets}
     */
    minted

    /**
     * @readonly
     * @type {number[] | undefined}
     */
    scriptDataHash

    /**
     * @readonly
     * @type {TxInput[]}
     */
    collateral

    /**
     * @readonly
     * @type {PubKeyHash[]}
     */
    signers

    /**
     * @readonly
     * @type {TxOutput | undefined}
     */
    collateralReturn

    /**
     * @readonly
     * @type {bigint}
     */
    totalCollateral

    /**
     * @readonly
     * @type {TxInput[]}
     */
    refInputs

    /**
     * @readonly
     * @type {number[] | undefined}
     */
    metadataHash

    /**
     * @param {TxBodyProps} props
     */
    constructor({
        encodingConfig,
        inputs,
        outputs,
        fee,
        firstValidSlot,
        lastValidSlot,
        dcerts,
        withdrawals,
        minted,
        scriptDataHash,
        collateral,
        signers,
        collateralReturn,
        totalCollateral,
        refInputs,
        metadataHash
    }) {
        this.encodingConfig = encodingConfig ?? { inputsAsSet: true }
        this.inputs = inputs
        this.outputs = outputs
        this.refInputs = refInputs
        this.fee = fee
        this.firstValidSlot = firstValidSlot
        this.lastValidSlot = lastValidSlot
        this.dcerts = dcerts
        this.withdrawals = withdrawals
        this.minted = minted
        this.scriptDataHash = scriptDataHash
        this.collateral = collateral ?? []
        this.signers = signers
        this.collateralReturn = collateralReturn
        this.totalCollateral = totalCollateral ?? 0n
        this.metadataHash = metadataHash
    }

    /**
     * @type {"TxBody"}
     */
    get kind() {
        return "TxBody"
    }

    /**
     * Used to validate if all the necessary scripts are included TxWitnesses (and that there are not redundant scripts)
     * @type {ScriptHash[]}
     */
    get allScriptHashes() {
        /**
         * @type {Map<string, ScriptHash>}
         */
        const m = new Map()

        this.inputs.forEach((utxo) => {
            const address = utxo.output.address
            if (address.era == "Byron") {
                throw new Error("not yet implemented")
            }

            const scriptHash = address.spendingCredential

            if (scriptHash.kind == "ValidatorHash") {
                m.set(scriptHash.toHex(), scriptHash)
            }
        })

        this.minted.getPolicies().forEach((mph) => m.set(mph.toHex(), mph))

        this.withdrawals.forEach(([stakingAddr]) => {
            const svh = stakingAddr.stakingCredential

            if (svh.kind == "StakingValidatorHash") {
                m.set(svh.toHex(), svh)
            }
        })

        this.dcerts.forEach((dcert) => {
            if (
                dcert.kind == "DeregistrationDCert" ||
                dcert.kind == "DelegationDCert"
            ) {
                const svh = dcert.credential

                if (svh.kind == "StakingValidatorHash") {
                    m.set(svh.toHex(), svh)
                }
            }
        })

        return Array.from(m.values())
    }

    /**
     * Calculates the number of dummy signatures needed to get precisely the right tx size.
     * @returns {number}
     */
    countUniqueSigners() {
        /**
         * @type {Set<string>}
         */
        let set = new Set()

        let nWorstCase = 0

        this.inputs.concat(this.collateral).forEach((utxo) => {
            try {
                const address = utxo.output.address

                if (address.era == "Byron") {
                    throw new Error("not yet implemented")
                }

                const spendingCredential = address.spendingCredential

                if (spendingCredential.kind == "PubKeyHash") {
                    set.add(spendingCredential.toHex())
                }
            } catch (_e) {
                nWorstCase += 1
            }
        })

        this.signers.forEach((signer) => set.add(signer.toHex()))

        return set.size + nWorstCase
    }

    /**
     * @returns {object}
     */
    dump() {
        return {
            inputs: this.inputs.map((input) => input.dump()),
            outputs: this.outputs.map((output) => output.dump()),
            fee: this.fee.toString(),
            lastValidSlot: this.lastValidSlot
                ? this.lastValidSlot.toString()
                : null,
            firstValidSlot: this.firstValidSlot
                ? this.firstValidSlot.toString()
                : null,
            minted: this.minted.isZero() ? null : this.minted.dump(),
            metadataHash: this.metadataHash
                ? bytesToHex(this.metadataHash)
                : null,
            scriptDataHash: this.scriptDataHash
                ? bytesToHex(this.scriptDataHash)
                : null,
            certificates:
                this.dcerts.length == 0
                    ? null
                    : this.dcerts.map((dc) => dc.dump()),
            collateral:
                this.collateral.length == 0
                    ? null
                    : this.collateral.map((c) => c.dump()),
            signers:
                this.signers.length == 0
                    ? null
                    : this.signers.map((rs) => rs.dump()),
            collateralReturn: this.collateralReturn
                ? this.collateralReturn.dump()
                : null,
            //totalCollateral: this.totalCollateral.toString(), // doesn't seem to be used anymore
            refInputs: this.refInputs.map((ri) => ri.dump())
        }
    }

    /**
     * @param {NetworkParams} params
     * @returns {TimeRange}
     */
    getValidityTimeRange(params) {
        const helper = makeNetworkParamsHelper(params)

        const start = this.firstValidSlot
            ? helper.slotToTime(this.firstValidSlot)
            : Number.NEGATIVE_INFINITY
        const end = this.lastValidSlot
            ? helper.slotToTime(this.lastValidSlot)
            : Number.POSITIVE_INFINITY

        return makeTimeRange(start, end, {
            excludeStart: false,
            excludeEnd: this.lastValidSlot !== undefined
        })
    }

    /**
     * Used by (indirectly) by emulator to check if slot range is valid.
     * Note: firstValidSlot == lastValidSlot is allowed
     * @param {IntLike} slot
     * @returns {boolean}
     */
    isValidSlot(slot) {
        if (this.lastValidSlot != null) {
            if (toInt(slot) > this.lastValidSlot) {
                return false
            }
        }

        if (this.firstValidSlot != null) {
            if (toInt(slot) < this.firstValidSlot) {
                return false
            }
        }

        return true
    }

    /**
     * A serialized tx throws away input information
     * This must be refetched from the network if the tx needs to be analyzed
     *
     * This must be done for the regular inputs because the datums are needed for correct budget calculation and min required signatures determination
     * This must be done for the reference inputs because they impact the budget calculation
     * This must be done for the collateral inputs as well, so that the minium required signatures can be determined correctly
     * @param {{getUtxo(id: TxOutputId): Promise<TxInput>}} network
     */
    async recover(network) {
        await Promise.all(
            this.inputs
                .map((input) => input.recover(network))
                .concat(
                    this.refInputs.map((refInput) => refInput.recover(network))
                )
                .concat(
                    this.collateral.map((collateral) =>
                        collateral.recover(network)
                    )
                )
        )
    }

    /**
     * @returns {Value}
     */
    sumInputValue() {
        return this.inputs.reduce(
            (prev, input) => prev.add(input.value),
            makeValue(0n)
        )
    }

    /**
     * Throws error if any part of the sum is negative (i.e. more is burned than input)
     * @returns {Value}
     */
    sumInputAndMintedValue() {
        return this.sumInputValue()
            .add(makeValue(0n, this.minted))
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
            makeValue(0n)
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
     * @returns {number[]}
     */
    toCbor() {
        /**
         * @type {Map<number, number[]>}
         */
        const m = new Map()

        const encodeInputsAsSet = this.encodingConfig.inputsAsSet ?? true
        m.set(
            0,
            encodeInputsAsSet
                ? encodeSet(this.inputs)
                : encodeDefList(this.inputs)
        )

        m.set(1, encodeDefList(this.outputs))
        m.set(2, encodeInt(this.fee))

        if (this.lastValidSlot !== undefined) {
            m.set(3, encodeInt(this.lastValidSlot))
        }

        if (this.dcerts.length != 0) {
            const encodeAsSet = this.encodingConfig.dcertsAsSet ?? true
            m.set(
                4,
                encodeAsSet
                    ? encodeSet(this.dcerts)
                    : encodeDefList(this.dcerts)
            )
        }

        if (this.withdrawals.length != 0) {
            m.set(
                5,
                encodeMap(
                    this.withdrawals.map(([sa, q]) => [
                        sa.toCbor(),
                        encodeInt(q)
                    ])
                )
            )
        }

        if (this.metadataHash !== undefined) {
            m.set(7, encodeBytes(this.metadataHash))
        }

        if (this.firstValidSlot !== undefined) {
            m.set(8, encodeInt(this.firstValidSlot))
        }

        if (!this.minted.isZero()) {
            m.set(9, this.minted.toCbor())
        }

        if (this.scriptDataHash !== undefined) {
            m.set(11, encodeBytes(this.scriptDataHash))
        }

        if (this.collateral.length != 0) {
            const encodeAsSet =
                this.encodingConfig.collateralInputsAsSet ?? true
            m.set(
                13,
                encodeAsSet
                    ? encodeSet(this.collateral)
                    : encodeDefList(this.collateral)
            )
        }

        if (this.signers.length != 0) {
            const encodeAsSet = this.encodingConfig.signersAsSet ?? true
            m.set(
                14,
                encodeAsSet
                    ? encodeSet(this.signers)
                    : encodeDefList(this.signers)
            )
        }

        // what is NetworkId used for, seems a bit useless?
        // object.set(15, encodeInt(2n));

        if (this.collateralReturn !== undefined) {
            m.set(16, this.collateralReturn.toCbor())
        }

        if (this.totalCollateral > 0n) {
            m.set(17, encodeInt(this.totalCollateral))
        }

        if (this.refInputs.length != 0) {
            const encodeAsSet = this.encodingConfig.refInputsAsSet ?? true
            m.set(
                18,
                encodeAsSet
                    ? encodeSet(this.refInputs)
                    : encodeDefList(this.refInputs)
            )
        }

        return encodeObjectIKey(m)
    }

    /**
     * Returns the on-chain Tx representation
     * @param {NetworkParams} params
     * @param {TxRedeemer[]} redeemers
     * @param {UplcData[]} datums
     * @param {TxId} txId
     * @returns {TxInfo}
     */
    toTxInfo(params, redeemers, datums, txId) {
        return {
            inputs: this.inputs,
            refInputs: this.refInputs,
            outputs: this.outputs,
            fee: this.fee,
            minted: this.minted,
            dcerts: this.dcerts,
            withdrawals: this.withdrawals,
            validityTimerange: this.getValidityTimeRange(params),
            signers: this.signers,
            redeemers: redeemers,
            datums: datums,
            id: txId
        }
    }

    /**
     * Not done in the same routine as sortInputs(), because balancing of assets happens after redeemer indices are set
     * @returns {void}
     */
    sortOutputs() {
        // sort the tokens in the outputs, needed by the flint wallet
        this.outputs.forEach((output) => {
            output.value.assets.sort()
        })
    }

    /**
     * @returns {number[]}
     */
    hash() {
        return blake2b(this.toCbor())
    }
}
