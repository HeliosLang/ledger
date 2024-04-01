import { decodeTagged, encodeInt, encodeTuple } from "@helios-lang/cbor"
import { ByteStream } from "@helios-lang/codec-utils"
import { None } from "@helios-lang/type-utils"
import { ConstrData } from "@helios-lang/uplc"
import { PubKeyHash } from "./PubKeyHash.js"
import { StakingValidatorHash } from "./StakingValidatorHash.js"
import { ValidatorHash } from "./ValidatorHash.js"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 * @typedef {import("../hashes/index.js").PubKeyHashLike} PubKeyHashLike
 * @typedef {import("../hashes/index.js").StakingValidatorHashLike} StakingValidatorHashLike
 */

/**
 * @typedef {"PubKey" | "Validator"} StakingHashKind
 */

/**
 * @template {StakingHashKind} T
 * @typedef {T extends "PubKey" ? {
 *   hash: PubKeyHash
 * } : {
 *   hash: StakingValidatorHash
 * }} StakingHashProps
 */

/**
 * @typedef {StakingHash | PubKeyHash | StakingValidatorHash} StakingHashLike
 */

/**
 * Similar to Credential, wrapper for StakingValidatorHash | PubKeyHash
 * @template {StakingHashKind} [T=StakingHashKind]
 */
export class StakingHash {
    /**
     * @private
     * @readonly
     * @type {T}
     */
    kind

    /**
     * @private
     * @readonly
     * @type {StakingHashProps<T>}
     */
    props

    /**
     * @private
     * @param {T} kind
     * @param {StakingHashProps<T>} props
     */
    constructor(kind, props) {
        this.kind = kind
        this.props = props
    }

    /**
     * @param {PubKeyHashLike} hash
     * @returns {StakingHash<"PubKey">}
     */
    static PubKey(hash) {
        return new StakingHash("PubKey", { hash: PubKeyHash.fromAlike(hash) })
    }

    /**
     * @param {StakingValidatorHashLike} hash
     * @returns {StakingHash<"Validator">}
     */
    static Validator(hash) {
        return new StakingHash("Validator", {
            hash: StakingValidatorHash.fromAlike(hash)
        })
    }

    /**
     * @param {StakingHashLike} arg
     * @returns {StakingHash}
     */
    static fromAlike(arg) {
        if (arg instanceof StakingHash) {
            return arg
        } else if (arg instanceof PubKeyHash) {
            return StakingHash.PubKey(arg)
        } else {
            return StakingHash.Validator(arg)
        }
    }

    /**
     * @param {ByteArrayLike} bytes
     * @returns {StakingHash}
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        const [tag, decodeItem] = decodeTagged(stream)

        switch (tag) {
            case 0:
                return StakingHash.PubKey(decodeItem(PubKeyHash))
            case 1:
                return StakingHash.Validator(decodeItem(ValidatorHash))
            default:
                throw new Error(
                    `expected 0 or 1 StakingHash cbor tag, got ${tag}`
                )
        }
    }

    /**
     *
     * @param {UplcData} data
     */
    static fromUplcData(data) {
        ConstrData.assert(data, None, 1)

        switch (data.tag) {
            case 0:
                return StakingHash.PubKey(
                    PubKeyHash.fromUplcData(data.fields[0])
                )
            case 1:
                return StakingHash.Validator(
                    StakingValidatorHash.fromUplcData(data.fields[0])
                )
            default:
                throw new Error(
                    `expected 0 or 1 StakingHash ConstrData tag, got ${data.tag}`
                )
        }
    }

    /**
     * @type {number[]}
     */
    get bytes() {
        return this.hash.bytes
    }

    /**
     * @type {T extends "PubKey" ? PubKeyHash : T extends "Validator" ? StakingValidatorHash : (PubKeyHash | StakingValidatorHash)}
     */
    get hash() {
        return /** @type {any} */ (this.props.hash)
    }

    /**
     * @type {T extends "PubKey" ? PubKeyHash : T extends "Validator" ? typeof None : Option<PubKeyHash>}
     */
    get pubKeyHash() {
        return /** @type {any} */ (this.isPubKey() ? this.props.hash : None)
    }

    /**
     * @type {T extends "Validator" ? StakingValidatorHash : T extends "PubKey" ? typeof None : Option<StakingValidatorHash>}
     */
    get stakingValidatorHash() {
        return /** @type {any} */ (this.isValidator() ? this.props.hash : None)
    }

    /**
     * @returns {this is StakingHash<"PubKey">}
     */
    isPubKey() {
        return "PubKey" == this.kind
    }

    /**
     * @returns {this is StakingHash<"Validator">}
     */
    isValidator() {
        return "Validator" == this.kind
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([
            encodeInt(this.isPubKey() ? 0 : 1),
            this.props.hash.toCbor()
        ])
    }

    /**
     * @returns {ConstrData}
     */
    toUplcData() {
        return new ConstrData(this.isPubKey() ? 0 : 1, [
            this.props.hash.toUplcData()
        ])
    }
}
