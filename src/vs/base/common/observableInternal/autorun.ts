/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IObservable, IObservableWithChange, IObserver, IReader } from './base.js';
import { DebugNameData} from './debugName.js';
import { assertFn, BugIndicatingError, IDisposable, markAsDisposed, onBugIndicatingError, trackDisposable } from './commonFacade/deps.js';
import { getLogger } from './logging/logging.js';
import { IChangeTracker } from './changeTracker.js';

/**
 * Runs immediately and whenever a transaction ends and an observed observable changed.
 * {@link fn} should start with a JS Doc using `@description` to name the autorun.
 */
export function autorun(fn: (reader: IReader) => void): IDisposable {
	return new AutorunObserver(
		new DebugNameData(undefined, undefined, fn),
		fn,
		undefined
	);
}

export const enum AutorunState {
	/**
	 * A dependency could have changed.
	 * We need to explicitly ask them if at least one dependency changed.
	 */
	dependenciesMightHaveChanged = 1,

	/**
	 * A dependency changed and we need to recompute.
	 */
	stale = 2,
	upToDate = 3,
}

export class AutorunObserver<TChangeSummary = any> implements IObserver, IReader, IDisposable {
	private _state = AutorunState.stale;
	private _updateCount = 0;
	private _disposed = false;
	private _dependencies = new Set<IObservable<any>>();
	private _dependenciesToBeRemoved = new Set<IObservable<any>>();
	private _changeSummary: TChangeSummary | undefined;
	private _isRunning = false;

	public get debugName(): string {
		return this._debugNameData.getDebugName(this) ?? '(anonymous)';
	}

	constructor(
		public readonly _debugNameData: DebugNameData,
		public readonly _runFn: (reader: IReader, changeSummary: TChangeSummary) => void,
		private readonly _changeTracker: IChangeTracker<TChangeSummary> | undefined,
	) {
		this._changeSummary = this._changeTracker?.createChangeSummary(undefined);
		getLogger()?.handleAutorunCreated(this);
		this._run();

		trackDisposable(this);
	}

	public dispose(): void {
		if (this._disposed) {
			return;
		}
		this._disposed = true;
		for (const o of this._dependencies) {
			o.removeObserver(this); // Warning: external call!
		}
		this._dependencies.clear();

		getLogger()?.handleAutorunDisposed(this);
		markAsDisposed(this);
	}

	private _run() {
		const emptySet = this._dependenciesToBeRemoved;
		this._dependenciesToBeRemoved = this._dependencies;
		this._dependencies = emptySet;

		this._state = AutorunState.upToDate;

		try {
			if (!this._disposed) {
				getLogger()?.handleAutorunStarted(this);
				const changeSummary = this._changeSummary!;
				try {
					this._isRunning = true;
					if (this._changeTracker) {
						this._changeTracker.beforeUpdate?.(this, changeSummary);
						this._changeSummary = this._changeTracker.createChangeSummary(changeSummary); // Warning: external call!
					}
					this._runFn(this, changeSummary); // Warning: external call!
				} catch (e) {
					onBugIndicatingError(e);
				} finally {
					this._isRunning = false;
				}
			}
		} finally {
			if (!this._disposed) {
				getLogger()?.handleAutorunFinished(this);
			}
			// We don't want our observed observables to think that they are (not even temporarily) not being observed.
			// Thus, we only unsubscribe from observables that are definitely not read anymore.
			for (const o of this._dependenciesToBeRemoved) {
				o.removeObserver(this); // Warning: external call!
			}
			this._dependenciesToBeRemoved.clear();
		}
	}

	public toString(): string {
		return `Autorun<${this.debugName}>`;
	}

	// IObserver implementation
	public beginUpdate(_observable: IObservable<any>): void {
		if (this._state === AutorunState.upToDate) {
			this._state = AutorunState.dependenciesMightHaveChanged;
		}
		this._updateCount++;
	}

	public endUpdate(_observable: IObservable<any>): void {
		try {
			if (this._updateCount === 1) {
				do {
					if (this._state === AutorunState.dependenciesMightHaveChanged) {
						this._state = AutorunState.upToDate;
						for (const d of this._dependencies) {
							d.reportChanges(); // Warning: external call!
							if (this._state as AutorunState === AutorunState.stale) {
								// The other dependencies will refresh on demand
								break;
							}
						}
					}

					if (this._state !== AutorunState.upToDate) {
						this._run(); // Warning: indirect external call!
					}
				} while (this._state !== AutorunState.upToDate);
			}
		} finally {
			this._updateCount--;
		}

		assertFn(() => this._updateCount >= 0);
	}

	public handlePossibleChange(observable: IObservable<any>): void {
		if (this._state === AutorunState.upToDate && this._isDependency(observable)) {
			this._state = AutorunState.dependenciesMightHaveChanged;
		}
	}

	public handleChange<T, TChange>(observable: IObservableWithChange<T, TChange>, change: TChange): void {
		if (this._isDependency(observable)) {
			getLogger()?.handleAutorunDependencyChanged(this, observable, change);
			try {
				// Warning: external call!
				const shouldReact = this._changeTracker ? this._changeTracker.handleChange({
					changedObservable: observable,
					change,
					didChange: (o): this is any => o === observable as any,
				}, this._changeSummary!) : true;
				if (shouldReact) {
					this._state = AutorunState.stale;
				}
			} catch (e) {
				onBugIndicatingError(e);
			}
		}
	}

	private _isDependency(observable: IObservableWithChange<any, any>): boolean {
		return this._dependencies.has(observable) && !this._dependenciesToBeRemoved.has(observable);
	}

	// IReader implementation

	public readObservable<T>(observable: IObservable<T>): T {
		if (!this._isRunning) { throw new BugIndicatingError('The reader object cannot be used outside its compute function!'); }

		// In case the run action disposes the autorun
		if (this._disposed) {
			return observable.get(); // warning: external call!
		}

		observable.addObserver(this); // warning: external call!
		const value = observable.get(); // warning: external call!
		this._dependencies.add(observable);
		this._dependenciesToBeRemoved.delete(observable);
		return value;
	}

	public debugGetState() {
		return {
			isRunning: this._isRunning,
			updateCount: this._updateCount,
			dependencies: this._dependencies,
			state: this._state,
		};
	}

	public debugRerun(): void {
		if (!this._isRunning) {
			this._run();
		} else {
			this._state = AutorunState.stale;
		}
	}
}

export namespace autorun {
	export const Observer = AutorunObserver;
}
