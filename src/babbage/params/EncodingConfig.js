/**
 * Sadly the cbor encoding can be done in a variety of ways, for which a config must be passed around `toCbor()` calls
 * @typedef {{
 *   strictBabbage?: boolean
 * }} EncodingConfig
 */

export const DEFAULT_ENCODING_CONFIG = {
    strictBabbage: false
}
