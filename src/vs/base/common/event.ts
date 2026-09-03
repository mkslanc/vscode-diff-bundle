/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken } from './cancellation.js';
import { onUnexpectedError } from './errors.js';
import { Disposable, DisposableStore, IDisposable, toDisposable } from './lifecycle.js';
import { IObservable, IObserver } from './observable.js';
import { StopWatch } from './stopwatch.js';


// -----------------------------------------------------------------------------------------------------------------------
// Uncomment the next line to print warnings whenever an emitter with listeners is disposed. That is a sign of code smell.
// -----------------------------------------------------------------------------------------------------------------------
const _enableDisposeWithListenerWarning = false
	// || Boolean("TRUE") // causes a linter warning so that it cannot be pushed
	;


// -----------------------------------------------------------------------------------------------------------------------
// Uncomment the next line to print warnings whenever a snapshotted event is used repeatedly without cleanup.
// See https://github.com/microsoft/vscode/issues/142851
// -----------------------------------------------------------------------------------------------------------------------




/**
 * An event with zero or one parameters that can be subscribed to. The event is a function itself.
 */
export interface Event<T> {
	(listener: (e: T) => unknown, thisArgs?: any, disposables?: IDisposable[] | DisposableStore): IDisposable;
}

export namespace Event {
	export const None: Event<any> = () => Disposable.None;




	export interface IChainableSythensis<T> {
		map<O>(fn: (i: T) => O): IChainableSythensis<O>;
		forEach(fn: (i: T) => void): IChainableSythensis<T>;
		filter<R extends T>(fn: (e: T) => e is R): IChainableSythensis<R>;
		filter(fn: (e: T) => boolean): IChainableSythensis<T>;
		reduce<R>(merge: (last: R, event: T) => R, initial: R): IChainableSythensis<R>;
		reduce<R>(merge: (last: R | undefined, event: T) => R): IChainableSythensis<R>;
		latch(equals?: (a: T, b: T) => boolean): IChainableSythensis<T>;
	}

	export interface NodeEventEmitter {
		on(event: string | symbol, listener: Function): unknown;
		removeListener(event: string | symbol, listener: Function): unknown;
	}

	export interface DOMEventEmitter {
		addEventListener(event: string | symbol, listener: Function): void;
		removeEventListener(event: string | symbol, listener: Function): void;
	}


	/**
	 * Each listener is attached to the observable directly.
	 */
	export function fromObservableLight(observable: IObservable<unknown>): Event<void> {
		return (listener, thisArgs, disposables) => {
			let count = 0;
			let didChange = false;
			const observer: IObserver = {
				beginUpdate() {
					count++;
				},
				endUpdate() {
					count--;
					if (count === 0) {
						observable.reportChanges();
						if (didChange) {
							didChange = false;
							listener.call(thisArgs);
						}
					}
				},
				handlePossibleChange() {
					// noop
				},
				handleChange() {
					didChange = true;
				}
			};
			observable.addObserver(observer);
			observable.reportChanges();
			const disposable = {
				dispose() {
					observable.removeObserver(observer);
				}
			};

			addToDisposables(disposable, disposables);

			return disposable;
		};
	}
}

export interface EmitterOptions {
	/**
	 * Optional function that's called *before* the very first listener is added
	 */
	onWillAddFirstListener?: Function;
	/**
	 * Optional function that's called *after* the very first listener is added
	 */
	onDidAddFirstListener?: Function;
	/**
	 * Optional function that's called after a listener is added
	 */
	onDidAddListener?: Function;
	/**
	 * Optional function that's called *after* remove the very last listener
	 */
	onDidRemoveLastListener?: Function;
	/**
	 * Optional function that's called *before* a listener is removed
	 */
	onWillRemoveListener?: Function;
	/**
	 * Optional function that's called when a listener throws an error. Defaults to
	 * {@link onUnexpectedError}
	 */
	onListenerError?: (e: any) => void;
	/**
	 * Number of listeners that are allowed before assuming a leak. Default to
	 * a globally configured value
	 *
	 * @see setGlobalLeakWarningThreshold
	 */
	leakWarningThreshold?: number;
	/**
	 * Human-readable name for the emitter, included in leak warning error
	 * messages to help identify which emitter is leaking in telemetry.
	 */
	leakWarningName?: string;
	/**
	 * Pass in a delivery queue, which is useful for ensuring
	 * in order event delivery across multiple emitters.
	 */
	deliveryQueue?: EventDeliveryQueue;

