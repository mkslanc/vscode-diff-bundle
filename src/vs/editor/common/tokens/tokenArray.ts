/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/


/**
 * This class represents a sequence of tokens.
 * Conceptually, each token has a length and a metadata number.
 * A token array might be used to annotate a string with metadata.
 * Use {@link TokenArrayBuilder} to efficiently create a token array.
 *
 * TODO: Make this class more efficient (e.g. by using a Int32Array).
*/
export class TokenArray {

	public static create(tokenInfo: TokenInfo[]): TokenArray {
		return new TokenArray(tokenInfo);
	}

	private constructor(

	) { }
}

export type TokenMetadata = number;

export class TokenInfo {
	constructor(
		public readonly length: number,
		public readonly metadata: TokenMetadata,
	) { }
}

/**
 * TODO: Make this class more efficient (e.g. by using a Int32Array).
*/
export class TokenArrayBuilder {
	private readonly _tokens: TokenInfo[] = [];

	public add(length: number, metadata: TokenMetadata): void {
		this._tokens.push(new TokenInfo(length, metadata));
	}

	public build(): TokenArray {
		return TokenArray.create(this._tokens);
	}
}
