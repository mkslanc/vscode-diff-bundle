/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { LineRange } from './lineRange.js';
import { Position } from './position.js';

/**
 * Represents a non-negative length of text in terms of line and column count.
*/
export class TextLength {
	public static zero = new TextLength(0, 0);

	constructor(
		public readonly lineCount: number,
		public readonly columnCount: number
	) { }

	public toLineRange(): LineRange {
		return LineRange.ofLength(1, this.lineCount);
	}

	public addToPosition(position: Position): Position {
		if (this.lineCount === 0) {
			return new Position(position.lineNumber, position.column + this.columnCount);
		} else {
			return new Position(position.lineNumber + this.lineCount, this.columnCount + 1);
		}
	}
}
