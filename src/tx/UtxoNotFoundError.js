/**
 * @import { TxOutputId } from "../index.js"
 */

export class UtxoNotFoundError extends Error {
    /**
     * @readonly
     * @type {TxOutputId}
     */
    utxoId

    /**
     * @param {TxOutputId} utxoId
     */
    constructor(utxoId) {
        super(`UTxO ${utxoId.toString()} not found`)

        this.utxoId = utxoId
    }
}
