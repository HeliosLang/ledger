import { deepEqual, throws } from "node:assert"
import { describe, it } from "node:test"
import { makeDummyPubKeyHash } from "./PubKeyHash.js"

describe("PubKeyHash", () => {
    it("dummy with default args returns all 0s", () => {
        deepEqual(makeDummyPubKeyHash().bytes, new Array(28).fill(0))
    })

    it("dummy with default args doesn't return all 0s", () => {
        throws(() => {
            deepEqual(makeDummyPubKeyHash(1).bytes, new Array(28).fill(0))
        })
    })
})
