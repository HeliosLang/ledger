import { throws } from "node:assert"
import { describe, it } from "node:test"
import { makeByronAddress } from "./ByronAddress.js"

describe("ByronAddress", () => {
    it("toUplcData() throws an error", () => {
        const addr = makeByronAddress(
            "Ae2tdPwUPEYz6ExfbWubiXPB6daUuhJxikMEb4eXRp5oKZBKZwrbJ2k7EZe"
        )
        throws(() => {
            addr.toUplcData()
        })
    })
})
