import { None } from "@helios-lang/type-utils"

export const config = {
    /**
     * If true, `Address` instances are assumed to be for a Testnet when constructing from hashes or raw bytes, otherwise for mainnet.
     *
     * Default: `true`.
     * @type {boolean}
     */
    IS_TESTNET: true,

    /**
     * If true, `TxOutput` is serialized using strictly the Babagge cddl format (slightly more verbose).
     *
     * Default: `false`.
     * @type {boolean}
     */
    STRICT_BABBAGE: false,

    /**
     * Maximum number of assets per change output. Used to break up very large asset outputs into multiple outputs.
     *
     * Default: `undefined` (no limit).
     * @type {Option<number>}
     */
    MAX_ASSETS_PER_CHANGE_OUTPUT: None
}
