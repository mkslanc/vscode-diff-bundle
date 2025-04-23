/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/


/**
 * Represents contiguous tokens over a contiguous range of lines.
 */
export class ContiguousMultilineTokens {

	/**
	 * The start line number for this block of tokens.
	 */
	private _startLineNumber: number;

	/**
	 * The tokens are stored in a binary format. There is an element for each line,
	 * so `tokens[index]` contains all tokens on line `startLineNumber + index`.
	 *
	 * On a specific line, each token occupies two array indices. For token i:
	 *  - at offset 2*i => endOffset
	 *  - at offset 2*i + 1 => metadata
	 *
	 */
	private _tokens: (Uint32Array | ArrayBuffer | null)[];

	/**
	 * (Inclusive) start line number for these tokens.
	 */
	public get startLineNumber(): number {
		return this._startLineNumber;
	}

	/**
	 * (Inclusive) end line number for these tokens.
	 */
	public get endLineNumber(): number {
		return this._startLineNumber + this._tokens.length - 1;
	}

	constructor(startLineNumber: number, tokens: Uint32Array[]) {
		this._startLineNumber = startLineNumber;
		this._tokens = tokens;
	}
}
