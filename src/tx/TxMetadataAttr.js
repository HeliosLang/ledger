import {
    decodeInt,
    decodeList,
    decodeMap,
    decodeString,
    encodeDefList,
    encodeInt,
    encodeMap,
    encodeString,
    isList,
    isMap,
    isString
} from "@helios-lang/cbor"
import { makeByteStream } from "@helios-lang/codec-utils"

/**
 * @import { BytesLike } from "@helios-lang/codec-utils"
 * @import { PermissiveTxMetadataAttr, TxMetadataAttr } from "../index.js"
 */

/**
 * @param {BytesLike} bytes
 * @returns {TxMetadataAttr}
 */
export function decodeTxMetadataAttr(bytes) {
    const stream = makeByteStream(bytes)

    if (isString(stream)) {
        return decodeString(stream)
    } else if (isList(stream)) {
        return { list: decodeList(stream, decodeTxMetadataAttr) }
    } else if (isMap(stream)) {
        return {
            map: decodeMap(stream, decodeTxMetadataAttr, decodeTxMetadataAttr)
        }
    } else {
        return Number(decodeInt(stream))
    }
}

/**
 * @param {PermissiveTxMetadataAttr} attr
 * @returns {number[]}
 */
export function encodeTxMetadataAttr(attr) {
    if (isTxMetadataAttrString(attr)) {
        return encodeString(attr, true)
    } else if (isTxMetadataAttrNumber(attr)) {
        if (attr % 1.0 != 0.0) {
            throw new Error("not a whole number")
        }

        return encodeInt(attr)
    } else if (Array.isArray(attr)) {
        return encodeDefList(attr.map((item) => encodeTxMetadataAttr(item)))
    } else if (isTxMetadataAttrList(attr)) {
        return encodeDefList(
            attr.list.map((item) => encodeTxMetadataAttr(item))
        )
    } else if (isTxMetadataAttrMap(attr)) {
        const pairs = attr["map"]

        if (Array.isArray(pairs)) {
            return encodeMap(
                pairs.map((pair) => {
                    if (Array.isArray(pair) && pair.length == 2) {
                        /**
                         * @type {[number[], number[]]}
                         */
                        const result = [
                            encodeTxMetadataAttr(pair[0]),
                            encodeTxMetadataAttr(pair[1])
                        ]

                        return result
                    } else {
                        throw new Error("invalid metadata schema")
                    }
                })
            )
        } else {
            throw new Error("invalid metadata schema")
        }
    } else if (attr instanceof Object) {
        const entries = Array.from(Object.entries(attr))
        return encodeMap(
            entries.map(([key, value]) => {
                return [encodeString(key), encodeTxMetadataAttr(value)]
            })
        )
    } else {
        throw new Error("invalid metadata schema")
    }
}

/**
 * @param {PermissiveTxMetadataAttr} attr
 * @returns {TxMetadataAttr}
 */
export function makeTxMetadataAttr(attr) {
    if (isTxMetadataAttrString(attr)) {
        return attr
    } else if (isTxMetadataAttrNumber(attr)) {
        return attr
    } else if (isTxMetadataAttrList(attr)) {
        return attr
    } else if (isTxMetadataAttrMap(attr)) {
        return attr
    } else if (Array.isArray(attr)) {
        return { list: attr.map(makeTxMetadataAttr) }
    } else if (attr instanceof Object) {
        return {
            map: Object.entries(attr).map(([key, value]) => {
                return [key, makeTxMetadataAttr(value)]
            })
        }
    } else {
        throw new Error(
            `unable to convert '${JSON.stringify(attr)}' to TxMetadataAttr`
        )
    }
}

/**
 * @param {PermissiveTxMetadataAttr} attr
 * @returns {attr is string}
 */
export function isTxMetadataAttrString(attr) {
    return typeof attr == "string"
}

/**
 * @param {PermissiveTxMetadataAttr} attr
 * @returns {attr is number}
 */
export function isTxMetadataAttrNumber(attr) {
    return typeof attr == "number"
}

/**
 * @param {PermissiveTxMetadataAttr} attr
 * @returns {attr is {list: TxMetadataAttr[]}}
 */
export function isTxMetadataAttrList(attr) {
    return (
        !Array.isArray(attr) &&
        attr instanceof Object &&
        "list" in attr &&
        Array.isArray(attr.list)
    )
}

/**
 * @param {PermissiveTxMetadataAttr} attr
 * @returns {attr is {map: [TxMetadataAttr, TxMetadataAttr][]}}
 */
export function isTxMetadataAttrMap(attr) {
    return (
        !Array.isArray(attr) &&
        attr instanceof Object &&
        "map" in attr &&
        Object.keys(attr).length == 1 &&
        Array.isArray(attr.map)
    )
}
