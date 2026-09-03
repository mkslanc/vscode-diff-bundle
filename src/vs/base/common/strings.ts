/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/


export interface RegExpOptions {
	matchCase?: boolean;
	wholeWord?: boolean;
	multiline?: boolean;
	global?: boolean;
	unicode?: boolean;
}

export function compare(a: string, b: string): number {
	if (a < b) {
		return -1;
	} else if (a > b) {
		return 1;
	} else {
		return 0;
	}
}

export function compareSubstring(a: string, b: string, aStart: number = 0, aEnd: number = a.length, bStart: number = 0, bEnd: number = b.length): number {
	for (; aStart < aEnd && bStart < bEnd; aStart++, bStart++) {
		const codeA = a.charCodeAt(aStart);
		const codeB = b.charCodeAt(bStart);
		if (codeA < codeB) {
			return -1;
		} else if (codeA > codeB) {
			return 1;
		}
	}
	const aLen = aEnd - aStart;
	const bLen = bEnd - bStart;
	if (aLen < bLen) {
		return -1;
	} else if (aLen > bLen) {
		return 1;
	}
	return 0;
}

export function compareSubstringIgnoreCase(a: string, b: string, aStart: number = 0, aEnd: number = a.length, bStart: number = 0, bEnd: number = b.length): number {

	for (; aStart < aEnd && bStart < bEnd; aStart++, bStart++) {

		let codeA = a.charCodeAt(aStart);
		let codeB = b.charCodeAt(bStart);

		if (codeA === codeB) {
			// equal
			continue;
		}

		if (codeA >= 128 || codeB >= 128) {
			// not ASCII letters -> fallback to lower-casing strings
			return compareSubstring(a.toLowerCase(), b.toLowerCase(), aStart, aEnd, bStart, bEnd);
		}

		// mapper lower-case ascii letter onto upper-case varinats
		// [97-122] (lower ascii) --> [65-90] (upper ascii)
		if (isLowerAsciiLetter(codeA)) {
			codeA -= 32;
		}
		if (isLowerAsciiLetter(codeB)) {
			codeB -= 32;
		}

		// compare both code points
		const diff = codeA - codeB;
		if (diff === 0) {
			continue;
		}

		return diff;
	}

	const aLen = aEnd - aStart;
	const bLen = bEnd - bStart;

	if (aLen < bLen) {
		return -1;
	} else if (aLen > bLen) {
		return 1;
	}

	return 0;
}

export function isLowerAsciiLetter(code: number): boolean {
	return code >= 97 && code <= 122;
}

export function equalsIgnoreCase(a: string, b: string): boolean {
	return a.length === b.length && compareSubstringIgnoreCase(a, b) === 0;
}

export function equals(a: string | undefined, b: string | undefined, ignoreCase?: boolean): boolean {
	return a === b || (!!ignoreCase && a !== undefined && b !== undefined && equalsIgnoreCase(a, b));
}

export function startsWithIgnoreCase(str: string, candidate: string): boolean {
	const len = candidate.length;
	return len <= str.length && compareSubstringIgnoreCase(str, candidate, 0, len) === 0;
}

/**
 * See http://en.wikipedia.org/wiki/Surrogate_pair
 */
export function isHighSurrogate(charCode: number): boolean {
	return (0xD800 <= charCode && charCode <= 0xDBFF);
}

/**
 * See http://en.wikipedia.org/wiki/Surrogate_pair
 */
export function isLowSurrogate(charCode: number): boolean {
	return (0xDC00 <= charCode && charCode <= 0xDFFF);
}

/**
 * See http://en.wikipedia.org/wiki/Surrogate_pair
 */
export function computeCodePoint(highSurrogate: number, lowSurrogate: number): number {
	return ((highSurrogate - 0xD800) << 10) + (lowSurrogate - 0xDC00) + 0x10000;
}




export const UNUSUAL_LINE_TERMINATORS = /[\u2028\u2029]/;

// Defacto standard: https://invisible-island.net/xterm/ctlseqs/ctlseqs.html



// -- UTF-8 BOM

export const UTF8_BOM_CHARACTER = String.fromCharCode(65279);


export const enum GraphemeBreakType {
	Other = 0,
	Prepend = 1,
	CR = 2,
	LF = 3,
	Control = 4,
	Extend = 5,
	Regional_Indicator = 6,
	SpacingMark = 7,
	L = 8,
	V = 9,
	T = 10,
	LV = 11,
	LVT = 12,
	ZWJ = 13,
	Extended_Pictographic = 14
}


export const noBreakWhitespace = '\xa0';

export const Ellipsis = '\u2026';

