/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { RichEditBrackets } from './richEditBrackets.js';

/**
 * Interface used to support electric characters
 * @internal
 */
export interface IElectricAction {
	// The line will be indented at the same level of the line
	// which contains the matching given bracket type.
	matchOpenBracket: string;
}

export class BracketElectricCharacterSupport {


	constructor(richEditBrackets: RichEditBrackets | null) {
	}
}
