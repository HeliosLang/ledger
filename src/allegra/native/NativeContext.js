/**
 * @typedef {import("../../shelley/index.js").NativeContext} ShelleyNativeContext
 */

/**
 * @typedef {ShelleyNativeContext & {
 *   isAfter: (slot: bigint) => boolean
 *   isBefore: (slot: bigint) => boolean
 * }} NativeContext
 */
