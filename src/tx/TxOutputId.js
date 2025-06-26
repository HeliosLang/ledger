import {
    decodeInt,
    decodeTuple,
    encodeInt,
    encodeTuple
} from "@helios-lang/cbor"
import { compareBytes, makeByteStream, toInt } from "@helios-lang/codec-utils"
import {
    assertConstrData,
    expectIntData,
    makeConstrData,
    makeIntData
} from "@helios-lang/uplc"
import {
    convertUplcDataToTxId,
    decodeTxId,
    makeDummyTxId,
    makeTxId
} from "../hashes/index.js"

/**
 * @import { BytesLike, IntLike } from "@helios-lang/codec-utils"
 * @import { ConstrData, UplcData } from "@helios-lang/uplc"
 * @import { TxId, TxOutputId, TxOutputIdLike } from "../index.js"
 */

/**
 * @overload
 * @param {TxId} txId
 * @param {IntLike} index
 * @returns {TxOutputId}
 */
/**
 * @overload
 * @param {TxOutputIdLike} arg
 * @returns {TxOutputId}
 */
/**
 * @param {(
 *   [TxId, IntLike]
 *   | [TxOutputIdLike]
 * )} args
 * @returns {TxOutputId}
 */
export function makeTxOutputId(...args) {
    if (args.length == 2) {
        return new TxOutputIdImpl(args[0], toInt(args[1]))
    } else {
        const arg = args[0]
        if (
            typeof arg == "object" &&
            "kind" in arg &&
            arg.kind == "TxOutputId"
        ) {
            return arg
        } else if (typeof arg == "string") {
            return parseTxOutputId(arg)
        } else if (Array.isArray(arg)) {
            const n = arg.length
            if (n != 2) {
                throw new Error(
                    `expected two entries in arg array of TxOutputId, got ${n}`
                )
            }

            return new TxOutputIdImpl(makeTxId(arg[0]), toInt(arg[1]))
        } else if (
            typeof arg == "object" &&
            "txId" in arg &&
            "utxoIdx" in arg
        ) {
            return new TxOutputIdImpl(makeTxId(arg.txId), toInt(arg.utxoIdx))
        } else {
            throw new Error(
                `unhandled TxOutputId.new arguments ${JSON.stringify(arg)}`
            )
        }
    }
}

/**
 * @param {number} seed
 * @param {number} index
 * @returns {TxOutputId}
 */
export function makeDummyTxOutputId(seed = -1, index = 0) {
    return new TxOutputIdImpl(makeDummyTxId(seed), index)
}

/**
 * @param {BytesLike} bytes
 * @returns {TxOutputId}
 */
export function decodeTxOutputId(bytes) {
    const stream = makeByteStream(bytes)

    const [txId, index] = decodeTuple(stream, [decodeTxId, decodeInt])

    return new TxOutputIdImpl(txId, toInt(index))
}

/**
 * @param {TxOutputIdLike} arg
 * @returns {boolean}
 */
export function isValidTxOutputId(arg) {
    try {
        makeTxOutputId(arg)
        return true
    } catch (e) {
        return false
    }
}

/**
 * @param {string} str
 * @returns {TxOutputId}
 */
export function parseTxOutputId(str) {
    str = str.trim()

    if (str.includes("#")) {
        const parts = str.trim().split("#")

        if (parts.length != 2) {
            throw new Error(`expected <txId>#<utxoIdx>, got ${str}`)
        }

        const utxoIdx = parseInt(parts[1])

        if (utxoIdx.toString() != parts[1]) {
            throw new Error(`bad utxoIdx in ${str}`)
        }

        return new TxOutputIdImpl(makeTxId(parts[0]), utxoIdx)
    } else {
        const part0 = str.slice(0, 64)
        const part1 = str.slice(64)
        const txID = makeTxId(part0)
        const utxoIdx = parseInt(part1)

        if (utxoIdx.toString() != part1) {
            throw new Error(`bad utxoIdx in ${str}`)
        }

        return new TxOutputIdImpl(txID, utxoIdx)
    }
}

/**
 * @param {TxOutputId} a
 * @param {TxOutputId} b
 * @returns {number}
 */
export function compareTxOutputIds(a, b) {
    const res = compareBytes(a.txId.bytes, b.txId.bytes)

    if (res == 0) {
        return a.index - b.index
    } else {
        return res
    }
}

/**
 * @param {UplcData} data
 * @returns {TxOutputId}
 */
export function convertUplcDataToTxOutputId(data) {
    assertConstrData(data, 0, 2)

    return new TxOutputIdImpl(
        convertUplcDataToTxId(data.fields[0]),
        toInt(expectIntData(data.fields[1]).value)
    )
}

/**
 * @implements {TxOutputId}
 */
class TxOutputIdImpl {
    /**
     * @readonly
     * @type {TxId}
     */
    txId

    /**
     * @readonly
     * @type {number}
     */
    index

    /**
     * @param {TxId} txId
     * @param {number} index
     */
    constructor(txId, index) {
        this.txId = txId
        this.index = index
    }

    /**
     * @type {"TxOutputId"}
     */
    get kind() {
        return "TxOutputId"
    }

    /**
     * @param {TxOutputId} other
     * @returns {boolean}
     */
    isEqual(other) {
        return this.txId.isEqual(other.txId) && this.index == other.index
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([this.txId.toCbor(), encodeInt(this.index)])
    }

    /**
     * @returns {string}
     */
    toString() {
        return `${this.txId.toHex()}#${this.index.toString()}`
    }

    /**
     * @returns {string}
     */
    toURLString() {
        return `${this.txId.toHex()}${this.index.toString()}`
    }

    /**
     * @returns {ConstrData}
     */
    toUplcData() {
        return makeConstrData(0, [
            this.txId.toUplcData(),
            makeIntData(this.index)
        ])
    }
}
