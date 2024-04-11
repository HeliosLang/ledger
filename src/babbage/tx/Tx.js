import {
    decodeBool,
    decodeNullOption,
    decodeTuple,
    encodeBool,
    encodeDefList,
    encodeInt,
    encodeMap,
    encodeNullOption,
    encodeTuple
} from "@helios-lang/cbor"
import { bytesToHex, compareBytes } from "@helios-lang/codec-utils"
import { None, expectSome } from "@helios-lang/type-utils"
import {
    ListData,
    UplcDataValue,
    UplcProgramV1,
    UplcProgramV2
} from "@helios-lang/uplc"
import { Value } from "../money/index.js"
import { NetworkParamsHelper } from "../params/index.js"
import { TxBody } from "./TxBody.js"
import { TxMetadata } from "./TxMetadata.js"
import { TxOutput } from "./TxOutput.js"
import { TxOutputId } from "./TxOutputId.js"
import { TxWitnesses } from "./TxWitnesses.js"
import { Signature } from "./Signature.js"
import { TxId } from "./TxId.js"
import { ScriptPurpose } from "./ScriptPurpose.js"
import { TxInput } from "./TxInput.js"
import { StakingAddress } from "./StakingAddress.js"
import { TxRedeemer } from "./TxRedeemer.js"
import { blake2b } from "@helios-lang/crypto"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 */

/**
 * Represents a Cardano transaction. Can also be used as a transaction builder.
 */
export class Tx {
    /**
     * @readonly
     * @type {TxBody}
     */
    body

    /**
     * @readonly
     * @type {TxWitnesses}
     */
    witnesses

    /**
     * Access this through `isValid()` instead
     * @private
     * @type {boolean}
     */
    valid

    /**
     * @readonly
     * @type {Option<TxMetadata>}
     */
    metadata

    /**
     * Use `Tx.new()` instead of this constructor for creating a new Tx builder.
     * @param {TxBody} body
     * @param {TxWitnesses} witnesses
     * @param {boolean} valid - false whilst some signatures are still missing
     * @param {Option<TxMetadata>} metadata
     */
    constructor(body, witnesses, valid, metadata = None) {
        this.body = body
        this.witnesses = witnesses
        this.valid = valid
        this.metadata = metadata
    }

    /**
     * Deserialize a CBOR encoded Cardano transaction (input is either an array of bytes, or a hex string).
     * @param {ByteArrayLike} bytes
     * @returns {Tx}
     */
    static fromCbor(bytes) {
        const [body, witnesses, valid, metadata] = decodeTuple(bytes, [
            TxBody,
            TxWitnesses,
            decodeBool,
            (s) => decodeNullOption(s, TxMetadata)
        ])

        return new Tx(body, witnesses, valid, metadata)
    }

    /**
     * Number of bytes
     * @type {number}
     */
    get size() {
        return this.toCbor().length
    }

    /**
     * Adds a signature created by a wallet. Only available after the transaction has been finalized.
     * Optionally verifies that the signature is correct.
     * @param {Signature} signature
     * @param {boolean} verify Defaults to `true`
     * @returns {Tx}
     */
    addSignature(signature, verify = true) {
        if (!this.valid) {
            throw new Error("invalid Tx")
        }

        if (verify) {
            signature.verify(this.body.hash())
        }

        this.witnesses.addSignature(signature)

        return this
    }

    /**
     * Adds multiple signatures at once. Only available after the transaction has been finalized.
     * Optionally verifies each signature is correct.
     * @param {Signature[]} signatures
     * @param {boolean} verify
     * @returns {Tx}
     */
    addSignatures(signatures, verify = true) {
        for (let s of signatures) {
            this.addSignature(s, verify)
        }

        return this
    }

    /**
     * @param {NetworkParamsHelper} networkParams
     * @param {boolean} recalcMinBaseFee
     * @returns {bigint} - a quantity of lovelace
     */
    calcMinCollateral(networkParams, recalcMinBaseFee = false) {
        const fee = recalcMinBaseFee
            ? this.calcMinFee(networkParams)
            : this.body.fee

        // integer division that rounds up
        const minCollateral =
            (fee * BigInt(networkParams.minCollateralPct) + 100n) / 100n

        return minCollateral
    }

