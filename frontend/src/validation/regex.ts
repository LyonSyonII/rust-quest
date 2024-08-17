import { char as _any, anyOf, digit, exactly, maybe, oneOrMore, whitespace, word, wordChar } from "magic-regexp";

/** Matches start of string. */
export const start = exactly().at.lineStart();

/** Matches end of string. */
export const end = exactly().at.lineEnd();

/** Matches any character except newline. */
export const any = _any;

/** Matches a line. */
export const line = any.times.any()

/** Matches `true` or `false`. */
export const bool = exactly("true").or("false");

/** Matches an integer (positive or negative). */
export const integer = exactly(maybe("-"), oneOrMore(digit));

/** Matches a number (with optional decimal point). */
export const number = exactly(maybe("-"), oneOrMore(digit), maybe(".", oneOrMore(digit)));

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
export const _ = whitespace.times.any();

/** Accepts 1 or more whitespace. */
export const __ = oneOrMore(whitespace);

/** Accepts a semicolon surrounded by whitespace. */
export const semicolon = exactly(_, ";", _);

export const ident = oneOrMore(anyOf(wordChar, "_"));

export const fn = ident.and("()")