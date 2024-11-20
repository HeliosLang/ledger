import { decodeInt, decodeTagged } from "@helios-lang/cbor"
import { makeByteStream } from "@helios-lang/codec-utils"
import { decodeStakingCredential } from "../address/index.js"
import { decodePubKeyHash } from "../hashes/index.js"
import { decodePoolParameters } from "../pool/index.js"
import { makeRegistrationDCert } from "./RegistrationDCert.js"
import { makeDeregistrationDCert } from "./DeregistrationDCert.js"
import { makeDelegationDCert } from "./DelegationDCert.js"
import { makeRetirePoolDCert } from "./RetirePoolDCert.js"
import { makeRegisterPoolDCert } from "./RegisterPoolDCert.js"

/**
 * @import { BytesLike } from "@helios-lang/codec-utils"
 * @import { DCert } from "src/index.js"
 */

/**
 * @param {BytesLike} bytes
 * @returns {DCert}
 */
export function decodeDCert(bytes) {
    const stream = makeByteStream({ bytes })

    const [tag, decodeItem] = decodeTagged(stream)

    switch (tag) {
        case 0:
            return makeRegistrationDCert(decodeItem(decodeStakingCredential))
        case 1:
            return makeDeregistrationDCert(decodeItem(decodeStakingCredential))
        case 2:
            return makeDelegationDCert(
                decodeItem(decodeStakingCredential),
                decodeItem(decodePubKeyHash)
            )
        case 3:
            return makeRegisterPoolDCert(decodeItem(decodePoolParameters))
        case 4:
            return makeRetirePoolDCert(
                decodeItem(decodePubKeyHash),
                decodeItem(decodeInt)
            )
        default:
            throw new Error(`unhandled DCert type (tag: ${tag})`)
    }
}
