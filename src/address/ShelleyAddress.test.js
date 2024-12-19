import { deepEqual, strictEqual, throws } from "node:assert"
import { describe, it } from "node:test"
import { bytesToHex } from "@helios-lang/codec-utils"
import { makeValidatorHash } from "../hashes/index.js"
import {
    convertUplcDataToShelleyAddress,
    decodeShelleyAddress,
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

    it("correctly decodes header byte addresses with pubkeyhash staking credential", () => {
        const expectedBech32 =
            "addr_test1xqv4hh3aat9kzwm7n6mzszc5md8r20j8t6tdr8el0f0z6eset00rm6ktvyaha84k9q93fk6wx5lywh5k6x0n77j794nqp4vpze"
        const expected = makeShelleyAddress(expectedBech32)

        strictEqual(expected.toString(), expectedBech32)
    })
})

describe("decodeShelleyAddress", () => {
    it("decodes 30195bde3deacb613b7e9eb6280b14db4e353e475e96d19f3f7a5e2d66195bde3deacb613b7e9eb6280b14db4e353e475e96d19f3f7a5e2d66 as addr_test1xqv4hh3aat9kzwm7n6mzszc5md8r20j8t6tdr8el0f0z6eset00rm6ktvyaha84k9q93fk6wx5lywh5k6x0n77j794nqp4vpze", () => {
        const actual = decodeShelleyAddress(
            "30195bde3deacb613b7e9eb6280b14db4e353e475e96d19f3f7a5e2d66195bde3deacb613b7e9eb6280b14db4e353e475e96d19f3f7a5e2d66"
        )
        const expected = makeShelleyAddress(
            "addr_test1xqv4hh3aat9kzwm7n6mzszc5md8r20j8t6tdr8el0f0z6eset00rm6ktvyaha84k9q93fk6wx5lywh5k6x0n77j794nqp4vpze"
        )

        strictEqual(actual.toString(), expected.toString())
        strictEqual(bytesToHex(actual.bytes), bytesToHex(expected.bytes))
    })

    it("decodes 10195bde3deacb613b7e9eb6280b14db4e353e475e96d19f3f7a5e2d66195bde3deacb613b7e9eb6280b14db4e353e475e96d19f3f7a5e2d66 as addr_test1zqv4hh3aat9kzwm7n6mzszc5md8r20j8t6tdr8el0f0z6eset00rm6ktvyaha84k9q93fk6wx5lywh5k6x0n77j794nqlth7hc", () => {
        const actual = decodeShelleyAddress(
            "10195bde3deacb613b7e9eb6280b14db4e353e475e96d19f3f7a5e2d66195bde3deacb613b7e9eb6280b14db4e353e475e96d19f3f7a5e2d66"
        )
        const expected = makeShelleyAddress(
            "addr_test1zqv4hh3aat9kzwm7n6mzszc5md8r20j8t6tdr8el0f0z6eset00rm6ktvyaha84k9q93fk6wx5lywh5k6x0n77j794nqlth7hc"
        )

        strictEqual(actual.toString(), expected.toString())
        strictEqual(bytesToHex(actual.bytes), bytesToHex(expected.bytes))
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
