import { decodeBytes, encodeBytes } from "@helios-lang/cbor"
import { None, bytesToHex, hexToBytes, isSome } from "@helios-lang/codec-utils"
import { decodeBech32, encodeBech32 } from "@helios-lang/crypto"
import { ByteArrayData, ConstrData, decodeUplcData } from "@helios-lang/uplc"
import { config } from "./config.js"
import { PubKeyHash } from "./PubKeyHash.js"
import { StakingValidatorHash } from "./StakingValidatorHash.js"
import { ValidatorHash } from "./ValidatorHash.js"

/**
 * @template T
 * @typedef {import("@helios-lang/codec-utils").Option<T>} Option
 */

/**
 * @typedef {import("@helios-lang/uplc").UplcData} UplcData
 */

/**
 * Wrapper for Cardano address bytes. An `Address` consists of three parts internally:
 *   * Header (1 byte, see [CIP 19](https://cips.cardano.org/cips/cip19/))
 *   * Witness hash (28 bytes that represent the `PubKeyHash` or `ValidatorHash`)
 *   * Optional staking credential (0 or 28 bytes)
 */
export class Address {
    /**
     * @readonly
     * @type {number[]}
     */
    bytes

    /**
     * @private
     * @param {string | number[] | {bytes: number[]}} arg
     * @returns {number[]}
     */
    static cleanConstructorArg(arg) {
        if (typeof arg == "object" && "bytes" in arg) {
            return arg.bytes
        } else if (typeof arg == "string") {
            if (arg.startsWith("addr")) {
                return Address.fromBech32(arg).bytes
            } else {
                if (arg.startsWith("#")) {
                    arg = arg.slice(1)
                }

                return hexToBytes(arg)
            }
        } else {
            return arg
        }
    }

    /**
     * @param {number[] | string | {bytes: number[]}} bytesOrBech32String
     */
    constructor(bytesOrBech32String) {
        this.bytes = Address.cleanConstructorArg(bytesOrBech32String)

        if (!(this.bytes.length == 29 || this.bytes.length == 57)) {
            throw new Error(
                `expected 29 or 57 bytes for Address, got ${this.bytes.length}`
            )
        }
    }

    /**
     * Returns a dummy address (based on a PubKeyHash with all null bytes)
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static dummy(isTestnet = config.isTestnet) {
        return Address.fromPubKeyHash(PubKeyHash.dummy(), None, isTestnet)
    }

    /**
     * @param {Address | number[] | string | {bytes: number[]}} arg
     * @returns {Address}
     */
    static from(arg) {
        return arg instanceof Address ? arg : new Address(arg)
    }

    /**
     * Converts a Bech32 string into an `Address`.
     * @param {string} str
     * @returns {Address}
     */
    static fromBech32(str) {
        // ignore the prefix (encoded in the bytes anyway)
        let [prefix, bytes] = decodeBech32(str)

        let result = new Address(bytes)

        if (prefix != (result.isForTestnet() ? "addr_test" : "addr")) {
            throw new Error("invalid Address prefix")
        }

        return result
    }

    /**
     * Deserializes bytes into an `Address`.
     * @param {number[]} bytes
     * @returns {Address}
     */
    static fromCbor(bytes) {
        return new Address(decodeBytes(bytes))
    }

    /**
     * Constructs an Address using either a `PubKeyHash` (i.e. simple payment address)
     * or `ValidatorHash` (i.e. script address),
     * without a staking hash.
     * @param {PubKeyHash | ValidatorHash} hash
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromHash(hash, isTestnet = config.isTestnet) {
        return Address.fromHashes(hash, null, isTestnet)
    }

    /**
     * Constructs an Address using either a `PubKeyHash` (i.e. simple payment address)
     * or `ValidatorHash` (i.e. script address),
     * in combination with an optional staking hash (`PubKeyHash` or `StakingValidatorHash`).
     * @param {PubKeyHash | ValidatorHash} hash
     * @param {Option<PubKeyHash | StakingValidatorHash>} stakingHash
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromHashes(hash, stakingHash, isTestnet = config.isTestnet) {
        if (hash instanceof PubKeyHash) {
            return Address.fromPubKeyHash(hash, stakingHash, isTestnet)
        } else if (hash instanceof ValidatorHash) {
            return Address.fromValidatorHash(hash, stakingHash, isTestnet)
        } else {
            throw new Error("unexpected")
        }
    }

    /**
     * Constructs an `Address` using a hexadecimal string representation of the address bytes.
     * Doesn't check validity.
     * @param {string} hex
     * @returns {Address}
     */
    static fromHex(hex) {
        return new Address(hexToBytes(hex))
    }

