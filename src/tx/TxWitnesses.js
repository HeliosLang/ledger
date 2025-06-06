import {
    decodeList,
    decodeObjectIKey,
    decodeSet,
    encodeDefList,
    encodeIndefList,
    encodeObjectIKey,
    encodeSet,
    isSet
} from "@helios-lang/cbor"
import { bytesToHex, equalsBytes } from "@helios-lang/codec-utils"
import { blake2b } from "@helios-lang/crypto"
import {
    decodeUplcData,
    decodeUplcProgramV1FromCbor,
    decodeUplcProgramV2FromCbor,
    decodeUplcProgramV3FromCbor
} from "@helios-lang/uplc"
import { decodeNativeScript } from "../native/index.js"
import { decodeSignature, makeDummySignature } from "../signature/index.js"
import { decodeTxRedeemer } from "./TxRedeemer.js"

/**
 * @import { BytesLike } from "@helios-lang/codec-utils"
 * @import { UplcData, UplcProgram, UplcProgramV1, UplcProgramV2, UplcProgramV3 } from "@helios-lang/uplc"
 * @import { MintingPolicyHash, NativeScript, NetworkParams, Signature, StakingValidatorHash, TxRedeemer, TxWitnesses, TxWitnessesEncodingConfig, ValidatorHash } from "../index.js"
 */

/**
 * @typedef {{
 *   encodingConfig?: TxWitnessesEncodingConfig
 *   signatures: Signature[]
 *   datums: UplcData[]
 *   redeemers: TxRedeemer[]
 *   nativeScripts: NativeScript[]
 *   v1Scripts: UplcProgramV1[]
 *   v2Scripts: UplcProgramV2[]
 *   v2RefScripts: UplcProgramV2[]
 *   v3Scripts: UplcProgramV3[]
 *   v3RefScripts: UplcProgramV3[]
 * }} TxWitnessesProps
 */

/**
 * @param {object} props
 * @param {TxWitnessesEncodingConfig} [props.encodingConfig]
 * @param {Signature[]} props.signatures
 * @param {UplcData[]} props.datums
 * @param {TxRedeemer[]} props.redeemers
 * @param {NativeScript[]} props.nativeScripts
 * @param {UplcProgramV1[]} props.v1Scripts
 * @param {UplcProgramV2[]} props.v2Scripts
 * @param {UplcProgramV2[]} props.v2RefScripts
 * @param {UplcProgramV3[]} props.v3Scripts
 * @param {UplcProgramV3[]} props.v3RefScripts
 * @returns {TxWitnesses}
 */
export function makeTxWitnesses(props) {
    return new TxWitnessesImpl(props)
}

/**
 * @param {BytesLike} bytes
 * @returns {TxWitnesses}
 */
export function decodeTxWitnesses(bytes) {
    let signaturesEncodedAsSet = false
    let nativeScriptsEncodedAsSet = false
    let v1ScriptsEncodedAsSet = false
    let datumsEncodedAsSet = false
    let v2ScriptsEncodedAsSet = false
    let v3ScriptsEncodedAsSet = false

    const {
        0: signatures,
        1: nativeScripts,
        3: v1Scripts,
        4: datums,
        5: redeemers,
        6: v2Scripts,
        7: v3Scripts
    } = decodeObjectIKey(bytes, {
        0: (s) => {
            signaturesEncodedAsSet = isSet(s)
            return decodeSet(s, decodeSignature)
        },
        1: (s) => {
            nativeScriptsEncodedAsSet = isSet(s)
            return decodeSet(s, decodeNativeScript)
        },
        3: (s) => {
            v1ScriptsEncodedAsSet = isSet(s)
            return decodeSet(s, (bytes) => decodeUplcProgramV1FromCbor(bytes))
        },
        4: (s) => {
            datumsEncodedAsSet = isSet(s)
            return decodeSet(s, decodeUplcData)
        },
        5: (s) => decodeList(s, decodeTxRedeemer),
        6: (s) => {
            v2ScriptsEncodedAsSet = isSet(s)
            return decodeSet(s, (bytes) => decodeUplcProgramV2FromCbor(bytes))
        },
        7: (s) => {
            v3ScriptsEncodedAsSet = isSet(s)
            return decodeSet(s, (bytes) => decodeUplcProgramV3FromCbor(bytes))
        }
    })

    return new TxWitnessesImpl({
        encodingConfig: {
            signaturesAsSet: signaturesEncodedAsSet,
            nativeScriptsAsSet: nativeScriptsEncodedAsSet,
            v1ScriptsAsSet: v1ScriptsEncodedAsSet,
            datumsAsSet: datumsEncodedAsSet,
            v2ScriptsAsSet: v2ScriptsEncodedAsSet,
            v3ScriptsAsSet: v3ScriptsEncodedAsSet
        },
        signatures: signatures ?? [],
        nativeScripts: nativeScripts ?? [],
        v1Scripts: v1Scripts ?? [],
        datums: datums ?? [],
        redeemers: redeemers ?? [],
        v2Scripts: v2Scripts ?? [],
        v2RefScripts: [],
        v3Scripts: v3Scripts ?? [],
        v3RefScripts: []
    })
}

