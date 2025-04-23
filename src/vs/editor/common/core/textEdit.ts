/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { assert, assertFn, checkAdjacentItems } from '../../../base/common/assert.js';
import { LineRange } from './lineRange.js';
import { Position } from './position.js';
import { PositionOffsetTransformer } from './positionToOffset.js';
import { Range } from './range.js';
import { TextLength } from './textLength.js';

export class TextEdit {

	constructor(public readonly edits: readonly SingleTextEdit[]) {
		assertFn(() => checkAdjacentItems(edits, (a, b) => a.range.getEndPosition().isBeforeOrEqual(b.range.getStartPosition())));
	}

	toString(text: AbstractText | string | undefined): string {
		if (text === undefined) {
			return this.edits.map(edit => edit.toString()).join('\n');
		}

		if (typeof text === 'string') {
			return this.toString(new StringText(text));
		}

		if (this.edits.length === 0) {
			return '';
		}

		return this.edits.map(edit => {
			const maxLength = 10;
			const originalText = text.getValueOfRange(edit.range);

			// Get text before the edit
			const beforeRange = Range.fromPositions(
				new Position(Math.max(1, edit.range.startLineNumber - 1), 1),
				edit.range.getStartPosition()
			);
			let beforeText = text.getValueOfRange(beforeRange);
			if (beforeText.length > maxLength) {
				beforeText = '...' + beforeText.substring(beforeText.length - maxLength);
			}

			// Get text after the edit
			const afterRange = Range.fromPositions(
				edit.range.getEndPosition(),
				new Position(edit.range.endLineNumber + 1, 1)
			);
			let afterText = text.getValueOfRange(afterRange);
			if (afterText.length > maxLength) {
				afterText = afterText.substring(0, maxLength) + '...';
			}

			// Format the replaced text
			let replacedText = originalText;
			if (replacedText.length > maxLength) {
				const halfMax = Math.floor(maxLength / 2);
				replacedText = replacedText.substring(0, halfMax) + '...' +
					replacedText.substring(replacedText.length - halfMax);
			}

			// Format the new text
			let newText = edit.text;
			if (newText.length > maxLength) {
				const halfMax = Math.floor(maxLength / 2);
				newText = newText.substring(0, halfMax) + '...' +
					newText.substring(newText.length - halfMax);
			}

			if (replacedText.length === 0) {
				// allow-any-unicode-next-line
				return `${beforeText}❰${newText}❱${afterText}`;
			}
			// allow-any-unicode-next-line
			return `${beforeText}❰${replacedText}↦${newText}❱${afterText}`;
		}).join('\n');
	}
}

export class SingleTextEdit {

	constructor(
		public readonly range: Range,
		public readonly text: string,
	) {
	}

	get isEmpty(): boolean {
		return this.range.isEmpty() && this.text.length === 0;
	}

	static equals(first: SingleTextEdit, second: SingleTextEdit) {
		return first.range.equalsRange(second.range) && first.text === second.text;
	}

	public equals(other: SingleTextEdit): boolean {
		return SingleTextEdit.equals(this, other);
	}
}


export abstract class AbstractText {
	abstract getValueOfRange(range: Range): string;
	abstract readonly length: TextLength;

	get endPositionExclusive(): Position {
		return this.length.addToPosition(new Position(1, 1));
	}

	get lineRange(): LineRange {
		return this.length.toLineRange();
	}

	getLineLength(lineNumber: number): number {
		return this.getValueOfRange(new Range(lineNumber, 1, lineNumber, Number.MAX_SAFE_INTEGER)).length;
	}

}

export class LineBasedText extends AbstractText {
	constructor(
		private readonly _getLineContent: (lineNumber: number) => string,
		private readonly _lineCount: number,
	) {
		assert(_lineCount >= 1);

		super();
	}

	override getValueOfRange(range: Range): string {
		if (range.startLineNumber === range.endLineNumber) {
			return this._getLineContent(range.startLineNumber).substring(range.startColumn - 1, range.endColumn - 1);
		}
		let result = this._getLineContent(range.startLineNumber).substring(range.startColumn - 1);
		for (let i = range.startLineNumber + 1; i < range.endLineNumber; i++) {
			result += '\n' + this._getLineContent(i);
		}
		result += '\n' + this._getLineContent(range.endLineNumber).substring(0, range.endColumn - 1);
		return result;
	}

	override getLineLength(lineNumber: number): number {
		return this._getLineContent(lineNumber).length;
	}

	get length(): TextLength {
		const lastLine = this._getLineContent(this._lineCount);
		return new TextLength(this._lineCount - 1, lastLine.length);
	}
}

export class ArrayText extends LineBasedText {
	constructor(lines: string[]) {
		super(
			lineNumber => lines[lineNumber - 1],
			lines.length
		);
	}
}

export class StringText extends AbstractText {
	private readonly _t = new PositionOffsetTransformer(this.value);

	constructor(public readonly value: string) {
		super();
	}

	getValueOfRange(range: Range): string {
		return this._t.getOffsetRange(range).substring(this.value);
	}

	get length(): TextLength {
		return this._t.textLength;
	}
}
