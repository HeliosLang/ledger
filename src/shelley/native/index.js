export { NativeScript } from "./NativeScript.js"

/**
 * @typedef {import("./NativeContext.js").NativeContext} NativeContext
 * @typedef {import("./NativeScript.js").NativeScriptKind} NativeScriptKind
 */

/**
 * @template {NativeContext} [C=NativeContext]
 * @typedef {import("./NativeScript.js").NativeScriptI<C>} NativeScriptI
 */

/**
 * @template {NativeScriptKind} K
 * @template {NativeContext} [C=NativeContext]
 * @typedef {import("./NativeScript.js").NativeScriptProps<K, C>} NativeScriptProps
 */