/**
 * Represents the pubkey signatures, and datums/redeemers/scripts that are witnessing a transaction.
 * @implements {TxWitnesses}
 */
class TxWitnessesImpl {
    /**
     * @readonly
     * @type {TxWitnessesEncodingConfig}
     */
    encodingConfig

    /**
     * @type {Signature[]}
     */
    signatures

    /**
     * @readonly
     * @type {UplcData[]}
     */
    datums

    /**
     * @readonly
     * @type {TxRedeemer[]}
     */
    redeemers

    /**
     * @readonly
     * @type {NativeScript[]}
     */
    nativeScripts

    /**
     * @readonly
     * @type {UplcProgramV1[]}
     */
    v1Scripts

    /**
     * @readonly
     * @type {UplcProgramV2[]}
     */
    v2Scripts

    /**
     * @readonly
     * @type {UplcProgramV2[]}
     */
    v2RefScripts

    /**
     * @readonly
     * @type {UplcProgramV3[]}
     */
    v3Scripts

    /**
     * @readonly
     * @type {UplcProgramV3[]}
     */
    v3RefScripts

    /**
     *
     * @param {TxWitnessesProps} props
     */
    constructor({
        encodingConfig,
        signatures,
        datums,
        redeemers,
        nativeScripts,
        v1Scripts,
        v2Scripts,
        v2RefScripts,
        v3Scripts,
        v3RefScripts
    }) {
        this.encodingConfig = encodingConfig ?? { signaturesAsSet: true }
        this.signatures = signatures
        this.datums = datums
        this.redeemers = redeemers
        this.nativeScripts = nativeScripts
        this.v1Scripts = v1Scripts
        this.v2Scripts = v2Scripts
        this.v2RefScripts = v2RefScripts
        this.v3Scripts = v3Scripts
        this.v3RefScripts = v3RefScripts
    }

    /**
     * @type {"TxWitnesses"}
     */
    get kind() {
        return "TxWitnesses"
    }

    /**
     * Returns all the scripts, including the reference scripts
     * @type {(NativeScript | UplcProgram)[]}
     */
    get allScripts() {
        return /** @type {(NativeScript | UplcProgram)[]} */ ([])
            .concat(this.v1Scripts)
            .concat(this.v2Scripts)
            .concat(this.v2RefScripts)
            .concat(this.v3Scripts)
            .concat(this.v3RefScripts)
            .concat(this.nativeScripts)
    }

    /**
     * Returns all the non-native scripts (includes the reference scripts)
     * @type {UplcProgram[]}
     */
    get allNonNativeScripts() {
        return /** @type {UplcProgram[]} */ ([])
            .concat(this.v1Scripts)
            .concat(this.v2Scripts)
            .concat(this.v2RefScripts)
            .concat(this.v3Scripts)
            .concat(this.v3RefScripts)
    }

    /**
     * Used to calculate the correct min fee
     * @param {number} n - number of dummy signatures to add
     */
    addDummySignatures(n) {
        if (n == 0) {
            return
        }

        for (let i = 0; i < n; i++) {
            this.signatures.push(makeDummySignature())
        }
    }

    /**
     * @param {Signature} signature
     */
    addSignature(signature) {
        // only add unique signautres
        if (
            this.signatures.every(
                (s) =>
                    !s.isDummy() && !s.pubKeyHash.isEqual(signature.pubKeyHash)
            )
        ) {
            this.signatures.push(signature)
        }
    }

    /**
     * @param {NetworkParams} params
     * @returns {bigint}
     */
    calcExFee(params) {
        return this.redeemers.reduce(
            (sum, redeemer) => sum + redeemer.calcExFee(params),
            0n
        )
    }

    /**
     * @returns {number}
     */
    countNonDummySignatures() {
        return this.signatures.reduce((n, s) => (s.isDummy() ? n : n + 1), 0)
    }

    /**
     * @returns {object}
     */
    dump() {
        return {
            signatures: this.signatures.map((pkw) => pkw.dump()),
            datums: this.datums.map((datum) => datum.toString()),
            redeemers: this.redeemers.map((r) => r.dump()),
            nativeScripts: this.nativeScripts.map((script) =>
                script.toJsonSafe()
            ),
            v2Scripts: this.v2Scripts.map((script) =>
                bytesToHex(script.toCbor())
            ),
            v2RefScripts: this.v2RefScripts.map((script) =>
                bytesToHex(script.toCbor())
            ),
            v3Scripts: this.v3Scripts.map((script) =>
                bytesToHex(script.toCbor())
            ),
            v3RefScripts: this.v3RefScripts.map((script) =>
                bytesToHex(script.toCbor())
            )
        }
    }

