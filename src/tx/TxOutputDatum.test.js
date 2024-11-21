import { deepEqual, strictEqual, throws } from "node:assert"
import { describe, it } from "node:test"
import { dummyBytes } from "@helios-lang/codec-utils"
import {
    makeByteArrayData,
    makeConstrData,
    makeIntData
} from "@helios-lang/uplc"
import { convertUplcDataToTxOutputDatum } from "./TxOutputDatum.js"

describe("TxOutputDatum", () => {
    describe("fromUplcData", () => {
        it("handles None correctly", () => {
            const datum = convertUplcDataToTxOutputDatum(makeConstrData(0, []))

            strictEqual(datum, undefined)
        })

        it("handles Hash correctly", () => {
            const bytes = dummyBytes(32)
            const datum = convertUplcDataToTxOutputDatum(
                makeConstrData(1, [makeByteArrayData(bytes)])
            )

            deepEqual(
                datum &&
                    datum.kind == "HashedTxOutputDatum" &&
                    datum.hash.bytes,
                bytes
            )
        })

        it("handles Inline correctly", () => {
            const payload = makeIntData(0)
            const datum = convertUplcDataToTxOutputDatum(
                makeConstrData(2, [payload])
            )

            strictEqual(
                datum &&
                    datum.kind == "InlineTxOutputDatum" &&
                    datum.data.toSchemaJson(),
                payload.toSchemaJson()
            )
        })

        it("fails if more than zero None fields", () => {
            throws(() => {
                convertUplcDataToTxOutputDatum(
                    makeConstrData(0, [makeIntData(0)])
                )
            })
        })

        it("fails if no Hash fields", () => {
            throws(() => {
                convertUplcDataToTxOutputDatum(makeConstrData(1, []))
            })
        })

        it("fails if too many Hash fields", () => {
            throws(() => {
                convertUplcDataToTxOutputDatum(
                    makeConstrData(1, [makeIntData(0), makeIntData(0)])
                )
            })
        })

        it("fails if no Inline fields", () => {
            throws(() => {
                convertUplcDataToTxOutputDatum(makeConstrData(2, []))
            })
        })

        it("fails if too many Inline fields", () => {
            throws(() => {
                convertUplcDataToTxOutputDatum(
                    makeConstrData(2, [makeIntData(0), makeIntData(0)])
                )
            })
        })
    })
})
