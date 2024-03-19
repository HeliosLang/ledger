/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 * @typedef {import("./Hash.js").Hash} Hash
 */

import { encodeBytes } from "@helios-lang/cbor";
import { bytesToHex, toBytes } from "@helios-lang/codec-utils";
import { ByteArrayData } from "@helios-lang/uplc";

/**
 * @implements {Hash}
 */
export class ScriptHash {
    /**
     * @readonly
     * @type {number[]}
     */
    bytes

    /**
     * 
     * @param {ByteArrayLike} bytes 
     */
    constructor(bytes) {
        this.bytes = toBytes(bytes)
    }

    /**
	 * @returns {number[]}
	 */
	toCbor() {
		return encodeBytes(this.bytes)
	}

	/**
	 * @returns {string}
	 */
	toHex() {
		return bytesToHex(this.bytes)
	}

	/**
	 * @returns {string}
	 */
	toString() {
		return this.toHex()
	}

    /**
     * @returns {UplcData}
     */
    toUplcData() {
        return new ByteArrayData(this.bytes);
    }
}