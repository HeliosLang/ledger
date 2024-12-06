import {
    decodeInt,
    decodeFloat32,
    encodeFloat32,
    encodeInt,
    encodeList,
    encodeNullOption,
    encodeTuple,
    decodeTuple,
    decodeList,
    decodeNullOption
} from "@helios-lang/cbor"
import { makeByteStream } from "@helios-lang/codec-utils"
import { decodeStakingAddress } from "../address/index.js"
import { decodePubKeyHash } from "../hashes/index.js"
import { decodePoolMetadata } from "./PoolMetadata.js"
import { decodePoolRelay } from "./PoolRelay.js"

/**
 * @import { BytesLike } from "@helios-lang/codec-utils"
 * @import { PoolMetadata, PoolParameters, PoolRelay, PubKeyHash, StakingAddress } from "../index.js"
 */

/**
 * @typedef {{
 *   id: PubKeyHash
 *   vrf: PubKeyHash
 *   pledge: bigint
 *   cost: bigint
 *   margin: number
 *   rewardAccount: StakingAddress
 *   owners: PubKeyHash[]
 *   relays: PoolRelay[]
 *   metadata?: PoolMetadata
 * }} PoolParametersProps
 */

/**
 * @param {object} data
 * @param {PubKeyHash} data.id
 * @param {PubKeyHash} data.vrf
 * @param {bigint} data.pledge
 * @param {bigint} data.cost
 * @param {number} data.margin
 * @param {StakingAddress} data.rewardAccount
 * @param {PubKeyHash[]} data.owners
 * @param {PoolRelay[]} data.relays
 * @param {PoolMetadata} [data.metadata]
 * @returns {PoolParameters}
 */
export function makePoolParameters(props) {
    return new PoolParametersImpl(props)
}

/**
 * @param {BytesLike} bytes
 */
export function decodePoolParameters(bytes) {
    const stream = makeByteStream(bytes)

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
        decodePubKeyHash,
        decodePubKeyHash,
        decodeInt,
        decodeInt,
        decodeFloat32,
        decodeStakingAddress,
        (stream) => decodeList(stream, decodePubKeyHash),
        (stream) => decodeList(stream, decodePoolRelay),
        (stream) => decodeNullOption(stream, decodePoolMetadata)
    ])

    return makePoolParameters({
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
 * @implements {PoolParameters}
 */
class PoolParametersImpl {
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
     * @type {StakingAddress}
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
     * @type {PoolMetadata | undefined}
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
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([
            this.id.toCbor(),
            this.vrf.toCbor(),
            encodeInt(this.pledge),
            encodeInt(this.cost),
            encodeFloat32(this.margin), // TODO: test this,
            this.rewardAccount.toCbor(),
            encodeList(this.owners),
            encodeList(this.relays),
            encodeNullOption(this.metadata)
        ])
    }
}