	/** ONLY enable this during development */
	_profName?: string;
}


export class EventProfiling {

	static readonly all = new Set<EventProfiling>();

	private static _idPool = 0;

	readonly name: string;
	public listenerCount: number = 0;
	public invocationCount = 0;
	public elapsedOverall = 0;
	public durations: number[] = [];

	private _stopWatch?: StopWatch;

	constructor(name: string) {
		this.name = `${name}_${EventProfiling._idPool++}`;
		EventProfiling.all.add(this);
	}

	start(listenerCount: number): void {
		this._stopWatch = new StopWatch();
		this.listenerCount = listenerCount;
	}

	stop(): void {
		if (this._stopWatch) {
			const elapsed = this._stopWatch.elapsed();
			this.durations.push(elapsed);
			this.elapsedOverall += elapsed;
			this.invocationCount += 1;
			this._stopWatch = undefined;
		}
	}
}

let _globalLeakWarningThreshold = -1;

let leakageMonitorId = 1;

function nextLeakageMonitorName(): string {
	return (leakageMonitorId++).toString(16).padStart(3, '0');
}

class LeakageMonitor {

	private _stacks: Map<string, number> | undefined;
	private _warnCountdown: number = 0;

	constructor(
		private readonly _errorHandler: (err: Error) => void,
		readonly threshold: number,
		readonly name: string = nextLeakageMonitorName()
	) { }

	dispose(): void {
		this._stacks?.clear();
	}

	check(stack: Stacktrace, listenerCount: number): undefined | (() => void) {

		const threshold = this.threshold;
		if (threshold <= 0 || listenerCount < threshold) {
			return undefined;
		}

		if (!this._stacks) {
			this._stacks = new Map();
		}
		const stackKey = stack.value;
		const count = (this._stacks.get(stackKey) || 0);
		this._stacks.set(stackKey, count + 1);
		this._warnCountdown -= 1;

		if (this._warnCountdown <= 0) {
			// only warn on first exceed and then every time the limit
			// is exceeded by 50% again
			this._warnCountdown = threshold * 0.5;

			const [topStack, topCount] = this.getMostFrequentStack()!;
			const emitterName = /^[0-9a-f]+$/i.test(this.name) ? undefined : this.name;
			const message = `[${this.name}] potential listener LEAK detected, having ${listenerCount} listeners already. MOST frequent listener (${topCount}):`;
			console.warn(message);
			console.warn(topStack);

			const kind = topCount / listenerCount > 0.3 ? 'dominated' : 'popular';
			const error = new ListenerLeakError(kind, message, topStack, listenerCount, emitterName);
			this._errorHandler(error);
		}

		return () => {
			const count = (this._stacks!.get(stackKey) || 0);
			if (count <= 1) {
				this._stacks!.delete(stackKey);
			} else {
				this._stacks!.set(stackKey, count - 1);
			}
		};
	}

	getMostFrequentStack(): [string, number] | undefined {
		if (!this._stacks) {
			return undefined;
		}
		let topStack: [string, number] | undefined;
		let topCount: number = 0;
		for (const [stack, count] of this._stacks) {
			if (!topStack || topCount < count) {
				topStack = [stack, count];
				topCount = count;
			}
		}
		return topStack;
	}
}

class Stacktrace {

	static create() {
		const err = new Error();
		return new Stacktrace(err.stack ?? '');
	}

	private constructor(readonly value: string) { }

	print() {
		console.warn(this.value.split('\n').slice(2).join('\n'));
	}
}

// error that is logged when going over the configured listener threshold
export class ListenerLeakError extends Error {
	readonly kind: string;
	readonly listenerCount: number;
	/**
	 * The detailed message including listener count and most frequent stack.
	 * Available locally for debugging but intentionally not used as the error
	 * `message`. When `emitterName` is provided, errors group by emitter name
	 * and kind in telemetry; otherwise they group by kind alone.
	 */
	readonly details: string;
	constructor(kind: 'dominated' | 'popular', details: string, stack: string, listenerCount: number, emitterName?: string) {
		super(emitterName
			? `[${emitterName}] potential listener LEAK detected, ${kind}`
			: `potential listener LEAK detected, ${kind}`);
		this.name = 'ListenerLeakError';
		this.kind = kind;
		this.listenerCount = listenerCount;
		this.details = details;
		this.stack = stack;
	}
}

