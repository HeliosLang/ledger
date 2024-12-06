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
    } else if ("list" in attr) {
        return encodeDefList(
            attr.list.map((item) => encodeTxMetadataAttr(item))
        )
    } else if (
        attr instanceof Object &&
        "map" in attr &&
        Object.keys(attr).length == 1
    ) {
        const pairs = attr["map"]

        if (Array.isArray(pairs)) {
            return encodeMap(
                pairs.map((pair) => {
                    if (Array.isArray(pair) && pair.length == 2) {
                        return [
                            encodeTxMetadataAttr(pair[0]),
                            encodeTxMetadataAttr(pair[1])
                        ]
                    } else {
                        throw new Error("invalid metadata schema")
                    }
                })
            )
        } else {
            throw new Error("invalid metadata schema")
        }
    } else {
        throw new Error("invalid metadata schema")
    }
}
