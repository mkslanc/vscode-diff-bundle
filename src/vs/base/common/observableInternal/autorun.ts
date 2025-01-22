/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IChangeContext, IObservable, IObservableWithChange, IObserver, IReader } from './base.js';
import { DebugNameData} from './debugName.js';
import { assertFn, BugIndicatingError, IDisposable, markAsDisposed, onBugIndicatingError, trackDisposable } from './commonFacade/deps.js';
import { getLogger } from './logging.js';

/**
 * Runs immediately and whenever a transaction ends and an observed observable changed.
 * {@link fn} should start with a JS Doc using `@description` to name the autorun.
 */
export function autorun(fn: (reader: IReader) => void): IDisposable {
	return new AutorunObserver(
		new DebugNameData(undefined, undefined, fn),
		fn,
		undefined,
		undefined
	);
}



const enum AutorunState {
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
	private state = AutorunState.stale;
	private updateCount = 0;
	private disposed = false;
	private dependencies = new Set<IObservable<any>>();
	private dependenciesToBeRemoved = new Set<IObservable<any>>();
	private changeSummary: TChangeSummary | undefined;

	public get debugName(): string {
		return this._debugNameData.getDebugName(this) ?? '(anonymous)';
	}

	constructor(
		public readonly _debugNameData: DebugNameData,
		public readonly _runFn: (reader: IReader, changeSummary: TChangeSummary) => void,
		private readonly createChangeSummary: (() => TChangeSummary) | undefined,
		private readonly _handleChange: ((context: IChangeContext, summary: TChangeSummary) => boolean) | undefined,
	) {
		this.changeSummary = this.createChangeSummary?.();
		getLogger()?.handleAutorunCreated(this);
		this._runIfNeeded();

		trackDisposable(this);
	}

	public dispose(): void {
		this.disposed = true;
		for (const o of this.dependencies) {
			o.removeObserver(this);
		}
		this.dependencies.clear();

		markAsDisposed(this);
	}

	private _runIfNeeded() {
		if (this.state === AutorunState.upToDate) {
			return;
		}

		const emptySet = this.dependenciesToBeRemoved;
		this.dependenciesToBeRemoved = this.dependencies;
		this.dependencies = emptySet;

		this.state = AutorunState.upToDate;

		const isDisposed = this.disposed;
		try {
			if (!isDisposed) {
				getLogger()?.handleAutorunTriggered(this);
				const changeSummary = this.changeSummary!;
				try {
					this.changeSummary = this.createChangeSummary?.();
					this._isReaderValid = true;
					this._runFn(this, changeSummary);
				} catch (e) {
					onBugIndicatingError(e);
				} finally {
					this._isReaderValid = false;
				}
			}
		} finally {
			if (!isDisposed) {
				getLogger()?.handleAutorunFinished(this);
			}
			// We don't want our observed observables to think that they are (not even temporarily) not being observed.
			// Thus, we only unsubscribe from observables that are definitely not read anymore.
			for (const o of this.dependenciesToBeRemoved) {
				o.removeObserver(this);
			}
			this.dependenciesToBeRemoved.clear();
		}
	}

	public toString(): string {
		return `Autorun<${this.debugName}>`;
	}

	// IObserver implementation
	public beginUpdate(): void {
		if (this.state === AutorunState.upToDate) {
			this.state = AutorunState.dependenciesMightHaveChanged;
		}
		this.updateCount++;
	}

	public endUpdate(): void {
		try {
			if (this.updateCount === 1) {
				do {
					if (this.state === AutorunState.dependenciesMightHaveChanged) {
						this.state = AutorunState.upToDate;
						for (const d of this.dependencies) {
							d.reportChanges();
							if (this.state as AutorunState === AutorunState.stale) {
								// The other dependencies will refresh on demand
								break;
							}
						}
					}

					this._runIfNeeded();
				} while (this.state !== AutorunState.upToDate);
			}
		} finally {
			this.updateCount--;
		}

		assertFn(() => this.updateCount >= 0);
	}

	public handlePossibleChange(observable: IObservable<any>): void {
		if (this.state === AutorunState.upToDate && this.dependencies.has(observable) && !this.dependenciesToBeRemoved.has(observable)) {
			this.state = AutorunState.dependenciesMightHaveChanged;
		}
	}

	public handleChange<T, TChange>(observable: IObservableWithChange<T, TChange>, change: TChange): void {
		if (this.dependencies.has(observable) && !this.dependenciesToBeRemoved.has(observable)) {
			try {
				const shouldReact = this._handleChange ? this._handleChange({
					changedObservable: observable,
					change,
					didChange: (o): this is any => o === observable as any,
				}, this.changeSummary!) : true;
				if (shouldReact) {
					this.state = AutorunState.stale;
				}
			} catch (e) {
				onBugIndicatingError(e);
			}
		}
	}

	// IReader implementation
	private _isReaderValid = false;

	public readObservable<T>(observable: IObservable<T>): T {
		if (!this._isReaderValid) { throw new BugIndicatingError('The reader object cannot be used outside its compute function!'); }

		// In case the run action disposes the autorun
		if (this.disposed) {
			return observable.get();
		}

		observable.addObserver(this);
		const value = observable.get();
		this.dependencies.add(observable);
		this.dependenciesToBeRemoved.delete(observable);
		return value;
	}
}

export namespace autorun {
	export const Observer = AutorunObserver;
}