    /**
     * TODO: also look for v3 scripts
     * @param {number[] | MintingPolicyHash | ValidatorHash | StakingValidatorHash} hash
     * @returns {UplcProgramV1 | UplcProgramV2}
     */
    findUplcProgram(hash) {
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

        if (Array.isArray(hash)) {
            throw new Error(`script for ${bytesToHex(hash)} not found`)
        } else if (hash.kind == "MintingPolicyHash") {
            throw new Error(
                `script for minting policy ${hash.toHex()} not found`
            )
        } else if (hash.kind == "ValidatorHash") {
            throw new Error(`script for validator ${hash.toHex()} not found`)
        } else if (hash.kind == "StakingValidatorHash") {
            throw new Error(
                `script for staking validator ${hash.toHex()} not found`
            )
        } else {
            throw new Error("unexpected hash type")
        }
    }

    /**
     * Used to determine of Tx needs collateral
     * @returns {boolean}
     */
    isSmart() {
        return this.allNonNativeScripts.length > 0
    }

    /**
     * @param {UplcProgram[]} refScriptsInRefInputs
     */
    recover(refScriptsInRefInputs) {
        refScriptsInRefInputs.forEach((refScript) => {
            const h = refScript.hash()

            if (refScript.plutusVersion == "PlutusScriptV1") {
                throw new Error("UplcProgramV1 ref script not supported")
            } else if (refScript.plutusVersion == "PlutusScriptV2") {
                if (
                    !this.v2RefScripts.some((prev) =>
                        equalsBytes(prev.hash(), h)
                    )
                ) {
                    // TODO: do these scripts need to ordered?
                    this.v2RefScripts.push(refScript)
                }
            } else if (refScript.plutusVersion == "PlutusScriptV3") {
                if (
                    !this.v3RefScripts.some((prev) =>
                        equalsBytes(prev.hash(), h)
                    )
                ) {
                    // TODO: do these scripts need to ordered?
                    this.v3RefScripts.push(refScript)
                }
            }
        })
    }

    /**
     * Used to removed any dummy signatures added while calculating the tx fee
     * @param {number} n
     */
    removeDummySignatures(n) {
        if (n == 0) {
            return
        }

        /**
         * @type {Signature[]}
         */
        const res = []

        let j = 0
        for (let i = 0; i < this.signatures.length; i++) {
            const signature = this.signatures[i]

            if (signature.isDummy() && j < n) {
                j++
            } else {
                res.push(signature)
            }
        }

        if (j != n) {
            throw new Error(
                `internal error: unable to remove ${n} dummy signatures`
            )
        }

        this.signatures = res
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        /**
         * @type {Map<number, number[]>}
         */
        const m = new Map()

        if (this.signatures.length > 0) {
            const encodeAsSet = this.encodingConfig.signaturesAsSet ?? true

            m.set(
                0,
                encodeAsSet
                    ? encodeSet(this.signatures)
                    : encodeDefList(this.signatures)
            )
        }

        if (this.nativeScripts.length > 0) {
            const encodeAsSet = this.encodingConfig.nativeScriptsAsSet ?? true

            m.set(
                1,
                encodeAsSet
                    ? encodeSet(this.nativeScripts)
                    : encodeDefList(this.nativeScripts)
            )
        }

        if (this.v1Scripts.length > 0) {
            const encodeAsSet = this.encodingConfig.v1ScriptsAsSet ?? true

            m.set(
                3,
                encodeAsSet
                    ? encodeSet(this.v1Scripts)
                    : encodeDefList(this.v1Scripts)
            )
        }

        if (this.datums.length > 0) {
            const encodeAsSet = this.encodingConfig.datumsAsSet ?? true

            m.set(
                4,
                encodeAsSet
                    ? encodeSet(this.datums)
                    : encodeDefList(this.datums)
            )
        }

        if (this.redeemers.length > 0) {
            m.set(5, encodeDefList(this.redeemers))
        }

        if (this.v2Scripts.length > 0) {
            const encodeAsSet = this.encodingConfig.v2ScriptsAsSet ?? true

            m.set(
                6,
                encodeAsSet
                    ? encodeSet(this.v2Scripts)
                    : encodeDefList(this.v2Scripts)
            )
        }

        if (this.v3Scripts.length > 0) {
            const encodeAsSet = this.encodingConfig.v3ScriptsAsSet ?? true

            m.set(
                7,
                encodeAsSet
                    ? encodeSet(this.v3Scripts)
                    : encodeDefList(this.v3Scripts)
            )
        }

        return encodeObjectIKey(m)
    }

    /**
     * Throws error if signatures are incorrect
     * @param {number[]} bodyBytes
     */
    verifySignatures(bodyBytes) {
        for (let signature of this.signatures) {
            signature.verify(blake2b(bodyBytes))
        }
    }
}
