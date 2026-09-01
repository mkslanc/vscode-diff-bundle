/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IDisposable } from './lifecycle.js';

export interface CacheResult<T> extends IDisposable {
	promise: Promise<T>;
}

export class Cache<T> {

	constructor() { }
}

interface ICacheOptions<TArg> {
	/**
	 * The cache key is used to identify the cache entry.
	 * Strict equality is used to compare cache keys.
	*/
	getCacheKey: (arg: TArg) => unknown;
}

/**
 * Uses a LRU cache to make a given parametrized function cached.
 * Caches just the last key/value.
*/
export class LRUCachedFunction<TArg, TComputed> {


	constructor(fn: (arg: TArg) => TComputed);
	constructor(options: ICacheOptions<TArg>, fn: (arg: TArg) => TComputed);
	constructor(arg1: ICacheOptions<TArg> | ((arg: TArg) => TComputed), arg2?: (arg: TArg) => TComputed) {
		if (typeof arg1 === 'function') {
		} else {
		}
	}
}

/**
 * Uses an unbounded cache to memoize the results of the given function.
*/
export class CachedFunction<TArg, TComputed> {
	private readonly _map = new Map<TArg, TComputed>();
	public get cachedValues(): ReadonlyMap<TArg, TComputed> {
		return this._map;
	}


	constructor(fn: (arg: TArg) => TComputed);
	constructor(options: ICacheOptions<TArg>, fn: (arg: TArg) => TComputed);
	constructor(arg1: ICacheOptions<TArg> | ((arg: TArg) => TComputed), arg2?: (arg: TArg) => TComputed) {
		if (typeof arg1 === 'function') {
		} else {
		}
	}
}
