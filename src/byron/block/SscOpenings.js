import {
    decodeBytes,
    decodeMap,
    encodeBytes,
    encodeMap
} from "@helios-lang/cbor"
import { ByteStream } from "@helios-lang/codec-utils"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 */

export class SscOpenings {
    /**
     * @param {number[][]} stakeHolderIds
     * @param {number[][]} secrets
     */
    constructor(stakeHolderIds, secrets) {
        if (stakeHolderIds.length != secrets.length) {
            throw new Error("expected equal length arguments")
        }

        this.stakeHolderIds = stakeHolderIds
        this.secrets = secrets
    }

    /**
     * @param {ByteArrayLike} bytes
     * @returns {SscOpenings}
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        const m = decodeMap(stream, decodeBytes, decodeBytes)

        const ids = m.map(([id]) => id)
        const secrets = m.map(([_id, secret]) => secret)

        return new SscOpenings(ids, secrets)
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeMap(
            this.stakeHolderIds.map((id, i) => [
                encodeBytes(id),
                encodeBytes(this.secrets[i])
            ])
        )
    }
}