// SEVERE error that is logged when having gone way over the configured listener
// threshold so that the emitter refuses to accept more listeners
export class ListenerRefusalError extends ListenerLeakError {
	constructor(kind: 'dominated' | 'popular', details: string, stack: string, listenerCount: number, emitterName?: string) {
		super(kind, details, stack, listenerCount, emitterName);
		this.name = 'ListenerRefusalError';
	}
}

let id = 0;
class UniqueContainer<T> {
	stack?: Stacktrace;
	public id = id++;
	constructor(public readonly value: T) { }
}
const compactionThreshold = 2;

type ListenerContainer<T> = UniqueContainer<(data: T) => void>;
type ListenerOrListeners<T> = (ListenerContainer<T> | undefined)[] | ListenerContainer<T>;

const forEachListener = <T>(listeners: ListenerOrListeners<T>, fn: (c: ListenerContainer<T>) => void) => {
	if (listeners instanceof UniqueContainer) {
		fn(listeners);
	} else {
		for (let i = 0; i < listeners.length; i++) {
			const l = listeners[i];
			if (l) {
				fn(l);
			}
		}
	}
};

/**
 * The Emitter can be used to expose an Event to the public
 * to fire it from the insides.
 * Sample:
	class Document {

		private readonly _onDidChange = new Emitter<(value:string)=>any>();

		public onDidChange = this._onDidChange.event;

		// getter-style
		// get onDidChange(): Event<(value:string)=>any> {
		// 	return this._onDidChange.event;
		// }

		private _doIt() {
			//...
			this._onDidChange.fire(value);
		}
	}
 */
export class Emitter<T> {

	private readonly _options?: EmitterOptions;
	private readonly _leakWarningThreshold?: number;
	private readonly _leakWarningName?: string;
	private readonly _leakWarningErrorHandler?: (err: Error) => void;
	private _leakageMon?: LeakageMonitor;
	private readonly _perfMon?: EventProfiling;
	private _disposed?: true;
	private _event?: Event<T>;

	/**
	 * A listener, or list of listeners. A single listener is the most common
	 * for event emitters (#185789), so we optimize that special case to avoid
	 * wrapping it in an array (just like Node.js itself.)
	 *
	 * A list of listeners never 'downgrades' back to a plain function if
	 * listeners are removed, for two reasons:
	 *
	 *  1. That's complicated (especially with the deliveryQueue)
	 *  2. A listener with >1 listener is likely to have >1 listener again at
	 *     some point, and swapping between arrays and functions may[citation needed]
	 *     introduce unnecessary work and garbage.
	 *
	 * The array listeners can be 'sparse', to avoid reallocating the array
	 * whenever any listener is added or removed. If more than `1 / compactionThreshold`
	 * of the array is empty, only then is it resized.
	 */
	protected _listeners?: ListenerOrListeners<T>;

	/**
	 * Always to be defined if _listeners is an array. It's no longer a true
	 * queue, but holds the dispatching 'state'. If `fire()` is called on an
	 * emitter, any work left in the _deliveryQueue is finished first.
	 */
	private _deliveryQueue?: EventDeliveryQueuePrivate;
	protected _size = 0;

	constructor(options?: EmitterOptions) {
		this._options = options;
		if (_globalLeakWarningThreshold > 0 || this._options?.leakWarningThreshold) {
			this._leakWarningThreshold = this._options?.leakWarningThreshold ?? _globalLeakWarningThreshold;
			this._leakWarningName = this._options?.leakWarningName ?? nextLeakageMonitorName();
			this._leakWarningErrorHandler = this._options?.onListenerError ?? onUnexpectedError;
		}
		this._perfMon = this._options?._profName ? new EventProfiling(this._options._profName) : undefined;
		this._deliveryQueue = this._options?.deliveryQueue as EventDeliveryQueuePrivate | undefined;
	}

	private _getLeakageMonitor(): LeakageMonitor | undefined {
		if (this._leakWarningThreshold === undefined || this._leakWarningName === undefined || this._leakWarningErrorHandler === undefined) {
			return undefined;
		}
		return this._leakageMon ??= new LeakageMonitor(this._leakWarningErrorHandler, this._leakWarningThreshold, this._leakWarningName);
	}

