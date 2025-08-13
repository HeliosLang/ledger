import { makeConstrData } from "@helios-lang/uplc"

/**
 * @import { ConstrData, UplcData } from "@helios-lang/uplc"
 * @import { SpendingPurpose, TxOutputId } from "../index.js"
 */

/**
 * @param {TxOutputId} utxoId
 * @returns {SpendingPurpose}
 */
export function makeSpendingPurpose(utxoId) {
    return new SpendingPurposeImpl(utxoId)
}

/**
 * Doesn't include functionality to make Tx UplcData as that is done external
 * @implements {SpendingPurpose}
 */
class SpendingPurposeImpl {
    /**
     * @readonly
     * @type {TxOutputId}
     */
    utxoId

    /**
     * @param {TxOutputId}  utxoId
     */
    constructor(utxoId) {
        this.utxoId = utxoId
    }

    /**
     * @type {"SpendingPurpose"}
     */
    get kind() {
        return "SpendingPurpose"
    }

    /**
     * @returns {ConstrData}
     */
    toUplcData() {
        return makeConstrData(1, [this.utxoId.toUplcData()])
    }
}
