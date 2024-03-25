import {
    decodeBytes,
    decodeInt,
    decodeNullOption,
    decodeString,
    decodeTagged,
    encodeBytes,
    encodeInt,
    encodeNull,
    encodeString,
    encodeTuple
} from "@helios-lang/cbor"
import { ByteStream } from "@helios-lang/codec-utils"
import { None } from "@helios-lang/type-utils"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 */

/**
 * @typedef {"SingleAddr" | "SingleName" | "MultiName"} PoolRelayKinds
 */

/**
 * @typedef {{
 *   port?: number
 *   ipv4?: number[]
 *   ipv6?: number[]
 * }} SingleAddrProps
 */
/**
 * @template {PoolRelayKinds} T
 * @typedef {T extends "SingleAddr" ? {
 *   "SingleAddr": SingleAddrProps
 * } : T extends "SingleName" ? {
 *   "SingleName": {
 *     port?: number
 *     record: string
 *   }
 * } : {
 *   "MultiName": {
 *     record: string
 *   }
 * }} PoolRelayProps
 */

/**
 * @template {PoolRelayKinds} [T=PoolRelayKinds]
 */
export class PoolRelay {
    /**
     * @private
     * @type {PoolRelayProps<T>}
     */
    props

    /**
     *
     * @param {PoolRelayProps<T>} props
     */
    constructor(props) {
        this.props = props
    }

    /**
     * @param {SingleAddrProps} props
     * @returns {PoolRelay<"SingleAddr">}
     */
    static SingleAddr(props) {
        return new PoolRelay({ SingleAddr: props })
    }

    /**
     * @param {string} record
     * @param {Option<number>} port
     * @returns {PoolRelay<"SingleName">}
     */
    static SingleName(record, port = None) {
        return new PoolRelay({
            SingleName: {
                record: record,
                port: port ? port : undefined
            }
        })
    }

    /**
     * @param {string} record
     * @returns {PoolRelay<"MultiName">}
     */
    static MultiName(record) {
        return new PoolRelay({ MultiName: { record: record } })
    }

    /**
     * @param {ByteArrayLike} bytes
     * @returns {PoolRelay}
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

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

                return PoolRelay.SingleAddr({
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

                return PoolRelay.SingleName(record, port ? Number(port) : None)
            }
            case 2: {
                const record = decodeItem(decodeString)

                return PoolRelay.MultiName(record)
            }
            default:
                throw new Error(
                    `expected 0, 1 or 2 PoolRelay CBOR tag, got ${tag}`
                )
        }
    }

    /**
     * @returns {this is PoolRelay<"SingleAddr">}
     */
    isSingleAddr() {
        return "SingleAddr" in this.props
    }

    /**
     * @returns {this is PoolRelay<"SingleName">}
     */
    isSingleName() {
        return "SingleName" in this.props
    }

    /**
     * @returns {this is PoolRelay<"MultiName">}
     */
    isMultiName() {
        return "MultiName" in this.props
    }

    /**
     * @type {T extends "SingleAddr" ? Option<number[]> : never}
     */
    get ipv4() {
        return /** @type {any} */ (
            this.isSingleAddr() ? this.props.SingleAddr.ipv4 : undefined
        )
    }

    /**
     * @type {T extends "SingleAddr" ? Option<number[]> : never}
     */
    get ipv6() {
        return /** @type {any} */ (
            this.isSingleAddr() ? this.props.SingleAddr.ipv6 : undefined
        )
    }

    /**
     * @type {T extends ("SingleAddr" | "SingleName") ? Option<number> : never}
     */
    get port() {
        return /** @type {any} */ (
            this.isSingleAddr()
                ? this.props.SingleAddr.port
                : this.isSingleName()
                  ? this.props.SingleName.port
                  : undefined
        )
    }

    /**
     * @type {T extends ("SingleName" | "MultiName") ? string : never}
     */
    get record() {
        return /** @type {any} */ (
            this.isSingleName()
                ? this.props.SingleName.record
                : this.isMultiName()
                  ? this.props.MultiName.record
                  : undefined
        )
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        if (this.isSingleAddr()) {
            return encodeTuple([
                encodeInt(0),
                this.props.SingleAddr.port
                    ? encodeInt(this.props.SingleAddr.port)
                    : encodeNull(),
                this.props.SingleAddr.ipv4
                    ? encodeBytes(this.props.SingleAddr.ipv4)
                    : encodeNull(),
                this.props.SingleAddr.ipv6
                    ? encodeBytes(this.props.SingleAddr.ipv6)
                    : encodeNull()
            ])
        } else if (this.isSingleName()) {
            return encodeTuple([
                encodeInt(1),
                this.props.SingleName.port
                    ? encodeInt(this.props.SingleName.port)
                    : encodeNull(),
                encodeString(this.props.SingleName.record)
            ])
        } else if (this.isMultiName()) {
            return encodeTuple([
                encodeInt(2),
                encodeString(this.props.MultiName.record)
            ])
        } else {
            throw new Error("unhandled variant")
        }
    }
}
