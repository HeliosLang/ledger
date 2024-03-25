/**
 * @typedef {Date | number | bigint}  TimeLike
 */

/**
 * @param {TimeLike} t
 * @returns {number}
 */
export function timeToNumber(t) {
    return t instanceof Date ? t.getTime() : Number(t)
}
