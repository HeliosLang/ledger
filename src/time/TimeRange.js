import {
    boolToUplcData,
    expectConstrData,
    expectIntData,
    makeConstrData,
    makeIntData,
    uplcDataToBool
} from "@helios-lang/uplc"
import { toTime } from "./Time.js"

/**
 * @import { ConstrData, UplcData } from "@helios-lang/uplc"
 * @import { TimeLike, TimeRange, TimeRangeLike, TimeRangeOptions } from "../index.js"
 */

/**
 * @overload
 * @param {TimeLike} start - milliseconds since 1970
 * @param {TimeLike} end - milliseconds since 1970
 * @returns {TimeRange}
 *
/**
 * @overload
 * @param {TimeLike} start - milliseconds since 1970
 * @param {TimeLike} end - milliseconds since 1970
 * @param {TimeRangeOptions} options
 * @returns {TimeRange}
 */
/**
 * @overload
 * @param {TimeRangeLike} arg
 * @returns {TimeRange}
 */
/**
 * @param {(
 *   [TimeLike, TimeLike]
 *   | [TimeLike, TimeLike, TimeRangeOptions]
 *   | [TimeRangeLike]
 * )} args
 * @returns {TimeRange}
 */
export function makeTimeRange(...args) {
    if (args.length == 1) {
        const arg = args[0]
        if (
            typeof arg == "object" &&
            "kind" in arg &&
            arg.kind == "TimeRange"
        ) {
            return arg
        } else if (Array.isArray(arg)) {
            return new TimeRangeImpl(arg[0], arg[1])
        } else {
            return new TimeRangeImpl(
                arg?.start ?? Number.NEGATIVE_INFINITY,
                arg?.end ?? Number.POSITIVE_INFINITY,
                {
                    excludeStart: /** @type {any} */ (arg)?.excludeStart,
                    excludeEnd: /** @type {any} */ (arg)?.excludeEnd
                }
            )
        }
    } else if (args.length == 2) {
        return new TimeRangeImpl(args[0], args[1])
    } else if (args.length == 3) {
        return new TimeRangeImpl(args[0], args[1], args[2])
    } else {
        throw new Error("invalid number of arguments for makeTimeRange")
    }
}

/**
 * @param {UplcData} data
 * @returns {TimeRange}
 */
export function convertUplcDataToTimeRange(data) {
    const cData = expectConstrData(data, 0, 2)

    const [startData, endData] = cData.fields

    const cStartData = expectConstrData(startData, 0, 2)
    const cEndData = expectConstrData(endData, 0, 2)

    const [startTimeData, includeStartData] = cStartData.fields
    const [endTimeData, includeEndData] = cEndData.fields

    const startTime = decodeTimeRangeTimeData(startTimeData, true)
    const endTime = decodeTimeRangeTimeData(endTimeData, true)
    const includeStart = uplcDataToBool(includeStartData, true)
    const includeEnd = uplcDataToBool(includeEndData, true)

    return new TimeRangeImpl(startTime, endTime, {
        excludeStart: !includeStart,
        excludeEnd: !includeEnd
    })
}

/**
 * `start` and `end` are stored as numbers so we can use Number.NEGATIVE_INFINITY and Number.POSITIVE_INFINITY
 * @implements {TimeRange}
 */
class TimeRangeImpl {
    /**
     * @readonly
     * @type {number}
     */
    start

    /**
     * @readonly
     * @type {boolean}
     */
    includeStart

    /**
     * @readonly
     * @type {number}
     */
    end

    /**
     * @readonly
     * @type {boolean}
     */
    includeEnd

    /**
     * @param {TimeLike} start - milliseconds since 1970
     * @param {TimeLike} end - milliseconds since 1970
     * @param {TimeRangeOptions} options
     */
    constructor(start, end, options = {}) {
        this.start = toTime(start)
        this.end = toTime(end)
        this.includeStart = !(options.excludeStart ?? false)
        this.includeEnd = !(options.excludeEnd ?? false)
    }

    /**
     * @type {"TimeRange"}
     */
    get kind() {
        return "TimeRange"
    }

    /**
     * @type {number | undefined}
     */
    get finiteStart() {
        if (
            this.start !== Number.NEGATIVE_INFINITY &&
            this.start !== Number.POSITIVE_INFINITY
        ) {
            return this.start
        } else {
            return undefined
        }
    }

    /**
     * @type {number | undefined}
     */
    get finiteEnd() {
        if (
            this.end !== Number.NEGATIVE_INFINITY &&
            this.end !== Number.POSITIVE_INFINITY
        ) {
            return this.end
        } else {
            return undefined
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        if (
            this.end == Number.NEGATIVE_INFINITY ||
            this.start == Number.POSITIVE_INFINITY
        ) {
            return "<never>"
        } else {
            return [
                `${this.includeStart ? "[" : "("}${this.start == Number.NEGATIVE_INFINITY ? "-inf" : this.start.toString()}`,
                `${this.end == Number.POSITIVE_INFINITY ? "+inf" : this.end.toString()}${this.includeEnd ? "]" : ")"}`
            ].join(", ")
        }
    }

    /**
     * @returns {ConstrData}
     */
    toUplcData() {
        return makeConstrData(0, [
            makeConstrData(0, [
                encodeTimeRangeTimeData(this.start),
                boolToUplcData(this.includeStart)
            ]),
            makeConstrData(0, [
                encodeTimeRangeTimeData(this.end),
                boolToUplcData(this.includeEnd)
            ])
        ])
    }
}

/**
 * @param {UplcData} data
 * @param {boolean} strict
 * @returns {number}
 */
function decodeTimeRangeTimeData(data, strict = false) {
    const cData = expectConstrData(data)

    switch (cData.tag) {
        case 0:
            if (strict && cData.fields.length != 0) {
                throw new Error(
                    `expected 0 ConstrData fields in TimeRange negative infinity, got ${cData.fields.length} fields`
                )
            }

            return Number.NEGATIVE_INFINITY
        case 1:
            if (
                cData.fields.length == 0 ||
                (strict && cData.fields.length != 1)
            ) {
                throw new Error(
                    `expected 1 ConstrData fields in TimeRange time, got ${cData.fields.length} fields`
                )
            }

            return Number(expectIntData(cData.fields[0]).value)
        case 2:
            if (strict && cData.fields.length != 0) {
                throw new Error(
                    `expected 0 ConstrData fields in TimeRange positive infinity, got ${cData.fields.length} fields`
                )
            }

            return Number.POSITIVE_INFINITY
        default:
            throw new Error(
                `expected tag 0, 1 or 2 for TimeRange time ConstrData, got ${cData.tag}`
            )
    }
}

/**
 *
 * @param {number} t
 * @returns {ConstrData}
 */
function encodeTimeRangeTimeData(t) {
    switch (t) {
        case Number.NEGATIVE_INFINITY:
            return makeConstrData(0, [])
        case Number.POSITIVE_INFINITY:
            return makeConstrData(2, [])
        default:
            return makeConstrData(1, [makeIntData(Math.round(t))])
    }
}

/**
 * @type {TimeRange}
 */
export const ALWAYS = /* @__PURE__ */ new TimeRangeImpl(
    Number.NEGATIVE_INFINITY,
    Number.POSITIVE_INFINITY
)

/**
 * @type {TimeRange}
 */
export const NEVER = /* @__PURE__ */ new TimeRangeImpl(
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY
)
