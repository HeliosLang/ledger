import {
    decodeInt,
    decodeFloat32,
    encodeBytes,
    encodeFloat32,
    encodeInt,
    encodeList,
    encodeOption,
    encodeTuple,
    decodeTuple,
    decodeBytes,
    decodeList,
    decodeOption
} from "@helios-lang/cbor"
import { PubKeyHash } from "../hashes/index.js"
import { PoolMetadata } from "./PoolMetadata.js"
import { PoolRelay } from "./PoolRelay.js"
import { ByteStream } from "@helios-lang/codec-utils"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 */

/**
 * @typedef {{
 *   id: PubKeyHash
 *   vrf: PubKeyHash
 *   pledge: bigint
 *   cost: bigint
 *   margin: number
 *   rewardAccount: number[]
 *   owners: PubKeyHash[]
 *   relays: PoolRelay[]
 *   metadata?: PoolMetadata
 * }} PoolParametersProps
 */

export class PoolParameters {
    /**
     * @readonly
     * @type {PubKeyHash}
     */
    id

    /**
     * @readonly
     * @type {PubKeyHash}
     */
    vrf

    /**
     * @readonly
     * @type {bigint}
     */
    pledge

    /**
     * @readonly
     * @type {bigint}
     */
    cost

    /**
     * @readonly
     * @type {number}
     */
    margin

    /**
     * @readonly
     * @type {number[]}
     */
    rewardAccount

    /**
     * @readonly
     * @type {PubKeyHash[]}
     */
    owners

    /**
     * @readonly
     * @type {PoolRelay[]}
     */
    relays

    /**
     * @readonly
     * @type {Option<PoolMetadata>}
     */
    metadata

    /**
     * @param {PoolParametersProps} props
     */
    constructor({
        id,
        vrf,
        pledge,
        cost,
        margin,
        rewardAccount,
        owners,
        relays,
        metadata
    }) {
        this.id = id
        this.vrf = vrf
        this.pledge = pledge
        this.cost = cost
        this.margin = margin
        this.rewardAccount = rewardAccount
        this.owners = owners
        this.relays = relays
        this.metadata = metadata
    }

    /**
     * @param {ByteArrayLike} bytes
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        const [
            id,
            vrf,
            pledge,
            cost,
            margin,
            rewardAccount,
            owners,
            relays,
            metadata
        ] = decodeTuple(stream, [
            PubKeyHash,
            PubKeyHash,
            decodeInt,
            decodeInt,
            decodeFloat32,
            decodeBytes,
            (stream) => decodeList(stream, PubKeyHash),
            (stream) => decodeList(stream, PoolRelay),
            (stream) => decodeOption(stream, PoolMetadata)
        ])

        return new PoolParameters({
            id,
            vrf,
            pledge,
            cost,
            margin,
            rewardAccount,
            owners,
            relays,
            metadata: metadata ?? undefined
        })
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([
            this.id.toCbor(),
            this.vrf.toCbor(),
            encodeInt(this.pledge),
            encodeInt(this.cost),
            encodeFloat32(this.margin), // TODO: test this,
            encodeBytes(this.rewardAccount),
            encodeList(this.owners),
            encodeList(this.relays),
            encodeOption(this.metadata, (some) => some.toCbor())
        ])
    }
}
