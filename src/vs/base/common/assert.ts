/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { BugIndicatingError} from './errors.js';

export function assert(condition: boolean, message = 'unexpected state'): asserts condition {
	if (!condition) {
		throw new BugIndicatingError(`Assertion Failed: ${message}`);
	}
}

/**
 * condition must be side-effect free!
 */
export function assertFn(condition: () => boolean): void {
	condition();
}

export function checkAdjacentItems<T>(items: readonly T[], predicate: (item1: T, item2: T) => boolean): boolean {
	let i = 0;
	while (i < items.length - 1) {
		const a = items[i];
		const b = items[i + 1];
		if (!predicate(a, b)) {
			return false;
		}
		i++;
	}
	return true;
}
