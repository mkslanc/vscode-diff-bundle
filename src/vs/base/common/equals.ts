/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/


export type EqualityComparer<T> = (a: T, b: T) => boolean;

/**
 * Compares two items for equality using strict equality.
*/
export const strictEquals: EqualityComparer<any> = (a, b) => a === b;

/**
 * Drills into arrays (items ordered) and objects (keys unordered) and uses strict equality on everything else.
*/
export function structuralEquals<T>(a: T, b: T): boolean {
	if (a === b) {
		return true;
	}

	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) {
			return false;
		}
		for (let i = 0; i < a.length; i++) {
			if (!structuralEquals(a[i], b[i])) {
				return false;
			}
		}
		return true;
	}

	if (a && typeof a === 'object' && b && typeof b === 'object') {
		if (Object.getPrototypeOf(a) === Object.prototype && Object.getPrototypeOf(b) === Object.prototype) {
			const aObj = a as Record<string, unknown>;
			const bObj = b as Record<string, unknown>;
			const keysA = Object.keys(aObj);
			const keysB = Object.keys(bObj);
			const keysBSet = new Set(keysB);

			if (keysA.length !== keysB.length) {
				return false;
			}

			for (const key of keysA) {
				if (!keysBSet.has(key)) {
					return false;
				}
				if (!structuralEquals(aObj[key], bObj[key])) {
					return false;
				}
			}

			return true;
		}
	}

	return false;
}


