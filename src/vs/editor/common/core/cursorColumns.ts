/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as strings from '../../../base/common/strings.js';

/**
 * A column in a position is the gap between two adjacent characters. The methods here
 * work with a concept called "visible column". A visible column is a very rough approximation
 * of the horizontal screen position of a column. For example, using a tab size of 4:
 * ```txt
 * |<TAB>|<TAB>|T|ext
 * |     |     | \---- column = 4, visible column = 9
 * |     |     \------ column = 3, visible column = 8
 * |     \------------ column = 2, visible column = 4
 * \------------------ column = 1, visible column = 0
 * ```
 *
 * **NOTE**: Visual columns do not work well for RTL text or variable-width fonts or characters.
 *
 * **NOTE**: These methods work and make sense both on the model and on the view model.
 */
export class CursorColumns {

	private static _nextVisibleColumn(codePoint: number, visibleColumn: number, tabSize: number): number {
		if (codePoint === 9) {
			return CursorColumns.nextRenderTabStop(visibleColumn, tabSize);
		}
		if (strings.isFullWidthCharacter(codePoint) || strings.isEmojiImprecise(codePoint)) {
			return visibleColumn + 2;
		}
		return visibleColumn + 1;
	}

	/**
	 * Returns a visible column from a column.
	 * @see {@link CursorColumns}
	 */
	public static visibleColumnFromColumn(lineContent: string, column: number, tabSize: number): number {
		const textLen = Math.min(column - 1, lineContent.length);
		const text = lineContent.substring(0, textLen);
		const iterator = new strings.GraphemeIterator(text);

		let result = 0;
		while (!iterator.eol()) {
			const codePoint = strings.getNextCodePoint(text, textLen, iterator.offset);
			iterator.nextGraphemeLength();

			result = this._nextVisibleColumn(codePoint, result, tabSize);
		}

		return result;
	}

	/**
	 * ATTENTION: This works with 0-based columns (as opposed to the regular 1-based columns)
	 * @see {@link CursorColumns}
	 */
	public static nextRenderTabStop(visibleColumn: number, tabSize: number): number {
		return visibleColumn + tabSize - visibleColumn % tabSize;
	}
}
