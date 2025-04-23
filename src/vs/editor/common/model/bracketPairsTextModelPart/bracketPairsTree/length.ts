/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TextLength } from '../../../core/textLength.js';

/**
 * The end must be greater than or equal to the start.
*/
export function lengthDiff(startLineCount: number, startColumnCount: number, endLineCount: number, endColumnCount: number): Length {
	return (startLineCount !== endLineCount)
		? toLength(endLineCount - startLineCount, endColumnCount)
		: toLength(0, endColumnCount - startColumnCount);
}

/**
 * Represents a non-negative length in terms of line and column count.
 * Does not allocate.
*/
export type Length = { _brand: 'Length' };

export const lengthZero = 0 as any as Length;

/*
 * We have 52 bits available in a JS number.
 * We use the upper 26 bits to store the line and the lower 26 bits to store the column.
 */
///*
const factor = 2 ** 26;
/*/
const factor = 1000000;
// */

export function toLength(lineCount: number, columnCount: number): Length {
	// llllllllllllllllllllllllllcccccccccccccccccccccccccc (52 bits)
	//       line count (26 bits)    column count (26 bits)

	// If there is no overflow (all values/sums below 2^26 = 67108864),
	// we have `toLength(lns1, cols1) + toLength(lns2, cols2) = toLength(lns1 + lns2, cols1 + cols2)`.

	return (lineCount * factor + columnCount) as any as Length;
}

export function lengthToObj(length: Length): TextLength {
	const l = length as any as number;
	const lineCount = Math.floor(l / factor);
	const columnCount = l - lineCount * factor;
	return new TextLength(lineCount, columnCount);
}

export function lengthGetLineCount(length: Length): number {
	return Math.floor(length as any as number / factor);
}

/**
 * Returns the amount of columns of the given length, assuming that it does not span any line.
*/
export function lengthGetColumnCountIfZeroLineCount(length: Length): number {
	return length as any as number;
}


// [10 lines, 5 cols] + [ 0 lines, 3 cols] = [10 lines, 8 cols]
// [10 lines, 5 cols] + [20 lines, 3 cols] = [30 lines, 3 cols]
export function lengthAdd(length1: Length, length2: Length): Length;
export function lengthAdd(l1: any, l2: any): Length {
	let r = l1 + l2;
	if (l2 >= factor) { r = r - (l1 % factor); }
	return r;
}
