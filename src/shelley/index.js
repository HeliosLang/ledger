export { PubKeyHash } from "./hashes/index.js"
export { NativeScript } from "./native/index.js"

/**
 * @typedef {import("./hashes/index.js").Hash} Hash
 * @typedef {import("./hashes/index.js").PubKeyHashLike} PubKeyHashLike
 * @typedef {import("./native/index.js").NativeContext} NativeContext
 * @typedef {import("./native/index.js").NativeScriptKind} NativeScriptKind
 */

/**
 * @template {NativeContext} [C=NativeContext]
 * @typedef {import("./native/index.js").NativeScriptI<C>} NativeScriptI
 */

/**
 * @template {NativeScriptKind} K
 * @template {NativeContext} [C=NativeContext]
 * @typedef {import("./native/index.js").NativeScriptProps<K, C>} NativeScriptProps
 */
