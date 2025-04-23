/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LineTokens } from '../tokens/lineTokens.js';
import { ILanguageIdCodec } from '../languages.js';

export class ScopedLineTokens {
	_scopedLineTokensBrand: void = undefined;

	public readonly languageIdCodec: ILanguageIdCodec;
	public readonly languageId: string;
	public readonly firstCharOffset: number;

	constructor(
		actual: LineTokens,
		languageId: string,
		firstTokenIndex: number,
		lastTokenIndex: number,
		firstCharOffset: number,
		lastCharOffset: number
	) {
		this.languageId = languageId;
		this.firstCharOffset = firstCharOffset;
		this.languageIdCodec = actual.languageIdCodec;
	}
}

