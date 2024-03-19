import { ByteArrayData } from "@helios-lang/uplc"

/**
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 */

/**
 * @typedef {{
 *   toCbor: () => number[]
 *   toHex: () => string
 *   toString: () => string
 *   toUplcData: () => ByteArrayData
 * }} Hash
 */
