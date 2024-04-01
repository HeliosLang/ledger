import {
    decodeBytes,
    decodeInt,
    decodeList,
    decodeMap,
    decodeObjectIKey,
    encodeBytes,
    encodeDefList,
    encodeInt,
    encodeMap,
    encodeObjectIKey
} from "@helios-lang/cbor"
import { bytesToHex } from "@helios-lang/codec-utils"
import { blake2b } from "@helios-lang/crypto"
import { expectSome, isSome } from "@helios-lang/type-utils"
import {
    ByteArrayData,
    ConstrData,
    IntData,
    ListData,
    MapData
} from "@helios-lang/uplc"
import {
    DatumHash,
    MintingPolicyHash,
    PubKeyHash,
    ScriptHash,
    ValidatorHash
} from "../hashes/index.js"
import { Assets, Value } from "../money/index.js"
import { NetworkParamsHelper } from "../params/index.js"
import { TimeRange } from "../time/index.js"
import { DCert } from "./DCert.js"
import { StakingAddress } from "./StakingAddress.js"
import { TxId } from "./TxId.js"
import { TxInput } from "./TxInput.js"
import { TxOutput } from "./TxOutput.js"
import { TxOutputId } from "./TxOutputId.js"
import { TxRedeemer } from "./TxRedeemer.js"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 * @typedef {import("../hashes/index.js").Hash} Hash
 */

/**
 * @typedef {{
 *   inputs: TxInput[]
 *   outputs: TxOutput[]
 *   fee: bigint
 *   firstValidSlot: Option<bigint>
 *   lastValidSlot: Option<bigint>
 *   dcerts: DCert[]
 *   withdrawals: [StakingAddress, bigint][]
 *   minted: Assets
 *   scriptDataHash?: Option<number[]>
 *   collateral?: TxInput[]
 *   signers: PubKeyHash[]
 *   collateralReturn?: Option<TxOutput>
 *   totalCollateral?: bigint
 *   refInputs: TxInput[]
 *   metadataHash?: Option<number[]>
 * }} TxBodyProps
 */

/**
 * inputs, minted assets, and withdrawals need to be sorted in order to form a valid transaction
 */
export class TxBody {
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
     * Lovelace fee
     * @readonly
     * @type {bigint}
     */
    fee

    /**
     * @readonly
     * @type {Option<bigint>}
     */
    firstValidSlot

    /**
     * @readonly
     * @type {Option<bigint>}
     */
    lastValidSlot

    /**
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
     * @type {Option<number[]>}
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
     * @type {Option<TxOutput>}
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
     * @type {Option<number[]>}
     */
    metadataHash

