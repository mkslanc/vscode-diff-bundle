/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CancellationToken, CancellationTokenSource } from './cancellation.js';
import { CancellationError} from './errors.js';
import { IDisposable, isDisposable,  } from './lifecycle.js';
import { setTimeout0 } from './platform.js';
import { } from './lazy.js';

export interface CancelablePromise<T> extends Promise<T> {
	cancel(): void;
}

/**
 * Returns a promise that can be cancelled using the provided cancellation token.
 *
 * @remarks When cancellation is requested, the promise will be rejected with a {@link CancellationError}.
 * If the promise resolves to a disposable object, it will be automatically disposed when cancellation
 * is requested.
 *
 * @param callback A function that accepts a cancellation token and returns a promise
 * @returns A promise that can be cancelled
 */
export function createCancelablePromise<T>(callback: (token: CancellationToken) => Promise<T>): CancelablePromise<T> {
	const source = new CancellationTokenSource();

	const thenable = callback(source.token);

	let isCancelled = false;

	const promise = new Promise<T>((resolve, reject) => {
		const subscription = source.token.onCancellationRequested(() => {
			isCancelled = true;
			subscription.dispose();
			reject(new CancellationError());
		});
		Promise.resolve(thenable).then(value => {
			subscription.dispose();
			source.dispose();

			if (!isCancelled) {
				resolve(value);

			} else if (isDisposable(value)) {
				// promise has been cancelled, result is disposable and will
				// be cleaned up
				value.dispose();
			}
		}, err => {
			subscription.dispose();
			source.dispose();
			reject(err);
		});
	});

	return <CancelablePromise<T>>new class {
		cancel() {
			source.cancel();
			source.dispose();
		}
		then<TResult1 = T, TResult2 = never>(resolve?: ((value: T) => TResult1 | Promise<TResult1>) | undefined | null, reject?: ((reason: unknown) => TResult2 | Promise<TResult2>) | undefined | null): Promise<TResult1 | TResult2> {
			return promise.then(resolve, reject);
		}
		catch<TResult = never>(reject?: ((reason: unknown) => TResult | Promise<TResult>) | undefined | null): Promise<T | TResult> {
			return this.then(undefined, reject);
		}
		finally(onfinally?: (() => void) | undefined | null): Promise<T> {
			return promise.finally(onfinally);
		}
	};
}

export interface ITask<T> {
	(): T;
}

export interface ICancellableTask<T> {
	(token: CancellationToken): T;
}


export function timeout(millis: number): CancelablePromise<void>;
export function timeout(millis: number, token: CancellationToken): Promise<void>;
export function timeout(millis: number, token?: CancellationToken): CancelablePromise<void> | Promise<void> {
	if (!token) {
		return createCancelablePromise(token => timeout(millis, token));
	}

	return new Promise((resolve, reject) => {
		const handle = setTimeout(() => {
			disposable.dispose();
			resolve();
		}, millis);
		const disposable = token.onCancellationRequested(() => {
			clearTimeout(handle);
			disposable.dispose();
			reject(new CancellationError());
		});
	});
}

/**
 * The largest delay (in milliseconds) a single `setTimeout` can represent.
 * Larger values overflow its internal 32-bit signed integer and fire (almost)
 * immediately instead of waiting.
 */
export const MAX_TIMEOUT_DELAY = 2 ** 31 - 1;


export interface ILimiter<T> {

	readonly size: number;

	queue(factory: ITask<Promise<T>>): Promise<T>;

	clear(): void;
}

export type Task<T = void> = () => (Promise<T> | T);

/**
 * Wrap a type in an optional promise. This can be useful to avoid the runtime
 * overhead of creating a promise.
 */
export type MaybePromise<T> = Promise<T> | T;

export interface IThrottledWorkerOptions {

	/**
	 * maximum of units the worker will pass onto handler at once
	 */
	maxWorkChunkSize: number;

	/**
	 * maximum of units the worker will keep in memory for processing
	 */
	maxBufferedWork: number | undefined;

	/**
	 * delay before processing the next round of chunks when chunk size exceeds limits
	 */
	throttleDelay: number;

	/**
	 * When enabled will guarantee that two distinct calls to `work()` are not executed
	 * without throttle delay between them.
	 * Otherwise if the worker isn't currently throttling it will execute work immediately.
	 */
	waitThrottleDelayBetweenWorkUnits?: boolean;
}

//#region -- run on idle tricks ------------

