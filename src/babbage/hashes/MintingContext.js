import { UplcProgramV1, UplcProgramV2 } from "@helios-lang/uplc"

/**
 * @template TStrict
 * @template TPermissive
 * @typedef {import("./Cast.js").Cast<TStrict, TPermissive>} Cast
 */

/**
 * @typedef {{
 *   program: UplcProgramV1 | UplcProgramV2
 *   redeemer: Cast<any, any>
 * }} MintingContext
 */
