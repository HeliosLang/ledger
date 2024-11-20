import { deepEqual, throws } from "node:assert"
import { describe, it } from "node:test"
import { makeDummyPubKey } from "./PubKey.js"

describe("makeDummyPubKey", () => {
    it("returns all 0s for default args", () => {
        deepEqual(makeDummyPubKey().bytes, new Array(32).fill(0))
    })

    it("PubKey.dummy() doesn't return all 0s for non-zero seed arg", () => {
        throws(() => {
            deepEqual(makeDummyPubKey(1).bytes, new Array(32).fill(0))
        })
    })
})
