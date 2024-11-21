import { deepEqual, throws } from "node:assert"
import { describe, it } from "node:test"
import {
    makeUplcConst,
    makeUplcInt,
    makeUplcProgramV2
} from "@helios-lang/uplc"
import { makeDummyValidatorHash, makeValidatorHash } from "./ValidatorHash.js"

/**
 * @import { UplcProgramV2 } from "@helios-lang/uplc"
 * @import { ValidatorHash } from "../index.js"
 */

describe("ValidatorHash", () => {
    it("typechecks", () => {
        const dummyBytes = makeDummyValidatorHash().bytes
        /**
         * _witnessed by NativeScript
         * @satisfies {ValidatorHash<null>}
         */
        const unwitnessed = makeValidatorHash(dummyBytes, null)

        /**
         * @satisfies {ValidatorHash<null>}
         */
        const _unwitnessedCopy = makeValidatorHash(unwitnessed)

        /**
         * default, witnessed or unwitnessed
         * @satisfies {ValidatorHash<unknown>}
         */
        const _witnessedOrUnwitnessed = makeValidatorHash(dummyBytes)

        const dummyProgram = makeUplcProgramV2(makeUplcConst(makeUplcInt(0)))

        /**
         * witnessed by UplcProgram
         * @satisfies {ValidatorHash<{program: UplcProgramV2}>}
         */
        const _witnessed = makeValidatorHash(dummyBytes, {
            program: dummyProgram
        })
    })

    it("ValidatorHash.dummy() returns all 0s for default args", () => {
        deepEqual(makeDummyValidatorHash().bytes, new Array(28).fill(0))
    })

    it("ValidatorHash.dummy() doesn't return all 0s for non-zero seed args", () => {
        throws(() => {
            deepEqual(makeDummyValidatorHash(1).bytes, new Array(28).fill(0))
        })
    })
})
