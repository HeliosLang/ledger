import { describe, it } from "node:test"
import { MintingPolicyHash } from "../hashes/index.js";
import { Assets } from "./Assets.js"
import { strictEqual } from "node:assert";

describe(Assets.name, () => {
    it("compare test", () => {
        const mphA = new MintingPolicyHash("00000000000000000000000000000000000000000000000000000000");
        const mphB = new MintingPolicyHash("00000000000000000000000000000000000000000000000000000001");
        const mphC = new MintingPolicyHash("00000000000000000000000000000000000000000000000000000002");
        const mphD = new MintingPolicyHash("00000000000000000000000000000000000000000000000000000003");
        const mphE = new MintingPolicyHash("00000000000000000000000000000000000000000000000000000004");
    
        const assets1 = new Assets([
            [mphA, [["", 1n]]],
            [mphB, [["", 1n]]],
            [mphC, [["", 1n]]],
            [mphD, [["", 1n]]],
            [mphE, [["", 1n]]]
        ]);
    
        const assets2 = new Assets([
            [mphA, [["", 1n]]]
        ]);

        strictEqual(assets1.isGreaterOrEqual(assets2), true)
    })
})