    /**
     * Simple payment address with an optional staking hash (`PubKeyHash` or `StakingValidatorHash`).
     * @private
     * @param {PubKeyHash} hash
     * @param {Option<PubKeyHash | StakingValidatorHash>} stakingHash
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromPubKeyHash(hash, stakingHash, isTestnet) {
        if (stakingHash) {
            if (stakingHash instanceof PubKeyHash) {
                return new Address(
                    [isTestnet ? 0x00 : 0x01]
                        .concat(hash.bytes)
                        .concat(stakingHash.bytes)
                )
            } else {
                return new Address(
                    [isTestnet ? 0x20 : 0x21]
                        .concat(hash.bytes)
                        .concat(stakingHash.bytes)
                )
            }
        } else {
            return new Address([isTestnet ? 0x60 : 0x61].concat(hash.bytes))
        }
    }

    /**
     * @param {string | number[]} bytes
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromUplcCbor(bytes, isTestnet = config.isTestnet) {
        return Address.fromUplcData(decodeUplcData(bytes), isTestnet)
    }

    /**
     * @param {UplcData} data
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromUplcData(data, isTestnet = config.isTestnet) {
        ConstrData.assert(data, 0, 2)

        const credData = ConstrData.expect(
            data.fields[0],
            "invalid Crendetial UplcData within Address"
        ).expectFields(1, "invalid Crendetial UplcData within Address")
        const stakData = ConstrData.expect(
            data.fields[1],
            "invalid StakingCredential UplcData within Address"
        )

        /**
         * @type {Option<PubKeyHash | StakingValidatorHash>}
         */
        let sh = None

        // for some weird reason Option::None has index 1
        if (stakData.tag == 1) {
            sh = None
        } else if (stakData.tag == 0) {
            stakData.expectFields(
                1,
                "invalid StakingCredential UplcData content within Address"
            )

            const inner = ConstrData.expect(stakData.fields[0]).expectFields(1)

            if (inner.tag == 0) {
                const innerInner = ConstrData.expect(
                    inner.fields[0]
                ).expectFields(1)
                const innerInnerBytes = ByteArrayData.expect(
                    innerInner.fields[0]
                ).bytes

                if (innerInner.tag == 0) {
                    sh = new PubKeyHash(innerInnerBytes)
                } else if (innerInner.tag == 1) {
                    sh = new StakingValidatorHash(innerInnerBytes)
                } else {
                    throw new Error("unexpected")
                }
            } else if (inner.tag == 1) {
                throw new Error("staking pointer not yet handled")
            } else {
                throw new Error("unexpected")
            }
        } else {
            throw new Error("unexpected")
        }

        const credBytes = ByteArrayData.expect(credData.fields[0]).bytes

