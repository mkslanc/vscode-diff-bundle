/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/


export interface ISequence {
	getElements(): Int32Array | number[] | string[];
	getStrictElement?(index: number): string;
}

export interface IDiffChange {
	/**
	 * The position of the first element in the original sequence which
	 * this change affects.
	 */
	originalStart: number;

	/**
	 * The number of elements from the original sequence which were
	 * affected.
	 */
	originalLength: number;

	/**
	 * The position of the first element in the modified sequence which
	 * this change affects.
	 */
	modifiedStart: number;

	/**
	 * The number of elements from the modified sequence which were
	 * affected (added).
	 */
	modifiedLength: number;
}

export interface IContinueProcessingPredicate {
	(furthestOriginalIndex: number, matchLengthOfLongest: number): boolean;
}

export interface IDiffResult {
	quitEarly: boolean;
	changes: IDiffChange[];
}

//
// The code below has been ported from a C# implementation in VS
//








