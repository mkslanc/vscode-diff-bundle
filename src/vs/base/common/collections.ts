/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * An interface for a JavaScript object that
 * acts a dictionary. The keys are strings.
 */
export type IStringDictionary<V> = Record<string, V>;

/**
 * An interface for a JavaScript object that
 * acts a dictionary. The keys are numbers.
 */
export type INumberDictionary<V> = Record<number, V>;
