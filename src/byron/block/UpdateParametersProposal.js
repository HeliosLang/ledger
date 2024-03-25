import { ByteStream } from "@helios-lang/codec-utils"
import {
    decodeTuple,
    encodeTuple,
    decodeInt,
    encodeListOption,
    encodeInt,
    decodeListOption
} from "@helios-lang/cbor"
import { None } from "@helios-lang/type-utils"
import { TxFeePolicy } from "./TxFeePolicy.js"

/**
 * @typedef {import("@helios-lang/codec-utils").ByteArrayLike} ByteArrayLike
 */

/**
 * @typedef {{
 *   scriptVersion: Option<number>
 *   slotDuration: Option<bigint>
 *   maxBlockSize: Option<bigint>
 *   maxHeaderSize: Option<bigint>
 *   maxTxSize: Option<bigint>
 *   maxProposalSize: Option<bigint>
 *   mpcThd: Option<bigint>
 *   heavyDelThd: Option<bigint>
 *   updateVoteThd: Option<bigint>
 *   updateProposalThd: Option<bigint>
 *   updateImplicit: Option<bigint>
 *   softForkRule: Option<[bigint, bigint, bigint]>
 *   txFeePolicy: Option<TxFeePolicy>
 *   unlockStakeEpoch: Option<number>
 * }} UpdateParametersProposalProps
 */

export class UpdateParametersProposal {
    /**
     *
     * @param {UpdateParametersProposalProps} props
     */
    constructor({
        scriptVersion,
        slotDuration,
        maxBlockSize,
        maxHeaderSize,
        maxTxSize,
        maxProposalSize,
        mpcThd,
        heavyDelThd,
        updateVoteThd,
        updateProposalThd,
        updateImplicit,
        softForkRule,
        txFeePolicy,
        unlockStakeEpoch
    }) {
        this.scriptVersion = scriptVersion
        this.slotDuration = slotDuration
        this.maxBlockSize = maxBlockSize
        this.maxHeaderSize = maxHeaderSize
        this.maxTxSize = maxTxSize
        this.maxProposalSize = maxProposalSize
        this.mpcThd = mpcThd
        this.heavyDelThd = heavyDelThd
        this.updateVoteThd = updateVoteThd
        this.updateProposalThd = updateProposalThd
        this.updateImplicit = updateImplicit
        this.softForkRule = softForkRule
        this.txFeePolicy = txFeePolicy
        this.unlockStakeEpoch = unlockStakeEpoch
    }

    /**
     * @param {ByteArrayLike} bytes
     * @returns {UpdateParametersProposal}
     */
    static fromCbor(bytes) {
        const stream = ByteStream.from(bytes)

        const [
            scriptVersion,
            slotDuration,
            maxBlockSize,
            maxHeaderSize,
            maxTxSize,
            maxProposalSize,
            mpcThd,
            heavyDelThd,
            updateVoteThd,
            updateProposalThd,
            updateImplicit,
            softForkRule,
            txFeePolicy,
            unlockStakeEpoch
        ] = decodeTuple(stream, [
            (s) => decodeListOption(s, decodeInt),
            (s) => decodeListOption(s, decodeInt),
            (s) => decodeListOption(s, decodeInt),
            (s) => decodeListOption(s, decodeInt),
            (s) => decodeListOption(s, decodeInt),
            (s) => decodeListOption(s, decodeInt),
            (s) => decodeListOption(s, decodeInt),
            (s) => decodeListOption(s, decodeInt),
            (s) => decodeListOption(s, decodeInt),
            (s) => decodeListOption(s, decodeInt),
            (s) => decodeListOption(s, decodeInt),
            (s) =>
                decodeListOption(s, (s) =>
                    decodeTuple(s, [decodeInt, decodeInt, decodeInt])
                ),
            (s) => decodeListOption(s, txFeePolicy),
            (s) => decodeListOption(s, decodeInt)
        ])

        return new UpdateParametersProposal({
            scriptVersion,
            slotDuration,
            maxBlockSize,
            maxHeaderSize,
            maxTxSize,
            maxProposalSize,
            mpcThd,
            heavyDelThd,
            updateVoteThd,
            updateProposalThd,
            updateImplicit,
            softForkRule,
            txFeePolicy,
            unlockStakeEpoch
        })
    }

    /**
     * @returns {number[]}
     */
    toCbor() {
        return encodeTuple([
            encodeListOption(
                this.scriptVersion ? encodeInt(this.scriptVersion) : None
            ),
            encodeListOption(
                this.slotDuration ? encodeInt(this.slotDuration) : None
            ),
            encodeListOption(
                this.maxBlockSize ? encodeInt(this.maxBlockSize) : None
            ),
            encodeListOption(
                this.maxHeaderSize ? encodeInt(this.maxHeaderSize) : None
            ),
            encodeListOption(this.maxTxSize ? encodeInt(this.maxTxSize) : None),
            encodeListOption(
                this.maxProposalSize ? encodeInt(this.maxProposalSize) : None
            ),
            encodeListOption(this.mpcThd ? encodeInt(this.mpcThd) : None),
            encodeListOption(
                this.heavyDelThd ? encodeInt(this.heavyDelThd) : None
            ),
            encodeListOption(
                this.updateVoteThd ? encodeInt(this.updateVoteThd) : None
            ),
            encodeListOption(
                this.updateProposalThd
                    ? encodeInt(this.updateProposalThd)
                    : None
            ),
            encodeListOption(
                this.updateImplicit ? encodeInt(this.updateImplicit) : None
            ),
            encodeListOption(
                this.softForkRule
                    ? encodeTuple([
                          encodeInt(this.softForkRule[0]),
                          encodeInt(this.softForkRule[1]),
                          encodeInt(this.softForkRule[2])
                      ])
                    : None
            ),
            encodeListOption(
                this.txFeePolicy ? this.txFeePolicy.toCbor() : None
            ),
            encodeListOption(
                this.unlockStakeEpoch ? encodeInt(this.unlockStakeEpoch) : None
            )
        ])
    }
}
