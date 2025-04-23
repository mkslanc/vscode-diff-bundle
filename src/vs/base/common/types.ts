/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from './uri.js';

/**
 * @returns whether the provided parameter is a JavaScript String or not.
 */
export function isString(str: unknown): str is string {
	return (typeof str === 'string');
}

/**
 * @returns whether the provided parameter is of type `object` but **not**
 *	`null`, an `array`, a `regexp`, nor a `date`.
 */
export function isObject(obj: unknown): obj is Object {
	// The method can't do a type cast since there are type (like strings) which
	// are subclasses of any put not positvely matched by the function. Hence type
	// narrowing results in wrong results.
	return typeof obj === 'object'
		&& obj !== null
		&& !Array.isArray(obj)
		&& !(obj instanceof RegExp)
		&& !(obj instanceof Date);
}

/**
 * @returns whether the provided parameter is an Iterable, casting to the given generic
 */
export function isIterable<T>(obj: unknown): obj is Iterable<T> {
	return !!obj && typeof (obj as any)[Symbol.iterator] === 'function';
}

/**
 * @returns whether the provided parameter is undefined.
 */
export function isUndefined(obj: unknown): obj is undefined {
	return (typeof obj === 'undefined');
}

/**
 * @returns whether the provided parameter is defined.
 */
export function isDefined<T>(arg: T | null | undefined): arg is T {
	return !isUndefinedOrNull(arg);
}

/**
 * @returns whether the provided parameter is undefined or null.
 */
export function isUndefinedOrNull(obj: unknown): obj is undefined | null {
	return (isUndefined(obj) || obj === null);
}

const hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * @returns whether the provided parameter is an empty JavaScript Object or not.
 */
export function isEmptyObject(obj: unknown): obj is object {
	if (!isObject(obj)) {
		return false;
	}

	for (const key in obj) {
		if (hasOwnProperty.call(obj, key)) {
			return false;
		}
	}

	return true;
}

/**
 * @returns whether the provided parameter is a JavaScript Function or not.
 */
export function isFunction(obj: unknown): obj is Function {
	return (typeof obj === 'function');
}

export type TypeConstraint = string | Function;

export function validateConstraints(args: unknown[], constraints: Array<TypeConstraint | undefined>): void {
	const len = Math.min(args.length, constraints.length);
	for (let i = 0; i < len; i++) {
		validateConstraint(args[i], constraints[i]);
	}
}

export function validateConstraint(arg: unknown, constraint: TypeConstraint | undefined): void {

	if (isString(constraint)) {
		if (typeof arg !== constraint) {
			throw new Error(`argument does not match constraint: typeof ${constraint}`);
		}
	} else if (isFunction(constraint)) {
		try {
			if (arg instanceof constraint) {
				return;
			}
		} catch {
			// ignore
		}
		if (!isUndefinedOrNull(arg) && (arg as any).constructor === constraint) {
			return;
		}
		if (constraint.length === 1 && constraint.call(undefined, arg) === true) {
			return;
		}
		throw new Error(`argument does not match one of these constraints: arg instanceof constraint, arg.constructor === constraint, nor constraint(arg) === true`);
	}
}

type AddFirstParameterToFunction<T, TargetFunctionsReturnType, FirstParameter> = T extends (...args: any[]) => TargetFunctionsReturnType ?
	// Function: add param to function
	(firstArg: FirstParameter, ...args: Parameters<T>) => ReturnType<T> :

	// Else: just leave as is
	T;

/**
 * Allows to add a first parameter to functions of a type.
 */
export type AddFirstParameterToFunctions<Target, TargetFunctionsReturnType, FirstParameter> = {
	// For every property
	[K in keyof Target]: AddFirstParameterToFunction<Target[K], TargetFunctionsReturnType, FirstParameter>;
};

/**
 * Given an object with all optional properties, requires at least one to be defined.
 * i.e. AtLeastOne<MyObject>;
 */
export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];

/**
 * Only picks the non-optional properties of a type.
 */
export type OmitOptional<T> = { [K in keyof T as T[K] extends Required<T>[K] ? K : never]: T[K] };

/**
 * A type that removed readonly-less from all properties of `T`
 */
export type Mutable<T> = {
	-readonly [P in keyof T]: T[P]
};

/**
 * A single object or an array of the objects.
 */
export type SingleOrMany<T> = T | T[];


/**
 * A type that recursively makes all properties of `T` required
 */
export type DeepRequiredNonNullable<T> = {
	[P in keyof T]-?: T[P] extends object ? DeepRequiredNonNullable<T[P]> : Required<NonNullable<T[P]>>;
};


/**
 * Represents a type that is a partial version of a given type `T`, where all properties are optional and can be deeply nested.
 */
export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : Partial<T[P]>;
};

/**
 * Represents a type that is a partial version of a given type `T`, except a subset.
 */
export type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>;

/**
 * Type for an `object` with its `value` property being a {@link URI}.
 */
export type WithUriValue<T extends object> = T & { value: URI };
