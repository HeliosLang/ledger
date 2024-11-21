import { makeConstrData } from "@helios-lang/uplc"

/**
 * @import { ConstrData, UplcData } from "@helios-lang/uplc"
 * @import { CertifyingPurpose, DCert } from "../index.js"
 */

/**
 * @param {DCert} dcert
 * @returns {CertifyingPurpose}
 */
export function makeCertifyingPurpose(dcert) {
    return new CertifyingPurposeImpl(dcert)
}

/**
 * Doesn't include functionality to make Tx UplcData as that is done external
 */
class CertifyingPurposeImpl {
    /**
     * @readonly
     * @type {DCert}
     */
    dcert

    /**
     * @param {DCert} dcert
     */
    constructor(dcert) {
        this.dcert = dcert
    }

    /**
     * @type {"CertifyingPurpose"}
     */
    get kind() {
        return "CertifyingPurpose"
    }

    /**
     * @returns {ConstrData}
     */
    toUplcData() {
        return makeConstrData({ tag: 3, fields: [this.dcert.toUplcData()] })
    }

    /**
     * @param {UplcData} txData
     * @returns {UplcData}
     */
    toScriptContextUplcData(txData) {
        return makeConstrData({ tag: 0, fields: [txData, this.toUplcData()] })
    }
}
