import {
    decodeList,
    decodeTuple,
    encodeList,
    encodeTuple
} from "@helios-lang/cbor"
import { Tx } from "../tx/index.js"
import { EpochDelegation } from "./EpochDelegation.js"
import { Ssc } from "./Ssc.js"
import { UpdateData } from "./UpdateData.js"
import { ByteStream } from "@helios-lang/codec-utils"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 */

export class BlockBody {
    /**
     *
     * @param {Tx[]} txs
     * @param {Ssc} ssc
     * @param {EpochDelegation[]} delegations
     * @param {UpdateData} updateData
     */
    constructor(txs, ssc, delegations, updateData) {
        this.txs = txs
        this.ssc = ssc
        this.delegations = delegations
        this.updateData = updateData
    }

    /**
     * @param {ByteArrayLike} bytes
     * @returns {BlockBody}
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        const [txs, ssc, delegations, updateData] = decodeTuple(stream, [
            (s) => decodeList(s, Tx),
            Ssc,
            (s) => decodeList(s, EpochDelegation),
            UpdateData
        ])

        return new BlockBody(txs, ssc, delegations, updateData)
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([
            encodeList(this.txs),
            this.ssc.toCbor(),
            encodeList(this.delegations),
            this.updateData.toCbor()
        ])
    }
}
