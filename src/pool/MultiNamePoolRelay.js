import { encodeInt, encodeString, encodeTuple } from "@helios-lang/cbor"

/**
 * @import { MultiNamePoolRelay } from "../index.js"
 */

/**
 * @param {string} record
 * @returns {MultiNamePoolRelay}
 */
export function makeMultiNamePoolRelay(record) {
    return new MultiNamePoolRelayImpl(record)
}

/**
 * @implements {MultiNamePoolRelay}
 */
class MultiNamePoolRelayImpl {
    /**
     * @readonly
     * @type {string}
     */
    record

    /**
     * @param {string} record
     */
    constructor(record) {
        this.record = record
    }

    /**
     * @type {"MultiNamePoolRelay"}
     */
    get kind() {
        return "MultiNamePoolRelay"
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([encodeInt(2), encodeString(this.record)])
    }
}
