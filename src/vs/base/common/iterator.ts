/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { isIterable } from './types.js';

export namespace Iterable {

	export function is<T = any>(thing: any): thing is Iterable<T> {
		return thing && typeof thing === 'object' && typeof thing[Symbol.iterator] === 'function';
	}


	export function* reverse<T>(array: Array<T>): Iterable<T> {
		for (let i = array.length - 1; i >= 0; i--) {
			yield array[i];
		}
	}

	export function first<T>(iterable: Iterable<T>): T | undefined {
		return iterable[Symbol.iterator]().next().value;
	}

	export function some<T>(iterable: Iterable<T>, predicate: (t: T, i: number) => unknown): boolean {
		let i = 0;
		for (const element of iterable) {
			if (predicate(element, i++)) {
				return true;
			}
		}
		return false;
	}

	export function* concat<T>(...iterables: (Iterable<T> | T)[]): Iterable<T> {
		for (const item of iterables) {
			if (isIterable(item)) {
				yield* item;
			} else {
				yield item;
			}
		}
	}
}