    /**
     * @param {NetworkParamsHelper} networkParams
     * @returns {bigint} - a quantity of lovelace
     */
    calcMinFee(networkParams) {
        // add dummy signatures to make sure the tx has the correct size
        if (!this.valid) {
            this.witnesses.addDummySignatures(this.body.countUniqueSigners())
        }

        const [a, b] = networkParams.txFeeParams

        const sizeFee = BigInt(a) + BigInt(this.size) * BigInt(b)

        // clean up the dummy signatures
        if (!this.valid) {
            this.witnesses.removeDummySignatures()
        }

        const exFee = this.witnesses.calcExFee(networkParams)

        return sizeFee + exFee
    }

    /**
     * Creates a new Tx without the metadata for client-side signing where the client can't know the metadata before tx-submission.
     * @returns {Tx}
     */
    clearMetadata() {
        return new Tx(this.body, this.witnesses, this.valid, None)
    }

    /**
     * @returns {Object}
     */
    dump() {
        return {
            body: this.body.dump(),
            witnesses: this.witnesses.dump(),
            metadata: this.metadata ? this.metadata.dump() : null,
            id: this.id().toString()
        }
    }

    /**
     * @returns {TxId}
     */
    id() {
        return new TxId(this.body.hash())
    }

    /**
     * @returns {boolean}
     */
    isSmart() {
        return this.witnesses.isSmart()
    }

    /**
     * @returns {boolean}
     */
    isValid() {
        return this.valid
    }

    /**
     * Used by emulator to check if tx is valid.
     * @param {bigint} slot
     * @returns {boolean}
     */
    isValidSlot(slot) {
        return this.body.isValidSlot(slot)
    }

    /**
     * A serialized tx throws away input information
     * This must be refetched from the network if the tx needs to be analyzed
     * @param {(id: TxOutputId) => Promise<TxOutput>} fn
     */
    async recover(fn) {
        await this.body.recover(fn)

        const refScriptsInRefInputs = this.body.refInputs.reduce(
            (refScripts, input) => {
                const refScript = input.output.refScript

                if (refScript) {
                    return refScripts.concat([refScript])
                } else {
                    return refScripts
                }
            },
            /** @type {(UplcProgramV1 | UplcProgramV2)[]} */ ([])
        )

        this.witnesses.recover(refScriptsInRefInputs)
    }

    /**
     * Serialize a transaction.
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([
            this.body.toCbor(),
            this.witnesses.toCbor(),
            encodeBool(true),
            encodeNullOption(this.metadata)
        ])
    }

    /**
     * Throws an error if the tx isn't valid
     *
     * Checks that are performed:
     *   * size of tx <= params.maxTxSize
     *   * body.fee >= calculated min fee
     *   * value is conserved (minus what is burned, plus what is minted)
     *   * enough collateral if smart
     *   * no collateral if not smart
     *   * all necessary scripts are attached
     *   * no redundant scripts are attached (only checked if strict=true)
     *   * each redeemer must have enough ex budget
     *   * total ex budget can't exceed max tx ex budget for either mem or cpu
     *   * each output contains enough lovelace (minDeposit)
     *   * the assets in the output values are correctly sorted (only checked if strict=true, because only needed by some wallets)
     *   * inputs are in the correct order
     *   * ref inputs are in the correct order
     *   * minted assets are in the correct order
     *   * staking withdrawals are in the correct order
     *   * metadatahash corresponds to metadata
     *   * metadatahash is null if there isn't any metadata
     *   * script data hash is correct
     *
     * Checks that aren't performed:
     *   * all necessary signatures are included (must done after tx has been signed)
     *   * validity time range, which can only be checked upon submission
     *
     * @param {NetworkParamsHelper} params
     * @param {boolean} strict - can be left when trying to inspect general transactions, the TxBuilder should however always set strict=true
     */
    validate(params, strict = false) {
        this.validateSize(params)

        this.validateFee(params)

        this.validateConservation(params)

        this.validateCollateral(params)

        this.validateScriptsPresent(strict)

        this.validateRedeemersExBudget(params)

        this.validateTotalExBudget(params)

        this.validateOutputs(params, strict)

        this.validateInputsOrder()

        this.validateRefInputsOrder()

        this.validateMintedOrder()

        this.validateWithdrawalsOrder()

        this.validateMetadata()

        this.validateScriptDataHash(params)
    }

