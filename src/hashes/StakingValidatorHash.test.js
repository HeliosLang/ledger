import { deepEqual, throws } from "node:assert"
import { describe, it } from "node:test"
import {
    makeUplcConst,
    makeUplcInt,
    makeUplcProgramV2
} from "@helios-lang/uplc"
import {
    makeDummyStakingValidatorHash,
    makeStakingValidatorHash
} from "./StakingValidatorHash.js"

/**
 * @import { UplcProgramV2 } from "@helios-lang/uplc"
 * @import { StakingValidatorHash } from "../index.js"
 */

describe("StakingValidatorHash", () => {
    it("typechecks", () => {
        const dummyBytes = makeDummyStakingValidatorHash().bytes
        /**
         * witnessed by NativeScript
         * @satisfies {StakingValidatorHash<null>}
         */
        const unwitnessed = makeStakingValidatorHash(dummyBytes, null)

        /**
         * witnessed by NativeScript
         * @satisfies {StakingValidatorHash<null>}
         */
        const _unwitnessedCopy = makeStakingValidatorHash(unwitnessed)

        /**
         * default, witnessed or unwitnessed
         * @satisfies {StakingValidatorHash<unknown>}
         */
        const _witnessedOrUnwitnessed = makeStakingValidatorHash(dummyBytes)

        const dummyProgram = makeUplcProgramV2(makeUplcConst(makeUplcInt(0)))

        /**
         * witnessed by UplcProgram
         * @satisfies {StakingValidatorHash<{program: UplcProgramV2}>}
         */
        const _witnessed = makeStakingValidatorHash(dummyBytes, {
            program: dummyProgram
        })
    })
})

describe("makeDummyStakingValidatorHash", () => {
    it("returns all 0s for default args", () => {
        deepEqual(makeDummyStakingValidatorHash().bytes, new Array(28).fill(0))
    })

    it("doesn't return all 0s for non-zero seed args", () => {
        throws(() => {
            deepEqual(
                makeDummyStakingValidatorHash(1).bytes,
                new Array(28).fill(0)
            )
        })
    })
})
