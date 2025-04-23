/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { toUint8 } from '../../../base/common/uint.js';

/**
 * A fast character classifier that uses a compact array for ASCII values.
 */
export class CharacterClassifier<T extends number> {
	/**
	 * Maintain a compact (fully initialized ASCII map for quickly classifying ASCII characters - used more often in code).
	 */
	protected readonly _asciiMap: Uint8Array;

	/**
	 * The entire map (sparse array).
	 */
	protected readonly _map: Map<number, number>;

	protected readonly _defaultValue: number;

	constructor(_defaultValue: T) {
		const defaultValue = toUint8(_defaultValue);

		this._defaultValue = defaultValue;
		this._asciiMap = CharacterClassifier._createAsciiMap(defaultValue);
		this._map = new Map<number, number>();
	}

	private static _createAsciiMap(defaultValue: number): Uint8Array {
		const asciiMap = new Uint8Array(256);
		asciiMap.fill(defaultValue);
		return asciiMap;
	}

	public set(charCode: number, _value: T): void {
		const value = toUint8(_value);

		if (charCode >= 0 && charCode < 256) {
			this._asciiMap[charCode] = value;
		} else {
			this._map.set(charCode, value);
		}
	}
}


export class CharacterSet {


	constructor() {
	}
}