    /**
     * @param {TxBodyProps} props
     */
    constructor({
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
     * @param {ByteArrayLike} bytes
     * @returns {TxBody}
     */
    static fromCbor(bytes) {
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
            13: collateral,
            14: signers,
            15: _networkId,
            16: collateralReturn,
            17: totalCollateral,
            18: refInputs
        } = decodeObjectIKey(bytes, {
            0: (s) => decodeList(s, TxInput),
            1: (s) => decodeList(s, TxOutput),
            2: decodeInt,
            3: decodeInt,
            4: (s) => decodeList(s, DCert),
            5: (s) => decodeMap(s, StakingAddress, decodeInt),
            7: decodeBytes,
            8: decodeInt,
            9: Assets,
            11: decodeBytes,
            13: (s) => decodeList(s, TxInput),
            14: (s) => decodeList(s, PubKeyHash),
            15: decodeInt,
            16: TxOutput,
            17: decodeInt,
            18: (s) => decodeList(s, TxInput)
        })

        return new TxBody({
            inputs: expectSome(inputs),
            outputs: expectSome(outputs),
            fee: expectSome(fee),
            firstValidSlot,
            lastValidSlot,
            dcerts: dcerts ?? [],
            withdrawals: withdrawals ?? [],
            metadataHash,
            minted: minted ?? new Assets(),
            scriptDataHash,
            collateral: collateral ?? [],
            signers: signers ?? [],
            collateralReturn,
            totalCollateral: totalCollateral ?? 0n,
            refInputs: refInputs ?? []
        })
    }

    /**
     * NativeScripts aren't added here
     * @type {Map<string, TxRedeemer[]>}
     */
    get spendingRedeemers() {
        /**
         * @type {Map<string, TxRedeemer[]>}
         */
        const res = new Map()

        /**
         * @param {ValidatorHash} hash
         * @param {TxRedeemer} redeemer
         */
        function addEntry(hash, redeemer) {
            const key = hash.toHex()

            const entries = (res.get(key) ?? []).concat([redeemer])
            res.set(key, entries)
        }

        this.inputs.forEach((input, i) => {
            const paymentCredential = input.output.address.paymentCredential
            const datum = input.output.datum

            // without datum this is assumed to be a native script
            if (paymentCredential.isValidator() && datum) {
                addEntry(
                    paymentCredential.validatorHash,
                    TxRedeemer.Spending(i, datum.data)
                )
            }
        })

        return res
    }

    /**
     * @returns {Object}
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
            //totalCollateral: this.#totalCollateral.toString(), // doesn't seem to be used anymore
            refInputs: this.refInputs.map((ri) => ri.dump())
        }
    }

    /**
     * @param {NetworkParamsHelper} networkParams
     * @returns {TimeRange}
     */
    getValidityTimeRange(networkParams) {
        const start = this.firstValidSlot
            ? networkParams.slotToTime(this.firstValidSlot)
            : Number.NEGATIVE_INFINITY
        const end = this.lastValidSlot
            ? networkParams.slotToTime(this.lastValidSlot)
            : Number.POSITIVE_INFINITY

        return new TimeRange(start, end, {
            excludeStart: false,
            excludeEnd: isSome(this.lastValidSlot)
        })
    }

    /**
     * Used by (indirectly) by emulator to check if slot range is valid.
     * Note: firstValidSlot == lastValidSlot is allowed
     * @param {bigint} slot
     * @returns {boolean}
     */
    isValidSlot(slot) {
        if (this.lastValidSlot != null) {
            if (slot > this.lastValidSlot) {
                return false
            }
        }

        if (this.firstValidSlot != null) {
            if (slot < this.firstValidSlot) {
                return false
            }
        }

        return true
    }

    /**
     * A serialized tx throws away input information
     * This must be refetched from the network if the tx needs to be analyzed
     * @param {(id: TxOutputId) => Promise<TxOutput>} fn
     */
    async recover(fn) {
        await Promise.all(
            this.inputs
                .map((input) => input.recover(fn))
                .concat(this.refInputs.map((refInput) => refInput.recover(fn)))
        )
    }

    /**
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
     * @returns {Value}
     */
    sumInputAndMintedValue() {
        return this.sumInputValue()
            .add(new Value(0n, this.minted))
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
     * @returns {number[]}
     */
    toCbor() {
        /**
         * @type {Map<number, number[]>}
         */
        const m = new Map()

        m.set(0, encodeDefList(this.inputs))
        m.set(1, encodeDefList(this.outputs))
        m.set(2, encodeInt(this.fee))

        if (isSome(this.lastValidSlot)) {
            m.set(3, encodeInt(this.lastValidSlot))
        }

        if (this.dcerts.length != 0) {
            m.set(4, encodeDefList(this.dcerts))
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

        if (isSome(this.metadataHash)) {
            m.set(7, encodeBytes(this.metadataHash))
        }

        if (isSome(this.firstValidSlot)) {
            m.set(8, encodeInt(this.firstValidSlot))
        }

        if (!this.minted.isZero()) {
            m.set(9, this.minted.toCbor())
        }

        if (isSome(this.scriptDataHash)) {
            m.set(11, encodeBytes(this.scriptDataHash))
        }

        if (this.collateral.length != 0) {
            m.set(13, encodeDefList(this.collateral))
        }

        if (this.signers.length != 0) {
            m.set(14, encodeDefList(this.signers))
        }

        // what is NetworkId used for, seems a bit useless?
        // object.set(15, encodeInt(2n));

        if (isSome(this.collateralReturn)) {
            m.set(16, this.collateralReturn.toCbor())
        }

        if (this.totalCollateral > 0n) {
            m.set(17, encodeInt(this.totalCollateral))
        }

        if (this.refInputs.length != 0) {
            m.set(18, encodeDefList(this.refInputs))
        }

        return encodeObjectIKey(m)
    }

    /**
     * Returns the on-chain Tx representation
     * @param {NetworkParamsHelper} networkParams
     * @param {TxRedeemer[]} redeemers
     * @param {UplcData[]} datums
     * @param {TxId} txId
     * @returns {ConstrData}
     */
    toTxUplcData(networkParams, redeemers, datums, txId) {
        return new ConstrData(0, [
            new ListData(this.inputs.map((input) => input.toUplcData())),
            new ListData(this.refInputs.map((input) => input.toUplcData())),
            new ListData(this.outputs.map((output) => output.toUplcData())),
            new Value(this.fee).toUplcData(),
            // NOTE: all other Value instances in ScriptContext contain some lovelace, but `minted` can never contain any lovelace, yet cardano-node always prepends 0 lovelace to the `minted` MapData
            new Value(0n, this.minted).toUplcData(true),
            new ListData(this.dcerts.map((cert) => cert.toUplcData())),
            new MapData(
                this.withdrawals.map(([sa, q]) => [
                    sa.toUplcData(),
                    new IntData(q)
                ])
            ),
            this.getValidityTimeRange(networkParams).toUplcData(),
            new ListData(this.signers.map((signer) => signer.toUplcData())),
            new MapData(
                [] //redeemers.map((r) => [r.toScriptPurposeData(this), r.data])
            ),
            new MapData(
                datums.map((d) => [DatumHash.hashUplcData(d).toUplcData(), d])
            ),
            new ConstrData(0, [new ByteArrayData(txId.bytes)])
        ])
    }

    /**
     * @param {NetworkParamsHelper} networkParams
     * @param {Option<bigint>} minCollateral
     */
    validateCollateral(networkParams, minCollateral) {
        if (this.collateral.length > networkParams.maxCollateralInputs) {
            throw new Error("too many collateral inputs")
        }

        if (!minCollateral) {
            if (this.collateral.length != 0) {
                throw new Error("unnecessary collateral included")
            }
        } else {
            let sum = new Value()

            for (let col of this.collateral) {
                if (!col.output) {
                    throw new Error(
                        "expected collateral TxInput.origOutput to be set"
                    )
                } else if (!col.output.value.assets.isZero()) {
                    throw new Error("collateral can only contain lovelace")
                } else {
                    sum = sum.add(col.output.value)
                }
            }

            if (this.collateralReturn != null) {
                sum = sum.subtract(this.collateralReturn.value)
            }

            if (sum.lovelace < minCollateral) {
                throw new Error("not enough collateral")
            }

            if (sum.lovelace > minCollateral * 5n) {
                console.error("Warning: way too much collateral")
            }
        }
    }

    /**
     * Throws an error in the inputs aren't in the correct order
     * @private
     */
    validateInputs() {
        this.inputs.forEach((input, i) => {
            if (i > 0) {
                const prev = this.inputs[i - 1]

                // can be less than -1 if utxoIds aren't consecutive
                if (TxInput.compare(prev, input) >= 0) {
                    throw new Error("inputs aren't sorted")
                }
            }
        })
    }

    /**
     * Checks that each output contains enough lovelace
     * @private
     * @param {NetworkParamsHelper} networkParams
     */
    validateOutputs(networkParams) {
        this.outputs.forEach((output) => {
            const minLovelace = output.calcDeposit(networkParams)

            if (minLovelace > output.value.lovelace) {
                throw new Error(
                    `not enough lovelace in output (expected at least ${minLovelace.toString()}, got ${output.value.lovelace})`
                )
            }

            output.value.assets.assertSorted()
        })
    }

    /**
     * Makes sore inputs, withdrawals, and minted assets are in correct order, this is needed for the redeemer indices
     * Mutates
     */
    validateOrder() {
        // same for ref inputs
        this.refInputs.forEach((input, i) => {
            if (i > 0) {
                const prev = this.refInputs[i - 1]

                // can be less than -1 if utxoIds aren't consecutive
                if (TxInput.compare(prev, input) >= 0) {
                    throw new Error("refInputs not sorted")
                }
            }
        })

        // TODO: also add withdrawals in sorted manner
        //this.withdrawals = new Map(
        //Array.from(this.withdrawals.entries()).sort((a, b) => {
        //return Address.compStakingHashes(a[0], b[0])
        //})
        //)

        // minted assets should've been added in sorted manner, so this is just a check
        this.minted.assertSorted()
    }

    /**
     * Throws an error if the refinputs aren't sorted
     * @private
     */
    validateRefInputs() {
        this.refInputs.forEach((input, i) => {
            if (i > 0) {
                const prev = this.refInputs[i - 1]

                // can be less than -1 if utxoIds aren't consecutive
                if (TxInput.compare(prev, input) >= 0) {
                    throw new Error("refInputs not sorted")
                }
            }
        })
    }

    /**
     * Thows an error if the withdrawals aren't sorted according the StakingAddresses
     * @private
     */
    validatorWithdrawals() {
        this.withdrawals.forEach(([sa], i) => {
            if (i > 0) {
                const prev = this.withdrawals[i - 1][0]

                if (StakingAddress.compare(prev, sa) >= 0) {
                    throw new Error("withdrawals not sorted")
                }
            }
        })
    }

    /**
     * Not done in the same routine as sortInputs(), because balancing of assets happens after redeemer indices are set
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
