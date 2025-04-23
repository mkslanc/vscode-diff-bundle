/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Codicon } from './codicons.js';

export type ColorIdentifier = string;

export type IconIdentifier = string;

export interface ThemeColor {
	id: string;
}

export namespace ThemeColor {
}


export interface ThemeIcon {
	readonly id: string;
	readonly color?: ThemeColor;
}

export namespace ThemeIcon {
	export const iconNameSegment = '[A-Za-z0-9]+';
	export const iconNameExpression = '[A-Za-z0-9-]+';
	export const iconModifierExpression = '~[A-Za-z]+';
	export const iconNameCharacter = '[A-Za-z0-9~-]';

	const ThemeIconIdRegex = new RegExp(`^(${iconNameExpression})(${iconModifierExpression})?$`);

	export function asClassNameArray(icon: ThemeIcon): string[] {
		const match = ThemeIconIdRegex.exec(icon.id);
		if (!match) {
			return asClassNameArray(Codicon.error);
		}
		const [, id, modifier] = match;
		const classNames = ['codicon', 'codicon-' + id];
		if (modifier) {
			classNames.push('codicon-modifier-' + modifier.substring(1));
		}
		return classNames;
	}


}
