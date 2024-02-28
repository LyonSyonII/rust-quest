import { exactly, maybe, oneOrMore, whitespace, word, char as any } from "magic-regexp";

/** Accepts a string delimited with `'` and exactly one character. 
 * @example 'X'
 * */
export const char = exactly("'", any, "'");

/** Accepts a string delimited with `'` and zero or more characters.
 * 
 * @example 'Hello'
 * @example ''
 */
export const wrongCharZ = exactly("'", maybe(word), "'");

/** Accepts a string delimited with `"` and zero or more characters.
 * 
 * @example "Hello"
 */
export const stringZ = exactly('"', maybe(word), '"');

/** Accepts a string delimited with `'` and one or more characters.
 * 
 * @example 'Hello'
 */
export const wrongChar = exactly("'", word, "'");

/** Accepts a string delimited with `"` and one or more characters.
 * 
 * @example "Hello"
 */
export const string = exactly('"', word, '"');

/** Accepts 0 or more whitespace. */
export const _ = maybe(oneOrMore(whitespace));

/** Accepts a semicolon sorrounded by whitespace. */
export const semicolon = exactly(_, ";", _);