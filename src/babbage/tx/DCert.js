import {
    decodeInt,
    decodeTagged,
    encodeInt,
    encodeTuple
} from "@helios-lang/cbor"
import { ByteStream } from "@helios-lang/codec-utils"
import { ConstrData, IntData } from "@helios-lang/uplc"
import { PubKeyHash, StakingHash } from "../hashes/index.js"
import { PoolParameters } from "../pool/index.js"
import { StakingCredential } from "./StakingCredential.js"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("../hashes/index.js").PubKeyHashLike} PubKeyHashLike
 * @typedef {import("./StakingCredential.js").StakingCredentialLike} StakingCredentialLike
 */

/**
 * @typedef {"Register" | "Deregister" | "Delegate" | "RegisterPool" | "RetirePool" } DCertKinds
 */

/**
 * @template {DCertKinds} T
 * @typedef {T extends "Register" ? {
 *   "Register": {
 *     credential: StakingCredential
 *   }
 * } : T extends "Deregister" ? {
 *   "Deregister": {
 *     credential: StakingCredential
 *   }
 * } : T extends "Delegate" ? {
 *   "Delegate": {
 *     credential: StakingCredential
 *     poolId: PubKeyHash
 *   }
 * } : T extends "RegisterPool" ? {
 *   "RegisterPool": {
 *     parameters: PoolParameters
 *   }
 * } : {
 *   "RetirePool": {
 *     poolId: PubKeyHash
 *     epoch: number
 *   }
 * }} DCertProps
 */

/**
 * Confusingly the DCerts in the script context uses full StakingCredentials (which can be Staking Pointer), but the Cbor ledger format only encodes the StakingHash (presumably resolving Staking Ptrs to Staking Hashes)
 * @template {DCertKinds} [T=DCertKinds]
 */
export class DCert {
    /**
     * @private
     * @type {DCertProps<T>}
     */
    props

    /**
     * @private
     * @param {DCertProps<T>} props
     */
    constructor(props) {
        this.props = props
    }

    /**
     * @param {StakingCredentialLike} credential
     * @returns {DCert<"Register">}
     */
    static Register(credential) {
        return new DCert({
            Register: {
                credential: StakingCredential.fromAlike(credential)
            }
        })
    }

    /**
     * @param {StakingCredentialLike} credential
     * @returns {DCert<"Deregister">}
     */
    static Deregister(credential) {
        return new DCert({
            Deregister: {
                credential: StakingCredential.fromAlike(credential)
            }
        })
    }

    /**
     *
     * @param {StakingCredentialLike} credential
     * @param {PubKeyHashLike} poolId
     * @returns {DCert<"Delegate">}
     */
    static Delegate(credential, poolId) {
        return new DCert({
            Delegate: {
                credential: StakingCredential.fromAlike(credential),
                poolId: PubKeyHash.fromAlike(poolId)
            }
        })
    }

    /**
     * @param {PoolParameters} parameters
     * @return {DCert<"RegisterPool">}
     */
    static RegisterPool(parameters) {
        return new DCert({
            RegisterPool: {
                parameters: parameters
            }
        })
    }

    /**
     * @param {PubKeyHashLike} poolId
     * @param {number | bigint} epoch
     * @returns {DCert<"RetirePool">}
     */
    static RetirePool(poolId, epoch) {
        return new DCert({
            RetirePool: {
                poolId: PubKeyHash.fromAlike(poolId),
                epoch: Math.round(Number(epoch))
            }
        })
    }

    /**
     *
     * @param {ByteArrayLike} bytes
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        const [tag, decodeItem] = decodeTagged(stream)

        switch (tag) {
            case 0:
                return DCert.Register(decodeItem(StakingHash))
            case 1:
                return DCert.Deregister(decodeItem(StakingHash))
            case 2:
                return DCert.Delegate(
                    decodeItem(StakingHash),
                    decodeItem(PubKeyHash)
                )
            case 3:
                return DCert.RegisterPool(decodeItem(PoolParameters))
            case 4:
                return DCert.RetirePool(
                    decodeItem(PubKeyHash),
                    decodeItem(decodeInt)
                )
            default:
                throw new Error(`unhandled DCert type (tag: ${tag})`)
        }
    }

    /**
     * @returns {this is DCert<"Register">}
     */
    isRegister() {
        return "Register" in this.props
    }

