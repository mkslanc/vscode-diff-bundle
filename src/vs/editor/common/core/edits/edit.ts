/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { BugIndicatingError } from '../../../../base/common/errors.js';
import { OffsetRange } from '../ranges/offsetRange.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class BaseEdit<T extends BaseReplacement<T> = BaseReplacement<any>, TEdit extends BaseEdit<T, TEdit> = BaseEdit<T, any>> {
	constructor(
		public readonly replacements: readonly T[],
	) {
		let lastEndEx = -1;
		for (const replacement of replacements) {
			if (!(replacement.replaceRange.start >= lastEndEx)) {
				throw new BugIndicatingError(`Edits must be disjoint and sorted. Found ${replacement} after ${lastEndEx}`);
			}
			lastEndEx = replacement.replaceRange.endExclusive;
		}
	}
}

export abstract class BaseReplacement<TSelf extends BaseReplacement<TSelf>> {
	constructor(
		/**
		 * The range to be replaced.
		*/
		public readonly replaceRange: OffsetRange,
	) { }
}

export type AnyEdit = BaseEdit<AnyReplacement, AnyEdit>;
export type AnyReplacement = BaseReplacement<AnyReplacement>;
