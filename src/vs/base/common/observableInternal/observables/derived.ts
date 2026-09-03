/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IObservable, IReader, IObservableWithChange } from '../base.js';
import { EqualityComparer, strictEquals } from '../commonFacade/deps.js';
import { DebugLocation } from '../debugLocation.js';
import { DebugOwner, DebugNameData, IDebugNameData } from '../debugName.js';
import { _setDerivedOpts } from './baseObservable.js';
import { IDerivedReader, Derived} from './derivedImpl.js';

/**
 * Creates an observable that is derived from other observables.
 * The value is only recomputed when absolutely needed.
 *
 * {@link computeFn} should start with a JS Doc using `@description` to name the derived.
 */
export function derived<T, TChange = void>(computeFn: (reader: IDerivedReader<TChange>, debugLocation?: DebugLocation) => T): IObservableWithChange<T, TChange>;
export function derived<T, TChange = void>(owner: DebugOwner, computeFn: (reader: IDerivedReader<TChange>) => T, debugLocation?: DebugLocation): IObservableWithChange<T, TChange>;
export function derived<T, TChange = void>(
	computeFnOrOwner: ((reader: IDerivedReader<TChange>) => T) | DebugOwner,
	computeFn?: ((reader: IDerivedReader<TChange>) => T) | undefined,
	debugLocation = DebugLocation.ofCaller()
): IObservable<T> {
	if (computeFn !== undefined) {
		return new Derived(
			new DebugNameData(computeFnOrOwner, undefined, computeFn),
			computeFn,
			undefined,
			undefined,
			strictEquals,
			debugLocation,
		);
	}
	return new Derived(
		// eslint-disable-next-line local/code-no-any-casts
		new DebugNameData(undefined, undefined, computeFnOrOwner as any),
		// eslint-disable-next-line local/code-no-any-casts
		computeFnOrOwner as any,
		undefined,
		undefined,
		strictEquals,
		debugLocation,
	);
}

export function derivedOpts<T>(
	options: IDebugNameData & {
		equalsFn?: EqualityComparer<T>;
		onLastObserverRemoved?: (() => void);
	},
	computeFn: (reader: IReader) => T,
	debugLocation = DebugLocation.ofCaller()
): IObservable<T> {
	return new Derived(
		new DebugNameData(options.owner, options.debugName, options.debugReferenceFn),
		computeFn,
		undefined,
		options.onLastObserverRemoved,
		options.equalsFn ?? strictEquals,
		debugLocation
	);
}
_setDerivedOpts(derivedOpts);
