import { encodeInt, encodeTuple } from "@helios-lang/cbor"
import { bytesToHex } from "@helios-lang/codec-utils"
import { makeConstrData } from "@helios-lang/uplc"
import { hashDatum } from "../hashes/index.js"

/**
 * @import { ConstrData, UplcData } from "@helios-lang/uplc"
 * @import { DatumHash, HashedTxOutputDatum } from "src/index.js"
 */

/**
 * @param {DatumHash | UplcData} arg
 * @returns {HashedTxOutputDatum}
 */
export function makeHashedTxOutputDatum(arg) {
    if (arg.kind == "DatumHash") {
        return new HashedTxOutputDatumImpl(arg)
    } else {
        return new HashedTxOutputDatumImpl(hashDatum(arg), arg)
    }
}

/**
 * On-chain the TxOutputDatum has 3 variants (`none`, `hash` and `inline`), off-chain it is more convenient to treat it as an Option of two variants
 */
class HashedTxOutputDatumImpl {
    /**
     * @readonly
     * @type {DatumHash}
     */
    hash

    /**
     * @readonly
     * @type {UplcData | undefined}
     */
    data

    /**
     * @param {DatumHash} hash
     * @param {UplcData | undefined} data
     */
    constructor(hash, data = undefined) {
        this.hash = hash
        this.data = data
    }

    /**
     * @type {"HashedTxOutputDatum"}
     */
    get kind() {
        return "HashedTxOutputDatum"
    }

    /**
     * @returns {HashedTxOutputDatum}
     */
    copy() {
        return new HashedTxOutputDatumImpl(this.hash, this.data)
    }

    /**
     * @returns {object}
     */
    dump() {
        return {
            hash: this.hash.dump(),
            cbor: this.data ? bytesToHex(this.data.toCbor()) : null,
            schema: this.data ? JSON.parse(this.data.toSchemaJson()) : null
        }
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([encodeInt(0n), this.hash.toCbor()])
    }

    /**
     * Used by script context emulation
     * @returns {ConstrData}
     */
    toUplcData() {
        return makeConstrData({ tag: 1, fields: [this.hash.toUplcData()] })
    }
}
