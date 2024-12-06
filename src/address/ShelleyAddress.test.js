import { deepEqual, strictEqual, throws } from "node:assert"
import { describe, it } from "node:test"
import {
    convertUplcDataToShelleyAddress,
    makeDummyShelleyAddress,
    makeShelleyAddress
} from "./ShelleyAddress.js"

const testAddressBytes =
    "004988cad9aa1ebd733b165695cfef965fda2ee42dab2d8584c43b039c96f91da5bdb192de2415d3e6d064aec54acee648c2c6879fad1ffda1"

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

describe("makeShelleyAddress", () => {
    it("can decode hex encoded address bytes", () => {
        makeShelleyAddress(testAddressBytes)
    })
})

describe("ShelleyAddress.toUplcData", () => {
    it("roundtrip ok", () => {
        const address = makeShelleyAddress(testAddressBytes)

        strictEqual(
            convertUplcDataToShelleyAddress(
                address.mainnet,
                address.toUplcData()
            ).toBech32(),
            address.toBech32()
        )
    })
})
