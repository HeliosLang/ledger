import {
    decodeBytes,
    decodeInt,
    decodeNullOption,
    decodeString,
    decodeTagged
} from "@helios-lang/cbor"
import { makeByteStream } from "@helios-lang/codec-utils"
import { makeSingleAddrPoolRelay } from "./SingleAddrPoolRelay.js"
import { makeSingleNamePoolRelay } from "./SingleNamePoolRelay.js"
import { makeMultiNamePoolRelay } from "./MultiNamePoolRelay.js"

/**
 * @import { BytesLike } from "@helios-lang/codec-utils"
 * @import { PoolRelay } from "../index.js"
 */

/**
 * @param {BytesLike} bytes
 * @returns {PoolRelay}
 */
export function decodePoolRelay(bytes) {
    const stream = makeByteStream(bytes)

    const [tag, decodeItem] = decodeTagged(stream)

    switch (tag) {
        case 0: {
            const port = decodeItem((stream) =>
                decodeNullOption(stream, decodeInt)
            )
            const ipv4 = decodeItem((stream) =>
                decodeNullOption(stream, decodeBytes)
            )
            const ipv6 = decodeItem((stream) =>
                decodeNullOption(stream, decodeBytes)
            )

            return makeSingleAddrPoolRelay({
                port: port ? Number(port) : undefined,
                ipv4: ipv4 ?? undefined,
                ipv6: ipv6 ?? undefined
            })
        }
        case 1: {
            const port = decodeItem((stream) =>
                decodeNullOption(stream, decodeInt)
            )
            const record = decodeItem(decodeString)

            return makeSingleNamePoolRelay(
                record,
                port ? Number(port) : undefined
            )
        }
        case 2: {
            const record = decodeItem(decodeString)

            return makeMultiNamePoolRelay(record)
        }
        default:
            throw new Error(`expected 0, 1 or 2 PoolRelay CBOR tag, got ${tag}`)
    }
}
