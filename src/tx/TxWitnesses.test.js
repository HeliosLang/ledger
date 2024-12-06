import { describe, it } from "node:test"
import { decodeTxWitnesses } from "./TxWitnesses.js"

describe("decodedTxWitnesses", () => {
    it("correctly deserializes CBOR", () => {
        decodeTxWitnesses(
            "a30081825820a0e006bbd52e9db2dcd904e90c335212d2968fcae92ee9dd01204543c314359b58409b4267e7691d160414f774f82942f08bbc3c64a19259a09b92350fe11ced5f73b64d99aa05f70cb68c730dc0d6ae718f739e5c2932eb843f2a9dcd69ff3c160c068147460100002249810581840100182a821903201a0002754c"
        )
    })

    it("correctly deserializes CBOR with tagged signatures array", () => {
        decodeTxWitnesses(
            "a100d901028182582044f3523cc794ecd0e4cc6aa5d459d4c0b30064d7f7f68dac0eb0653819861b985840ad8a1887d409ca2c5205a9002b104ff77ddee415d730fd85925399e622c6840c2a0c68b72d4bd57979f1d9fec70c6ee7b15a01607da98119dddf05420e274e0a"
        )
    })
})
