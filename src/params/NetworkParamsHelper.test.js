import { strictEqual } from "node:assert"
import { describe, it } from "node:test"
import {
    makeDefaultNetworkParamsHelper,
    makeNetworkParamsHelper
} from "./NetworkParamsHelper.js"
import { DEFAULT_NETWORK_PARAMS } from "./NetworkParams.js"

/**
 * @import { NetworkParams, NetworkParamsHelper } from "../index.js"
 */

describe("NetworkParamsHelper", () => {
    it("type", () => {
        /**
         * @satisfies {NetworkParamsHelper<NetworkParams>}
         */
        const _params = makeNetworkParamsHelper(DEFAULT_NETWORK_PARAMS())
    })

    it("timeToSlot/slotToTime roundtrip", () => {
        const h = makeDefaultNetworkParamsHelper()

        const time = Date.now() + 300000

        strictEqual(
            Math.round(h.slotToTime(h.timeToSlot(time)) / 1000),
            Math.round(time / 1000)
        )
    })
})
