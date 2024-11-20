import { strictEqual } from "node:assert"
import { describe, it } from "node:test"
import { bytesToHex } from "@helios-lang/codec-utils"
import { makeDummyShelleyAddress } from "../address/ShelleyAddress.js"
import { makeTxInput } from "../tx/TxInput.js"
import { makeTxOutput } from "../tx/TxOutput.js"
import { makeDummyTxOutputId } from "../tx/TxOutputId.js"
import { addValues, makeValue } from "./Value.js"

/**
 * @import { TxInput, TxOutput, Value } from "src/index.js"
 */

const IS_MAINNET = false

describe("Value", () => {
    it("adds values of TxInput[] together correctly", () => {
        /**
         * @param {Value} value
         * @returns {TxInput}
         */
        const makeInput = (value) => {
            return makeTxInput(
                makeDummyTxOutputId(),
                makeTxOutput(makeDummyShelleyAddress(IS_MAINNET), value)
            )
        }

        const policy =
            "b143fb8b156eb62cb5240b02d55e580a56b7864064d2ee374536ca0b"
        const tokenName = ""
        const qty = 10n

        const inputs = [
            makeInput(makeValue(1_000_000n)),
            makeInput(makeValue(10_000_000n)),
            makeInput(makeValue(2_000_000n, { [policy]: { [tokenName]: qty } }))
        ]

        const sum = addValues(inputs)
        const summedTokens = sum.assets.getPolicyTokens(policy)

        strictEqual(sum.lovelace, 13_000_000n)
        strictEqual(sum.assets.assets.length, 1)
        strictEqual(summedTokens.length, 1)
        strictEqual(bytesToHex(summedTokens[0][0]), tokenName)
        strictEqual(summedTokens[0][1], qty)
    })
})
