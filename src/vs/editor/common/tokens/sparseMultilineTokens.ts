/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/


/**
 * Represents sparse tokens over a contiguous range of lines.
 */
export class SparseMultilineTokens {

	private _startLineNumber: number;
	private _endLineNumber: number;
	private readonly _tokens: SparseMultilineTokensStorage;

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
		return this._endLineNumber;
	}

	private constructor(startLineNumber: number, tokens: SparseMultilineTokensStorage) {
		this._startLineNumber = startLineNumber;
		this._tokens = tokens;
		this._endLineNumber = this._startLineNumber + this._tokens.getMaxDeltaLine();
	}



}

class SparseMultilineTokensStorage {
	/**
	 * The encoding of tokens is:
	 *  4*i    deltaLine (from `startLineNumber`)
	 *  4*i+1  startCharacter (from the line start)
	 *  4*i+2  endCharacter (from the line start)
	 *  4*i+3  metadata
	 */
	private readonly _tokens: Uint32Array;
	private _tokenCount: number;

	constructor(tokens: Uint32Array) {
		this._tokens = tokens;
		this._tokenCount = tokens.length / 4;
	}

	public getMaxDeltaLine(): number {
		const tokenCount = this._getTokenCount();
		if (tokenCount === 0) {
			return -1;
		}
		return this._getDeltaLine(tokenCount - 1);
	}

	private _getTokenCount(): number {
		return this._tokenCount;
	}

	private _getDeltaLine(tokenIndex: number): number {
		return this._tokens[4 * tokenIndex];
	}

}

export class SparseLineTokens {


	constructor(tokens: Uint32Array) {
	}
}
