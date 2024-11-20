import { strictEqual } from "node:assert"
import { describe, it } from "node:test"
import { makeDefaultNetworkParamsHelper } from "./NetworkParamsHelper.js"

describe("NetworkParamsHelper", () => {
    it("timeToSlot/slotToTime roundtrip", () => {
        const h = makeDefaultNetworkParamsHelper()

        const time = Date.now() + 300000

        strictEqual(
            Math.round(h.slotToTime(h.timeToSlot(time)) / 1000),
            Math.round(time / 1000)
        )
    })
})
