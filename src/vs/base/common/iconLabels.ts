/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ThemeIcon } from './themables.js';


const iconsRegex = new RegExp(`\\$\\(${ThemeIcon.iconNameExpression}(?:${ThemeIcon.iconModifierExpression})?\\)`, 'g'); // no capturing groups

const escapeIconsRegex = new RegExp(`(\\\\)?${iconsRegex.source}`, 'g');
export function escapeIcons(text: string): string {
	return text.replace(escapeIconsRegex, (match, escaped) => escaped ? match : `\\${match}`);
}




export interface IParsedLabelWithIcons {
	readonly text: string;
	readonly iconOffsets?: readonly number[];
}

