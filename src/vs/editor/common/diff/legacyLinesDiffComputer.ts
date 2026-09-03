/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DetailedLineRangeMapping } from './rangeMapping.js';


export interface IDiffComputationResult {
	quitEarly: boolean;
	identical: boolean;

	/**
	 * The changes as (legacy) line change array.
	 * @deprecated Use `changes2` instead.
	 */
	changes: ILineChange[];

	/**
	 * The changes as (modern) line range mapping array.
	 */
	changes2: readonly DetailedLineRangeMapping[];
}

/**
 * A change
 */
export interface IChange {
	readonly originalStartLineNumber: number;
	readonly originalEndLineNumber: number;
	readonly modifiedStartLineNumber: number;
	readonly modifiedEndLineNumber: number;
}

/**
 * A character level change.
 */
export interface ICharChange extends IChange {
	readonly originalStartColumn: number;
	readonly originalEndColumn: number;
	readonly modifiedStartColumn: number;
	readonly modifiedEndColumn: number;
}

/**
 * A line change
 */
export interface ILineChange extends IChange {
	readonly charChanges: ICharChange[] | undefined;
}

export interface IDiffComputerResult {
	quitEarly: boolean;
	changes: ILineChange[];
}




export interface IDiffComputerOpts {
	shouldComputeCharChanges: boolean;
	shouldPostProcessCharChanges: boolean;
	shouldIgnoreTrimWhitespace: boolean;
	shouldMakePrettyDiff: boolean;
	maxComputationTime: number;
}



