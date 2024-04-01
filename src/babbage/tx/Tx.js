import {
    decodeBool,
    decodeNullOption,
    decodeTuple,
    encodeBool,
    encodeNullOption,
    encodeTuple
} from "@helios-lang/cbor"
import { bytesToHex } from "@helios-lang/codec-utils"
import { None } from "@helios-lang/type-utils"
import { UplcProgramV1, UplcProgramV2 } from "@helios-lang/uplc"
import { Value } from "../money/index.js"
import { NetworkParamsHelper } from "../params/index.js"
import { TxBody } from "./TxBody.js"
import { TxMetadata } from "./TxMetadata.js"
import { TxOutput } from "./TxOutput.js"
import { TxOutputId } from "./TxOutputId.js"
import { TxWitnesses } from "./TxWitnesses.js"
import { Signature } from "./Signature.js"
import { TxId } from "./TxId.js"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
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
     * @readonly
     * @type {boolean}
     */
    isValid

    /**
     * @readonly
     * @type {Option<TxMetadata>}
     */
    metadata

    /**
     * Use `Tx.new()` instead of this constructor for creating a new Tx builder.
     * @param {TxBody} body
     * @param {TxWitnesses} witnesses
     * @param {boolean} isValid - false whilst some signatures are still missing
     * @param {Option<TxMetadata>} metadata
     */
    constructor(body, witnesses, isValid, metadata = None) {
        this.body = body
        this.witnesses = witnesses
        this.isValid = isValid
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
     * Creates a new Tx without the metadata for client-side signing where the client can't know the metadata before tx-submission.
     * @returns {Tx}
     */
    clearMetadata() {
        return new Tx(this.body, this.witnesses, this.isValid, None)
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
     * Checks that all necessary scripts are included, and that all included scripts are used
     * Shouldn't be used directly
     * @internal
     */
    /*checkScripts() {
		let scripts = this.witnesses.allScripts
		const currentScripts = new Set();

		scripts.forEach(script => {
			currentScripts.add(bytesToHex(script.hash()))
		});
		let wantedScripts = new Map();

		this.body.collectScriptHashes(wantedScripts);

		if (wantedScripts.size < scripts.length) {
			throw new Error("too many scripts included, not all are needed");
		} else if (wantedScripts.size > scripts.length) {
			wantedScripts.forEach((value, key) => {
				if (!currentScripts.has(key)) {
					if (value >= 0) {
						console.error(JSON.stringify(this.dump(), null, "  "));
						throw new Error(`missing script for input ${value}`);
					} else if (value < 0) {
						console.error(JSON.stringify(this.dump(), null, "  "));
						throw new Error(`missing script for minting policy ${-value-1}`);
					}
				}
			});
		}

		currentScripts.forEach((key) => {
			if (!wantedScripts.has(key)) {
				console.log(wantedScripts, currentScripts)
				throw new Error("detected unused script");
			}
		});
	}*/

    /**
     * @internal
     * @param {NetworkParamsHelper} networkParams
     */
    checkBalanced(networkParams) {
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
     * @internal
     * @returns {boolean}
     */
    isSmart() {
        return this.witnesses.allScripts.length > 0
    }

    /**
     * Throws an error if there isn't enough collateral
     * Also throws an error if the script doesn't require collateral, but collateral was actually included
     * Shouldn't be used directly
     * @internal
     * @param {NetworkParamsHelper} networkParams
     */
    checkCollateral(networkParams) {
        if (this.isSmart()) {
            let minCollateralPct = networkParams.minCollateralPct

            // only use the exBudget

            const fee = this.body.fee

            this.body.validateCollateral(
                networkParams,
                BigInt(Math.ceil((minCollateralPct * Number(fee)) / 100.0))
            )
        } else {
            this.body.validateCollateral(networkParams, null)
        }
    }

    /**
     * Throws error if tx is too big
     * Shouldn't be used directly
     * @internal
     * @param {NetworkParamsHelper} networkParams
     */
    checkSize(networkParams) {
        let size = this.toCbor().length

        if (size > networkParams.maxTxSize) {
            throw new Error("tx too big")
        }
    }

    /**
     * Final check that fee is big enough
     * @internal
     * @param {NetworkParamsHelper} networkParams
     */
    /*checkFee(networkParams) {
		assert(this.estimateFee(networkParams) <= this.body.fee, `fee too small (${this.body.fee} < ${this.estimateFee(networkParams)})`);
	}*/

    /**
     * @param {NetworkParamsHelper} networkParams
     * @returns {Promise<void>}
     */
    async validate(networkParams) {
        //this.checkScripts();

        // a bunch of checks
        //this.body.validateOutputs(networkParams);

        this.checkCollateral(networkParams)

        //await this.checkExecutionBudgets(networkParams);

        this.witnesses.checkExecutionBudgetLimits(networkParams)

        this.checkSize(networkParams)

        //this.checkFee(networkParams);

        this.checkBalanced(networkParams)
    }

    /**
     * Adds a signature created by a wallet. Only available after the transaction has been finalized.
     * Optionally verifies that the signature is correct.
     * @param {Signature} signature
     * @param {boolean} verify Defaults to `true`
     * @returns {Tx}
     */
    addSignature(signature, verify = true) {
        if (!this.isValid) {
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
     * @returns {TxId}
     */
    id() {
        if (!this.isValid) {
            throw new Error("can't get TxId of unfinalized Tx")
        }

        return new TxId(this.body.hash())
    }

    /**
     * Checks that all necessary scripts and UplcPrograms are included, and that all included scripts are used
     * Shouldn't be used directly
     * @internal
     */
    /*validateScripts() {
		const allScripts = this.witnesses.allScripts;
		const scriptHashes = new Set(allScripts.map(s => bytesToHex(s.hash())))

		if (allScripts.length != scriptHashes.size) {
			throw new Error("duplicate scripts included in transaction")
		}
		let wantedScripts = new Map();

		this.body.collectScriptHashes(wantedScripts);

		if (wantedScripts.size < allScripts.length) {
			throw new Error("too many scripts included, not all are needed");
		} else if (wantedScripts.size > allScripts.length) {
			wantedScripts.forEach((value, key) => {
				if (!scriptHashes.has(key)) {
					if (value >= 0) {
						console.error(JSON.stringify(this.dump(), null, "  "));
						throw new Error(`missing script for input ${value}`);
					} else if (value < 0) {
						console.error(JSON.stringify(this.dump(), null, "  "));
						throw new Error(`missing script for minting policy ${-value-1}`);
					}
				}
			});
		}

		scriptHashes.forEach((key) => {
			if (!wantedScripts.has(key)) {
				console.log(wantedScripts, scriptHashes)
				throw new Error("detected unused script");
			}
		});
	}*/
}
