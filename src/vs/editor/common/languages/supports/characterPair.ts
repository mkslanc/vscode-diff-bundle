/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { StandardAutoClosingPairConditional, LanguageConfiguration } from '../languageConfiguration.js';

export class CharacterPairSupport {

	static readonly DEFAULT_AUTOCLOSE_BEFORE_LANGUAGE_DEFINED_QUOTES = ';:.,=}])> \n\t';
	static readonly DEFAULT_AUTOCLOSE_BEFORE_LANGUAGE_DEFINED_BRACKETS = '\'"`;:.,=}])> \n\t';
	static readonly DEFAULT_AUTOCLOSE_BEFORE_WHITESPACE = ' \n\t';

	private readonly _autoClosingPairs: StandardAutoClosingPairConditional[];

	constructor(config: LanguageConfiguration) {
		if (config.autoClosingPairs) {
			this._autoClosingPairs = config.autoClosingPairs.map(el => new StandardAutoClosingPairConditional(el));
		} else if (config.brackets) {
			this._autoClosingPairs = config.brackets.map(b => new StandardAutoClosingPairConditional({ open: b[0], close: b[1] }));
		} else {
			this._autoClosingPairs = [];
		}

		if (config.__electricCharacterSupport && config.__electricCharacterSupport.docComment) {
			const docComment = config.__electricCharacterSupport.docComment;
			// IDocComment is legacy, only partially supported
			this._autoClosingPairs.push(new StandardAutoClosingPairConditional({ open: docComment.open, close: docComment.close || '' }));
		}


	}
}
