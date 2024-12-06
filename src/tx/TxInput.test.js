import { describe, it } from "node:test"
import { decodeTxInput } from "./TxInput.js"

describe("decodeTxInput", () => {
    it("works for UTxO returned from Cip30 wallet", () => {
        decodeTxInput(
            "828258204cb4e9f79554fb3b572b19f68c8cce0dba929fcee2f6ab6cc390419a8d703bd8181882581d604988cad9aa1ebd733b165695cfef965fda2ee42dab2d8584c43b039c1a49da0141"
        )
    })
})
