import { deepEqual, throws } from "node:assert"
import { describe, it } from "node:test"
import { makeDummyShelleyAddress } from "./ShelleyAddress.js"

describe("makeDummyShelleyAddress", () => {
    it("returns all 0s for default args", () => {
        deepEqual(
            makeDummyShelleyAddress(false).spendingCredential.bytes,
            new Array(28).fill(0)
        )
    })

    it("doesn't return all 0s for non-zero seed args", () => {
        throws(() => {
            deepEqual(
                makeDummyShelleyAddress(false, 1).spendingCredential.bytes,
                new Array(28).fill(0)
            )
        })
    })
})
