import { UplcProgramV1, UplcProgramV2 } from "@helios-lang/uplc"

/**
 * @template TStrict
 * @template TPermissive
 * @typedef {import("../hashes/Cast.js").Cast<TStrict, TPermissive>} Cast
 */

/**
 * @template TDatumStrict
 * @typedef {{
 *   datum: Cast<TDatumStrict, any>
 * }} DatumPaymentContext
 */

/**
 * @template TDatumStrict
 * @template TDatumPermissive
 * @template TRedeemerStrict
 * @template TRedeemerPermissive
 * @typedef {DatumPaymentContext<TDatumStrict> & {
 *   program: UplcProgramV1 | UplcProgramV2
 *   datum: Cast<TDatumStrict, TDatumPermissive>
 *   redeemer: Cast<TRedeemerStrict, TRedeemerPermissive>
 * }} SpendingContext
 */
