import { makeConstrData } from "@helios-lang/uplc"

/**
 * @import { ConstrData, UplcData } from "@helios-lang/uplc"
 * @import { SpendingPurposeV3, TxOutputId } from "../index.js"
 */

/**
 * @param {TxOutputId} utxoId
 * @param {UplcData | undefined} datum
 * @returns {SpendingPurposeV3}
 */
export function makeSpendingPurposeV3(utxoId, datum) {
    return new SpendingPurposeV3Impl(utxoId, datum)
}

/**
 * Doesn't include functionality to make Tx UplcData as that is done external
 */
class SpendingPurposeV3Impl {
    /**
     * @readonly
     * @type {TxOutputId}
     */
    utxoId

    /**
     * @readonly
     * @type {UplcData | undefined}
     */
    datum

    /**
     * @param {TxOutputId}  utxoId
     * @param {UplcData | undefined} datum
     */
    constructor(utxoId, datum) {
        this.utxoId = utxoId
        this.datum = datum
    }

    /**
     * @type {"SpendingPurposeV3"}
     */
    get kind() {
        return "SpendingPurposeV3"
    }

    /**
     * @returns {ConstrData}
     */
    toUplcData() {
        return makeConstrData(1, [
            this.utxoId.toUplcDataV3(),
            this.datum ? makeConstrData(0, [this.datum]) : makeConstrData(1, [])
        ])
    }
}
