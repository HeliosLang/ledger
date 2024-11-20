import { deepEqual, throws } from "node:assert"
import { describe, it } from "node:test"
import { dummyBytes } from "@helios-lang/codec-utils"
import {
    makeDummyPubKeyHash,
    makeStakingValidatorHash
} from "../hashes/index.js"
import {
    makeDummyStakingAddress,
    makeStakingAddress
} from "./StakingAddress.js"

/**
 * @import { PubKeyHash, StakingAddress, StakingValidatorHash } from "src/index.js"
 */

describe("makeDummyStakingAddress", () => {
    it("StakingAddress.dummy() returns all 0s for default arg", () => {
        deepEqual(
            makeDummyStakingAddress(false).stakingCredential.bytes,
            new Array(28).fill(0)
        )
    })

    it("StakingAddress.dummy() doesn't return all 0s for non-zero seed arg", () => {
        throws(() => {
            deepEqual(
                makeDummyStakingAddress(false, 1).stakingCredential.bytes,
                new Array(28).fill(0)
            )
        })
    })
})

describe(makeStakingAddress.name, () => {
    it("unknown context type for plain bytes", () => {
        /**
         * @satisfies {StakingAddress<PubKeyHash>}
         */
        const _addr = makeDummyStakingAddress(false)
    })

    it("null context type for PubKeyHash bytes", () => {
        /**
         * @satisfies {StakingAddress<PubKeyHash>}
         */
        const _addr = makeStakingAddress(false, makeDummyPubKeyHash(0))
    })

    it("known context for StakingValidatorHash with context", () => {
        /**
         * @satisfies {StakingAddress<StakingValidatorHash<"hello world">>}
         */
        const _addr = makeStakingAddress(
            false,
            makeStakingValidatorHash(
                dummyBytes(28),
                /** @type {const} */ ("hello world")
            )
        )
    })
})
