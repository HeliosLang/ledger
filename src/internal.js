/**
 * @import { AssertExtends } from "@helios-lang/type-utils"
 * @import { Address, AfterScript, AllScript, AnyScript, AtLeastScript, BeforeScript, NativeContext, NativeScriptJsonSafe, SigScript } from "./index.js"
 */

/**
 * @typedef {{
 *   kind: string
 *   era: string
 *   isEqual(other: Address): boolean
 *   toCbor(): number[]
 *   toString(): string
 * }} CommonAddressProps
 */

/**
 * Address common props
 * @typedef {AssertExtends<CommonAddressProps, Address>} _AddressHasCommonProps
 */

/**
 * @typedef {{
 *   kind: string
 *   eval(ctx: NativeContext): boolean
 *   toCbor(): number[]
 *   toJsonSafe(): NativeScriptJsonSafe
 * }} CommonNativeScriptProps
 */

/**
 * NativeScript implementations
 * @typedef {AssertExtends<CommonNativeScriptProps, AfterScript>} _AfterScriptExtendsCommonNativeScriptProps
 * @typedef {AssertExtends<CommonNativeScriptProps, AllScript>} _AllScriptExtendsCommonNativeScriptProps
 * @typedef {AssertExtends<CommonNativeScriptProps, AnyScript>} _AnyScriptExtendsCommonNativeScriptProps
 * @typedef {AssertExtends<CommonNativeScriptProps, AtLeastScript>} _AtLeastScriptExtendsCommonNativeScriptProps
 * @typedef {AssertExtends<CommonNativeScriptProps, BeforeScript>} _BeforeScriptExtendsCommonNativeScriptProps
 * @typedef {AssertExtends<CommonNativeScriptProps, SigScript>} _SigScriptExtendsCommonNativeScriptProps
 */
