/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { BugIndicatingError } from '../../../base/common/errors.js';
import { OffsetRange } from './offsetRange.js';

/**
 * Describes an edit to a (0-based) string.
 * Use `TextEdit` to describe edits for a 1-based line/column text.
*/
export class OffsetEdit {
	public static readonly empty = new OffsetEdit([]);

	constructor(
		public readonly edits: readonly SingleOffsetEdit[],
	) {
		let lastEndEx = -1;
		for (const edit of edits) {
			if (!(edit.replaceRange.start >= lastEndEx)) {
				throw new BugIndicatingError(`Edits must be disjoint and sorted. Found ${edit} after ${lastEndEx}`);
			}
			lastEndEx = edit.replaceRange.endExclusive;
		}
	}

	get isEmpty(): boolean {
		return this.edits.length === 0;
	}
}

export type IOffsetEdit = ISingleOffsetEdit[];

export interface ISingleOffsetEdit {
	txt: string;
	pos: number;
	len: number;
}

export class SingleOffsetEdit {

	constructor(
		public readonly replaceRange: OffsetRange,
		public readonly newText: string,
	) { }

	get isEmpty() {
		return this.newText.length === 0 && this.replaceRange.length === 0;
	}
}