	dispose() {
		if (!this._disposed) {
			this._disposed = true;

			// It is bad to have listeners at the time of disposing an emitter, it is worst to have listeners keep the emitter
			// alive via the reference that's embedded in their disposables. Therefore we loop over all remaining listeners and
			// unset their subscriptions/disposables. Looping and blaming remaining listeners is done on next tick because the
			// the following programming pattern is very popular:
			//
			// const someModel = this._disposables.add(new ModelObject()); // (1) create and register model
			// this._disposables.add(someModel.onDidChange(() => { ... }); // (2) subscribe and register model-event listener
			// ...later...
			// this._disposables.dispose(); disposes (1) then (2): don't warn after (1) but after the "overall dispose" is done

			if (this._deliveryQueue?.current === this) {
				this._deliveryQueue.reset();
			}
			if (this._listeners) {
				if (_enableDisposeWithListenerWarning) {
					const listeners = this._listeners;
					queueMicrotask(() => {
						forEachListener(listeners, l => l.stack?.print());
					});
				}

				this._listeners = undefined;
				this._size = 0;
			}
			this._options?.onDidRemoveLastListener?.();
			this._leakageMon?.dispose();
		}
	}

	/**
	 * For the public to allow to subscribe
	 * to events from this Emitter
	 */
	get event(): Event<T> {
		this._event ??= (callback: (e: T) => unknown, thisArgs?: any, disposables?: IDisposable[] | DisposableStore) => {
			if (this._leakWarningThreshold !== undefined && this._size > this._leakWarningThreshold ** 2) {
				const leakageMon = this._getLeakageMonitor();
				if (leakageMon) {
					const message = `[${leakageMon.name}] REFUSES to accept new listeners because it exceeded its threshold by far (${this._size} vs ${leakageMon.threshold})`;
					console.warn(message);

					const tuple = leakageMon.getMostFrequentStack() ?? ['UNKNOWN stack', -1];
					const kind = tuple[1] / this._size > 0.3 ? 'dominated' : 'popular';
					const error = new ListenerRefusalError(kind, `${message}. HINT: Stack shows most frequent listener (${tuple[1]}-times)`, tuple[0], this._size, this._options?.leakWarningName);
					const errorHandler = this._options?.onListenerError || onUnexpectedError;
					errorHandler(error);

					return Disposable.None;
				}
			}

			if (this._disposed) {
				// todo: should we warn if a listener is added to a disposed emitter? This happens often
				return Disposable.None;
			}

			if (thisArgs) {
				callback = callback.bind(thisArgs);
			}

			const contained = new UniqueContainer(callback);

			let removeMonitor: Function | undefined;
			let stack: Stacktrace | undefined;
			if (this._leakWarningThreshold !== undefined && this._size >= Math.ceil(this._leakWarningThreshold * 0.2)) {
				const leakageMon = this._getLeakageMonitor();
				if (leakageMon) {
					// check and record this emitter for potential leakage
					contained.stack = Stacktrace.create();
					removeMonitor = leakageMon.check(contained.stack, this._size + 1);
				}
			}

			if (_enableDisposeWithListenerWarning) {
				contained.stack = stack ?? Stacktrace.create();
			}

			if (!this._listeners) {
				this._options?.onWillAddFirstListener?.(this);
				this._listeners = contained;
				this._options?.onDidAddFirstListener?.(this);
			} else if (this._listeners instanceof UniqueContainer) {
				this._deliveryQueue ??= new EventDeliveryQueuePrivate();
				this._listeners = [this._listeners, contained];
			} else {
				this._listeners.push(contained);
			}
			this._options?.onDidAddListener?.(this);

			this._size++;


			const result = toDisposable(() => {
				removeMonitor?.();
				this._removeListener(contained);
			});
			addToDisposables(result, disposables);

			return result;
		};

		return this._event;
	}

