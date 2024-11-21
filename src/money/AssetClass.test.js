import { deepEqual, throws } from "node:assert"
import { describe, it } from "node:test"
import {
    makeUplcConst,
    makeUplcInt,
    makeUplcProgramV2
} from "@helios-lang/uplc"
import { makeMintingPolicyHash } from "../hashes/index.js"
import { makeAssetClass, makeDummyAssetClass } from "./AssetClass.js"

/**
 * @import { UplcProgramV2 } from "@helios-lang/uplc"
 * @import { AssetClass } from "../index.js"
 */

describe("AssetClass", () => {
    it("typechecks", () => {
        const unwitnessedMph = makeMintingPolicyHash([], null)

        /**
         * AssetClass<null> (witnessed by NativeScript)
         * @satisfies {AssetClass<null>}
         */
        const _unwitnessed = makeAssetClass(unwitnessedMph, [])

        const witnessedOrUnwitnessedMph = makeMintingPolicyHash([])

        /**
         * AssetClass<unknown> (default, witnessed or unwitnessed)
         * @satisfies {AssetClass<unknown>}
         */
        const _witnessedOrUnwitnessed = makeAssetClass(
            witnessedOrUnwitnessedMph,
            []
        )

        const dummyProgram = makeUplcProgramV2(makeUplcConst(makeUplcInt(0)))
        const witnessedMph = makeMintingPolicyHash([], {
            program: dummyProgram
        })

        /**
         * AssetClass<{...}> (witnessed by UplcProgram)
         * @satisfies {AssetClass<{program: UplcProgramV2}>}
         */
        const _witnessed = makeAssetClass(witnessedMph, [])
    })
})

describe("makeDummyAssetClass", () => {
    it("returns mph with all 0s and empty tokenName", () => {
        const ac = makeDummyAssetClass()

        deepEqual(ac.mph.bytes, new Array(28).fill(0))
        deepEqual(ac.tokenName, [])
    })

    it("AssetClass.dummy() doesn't return mph with all 0s for non-zero seed arg", () => {
        const ac = makeDummyAssetClass(1)

        throws(() => {
            deepEqual(ac.mph.bytes, new Array(28).fill(0))
        })
    })
})
