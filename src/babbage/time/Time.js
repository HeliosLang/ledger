/**
 * Number representations are always milliseconds since 1970
 * @typedef {Date | number | bigint}  TimeLike
 */

/**
 * @param {TimeLike} t
 * @returns {number}
 */
export function timeToNumber(t) {
    return t instanceof Date ? t.getTime() : Number(t)
}

/**
 * @param {TimeLike} t
 * @returns {Date}
 */
export function timeToDate(t) {
    return t instanceof Date ? t : new Date(Number(t))
}
