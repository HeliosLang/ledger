import { describe, it } from "node:test"
import { deepEqual, strictEqual, throws } from "node:assert"
import { Value } from "../money/index.js"
import {
    DEFAULT_ENCODING_CONFIG,
    NetworkParamsHelper
} from "../params/index.js"
import { Address } from "./Address.js"
import { Tx } from "./Tx.js"
import { TxOutput } from "./TxOutput.js"

describe(`basic ${Tx.name}`, () => {
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

    const unsigned = Tx.fromCbor(unsignedHex)
    const signed = Tx.fromCbor(signedHex)

    const params = NetworkParamsHelper.default()

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

    it("fee is larger or equal to min calculated fee", () => {
        strictEqual(signed.body.fee >= signed.calcMinFee(params), true)
    })

    it("signed tx id is equal to unsigned tx id", () => {
        deepEqual(
            signed.id(DEFAULT_ENCODING_CONFIG).bytes,
            unsigned.id(DEFAULT_ENCODING_CONFIG).bytes
        )
    })

    it("recovered signed doesn't fail regular validations", async () => {
        await signed.recover(
            async () =>
                new TxOutput(
                    Address.new(
                        "addr_test1vzzcg26lxj3twnnx889lrn60pqn0z3km2yahhsz0fvpyxdcj5qp8w"
                    ),
                    new Value(10_000_000_000n)
                )
        )
        signed.validate(params)
    })
})