	private _removeListener(listener: ListenerContainer<T>) {
		this._options?.onWillRemoveListener?.(this);

		if (!this._listeners) {
			return; // expected if a listener gets disposed
		}

		if (this._size === 1) {
			this._listeners = undefined;
			this._options?.onDidRemoveLastListener?.(this);
			this._size = 0;
			return;
		}

		// size > 1 which requires that listeners be a list:
		const listeners = this._listeners as (ListenerContainer<T> | undefined)[];

		const index = listeners.indexOf(listener);
		if (index === -1) {
			console.log('disposed?', this._disposed);
			console.log('size?', this._size);
			console.log('arr?', JSON.stringify(this._listeners));
			throw new Error('Attempted to dispose unknown listener');
		}

		this._size--;
		listeners[index] = undefined;

		const adjustDeliveryQueue = this._deliveryQueue!.current === this;
		if (this._size * compactionThreshold <= listeners.length) {
			let n = 0;
			for (let i = 0; i < listeners.length; i++) {
				if (listeners[i]) {
					listeners[n++] = listeners[i];
				} else if (adjustDeliveryQueue && n < this._deliveryQueue!.end) {
					this._deliveryQueue!.end--;
					if (n < this._deliveryQueue!.i) {
						this._deliveryQueue!.i--;
					}
				}
			}
			listeners.length = n;
		}
	}

	private _deliver(listener: undefined | UniqueContainer<(value: T) => void>, value: T) {
		if (!listener) {
			return;
		}

		const errorHandler = this._options?.onListenerError || onUnexpectedError;
		if (!errorHandler) {
			listener.value(value);
			return;
		}

		try {
			listener.value(value);
		} catch (e) {
			errorHandler(e);
		}
	}

	/** Delivers items in the queue. Assumes the queue is ready to go. */
	private _deliverQueue(dq: EventDeliveryQueuePrivate) {
		const listeners = dq.current!._listeners! as (ListenerContainer<T> | undefined)[];
		while (dq.i < dq.end) {
			// important: dq.i is incremented before calling deliver() because it might reenter deliverQueue()
			this._deliver(listeners[dq.i++], dq.value as T);
		}
		dq.reset();
	}

	/**
	 * To be kept private to fire an event to
	 * subscribers
	 */
	fire(event: T): void {
		if (this._deliveryQueue?.current) {
			this._deliverQueue(this._deliveryQueue);
			this._perfMon?.stop(); // last fire() will have starting perfmon, stop it before starting the next dispatch
		}

		this._perfMon?.start(this._size);

		if (!this._listeners) {
			// no-op
		} else if (this._listeners instanceof UniqueContainer) {
			this._deliver(this._listeners, event);
		} else {
			const dq = this._deliveryQueue!;
			dq.enqueue(this, event, this._listeners.length);
			this._deliverQueue(dq);
		}

		this._perfMon?.stop();
	}
}

export interface EventDeliveryQueue {
	_isEventDeliveryQueue: true;
}

export const createEventDeliveryQueue = (): EventDeliveryQueue => new EventDeliveryQueuePrivate();

class EventDeliveryQueuePrivate implements EventDeliveryQueue {
	declare _isEventDeliveryQueue: true;

	/**
	 * Index in current's listener list.
	 */
	public i = -1;

	/**
	 * The last index in the listener's list to deliver.
	 */
	public end = 0;

	/**
	 * Emitter currently being dispatched on. Emitter._listeners is always an array.
	 */
	public current?: Emitter<any>;
	/**
	 * Currently emitting value. Defined whenever `current` is.
	 */
	public value?: unknown;

	public enqueue<T>(emitter: Emitter<T>, value: T, end: number) {
		this.i = 0;
		this.end = end;
		this.current = emitter;
		this.value = value;
	}

	public reset() {
		this.i = this.end; // force any current emission loop to stop, mainly for during dispose
		this.current = undefined;
		this.value = undefined;
	}
}

export interface IWaitUntil {
	token: CancellationToken;
	waitUntil(thenable: Promise<unknown>): void;
}

export type IWaitUntilData<T> = Omit<Omit<T, 'waitUntil'>, 'token'>;

export interface IDynamicListEventMultiplexer<TEventType> extends IDisposable {
	readonly event: Event<TEventType>;
}

export interface IValueWithChangeEvent<T> {
	readonly onDidChange: Event<void>;
	get value(): T;
}



function addToDisposables(result: IDisposable, disposables: DisposableStore | IDisposable[] | undefined) {
	if (disposables instanceof DisposableStore) {
		disposables.add(result);
	} else if (Array.isArray(disposables)) {
		disposables.push(result);
	}
}

