import { encodeInt, encodeTuple } from "@helios-lang/cbor"
import { toInt } from "@helios-lang/codec-utils"
import { makeConstrData, makeIntData } from "@helios-lang/uplc"

/**
 * @import { IntLike } from "@helios-lang/codec-utils"
 * @import { ConstrData } from "@helios-lang/uplc"
 * @import { PubKeyHash, RetirePoolDCert } from "src/index.js"
 */

/**
 * @param {PubKeyHash} poolId
 * @param {IntLike} epoch
 * @returns {RetirePoolDCert}
 */
export function makeRetirePoolDCert(poolId, epoch) {
    return new RetirePoolDCertImpl(poolId, toInt(epoch))
}

/**
 * Confusingly the DCerts in the script context uses full StakingCredentials (which can be Staking Pointer), but the Cbor ledger format only encodes the StakingHash (presumably resolving Staking Ptrs to Staking Hashes)
 * @implements {RetirePoolDCert}
 */
class RetirePoolDCertImpl {
    /**
     * @readonly
     * @type {PubKeyHash}
     */
    poolId

    /**
     * @readonly
     * @type {number}
     */
    epoch

    /**
     * @param {PubKeyHash} poolId
     * @param {number} epoch
     */
    constructor(poolId, epoch) {
        this.poolId = poolId
        this.epoch = epoch
    }

    /**
     * @type {"RetirePoolDCert"}
     */
    get kind() {
        return "RetirePoolDCert"
    }

    /**
     * @type {4}
     */
    get tag() {
        return 4
    }

    /**
     * @returns {object}
     */
    dump() {
        return {
            dcertType: "RetirePool"
        }
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([encodeInt(4), this.poolId, encodeInt(this.epoch)])
    }

    /**
     * @returns {ConstrData}
     */
    toUplcData() {
        return makeConstrData({
            tag: 4,
            fields: [this.poolId.toUplcData(), makeIntData(this.epoch)]
        })
    }
}