    /**
     * Throws an error if all necessary signatures haven't yet been added
     * Separate from the other validation checks
     * If valid: this.valid is mutated to true
     */
    validateSignatures() {
        const signatures = this.witnesses.signatures

        const includedSigners = new Set(
            signatures.map((s) => s.pubKeyHash.toHex())
        )

        // check the signers
        this.body.signers.forEach((s) => {
            if (!includedSigners.has(s.toHex())) {
                throw new Error(`signature for signer ${s.toHex()} missing`)
            }
        })

        // check the input and the collateral utxos
        this.body.inputs.concat(this.body.collateral).forEach((utxo) => {
            const pkh = utxo.output.address.pubKeyHash
            if (pkh && !includedSigners.has(pkh.toHex())) {
                throw new Error(
                    `signature for input at ${utxo.output.address.toBech32()} missing`
                )
            }
        })

        this.valid = true
    }

    /**
     * Throws an error if there isn't enough collateral
     * Also throws an error if the script doesn't require collateral, but collateral was actually included
     * @private
     * @param {NetworkParamsHelper} networkParams
     */
    validateCollateral(networkParams) {
        if (this.body.collateral.length > networkParams.maxCollateralInputs) {
            throw new Error("too many collateral inputs")
        }

        if (this.isSmart()) {
            let minCollateralPct = networkParams.minCollateralPct

            // only use the exBudget

            const fee = this.body.fee

            const minCollateral = BigInt(
                Math.ceil((minCollateralPct * Number(fee)) / 100.0)
            )

            let sum = new Value()

            for (let col of this.body.collateral) {
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

            if (this.body.collateralReturn != null) {
                sum = sum.subtract(this.body.collateralReturn.value)
            }

            if (sum.lovelace < minCollateral) {
                throw new Error("not enough collateral")
            }

            if (sum.lovelace > minCollateral * 5n) {
                console.error("Warning: way too much collateral")
            }
        } else {
            if (this.body.collateral.length != 0) {
                throw new Error("unnecessary collateral included")
            }
        }
    }

    /**
     * Validate that value is conserved, minus what is burned and plus what is minted
     * Throws an error if value isn't conserved
     * @private
     * @param {NetworkParamsHelper} networkParams
     */
    validateConservation(networkParams) {
        const stakeAddrDeposit = new Value(networkParams.stakeAddressDeposit)
        let v = new Value(0n)

        v = this.body.inputs.reduce((prev, inp) => inp.value.add(prev), v)
        v = this.body.dcerts.reduce((prev, dcert) => {
            // add released stakeAddrDeposit
            return dcert.isDeregister() ? prev.add(stakeAddrDeposit) : prev
        }, v)
        v = v.subtract(new Value(this.body.fee))
        v = v.add(new Value(0, this.body.minted))
        v = this.body.outputs.reduce((prev, out) => {
            return prev.subtract(out.value)
        }, v)
        v = this.body.dcerts.reduce((prev, dcert) => {
            // deduct locked stakeAddrDeposit
            return dcert.isRegister() ? prev.subtract(stakeAddrDeposit) : prev
        }, v)

        if (v.lovelace != 0n) {
            throw new Error(
                `tx not balanced, net lovelace not zero (${v.lovelace})`
            )
        }

        if (!v.assets.isZero()) {
            throw new Error("tx not balanced, net assets not zero")
        }
    }

    /**
     * Final check that fee is big enough
     * Throws an error if not
     * @private
     * @param {NetworkParamsHelper} networkParams
     */
    validateFee(networkParams) {
        const minFee = this.calcMinFee(networkParams)

        if (minFee > this.body.fee) {
            throw new Error(
                `fee too small, expected at least ${minFee}, got ${this.body.fee}`
            )
        }
    }

    /**
     * Throws an error in the inputs aren't in the correct order
     * @private
     */
    validateInputsOrder() {
        this.body.inputs.forEach((input, i) => {
            if (i > 0) {
                const prev = this.body.inputs[i - 1]

                // can be less than -1 if utxoIds aren't consecutive
                if (TxInput.compare(prev, input) >= 0) {
                    throw new Error("inputs aren't sorted")
                }
            }
        })
    }

    /**
     * Throws an error if the metadatahash doesn't correspond, or if a tx without metadata has its metadatahash set
     * @private
     */
    validateMetadata() {
        const metadata = this.metadata

        if (metadata) {
            const h = metadata.hash()

            if (this.body.metadataHash) {
                if (compareBytes(h, this.body.metadataHash) != 0) {
                    throw new Error(
                        "metadataHash doesn't correspond with actual metadata"
                    )
                }
            } else {
                throw new Error(
                    "metadataHash not included in a Tx that has metadata"
                )
            }
        } else {
            if (this.body.metadataHash) {
                throw new Error(
                    "metadataHash included in a Tx that doesn't have any metadata"
                )
            }
        }
    }

    /**
     * Throws an error if the minted assets aren't in the correct order
     * @private
     */
    validateMintedOrder() {
        this.body.minted.assertSorted()
    }

    /**
     * Checks that each output contains enough lovelace,
     *   and that the contained assets are correctly sorted
     * @private
     * @param {NetworkParamsHelper} networkParams
     * @param {boolean} strict
     */
    validateOutputs(networkParams, strict) {
        this.body.outputs.forEach((output) => {
            const minLovelace = output.calcDeposit(networkParams)

            if (minLovelace > output.value.lovelace) {
                throw new Error(
                    `not enough lovelace in output (expected at least ${minLovelace.toString()}, got ${output.value.lovelace})`
                )
            }

            if (strict) {
                output.value.assets.assertSorted()
            }
        })
    }

    /**
     * @private
     * @param {NetworkParamsHelper} networkParams
     */
    validateRedeemersExBudget(networkParams) {
        const txData = this.body.toTxUplcData(
            networkParams,
            this.witnesses.redeemers,
            this.witnesses.datums,
            this.id()
        )

        this.witnesses.redeemers.forEach((redeemer) => {
            const redeemerData = redeemer.data

            if (redeemer.isSpending()) {
                const utxo = expectSome(this.body.inputs[redeemer.index])

                const script = expectSome(
                    this.witnesses.findUplcProgram(
                        expectSome(utxo.address.validatorHash)
                    )
                )
                const datumData = expectSome(utxo.datum?.data)
                const scriptContextData = ScriptPurpose.Spending(
                    redeemer,
                    utxo.id
                ).toScriptContextUplcData(txData)

                const args = [datumData, redeemerData, scriptContextData]

                const { cost } = script.eval(
                    args.map((a) => new UplcDataValue(a))
                )

                if (cost.mem > redeemer.cost.mem) {
                    throw new Error(
                        `actual mem cost for spending UTxO ${utxo.id.toString()} too high, expected at most ${redeemer.cost.mem}, got ${cost.mem}`
                    )
                }

                if (cost.cpu > redeemer.cost.cpu) {
                    throw new Error(
                        `actual cpu cost for spending UTxO ${utxo.id.toString()} too high, expected at most ${redeemer.cost.cpu}, got ${cost.cpu}`
                    )
                }
            } else if (redeemer.isMinting()) {
                const mph = expectSome(
                    this.body.minted.getPolicies()[redeemer.index]
                )

                const script = expectSome(this.witnesses.findUplcProgram(mph))
                const scriptContextData = ScriptPurpose.Minting(
                    redeemer,
                    mph
                ).toScriptContextUplcData(txData)

                const args = [redeemerData, scriptContextData]

                const { cost } = script.eval(
                    args.map((a) => new UplcDataValue(a))
                )

                if (cost.mem > redeemer.cost.mem) {
                    throw new Error(
                        `actual mem cost for minting ${mph.toHex()} too high, expected at most ${redeemer.cost.mem}, got ${cost.mem}`
                    )
                }

                if (cost.cpu > redeemer.cost.cpu) {
                    throw new Error(
                        `actual cpu cost for minting ${mph.toHex()} too high, expected at most ${redeemer.cost.cpu}, got ${cost.cpu}`
                    )
                }
            } else {
                throw new Error("unhandled TxRedeemer kind")
            }
        })
    }

    /**
     * Throws an error if the ref inputs aren't in the correct order
     * @private
     */
    validateRefInputsOrder() {
        // same for ref inputs
        this.body.refInputs.forEach((input, i) => {
            if (i > 0) {
                const prev = this.body.refInputs[i - 1]

                // can be less than -1 if utxoIds aren't consecutive
                if (TxInput.compare(prev, input) >= 0) {
                    throw new Error("refInputs not sorted")
                }
            }
        })
    }

    /**
     * Throws an error if the script data hash is incorrect
     * @private
     * @param {NetworkParamsHelper} networkParams
     */
    validateScriptDataHash(networkParams) {
        if (this.witnesses.redeemers.length > 0) {
            if (this.body.scriptDataHash) {
                const scriptDataHash = calcScriptDataHash(
                    networkParams,
                    this.witnesses.datums,
                    this.witnesses.redeemers
                )

                if (
                    compareBytes(scriptDataHash, this.body.scriptDataHash) != 0
                ) {
                    throw new Error("wrong script data hash")
                }
            } else {
                throw new Error(
                    "no script data hash included for a Tx that has redeemers"
                )
            }
        } else {
            if (this.body.scriptDataHash) {
                throw new Error(
                    "script data hash included for a Tx that has no redeemers"
                )
            }
        }
    }

    /**
     * Checks that all necessary scripts and UplcPrograms are included, and that all included scripts are used
     * @private
     * @param {boolean} strict
     */
    validateScriptsPresent(strict) {
        const allScripts = this.witnesses.allScripts
        const includedScriptHashes = new Set(
            allScripts.map((s) => bytesToHex(s.hash()))
        )

        if (allScripts.length != includedScriptHashes.size) {
            throw new Error("duplicate scripts included in transaction")
        }

        const requiredScriptHashes = this.body.allScriptHashes

        if (requiredScriptHashes.length < includedScriptHashes.size) {
            throw new Error("too many scripts included, not all are needed")
        }

        requiredScriptHashes.forEach((hash) => {
            const key = hash.toHex()

            if (!includedScriptHashes.has(key)) {
                throw new Error(`missing script for hash ${key}`)
            }
        })

        if (strict) {
            includedScriptHashes.forEach((key) => {
                if (
                    requiredScriptHashes.findIndex((h) => h.toHex() == key) ==
                    -1
                ) {
                    throw new Error(`detected unused script ${key}`)
                }
            })
        }
    }

    /**
     * Throws error if tx is too big
     * @private
     * @param {NetworkParamsHelper} networkParams
     */
    validateSize(networkParams) {
        if (this.size > networkParams.maxTxSize) {
            throw new Error("tx too big")
        }
    }

    /**
     * Throws error if execution budget is exceeded
     * @private
     * @param {NetworkParamsHelper} networkParams
     */
    validateTotalExBudget(networkParams) {
        let totalMem = 0n
        let totalCpu = 0n

        for (let redeemer of this.witnesses.redeemers) {
            totalMem += redeemer.cost.mem
            totalCpu += redeemer.cost.cpu
        }

        let [maxMem, maxCpu] = networkParams.maxTxExecutionBudget

        if (totalMem > BigInt(maxMem)) {
            throw new Error(
                `execution budget exceeded for mem (${totalMem.toString()} > ${maxMem.toString()})\n`
            )
        }

        if (totalCpu > BigInt(maxCpu)) {
            throw new Error(
                `execution budget exceeded for cpu (${totalCpu.toString()} > ${maxCpu.toString()})\n`
            )
        }
    }

    /**
     * Throws an error if the withdrawals aren't in the correct order
     * @private
     */
    validateWithdrawalsOrder() {
        this.body.withdrawals.forEach((w, i) => {
            if (i > 0) {
                const prev = this.body.withdrawals[i - 1]

                if (StakingAddress.compare(prev[0], w[0]) >= 0) {
                    throw new Error("withdrawals not sorted")
                }
            }
        })
    }
}

/**
 * @param {NetworkParamsHelper} networkParams
 * @param {UplcData[]} datums
 * @param {TxRedeemer[]} redeemers
 * @returns {number[]}
 */
export function calcScriptDataHash(networkParams, datums, redeemers) {
    if (redeemers.length == 0) {
        throw new Error(
            "expected at least 1 redeemer to be able to create the script data hash"
        )
    }

    let bytes = encodeDefList(redeemers)

    if (datums.length > 0) {
        bytes = bytes.concat(new ListData(datums).toCbor())
    }

    // language view encodings?
    const sortedCostParams = networkParams.sortedV2CostParams

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
}
