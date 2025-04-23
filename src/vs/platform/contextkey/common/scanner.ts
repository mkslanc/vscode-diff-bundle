/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { illegalState } from '../../../base/common/errors.js';

export const enum TokenType {
	LParen,
	RParen,
	Neg,
	Eq,
	NotEq,
	Lt,
	LtEq,
	Gt,
	GtEq,
	RegexOp,
	RegexStr,
	True,
	False,
	In,
	Not,
	And,
	Or,
	Str,
	QuotedStr,
	Error,
	EOF,
}

export type Token =
	| { type: TokenType.LParen; offset: number }
	| { type: TokenType.RParen; offset: number }
	| { type: TokenType.Neg; offset: number }
	| { type: TokenType.Eq; offset: number; isTripleEq: boolean }
	| { type: TokenType.NotEq; offset: number; isTripleEq: boolean }
	| { type: TokenType.Lt; offset: number }
	| { type: TokenType.LtEq; offset: number }
	| { type: TokenType.Gt; offset: number }
	| { type: TokenType.GtEq; offset: number }
	| { type: TokenType.RegexOp; offset: number }
	| { type: TokenType.RegexStr; offset: number; lexeme: string }
	| { type: TokenType.True; offset: number }
	| { type: TokenType.False; offset: number }
	| { type: TokenType.In; offset: number }
	| { type: TokenType.Not; offset: number }
	| { type: TokenType.And; offset: number }
	| { type: TokenType.Or; offset: number }
	| { type: TokenType.Str; offset: number; lexeme: string }
	| { type: TokenType.QuotedStr; offset: number; lexeme: string }
	| { type: TokenType.Error; offset: number; lexeme: string }
	| { type: TokenType.EOF; offset: number };


/**
 * Example:
 * `foo == bar'` - note how single quote doesn't have a corresponding closing quote,
 * so it's reported as unexpected
 */
export type LexingError = {
	offset: number; /** note that this doesn't take into account escape characters from the original encoding of the string, e.g., within an extension manifest file's JSON encoding  */
	lexeme: string;
	additionalInfo?: string;
};



/**
 * A simple scanner for context keys.
 *
 * Example:
 *
 * ```ts
 * const scanner = new Scanner().reset('resourceFileName =~ /docker/ && !config.docker.enabled');
 * const tokens = [...scanner];
 * if (scanner.errorTokens.length > 0) {
 *     scanner.errorTokens.forEach(err => console.error(`Unexpected token at ${err.offset}: ${err.lexeme}\nHint: ${err.additional}`));
 * } else {
 *     // process tokens
 * }
 * ```
 */
export class Scanner {

	static getLexeme(token: Token): string {
		switch (token.type) {
			case TokenType.LParen:
				return '(';
			case TokenType.RParen:
				return ')';
			case TokenType.Neg:
				return '!';
			case TokenType.Eq:
				return token.isTripleEq ? '===' : '==';
			case TokenType.NotEq:
				return token.isTripleEq ? '!==' : '!=';
			case TokenType.Lt:
				return '<';
			case TokenType.LtEq:
				return '<=';
			case TokenType.Gt:
				return '>=';
			case TokenType.GtEq:
				return '>=';
			case TokenType.RegexOp:
				return '=~';
			case TokenType.RegexStr:
				return token.lexeme;
			case TokenType.True:
				return 'true';
			case TokenType.False:
				return 'false';
			case TokenType.In:
				return 'in';
			case TokenType.Not:
				return 'not';
			case TokenType.And:
				return '&&';
			case TokenType.Or:
				return '||';
			case TokenType.Str:
				return token.lexeme;
			case TokenType.QuotedStr:
				return token.lexeme;
			case TokenType.Error:
				return token.lexeme;
			case TokenType.EOF:
				return 'EOF';
			default:
				throw illegalState(`unhandled token type: ${JSON.stringify(token)}; have you forgotten to add a case?`);
		}
	}



	private _errors: LexingError[] = [];

	get errors(): Readonly<LexingError[]> {
		return this._errors;
	}




}
