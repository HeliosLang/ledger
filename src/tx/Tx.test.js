import { deepEqual, strictEqual, throws } from "node:assert"
import { describe, it } from "node:test"
import { bytesToHex, hexToBytes } from "@helios-lang/codec-utils"
import { makeValue } from "../money/index.js"
import { makeAddress } from "../address/index.js"
import {
    BABBAGE_NETWORK_PARAMS,
    DEFAULT_NETWORK_PARAMS
} from "../params/index.js"
import { calcRefScriptsFee, decodeTx } from "./Tx.js"
import { makeTxOutput } from "./TxOutput.js"
import { makeTxInput } from "./TxInput.js"

describe(`basic Tx`, () => {
    /**
     * send 10 tAda on preview net from wallet1 to wallet 2
     * (input is 10000 tAda, change is 9990 tAda minus fees)
     * wallet1 address: addr_test1vzzcg26lxj3twnnx889lrn60pqn0z3km2yahhsz0fvpyxdcj5qp8w
     * wallet2 address: addr_test1vqzhgmkqsyyzxthk7vzxet4283wx8wwygu9nq0v94mdldxs0d56ku
     * input utxo: d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83#0
     * command: cardano-cli transaction build --tx-in d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83#0 --tx-out addr_test1vqzhgmkqsyyzxthk7vzxet4283wx8wwygu9nq0v94mdldxs0d56ku+10000000 --change-address addr_test1vzzcg26lxj3twnnx889lrn60pqn0z3km2yahhsz0fvpyxdcj5qp8w --testnet-magic 2 --out-file /data/preview/transactions/202209042119.tx --babbage-era --cddl-format
     */
    const unsignedHex =
        "84a30081825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000182a200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b024337011b000000025370c627a200581d6005746ec08108232ef6f3046caeaa3c5c63b9c4470b303d85aedbf69a011a00989680021a00028759a0f5f6"
    const signedHex =
        "84a30081825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000182a200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b024337011b000000025370c627a200581d6005746ec08108232ef6f3046caeaa3c5c63b9c4470b303d85aedbf69a011a00989680021a00028759a10081825820a0e006bbd52e9db2dcd904e90c335212d2968fcae92ee9dd01204543c314359b584073afc3d75355883cd9a83140ed6480354578148f861f905d65a75b773d004eca5869f7f2a580c6d9cc7d54da3b307aa6cb1b8d4eb57603e37eff83ca56ec620cf5f6"

    const unsigned = decodeTx(unsignedHex)
    const signed = decodeTx(signedHex)

    const params = BABBAGE_NETWORK_PARAMS()

    it("unsigned tx contains a single input", () => {
        strictEqual(unsigned.body.inputs.length, 1)
    })

    it("unsigned tx validateSignatures fails", () => {
        throws(() => unsigned.validateSignatures())
    })

    it("signed tx validateSignatures fails (not yet recovered)", () => {
        throws(() => signed.validateSignatures())
    })

    it("unsigned fails regular validations (not yet recovered)", () => {
        throws(() => unsigned.validate(params))
    })

    it("signed fails regular validations (not yet recovered)", () => {
        throws(() => signed.validate(params))
    })

    it("minted value is zero", () => {
        strictEqual(unsigned.body.minted.isZero(), true)
    })

    it("unsigned.toCbor() should give exactly the same as original encoding", () => {
        strictEqual(bytesToHex(unsigned.toCbor()), unsignedHex)
    })

    it("signed.toCbor() should give exactly the same as original encoding", () => {
        strictEqual(bytesToHex(signed.toCbor()), signedHex)
    })

    it("signed size should be equal to original encoding size", () => {
        strictEqual(signed.calcSize(), hexToBytes(signedHex).length)
    })

    it("fee is larger or equal to min calculated fee", () => {
        const calculatedFee = signed.calcMinFee(params)
        strictEqual(signed.body.fee >= calculatedFee, true)
    })

    it("signed tx id is equal to unsigned tx id", () => {
        deepEqual(signed.id().bytes, unsigned.id().bytes)
    })

    it("recovered signed doesn't fail regular validations", async () => {
        await signed.recover({
            getUtxo: async (id) =>
                makeTxInput(
                    id,
                    makeTxOutput(
                        makeAddress(
                            "addr_test1vzzcg26lxj3twnnx889lrn60pqn0z3km2yahhsz0fvpyxdcj5qp8w"
                        ),
                        makeValue(10_000_000_000n)
                    )
                )
        })
        signed.validate(params)
    })
})

