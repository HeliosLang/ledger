import {
    encodeBytes,
    encodeInt,
    encodeTag,
    encodeTuple
} from "@helios-lang/cbor"
import { bytesToHex } from "@helios-lang/codec-utils"
import { makeConstrData } from "@helios-lang/uplc"
import { hashDatum } from "../hashes/index.js"

/**
 * @import { ConstrData, UplcData } from "@helios-lang/uplc"
 * @import { DatumHash, InlineTxOutputDatum } from "src/index.js"
 */

/**
 * @param {UplcData} data
 * @returns {InlineTxOutputDatum}
 */
export function makeInlineTxOutputDatum(data) {
    return new InlineTxOutputDatumImpl(data)
}

/**
 * On-chain the TxOutputDatum has 3 variants (`none`, `hash` and `inline`), off-chain it is more convenient to treat it as an Option of two variants
 * @implements {InlineTxOutputDatum} [T=TxOutputDatumKind]
 */
class InlineTxOutputDatumImpl {
    /**
     * @readonly
     * @type {UplcData}
     */
    data

    /**
     * @param {UplcData} data
     */
    constructor(data) {
        this.data = data
    }

    /**
     * @type {"InlineTxOutputDatum"}
     */
    get kind() {
        return "InlineTxOutputDatum"
    }

    /**
     * @type {DatumHash}
     */
    get hash() {
        return hashDatum(this.data)
    }

    /**
     * @returns {InlineTxOutputDatum}
     */
    copy() {
        return new InlineTxOutputDatumImpl(this.data)
    }

    /**
     * @returns {Object}
     */
    dump() {
        return {
            inlineCbor: bytesToHex(this.data.toCbor()),
            inlineSchema: JSON.parse(this.data.toSchemaJson())
        }
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([
            encodeInt(1n),
            encodeTag(24n).concat(encodeBytes(this.data.toCbor()))
        ])
    }

    /**
     * Used by script context emulation
     * @returns {ConstrData}
     */
    toUplcData() {
        return makeConstrData({ tag: 2, fields: [this.data] })
    }
}
