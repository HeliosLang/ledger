import { deepEqual, throws } from "node:assert"
import { describe, it } from "node:test"
import { makeDummySignature } from "./Signature.js"

describe("makeDummySignature", () => {
    it("returns PubKey and bytes with all 0s for default arg", () => {
        const s = makeDummySignature()

        deepEqual(s.pubKey.bytes, new Array(32).fill(0))
        deepEqual(s.bytes, new Array(64).fill(0))
    })

    it("doesn't return PubKey and bytes with all 0s for non-zero seed arg", () => {
        const s = makeDummySignature(1)

        throws(() => {
            deepEqual(s.pubKey.bytes, new Array(32).fill(0))
        })

        throws(() => {
            deepEqual(s.bytes, new Array(64).fill(0))
        })
    })
})
