/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { onUnexpectedError } from '../../../../base/common/errors.js';
import * as strings from '../../../../base/common/strings.js';
import { CharacterPair, OnEnterRule } from '../languageConfiguration.js';

export interface IOnEnterSupportOptions {
	brackets?: CharacterPair[];
	onEnterRules?: OnEnterRule[];
}

interface IProcessedBracketPair {
	open: string;
	close: string;
	openRegExp: RegExp;
	closeRegExp: RegExp;
}

export class OnEnterSupport {

	private readonly _brackets: IProcessedBracketPair[];

	constructor(opts: IOnEnterSupportOptions) {
		opts = opts || {};
		opts.brackets = opts.brackets || [
			['(', ')'],
			['{', '}'],
			['[', ']']
		];

		this._brackets = [];
		opts.brackets.forEach((bracket) => {
			const openRegExp = OnEnterSupport._createOpenBracketRegExp(bracket[0]);
			const closeRegExp = OnEnterSupport._createCloseBracketRegExp(bracket[1]);
			if (openRegExp && closeRegExp) {
				this._brackets.push({
					open: bracket[0],
					openRegExp: openRegExp,
					close: bracket[1],
					closeRegExp: closeRegExp,
				});
			}
		});
	}

	private static _createOpenBracketRegExp(bracket: string): RegExp | null {
		let str = strings.escapeRegExpCharacters(bracket);
		if (!/\B/.test(str.charAt(0))) {
			str = '\\b' + str;
		}
		str += '\\s*$';
		return OnEnterSupport._safeRegExp(str);
	}

	private static _createCloseBracketRegExp(bracket: string): RegExp | null {
		let str = strings.escapeRegExpCharacters(bracket);
		if (!/\B/.test(str.charAt(str.length - 1))) {
			str = str + '\\b';
		}
		str = '^\\s*' + str;
		return OnEnterSupport._safeRegExp(str);
	}

	private static _safeRegExp(def: string): RegExp | null {
		try {
			return new RegExp(def);
		} catch (err) {
			onUnexpectedError(err);
			return null;
		}
	}
}
