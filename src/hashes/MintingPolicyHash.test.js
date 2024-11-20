import { deepEqual, throws } from "assert"
import { describe, it } from "node:test"
import {
    makeUplcConst,
    makeUplcInt,
    makeUplcProgramV2
} from "@helios-lang/uplc"
import {
    makeDummyMintingPolicyHash,
    makeMintingPolicyHash
} from "./MintingPolicyHash.js"

/**
 * @import { UplcProgramV2 } from "@helios-lang/uplc"
 * @import { MintingPolicyHash } from "src/index.js"
 */

describe("MintingPolicyHash", () => {
    it("typechecks", () => {
        /**
         * witnessed by NativeScript
         * @type {MintingPolicyHash<null>}
         */
        const _unwitnessed = makeMintingPolicyHash([], null)

        /**
         * default, witnessed or unwitnessed
         * @type {MintingPolicyHash<unknown>}
         */
        const _witnessedOrUnwitnessed = makeMintingPolicyHash([])

        const dummyProgram = makeUplcProgramV2(makeUplcConst(makeUplcInt(0)))

        /**
         * witnessed by UplcProgram
         * @type {MintingPolicyHash<{program: UplcProgramV2}>}
         */
        const _witnessed = makeMintingPolicyHash([], { program: dummyProgram })
    })
})

describe("makeDummyMintingPolicyHash", () => {
    it("returns all 0s with default args", () => {
        deepEqual(makeDummyMintingPolicyHash().bytes, new Array(28).fill(0))
    })

    it("doesn't returns all 0s with non-zero seed arg", () => {
        throws(() => {
            deepEqual(
                makeDummyMintingPolicyHash(1).bytes,
                new Array(28).fill(0)
            )
        })
    })
})
