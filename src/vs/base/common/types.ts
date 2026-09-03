

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

/**
 * Checks if the provided value is one of the vales in the provided list.
 *
 * ## Examples
 *
 * ```typescript
 * // note! item type is a `subset of string`
 * type TItem = ':' | '.' | '/';
 *
 * // note! item is type of `string` here
 * const item: string = ':';
 * // list of the items to check against
 * const list: TItem[] = [':', '.'];
 *
 * // ok
 * assert(
 *   isOneOf(item, list),
 *   'Must succeed.',
 * );
 *
 * // `item` is of `TItem` type now
 * ```
 */
export const isOneOf = <TType, TSubtype extends TType>(
	value: TType,
	validValues: readonly TSubtype[],
): value is TSubtype => {
	// note! it is OK to type cast here, because we rely on the includes
	//       utility to check if the value is present in the provided list
	return validValues.includes(<TSubtype>value);
};

export type TypeConstraint = string | Function;

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
 * A type that adds readonly to all properties of T, recursively.
 */
export type DeepImmutable<T> = T extends (infer U)[]
	? ReadonlyArray<DeepImmutable<U>>
	: T extends ReadonlyArray<infer U>
	? ReadonlyArray<DeepImmutable<U>>
	: T extends Map<infer K, infer V>
	? ReadonlyMap<K, DeepImmutable<V>>
	: T extends Set<infer U>
	? ReadonlySet<DeepImmutable<U>>
	: T extends object
	? {
		readonly [K in keyof T]: DeepImmutable<T[K]>;
	}
	: T;

/**
 * A single object or an array of the objects.
 */
export type SingleOrMany<T> = T | T[];

/**
 * Given a `type X = { foo?: string }` checking that an object `satisfies X`
 * will ensure each property was explicitly defined, ensuring no properties
 * are omitted or forgotten.
 */
export type WithDefinedProps<T> = { [K in keyof Required<T>]: T[K] };


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


