/**
 * @import { TxId, TxInput } from "../index.js"
 */

export class UtxoAlreadySpentError extends Error {
    /**
     * @readonly
     * @type {TxInput}
     */
    utxo

    /**
     * @readonly
     * @type {TxId | undefined}
     */
    consumedBy

    /**
     * @param {TxInput} utxo
     * @param {TxId | undefined} consumedBy
     */
    constructor(utxo, consumedBy = undefined) {
        const utxoId = utxo.id

        super(
            `UTxO ${utxoId.toString()} already spent${consumedBy ? `(spent by tx ${consumedBy.toString()}` : ""}`
        )

        this.utxo = utxo
        this.consumedBy = consumedBy
    }
}
