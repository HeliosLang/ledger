import { decodeBytes, decodeTag, decodeTagged } from "@helios-lang/cbor"
import { decodeUplcData, expectConstrData } from "@helios-lang/uplc"
import { convertUplcDataToDatumHash, decodeDatumHash } from "../hashes/index.js"
import { makeHashedTxOutputDatum } from "./HashedTxOutputDatum.js"
import { makeInlineTxOutputDatum } from "./InlineTxOutputDatum.js"

/**
 * @import { BytesLike } from "@helios-lang/codec-utils"
 * @import { UplcData } from "@helios-lang/uplc"
 * @import { HashedTxOutputDatum, InlineTxOutputDatum, TxOutputDatum, TxOutputDatumCastable, TxOutputDatumLike, UplcDataConverter } from "src/index.js"
 */

/**
 * @template T
 * @template {TxOutputDatumCastable<T>} D
 * @overload
 * @param {D} data
 * @param {UplcDataConverter<any, T>} cast
 * @returns {D extends {hash: T} ? HashedTxOutputDatum : InlineTxOutputDatum}
 */
/**
 * @overload
 * @param {TxOutputDatumLike} arg
 * @returns {TxOutputDatum | undefined}
 */
/**
 * @template T
 * @template {TxOutputDatumCastable<T>} D
 * @param {(
 *   [D, UplcDataConverter<any, T>]
 *   | [TxOutputDatumLike]
 * )} args
 * @returns {TxOutputDatum | undefined}
 */
export function makeTxOutputDatum(...args) {
    if (args.length == 1) {
        const arg = args[0]
        if (arg === undefined) {
            return undefined
        } else if (
            arg.kind == "HashedTxOutputDatum" ||
            arg.kind == "InlineTxOutputDatum"
        ) {
            return arg
        } else if (arg.kind == "DatumHash") {
            return makeHashedTxOutputDatum(arg)
        } else {
            return makeInlineTxOutputDatum(arg)
        }
    } else if (args.length == 2) {
        const [data, cast] = args
        return /** @type {any} */ (
            "hash" in data
                ? makeHashedTxOutputDatum(cast.toUplcData(data.hash))
                : makeInlineTxOutputDatum(cast.toUplcData(data.inline))
        )
    } else {
        throw new Error("invalid number of arguments for makeTxOutputDatum")
    }
}

/**
 * @param {BytesLike} bytes
 * @returns {TxOutputDatum}
 */
export function decodeTxOutputDatum(bytes) {
    const [type, decodeItem] = decodeTagged(bytes)

    switch (type) {
        case 0:
            return makeHashedTxOutputDatum(decodeItem(decodeDatumHash))
        case 1:
            return makeInlineTxOutputDatum(
                decodeItem((bytes) => {
                    const tag = decodeTag(bytes)
                    if (tag != 24n) {
                        throw new Error(`expected 24 as tag, got ${tag}`)
                    }

                    return decodeUplcData(decodeBytes(bytes))
                })
            )
        default:
            throw new Error(`unhandled TxOutputDatum type ${type}`)
    }
}

/**
 * @param {UplcData} data
 * @returns {TxOutputDatum | undefined}
 */
export function convertUplcDataToTxOutputDatum(data) {
    const { tag, fields } = expectConstrData(data)

    switch (tag) {
        case 0:
            if (fields.length != 0) {
                throw new Error(
                    `expected 0 fields for TxOutputDatum::None ConstrData, got ${fields.length} fields`
                )
            }

            return undefined
        case 1:
            if (fields.length != 1) {
                throw new Error(
                    `expected 1 field for TxOutputDatum::Hash ConstrData, got ${fields.length} fields`
                )
            }

            return makeHashedTxOutputDatum(
                convertUplcDataToDatumHash(fields[0])
            )
        case 2:
            if (fields.length != 1) {
                throw new Error(
                    `expected 1 field for TxOutputDatum::Inline ConstrData, got ${fields.length} fields`
                )
            }

            return makeInlineTxOutputDatum(fields[0])
        default:
            throw new Error(
                `expected 0, 1 or 2 TxOutputDatum ConstrData tag, got ${tag}`
            )
    }
}