/**
 * The Txs in the following testVector were generated using the cardano-cli
 * This testvector can be used to check round-trip encoding
 * @type {{txHex: string}[]}
 */
const testVector = [
    {
        txHex: "84a60081825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000d81825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000182a200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b024337011b0000000253eaa6cca200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b02433701821a001e8480a1581c0b61cc751e9512fef62362f00e6db61e70d719a567c6d4eb68095957a14001021a0002b8b409a1581c0b61cc751e9512fef62362f00e6db61e70d719a567c6d4eb68095957a140010b5820af267b4418b11a9faa827f80301849ec4bd4565dbd95bae23f73918444eab395a206815453010000322233335734600693124c4c931251010581840100182a821909611a00094d78f5f6"
    },
    {
        txHex: "84a60081825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000d81825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000182a200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b024337011b0000000253eaa985a200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b02433701821a001e8480a1581c919d4c2c9455016289341b1a14dedf697687af31751170d56a31466ea14001021a0002b5fb09a1581c919d4c2c9455016289341b1a14dedf697687af31751170d56a31466ea140010b5820686829109fc5e6342d9223537b91f804107c4dbfa8ba3288f80657be843acd51a2068147460100002249810581840100182a821903201a0002754cf5f6"
    },
    {
        txHex: "84a60081825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000d81825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000182a200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b024337011b0000000253eaa6cca200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b02433701821a001e8480a1581c0b61cc751e9512fef62362f00e6db61e70d719a567c6d4eb68095957a14001021a0002b8b409a1581c0b61cc751e9512fef62362f00e6db61e70d719a567c6d4eb68095957a140010b5820af267b4418b11a9faa827f80301849ec4bd4565dbd95bae23f73918444eab395a30081825820a0e006bbd52e9db2dcd904e90c335212d2968fcae92ee9dd01204543c314359b5840684649bbe18d47cc58963877e777da9c7dab6206b4833c676f6301d974418b574f0d169723d7cedbd33e2cbcc07fac4a8cf32769816f8dc3153f5bdf6e510c0406815453010000322233335734600693124c4c931251010581840100182a821909611a00094d78f5f6"
    },
    {
        txHex: "84a60081825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000d81825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000182a200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b024337011b0000000253eaa985a200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b02433701821a001e8480a1581c919d4c2c9455016289341b1a14dedf697687af31751170d56a31466ea14001021a0002b5fb09a1581c919d4c2c9455016289341b1a14dedf697687af31751170d56a31466ea140010b5820686829109fc5e6342d9223537b91f804107c4dbfa8ba3288f80657be843acd51a30081825820a0e006bbd52e9db2dcd904e90c335212d2968fcae92ee9dd01204543c314359b58409b4267e7691d160414f774f82942f08bbc3c64a19259a09b92350fe11ced5f73b64d99aa05f70cb68c730dc0d6ae718f739e5c2932eb843f2a9dcd69ff3c160c068147460100002249810581840100182a821903201a0002754cf5f6"
    },
    {
        txHex: "84a400818258205d4bc6456f3bc6ac9f0c36ac25b0a4a9c2d793aaa5344355fcd2c8f647f2b55c000d818258205d4bc6456f3bc6ac9f0c36ac25b0a4a9c2d793aaa5344355fcd2c8f647f2b55c000182a200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b024337011b0000000253c6daafa300581d7052c6af0c9b744b4eecce838538a52ceb155038b3de68e2bb2fa8fc37011a001e8480028201d81842182a021a0002a09da0f5f6"
    }
]

