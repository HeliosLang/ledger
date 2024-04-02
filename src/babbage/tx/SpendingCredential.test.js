import { describe, it } from "node:test"
import {
    MintingPolicyHash,
    PubKeyHash,
    ValidatorHash
} from "../hashes/index.js"
import { SpendingCredential } from "./SpendingCredential.js"
import { UplcConst, UplcInt, UplcProgramV2 } from "@helios-lang/uplc"

describe(SpendingCredential.name, () => {
    it("typechecks", () => {
        const unwitnessedPkh = PubKeyHash.dummy()

        /**
         * unwitnessed
         * @satisfies {SpendingCredential<"PubKey", null>}
         */
        const unwitnessed = SpendingCredential.fromAlike(unwitnessedPkh)

        const dummyBytes = ValidatorHash.dummy().bytes
        const unwitnessedVh = new ValidatorHash(dummyBytes, null)

        /**
         * witnessed by NativeScript
         * @satisfies {SpendingCredential<"Validator", null>}
         */
        const witnessedByNative = SpendingCredential.fromAlike(unwitnessedVh)

        const witnessedOrUnwitnessedVh = new ValidatorHash(dummyBytes)

        /**
         * default, unwitnessed or witnessed
         * @satisfies {SpendingCredential<"Validator", unknown>}
         */
        const witnessedOrUnwitnessed = SpendingCredential.fromAlike(
            witnessedOrUnwitnessedVh
        )

        const dummyProgram = new UplcProgramV2(new UplcConst(new UplcInt(0)))
        const witnessedVh = new ValidatorHash(dummyBytes, { program: dummyProgram })

        /**
         * SpendingCredential<{...}> (witnessed by UplcProgram)
         * @satisfies {SpendingCredential<"Validator", {program: UplcProgramV2}>}
         */
        const witnessed = SpendingCredential.fromAlike(witnessedVh)

        /**
         * @satisfies {SpendingCredential<"Validator", {program: UplcProgramV2}>}
         */
        const witnessedCopy = SpendingCredential.fromAlike(witnessed)
    })
})
