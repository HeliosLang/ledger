import {
    encodeInt,
    encodeNull,
    encodeString,
    encodeTuple
} from "@helios-lang/cbor"

/**
 * @import { SingleNamePoolRelay } from "src/index.js"
 */

/**
 * @param {string} record
 * @param {number} [port]
 * @returns {SingleNamePoolRelay}
 */
export function makeSingleNamePoolRelay(record, port = undefined) {
    return new SingleNamePoolRelayImpl(record, port)
}

/**
 * @implements {SingleNamePoolRelay}
 */
class SingleNamePoolRelayImpl {
    /**
     * @readonly
     * @type {string}
     */
    record

    /**
     * @readonly
     * @type {number | undefined}
     */
    port

    /**
     * @param {string} record
     * @param {number | undefined} port
     */
    constructor(record, port) {
        this.record = record
        this.port = port
    }

    /**
     * @type {"SingleNamePoolRelay"}
     */
    get kind() {
        return "SingleNamePoolRelay"
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([
            encodeInt(1),
            this.port ? encodeInt(this.port) : encodeNull(),
            encodeString(this.record)
        ])
    }
}