        if (credData.tag == 0) {
            return Address.fromPubKeyHash(
                new PubKeyHash(credBytes),
                sh,
                isTestnet
            )
        } else if (credData.tag == 1) {
            return Address.fromValidatorHash(
                new ValidatorHash(credBytes),
                sh,
                isTestnet
            )
        } else {
            throw new Error("unexpected")
        }
    }

    /**
     * Simple script address with an optional staking hash (`PubKeyHash` or `StakingValidatorHash`).
     * @private
     * @param {ValidatorHash} hash
     * @param {Option<PubKeyHash | StakingValidatorHash>} stakingHash
     * @param {boolean} isTestnet
     * @returns {Address}
     */
    static fromValidatorHash(hash, stakingHash, isTestnet) {
        if (isSome(stakingHash)) {
            if (stakingHash instanceof PubKeyHash) {
                return new Address(
                    [isTestnet ? 0x10 : 0x11]
                        .concat(hash.bytes)
                        .concat(stakingHash.bytes)
                )
            } else {
                return new Address(
                    [isTestnet ? 0x30 : 0x31]
                        .concat(hash.bytes)
                        .concat(stakingHash.bytes)
                )
            }
        } else {
            return new Address([isTestnet ? 0x70 : 0x71].concat(hash.bytes))
        }
    }

    /**
     * Converts an `Address` into its Bech32 representation.
     * @returns {string}
     */
    toBech32() {
        return encodeBech32(
            this.isForTestnet() ? "addr_test" : "addr",
            this.bytes
        )
    }

    /**
     * Converts an `Address` into its CBOR representation.
     * @returns {number[]}
     */
    toCbor() {
        return encodeBytes(this.bytes)
    }

    /**
     * @private
     * @returns {ConstrData}
     */
    toCredentialData() {
        const vh = this.validatorHash

        if (isSome(vh)) {
            return new ConstrData(1, [new ByteArrayData(vh.bytes)])
        } else {
            const pkh = this.pubKeyHash

            if (isSome(pkh)) {
                return new ConstrData(0, [new ByteArrayData(pkh.bytes)])
            } else {
                throw new Error("unexpected")
            }
        }
    }

    /**
     * Converts a `Address` into its hexadecimal representation.
     * @returns {string}
     */
    toHex() {
        return bytesToHex(this.bytes)
    }

    /**
     * @private
     * @returns {ConstrData}
     */
    toStakingData() {
        const type = this.bytes[0] >> 4
        const sh = this.stakingHash

        if (sh == null) {
            return new ConstrData(1, []) // none
        } else {
            if (type == 4 || type == 5) {
                throw new Error("not yet implemented")
            } else if (type == 3 || type == 2) {
                // some
                return new ConstrData(0, [
                    // staking credential -> 0, 1 -> pointer
                    new ConstrData(0, [
                        // StakingValidator credential
                        new ConstrData(1, [new ByteArrayData(sh.bytes)])
                    ])
                ])
            } else if (type == 0 || type == 1) {
                // some
                return new ConstrData(0, [
                    // staking credential -> 0, 1 -> pointer
                    new ConstrData(0, [
                        // PubKeyHash credential
                        new ConstrData(0, [new ByteArrayData(sh.bytes)])
                    ])
                ])
            } else {
                throw new Error("unexpected")
            }
        }
    }

    /**
     * @returns {UplcData}
     */
    toUplcData() {
        return new ConstrData(0, [
            this.toCredentialData(),
            this.toStakingData()
        ])
    }

    /**
     * Converts a `Address` into its hexadecimal representation.
     * @returns {string}
     */
    get hex() {
        return this.toHex()
    }

    /**
     * @param {Address} other
     * @returns {boolean}
     */
    equals(other) {
        return ByteArrayData.compare(this.bytes, other.bytes) == 0
    }

    /**
     * @returns {Object}
     */
    dump() {
        return {
            hex: bytesToHex(this.bytes),
            bech32: this.toBech32()
        }
    }

    /**
     * Returns `true` if the given `Address` is a testnet address.
     * @returns {boolean}
     */
    isForTestnet() {
        let type = this.bytes[0] & 0b00001111

        return type == 0
    }

    /**
     * Returns the underlying `PubKeyHash` of a simple payment address, or `null` for a script address.
     * @type {Option<PubKeyHash>}
     */
    get pubKeyHash() {
        let type = this.bytes[0] >> 4

        if (type % 2 == 0) {
            return new PubKeyHash(this.bytes.slice(1, 29))
        } else {
            return None
        }
    }

    /**
     * Returns the underlying `ValidatorHash` of a script address, or `null` for a regular payment address.
     * @type {Option<ValidatorHash>}
     */
    get validatorHash() {
        let type = this.bytes[0] >> 4

        if (type % 2 == 1) {
            return new ValidatorHash(this.bytes.slice(1, 29))
        } else {
            return None
        }
    }

    /**
     * Returns the underlying `PubKeyHash` or `StakingValidatorHash`, or `null` for non-staked addresses.
     * @type {Option<PubKeyHash | StakingValidatorHash>}
     */
    get stakingHash() {
        let type = this.bytes[0] >> 4

        let bytes = this.bytes.slice(29)

        if (type == 0 || type == 1) {
            if (bytes.length != 28) {
                throw new Error(`expected 28 bytes, got ${bytes.length} bytes`)
            }

            return new PubKeyHash(bytes)
        } else if (type == 2 || type == 3) {
            if (bytes.length != 28) {
                throw new Error(`expected 28 bytes, got ${bytes.length} bytes`)
            }

            return new StakingValidatorHash(bytes)
        } else if (type == 4 || type == 5) {
            throw new Error("staking pointer not yet supported")
        } else {
            return null
        }
    }

    /**
     * Used to sort txbody withdrawals.
     * @param {Address} a
     * @param {Address} b
     * @param {boolean} stakingHashesOnly
     * @return {number}
     */
    static compare(a, b, stakingHashesOnly = false) {
        if (stakingHashesOnly) {
            if (isSome(a.stakingHash) && isSome(b.stakingHash)) {
                return ByteArrayData.compare(
                    a.stakingHash.bytes,
                    b.stakingHash.bytes
                )
            } else {
                throw new Error("can't compare undefined stakingHashes")
            }
        } else {
            throw new Error("not yet implemented")
        }
    }
}
