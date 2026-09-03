/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/


export namespace Iterable {

	export function is<T = unknown>(thing: unknown): thing is Iterable<T> {
		return !!thing && typeof thing === 'object' && typeof (thing as Iterable<T>)[Symbol.iterator] === 'function';
	}
}
