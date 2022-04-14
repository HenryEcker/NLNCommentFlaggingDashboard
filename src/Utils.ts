import {Comment} from "./Types";

/**
 * Converts an array of distinct RegExp and joins them together using OR (|)
 *
 * @param {Array<RegExp>} arrRegex Array of RegExp that will be ORed (|) together
 * @param {string} flags String representation of flags to apply to the joined RegExp (e.g. 'g', 'i', 'gi', etc.)
 * @returns {RegExp} The joint RegExp
 */
export function mergeRegexes(arrRegex: Array<RegExp>, flags: string): RegExp {
    return new RegExp(arrRegex.map(p => p.source).join('|'), flags);
}

/**
 * Easily capitalise the first letter of any string
 *
 * @param {string} str
 * @returns {string} str with the first letter capitalised
 */
export function capitalise(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Adds an htmlDecode function to all Strings. This makes it easy to decode the response from the SE API
 * @returns {string}
 */
export function htmlDecode(str: string): string | null {
    return new DOMParser().parseFromString(str, "text/html").documentElement.textContent;
}

/**
 * Formats a number to two decimal places with a percent sign
 *
 * @param {number} percent The value to format
 * @param {number} precision The number of decimal places to round to. (Defaults to 2)
 * @returns {`${string}%`} The rounded percent with % sign
 */
export function formatPercentage(percent: number, precision = 2): string {
    return `${percent.toFixed(precision)}%`;
}

/**
 * Calculate what percentage of the comment is noise
 *
 * @param {Array<string>} matches Result from String.match
 * @param {number} totalLength Total Length of the String
 * @returns {number} The resulting noise percentage (out of 100)
 */
export function calcNoiseRatio(matches: Array<string>, totalLength: number): number {
    const lengthWeight = matches.reduce((total: number, match: string) => {
        return total + match.length
    }, 0);
    return lengthWeight / totalLength * 100;
}


/**
 * Get timestamp for now offset by a certain number of hours prior.
 * hours=0 will just return the timestamp for now.
 *
 * @param {number} hours Number of hours to offset
 * @returns {number} The timestamp relative to now
 */
export function getOffset(hours: number): number {
    return new Date().getTime() - (hours * 60 * 60 * 1000)
}

/**
 * Easily format comment as a String. Includes noise ratio, blacklist matches, and link to comment
 *
 * @param {Comment} comment
 * @returns {`${string}% [${*}] (${*})`}
 */
export function formatComment(comment: Comment): string {
    return `${formatPercentage(comment.noise_ratio)} [${comment.blacklist_matches.join(',')}] (${comment.link})`;
}

/**
 * Converts a number in MS to a string formatted in seconds with an 's' for CSS
 *
 * @param ms duration in milliseconds
 * @returns {string} formatted string
 */
export function formatCSSDuration(ms: number) {
    return `${ms / 1000}s`;
}

/**
 * Take an object and convert it to a settable type (FormData, URLSearchParams, etc.)
 * @param {object} obj Object to convert
 * @param initialAcc Empty return type object (new FormData(), new URLSearchParams(), etc.)
 */
function reduceObjectToSettableType<Type extends {
    set: (key: string, value: string) => void
}>(obj: object, initialAcc: Type): Type {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        acc.set(key, value);
        return acc;
    }, initialAcc);
}

export function getFormDataFromObject(o: object): FormData {
    return reduceObjectToSettableType<FormData>(o, new FormData());
}

export function getURLSearchParamsFromObject(o: object): URLSearchParams {
    return reduceObjectToSettableType<URLSearchParams>(o, new URLSearchParams());
}