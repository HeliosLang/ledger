import { describe, it } from "node:test"
import { NetworkParamsHelper } from "./NetworkParamsHelper.js"
import { strictEqual } from "node:assert"

describe(NetworkParamsHelper.name, () => {
    it("timeToSlot/slotToTime roundtrip", () => {
        const h = NetworkParamsHelper.new()

        const time = Date.now() + 300000

        strictEqual(
            Math.round(h.slotToTime(h.timeToSlot(time)) / 1000),
            Math.round(time / 1000)
        )
    })
})
