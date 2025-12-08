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
 * @import { TxMetadataAttr } from "../index.js"
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
 * @param {TxMetadataAttr} attr
 * @returns {number[]}
 */
export function encodeTxMetadataAttr(attr) {
    if (typeof attr === "string") {
        return encodeString(attr, true)
    } else if (typeof attr === "number") {
        if (attr % 1.0 != 0.0) {
            throw new Error("not a whole number")
        }

        return encodeInt(attr)
    } else if (Array.isArray(attr)) {
        return encodeDefList(attr.map((item) => encodeTxMetadataAttr(item)))
    } else if (
        !Array.isArray(attr) &&
        attr instanceof Object &&
        "list" in attr &&
        Array.isArray(attr.list)
    ) {
        return encodeDefList(
            attr.list.map((item) => encodeTxMetadataAttr(item))
        )
    } else if (
        !Array.isArray(attr) &&
        attr instanceof Object &&
        Object.keys(attr).length == 1 &&
        "map" in attr &&
        Array.isArray(attr.map)
    ) {
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