    /**
     * @returns {this is DCert<"Deregister">}
     */
    isDeregister() {
        return "Deregister" in this.props
    }

    /**
     * @returns {this is DCert<"Delegate">}
     */
    isDelegate() {
        return "Delegate" in this.props
    }

    /**
     * @returns {this is DCert<"RegisterPool">}
     */
    isRegisterPool() {
        return "RegisterPool" in this.props
    }

    /**
     * @returns {this is DCert<"RetirePool">}
     */
    isRetirePool() {
        return "RetirePool" in this.props
    }

    /**
     * @type {T extends ("Register" | "Deregister" | "Delegate") ? StakingCredential : never}
     */
    get credential() {
        return /** @type {any} */ (
            this.isRegister()
                ? this.props.Register.credential
                : this.isDeregister()
                  ? this.props.Deregister.credential
                  : this.isDelegate()
                    ? this.props.Delegate.credential
                    : undefined
        )
    }

    /**
     * @type {T extends "RetirePool" ? number : never}
     */
    get epoch() {
        return /** @type {any} */ (
            this.isRetirePool() ? this.props.RetirePool.epoch : undefined
        )
    }

    /**
     * @type {T extends ("Delegate" | "RegisterPool" | "RetirePool") ? PubKeyHash : never}
     */
    get poolId() {
        return /** @type {any} */ (
            this.isDelegate()
                ? this.props.Delegate.poolId
                : this.isRegisterPool()
                  ? this.props.RegisterPool.parameters.id
                  : this.isRetirePool()
                    ? this.props.RetirePool.poolId
                    : undefined
        )
    }

    /**
     * @type {T extends "RegisterPool" ? PoolParameters : never}
     */
    get poolParameters() {
        return /** @type {any} */ (
            this.isRegisterPool()
                ? this.props.RegisterPool.parameters
                : undefined
        )
    }

    /**
     * @type {number}
     */
    get tag() {
        return this.isRegister()
            ? 0
            : this.isDeregister()
              ? 1
              : this.isDelegate()
                ? 2
                : this.isRegisterPool()
                  ? 3
                  : 4
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        if (this.isRegister()) {
            return encodeTuple([
                encodeInt(0),
                this.props.Register.credential.toCbor()
            ])
        } else if (this.isDeregister()) {
            return encodeTuple([
                encodeInt(1),
                this.props.Deregister.credential.toCbor()
            ])
        } else if (this.isDelegate()) {
            return encodeTuple([
                encodeInt(2),
                this.props.Delegate.credential.toCbor(),
                this.props.Delegate.poolId.toCbor()
            ])
        } else if (this.isRegisterPool()) {
            return encodeTuple([
                encodeInt(3),
                this.props.RegisterPool.parameters.toCbor()
            ])
        } else if (this.isRetirePool()) {
            return encodeTuple([
                encodeInt(4),
                this.props.RetirePool.poolId,
                encodeInt(this.props.RetirePool.epoch)
            ])
        } else {
            throw new Error("unhandled DCert type")
        }
    }

    /**
     * @returns {ConstrData}
     */
    toUplcData() {
        if (this.isRegister()) {
            return new ConstrData(0, [
                this.props.Register.credential.toUplcData()
            ])
        } else if (this.isDeregister()) {
            return new ConstrData(1, [
                this.props.Deregister.credential.toUplcData()
            ])
        } else if (this.isDelegate()) {
            return new ConstrData(2, [
                this.props.Delegate.credential.toUplcData(),
                this.props.Delegate.poolId.toUplcData()
            ])
        } else if (this.isRegisterPool()) {
            return new ConstrData(3, [
                this.props.RegisterPool.parameters.id.toUplcData(),
                this.props.RegisterPool.parameters.vrf.toUplcData()
            ])
        } else if (this.isRetirePool()) {
            return new ConstrData(4, [
                this.props.RetirePool.poolId.toUplcData(),
                new IntData(this.props.RetirePool.epoch)
            ])
        } else {
            throw new Error("unhandled DCert type")
        }
    }
}