export interface IdleDeadline {
	readonly didTimeout: boolean;
	timeRemaining(): number;
}

type IdleApi = Pick<typeof globalThis, 'requestIdleCallback' | 'cancelIdleCallback'>;


/**
 * Execute the callback the next time the browser is idle, returning an
 * {@link IDisposable} that will cancel the callback when disposed. This wraps
 * [requestIdleCallback] so it will fallback to [setTimeout] if the environment
 * doesn't support it.
 *
 * @param callback The callback to run when idle, this includes an
 * [IdleDeadline] that provides the time alloted for the idle callback by the
 * browser. Not respecting this deadline will result in a degraded user
 * experience.
 * @param timeout A timeout at which point to queue no longer wait for an idle
 * callback but queue it on the regular event loop (like setTimeout). Typically
 * this should not be used.
 *
 * [IdleDeadline]: https://developer.mozilla.org/en-US/docs/Web/API/IdleDeadline
 * [requestIdleCallback]: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
 * [setTimeout]: https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout
 *
 * **Note** that there is `dom.ts#runWhenWindowIdle` which is better suited when running inside a browser
 * context
 */
export let runWhenGlobalIdle: (callback: (idle: IdleDeadline) => void, timeout?: number) => IDisposable;

export let _runWhenIdle: (targetWindow: IdleApi, callback: (idle: IdleDeadline) => void, timeout?: number) => IDisposable;

(function () {
	const safeGlobal: any = globalThis;
	if (typeof safeGlobal.requestIdleCallback !== 'function' || typeof safeGlobal.cancelIdleCallback !== 'function') {
		_runWhenIdle = (_targetWindow, runner, timeout?) => {
			setTimeout0(() => {
				if (disposed) {
					return;
				}
				const end = Date.now() + 15; // one frame at 64fps
				const deadline: IdleDeadline = {
					didTimeout: true,
					timeRemaining() {
						return Math.max(0, end - Date.now());
					}
				};
				runner(Object.freeze(deadline));
			});
			let disposed = false;
			return {
				dispose() {
					if (disposed) {
						return;
					}
					disposed = true;
				}
			};
		};
	} else {
		_runWhenIdle = (targetWindow: typeof safeGlobal, runner, timeout?) => {
			const handle: number = targetWindow.requestIdleCallback(runner, typeof timeout === 'number' ? { timeout } : undefined);
			let disposed = false;
			return {
				dispose() {
					if (disposed) {
						return;
					}
					disposed = true;
					targetWindow.cancelIdleCallback(handle);
				}
			};
		};
	}
	runWhenGlobalIdle = (runner, timeout) => _runWhenIdle(globalThis, runner, timeout);
})();


interface IQueuedTask {
	readonly promise: Promise<void>;
	readonly promiseResolve: () => void;
	readonly promiseReject: (error: Error) => void;
	run: ITask<Promise<void>>;
}

export interface ITaskSequentializerWithRunningTask {
	readonly running: Promise<void>;
}

export interface ITaskSequentializerWithQueuedTask {
	readonly queued: IQueuedTask;
}

//#endregion

//#region

export type ValueCallback<T = unknown> = (value: T | Promise<T>) => void;


//#endregion

//#region Promises

export namespace Promises {
}


/**
 * An object that allows to emit async values asynchronously or bring the iterable to an error state using `reject()`.
 * This emitter is valid only for the duration of the executor (until the promise returned by the executor settles).
 */
export interface AsyncIterableEmitter<T> {
	/**
	 * The value will be appended at the end.
	 *
	 * **NOTE** If `reject()` has already been called, this method has no effect.
	 */
	emitOne(value: T): void;
	/**
	 * The values will be appended at the end.
	 *
	 * **NOTE** If `reject()` has already been called, this method has no effect.
	 */
	emitMany(values: T[]): void;
	/**
	 * Writing an error will permanently invalidate this iterable.
	 * The current users will receive an error thrown, as will all future users.
	 *
	 * **NOTE** If `reject()` have already been called, this method has no effect.
	 */
	reject(error: Error): void;
}

/**
 * An executor for the `AsyncIterableObject` that has access to an emitter.
 */
export interface AsyncIterableExecutor<T> {
	/**
	 * @param emitter An object that allows to emit async values valid only for the duration of the executor.
	 */
	(emitter: AsyncIterableEmitter<T>): unknown | Promise<unknown>;
}



//#endregion

export const AsyncReaderEndOfStream = Symbol('AsyncReaderEndOfStream');