describe("Tx.calcSize()", () => {
    const params = BABBAGE_NETWORK_PARAMS()

    testVector.forEach((t, i) => {
        it(`test tx ${i + 1}`, () => {
            const tx = decodeTx(t.txHex)

            strictEqual(tx.calcMinFee(params), tx.body.fee)
        })
    })
})

describe("calcRefScriptsFee", () => {
    it("constant fee per byte for growth factor equal to 1", () => {
        const size = 18754781231n
        const fee = calcRefScriptsFee(size, 15, 25600n, 1)
        strictEqual(fee, 15n * size)
    })

    it("equals 0 for [size=0, feePerByte=15, growthIncrement=25600, growthFactor=1.5]", () => {
        strictEqual(calcRefScriptsFee(0n, 15, 25600n, 1.5), 0n)
    })

    it("equals 384000 for [size=25600, feePerByte=15, growthIncrement=25600, growthFactor=1.5]", () => {
        strictEqual(calcRefScriptsFee(25600n, 15, 25600n, 1.5), 384000n)
    })

    it("equals 960000 for [size=2*25600, feePerByte=15, growthIncrement=25600, growthFactor=1.5]", () => {
        strictEqual(calcRefScriptsFee(2n * 25600n, 15, 25600n, 1.5), 960000n)
    })

    it("equals 1824000 for [size=3*25600, feePerByte=15, growthIncrement=25600, growthFactor=1.5]", () => {
        strictEqual(calcRefScriptsFee(3n * 25600n, 15, 25600n, 1.5), 1824000n)
    })

    it("equals 3120000 for [size=4*25600, feePerByte=15, growthIncrement=25600, growthFactor=1.5]", () => {
        strictEqual(calcRefScriptsFee(4n * 25600n, 15, 25600n, 1.5), 3120000n)
    })

    it("equals 5064000 for [size=5*25600, feePerByte=15, growthIncrement=25600, growthFactor=1.5]", () => {
        strictEqual(calcRefScriptsFee(5n * 25600n, 15, 25600n, 1.5), 5064000n)
    })

    it("equals 7980000 for [size=6*25600, feePerByte=15, growthIncrement=25600, growthFactor=1.5]", () => {
        strictEqual(calcRefScriptsFee(6n * 25600n, 15, 25600n, 1.5), 7980000n)
    })

    it("equals 12354000 for [size=7*25600, feePerByte=15, growthIncrement=25600, growthFactor=1.5]", () => {
        strictEqual(calcRefScriptsFee(7n * 25600n, 15, 25600n, 1.5), 12354000n)
    })

    it("equals 18915000 for [size=8*25600, feePerByte=15, growthIncrement=25600, growthFactor=1.5]", () => {
        strictEqual(calcRefScriptsFee(8n * 25600n, 15, 25600n, 1.5), 18915000n)
    })
})

describe("decodeTx", () => {
    it("works for with both signatures and inputs encoded as sets, keeping track encoding to ensure TxId matches", () => {
        const txHex =
            "84a300d9010281825820cdf17a9d7eeb9aa1d5c4ec2a9727305e197f233348e8441932a0ef0fbe539f6b181c0181825839000033c89bf0cf9d946ebd44d69384d50e8372566472f2b9683243aaea5a0987ee3ec775d90cb16851a5f3cc9d8b03bd6492329e89368442291b00000002540be400021a00030d40a100d901028182582045a35a111726f809cf2c33980ca06e45d29db1b06153c54e6eaafb6e4abfb2e958409f416a4620245a49d40599a473c98616fc6b6680a11bd136e181f576ebd2745ea15b0270b8baefce959949f9453ba25822262ef24bcfea7a80d812eedcb5f405f5f6"

        const tx = decodeTx(txHex)

        strictEqual(
            tx.id().toHex(),
            "2b5395c8417739ecf6a8ce447c28f4a027951673ca8fbf6b8b9d77d99715b4a6"
        )
    })
})
