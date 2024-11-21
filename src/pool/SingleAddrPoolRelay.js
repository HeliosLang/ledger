import {
    encodeBytes,
    encodeInt,
    encodeNull,
    encodeTuple
} from "@helios-lang/cbor"

/**
 * @import { SingleAddrPoolRelay } from "../index.js"
 */

/**
 * @param {object} data
 * @param {number} [data.port]
 * @param {number[]} [data.ipv4]
 * @param {number[]} [data.ipv6]
 * @returns {SingleAddrPoolRelay}
 */
export function makeSingleAddrPoolRelay(props) {
    return new SingleAddrPoolRelayImpl(props.port, props.ipv4, props.ipv6)
}

/**
 * @implements {SingleAddrPoolRelay}
 */
class SingleAddrPoolRelayImpl {
    /**
     * @readonly
     * @type {number | undefined}
     */
    port

    /**
     * @readonly
     * @type {number[] | undefined}
     */
    ipv4

    /**
     * @readonly
     * @type {number[] | undefined}
     */
    ipv6

    /**
     * @param {number | undefined} port
     * @param {number[] | undefined} ipv4
     * @param {number[] | undefined} ipv6
     */
    constructor(port, ipv4, ipv6) {
        this.port = port
        this.ipv4 = ipv4
        this.ipv6 = ipv6
    }

    /**
     * @type {"SingleAddrPoolRelay"}
     */
    get kind() {
        return "SingleAddrPoolRelay"
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([
            encodeInt(0),
            this.port ? encodeInt(this.port) : encodeNull(),
            this.ipv4 ? encodeBytes(this.ipv4) : encodeNull(),
            this.ipv6 ? encodeBytes(this.ipv6) : encodeNull()
        ])
    }
}
