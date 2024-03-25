import {
    decodeInt,
    decodeList,
    decodeMap,
    decodeTuple,
    encodeList,
    encodeMap,
    encodeTuple
} from "@helios-lang/cbor"
import { TxInput } from "./TxInput.js"
import { TxOutput } from "./TxOutput.js"
import { TxWitnesses } from "./TxWitnesses.js"
import { ByteStream } from "@helios-lang/codec-utils"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 */

export class Tx {
    /**
     * @param {TxInput[]} inputs
     * @param {TxOutput[]} outputs
     * @param {TxWitnesses} witnesses
     */
    constructor(inputs, outputs, witnesses) {
        this.inputs = inputs
        this.outputs = outputs
        this.witnesses = witnesses
    }

    /**
     * @param {ByteArrayLike} bytes
     * @returns {Tx}
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        const [[inputs, outputs, attributes], witnesses] = decodeTuple(stream, [
            (s) =>
                decodeTuple(s, [
                    (s) => decodeList(s, TxInput),
                    (s) => decodeList(s, TxOutput),
                    (s) => decodeMap(s, decodeInt, decodeInt)
                ]),
            TxWitnesses
        ])

        if (attributes.length != 0) {
            throw new Error("unexpected attributes")
        }

        return new Tx(inputs, outputs, witnesses)
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([
            encodeTuple([
                encodeList(this.inputs),
                encodeList(this.outputs),
                encodeMap([])
            ]),
            this.witnesses.toCbor()
        ])
    }
}
