/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IPosition, Position } from './position.js';

/**
 * A range in the editor. This interface is suitable for serialization.
 */
export interface IRange {
	/**
	 * Line number on which the range starts (starts at 1).
	 */
	readonly startLineNumber: number;
	/**
	 * Column on which the range starts in line `startLineNumber` (starts at 1).
	 */
	readonly startColumn: number;
	/**
	 * Line number on which the range ends.
	 */
	readonly endLineNumber: number;
	/**
	 * Column on which the range ends in line `endLineNumber`.
	 */
	readonly endColumn: number;
}

/**
 * A range in the editor. (startLineNumber,startColumn) is <= (endLineNumber,endColumn)
 */
export class Range {

	/**
	 * Line number on which the range starts (starts at 1).
	 */
	public readonly startLineNumber: number;
	/**
	 * Column on which the range starts in line `startLineNumber` (starts at 1).
	 */
	public readonly startColumn: number;
	/**
	 * Line number on which the range ends.
	 */
	public readonly endLineNumber: number;
	/**
	 * Column on which the range ends in line `endLineNumber`.
	 */
	public readonly endColumn: number;

	constructor(startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number) {
		if ((startLineNumber > endLineNumber) || (startLineNumber === endLineNumber && startColumn > endColumn)) {
			this.startLineNumber = endLineNumber;
			this.startColumn = endColumn;
			this.endLineNumber = startLineNumber;
			this.endColumn = startColumn;
		} else {
			this.startLineNumber = startLineNumber;
			this.startColumn = startColumn;
			this.endLineNumber = endLineNumber;
			this.endColumn = endColumn;
		}
	}

	/**
	 * Test if this range is empty.
	 */
	public isEmpty(): boolean {
		return Range.isEmpty(this);
	}

	/**
	 * Test if `range` is empty.
	 */
	public static isEmpty(range: IRange): boolean {
		return (range.startLineNumber === range.endLineNumber && range.startColumn === range.endColumn);
	}

	/**
	 * Test if position is in this range. If the position is at the edges, will return true.
	 */
	public containsPosition(position: IPosition): boolean {
		return Range.containsPosition(this, position);
	}

	/**
	 * Test if `position` is in `range`. If the position is at the edges, will return true.
	 */
	public static containsPosition(range: IRange, position: IPosition): boolean {
		if (position.lineNumber < range.startLineNumber || position.lineNumber > range.endLineNumber) {
			return false;
		}
		if (position.lineNumber === range.startLineNumber && position.column < range.startColumn) {
			return false;
		}
		if (position.lineNumber === range.endLineNumber && position.column > range.endColumn) {
			return false;
		}
		return true;
	}

	/**
	 * Test if range is in this range. If the range is equal to this range, will return true.
	 */
	public containsRange(range: IRange): boolean {
		return Range.containsRange(this, range);
	}

	/**
	 * Test if `otherRange` is in `range`. If the ranges are equal, will return true.
	 */
	public static containsRange(range: IRange, otherRange: IRange): boolean {
		if (otherRange.startLineNumber < range.startLineNumber || otherRange.endLineNumber < range.startLineNumber) {
			return false;
		}
		if (otherRange.startLineNumber > range.endLineNumber || otherRange.endLineNumber > range.endLineNumber) {
			return false;
		}
		if (otherRange.startLineNumber === range.startLineNumber && otherRange.startColumn < range.startColumn) {
			return false;
		}
		if (otherRange.endLineNumber === range.endLineNumber && otherRange.endColumn > range.endColumn) {
			return false;
		}
		return true;
	}

	/**
	 * Test if `range` is strictly in this range. `range` must start after and end before this range for the result to be true.
	 */
	public strictContainsRange(range: IRange): boolean {
		return Range.strictContainsRange(this, range);
	}

	/**
	 * Test if `otherRange` is strictly in `range` (must start after, and end before). If the ranges are equal, will return false.
	 */
	public static strictContainsRange(range: IRange, otherRange: IRange): boolean {
		if (otherRange.startLineNumber < range.startLineNumber || otherRange.endLineNumber < range.startLineNumber) {
			return false;
		}
		if (otherRange.startLineNumber > range.endLineNumber || otherRange.endLineNumber > range.endLineNumber) {
			return false;
		}
		if (otherRange.startLineNumber === range.startLineNumber && otherRange.startColumn <= range.startColumn) {
			return false;
		}
		if (otherRange.endLineNumber === range.endLineNumber && otherRange.endColumn >= range.endColumn) {
			return false;
		}
		return true;
	}

	/**
	 * A reunion of the two ranges.
	 * The smallest position will be used as the start point, and the largest one as the end point.
	 */
	public plusRange(range: IRange): Range {
		return Range.plusRange(this, range);
	}

	/**
	 * A reunion of the two ranges.
	 * The smallest position will be used as the start point, and the largest one as the end point.
	 */
	public static plusRange(a: IRange, b: IRange): Range {
		let startLineNumber: number;
		let startColumn: number;
		let endLineNumber: number;
		let endColumn: number;

		if (b.startLineNumber < a.startLineNumber) {
			startLineNumber = b.startLineNumber;
			startColumn = b.startColumn;
		} else if (b.startLineNumber === a.startLineNumber) {
			startLineNumber = b.startLineNumber;
			startColumn = Math.min(b.startColumn, a.startColumn);
		} else {
			startLineNumber = a.startLineNumber;
			startColumn = a.startColumn;
		}

		if (b.endLineNumber > a.endLineNumber) {
			endLineNumber = b.endLineNumber;
			endColumn = b.endColumn;
		} else if (b.endLineNumber === a.endLineNumber) {
			endLineNumber = b.endLineNumber;
			endColumn = Math.max(b.endColumn, a.endColumn);
		} else {
			endLineNumber = a.endLineNumber;
			endColumn = a.endColumn;
		}

		return new Range(startLineNumber, startColumn, endLineNumber, endColumn);
	}

	/**
	 * A intersection of the two ranges.
	 */
	public intersectRanges(range: IRange): Range | null {
		return Range.intersectRanges(this, range);
	}

	/**
	 * A intersection of the two ranges.
	 */
	public static intersectRanges(a: IRange, b: IRange): Range | null {
		let resultStartLineNumber = a.startLineNumber;
		let resultStartColumn = a.startColumn;
		let resultEndLineNumber = a.endLineNumber;
		let resultEndColumn = a.endColumn;
		const otherStartLineNumber = b.startLineNumber;
		const otherStartColumn = b.startColumn;
		const otherEndLineNumber = b.endLineNumber;
		const otherEndColumn = b.endColumn;

		if (resultStartLineNumber < otherStartLineNumber) {
			resultStartLineNumber = otherStartLineNumber;
			resultStartColumn = otherStartColumn;
		} else if (resultStartLineNumber === otherStartLineNumber) {
			resultStartColumn = Math.max(resultStartColumn, otherStartColumn);
		}

		if (resultEndLineNumber > otherEndLineNumber) {
			resultEndLineNumber = otherEndLineNumber;
			resultEndColumn = otherEndColumn;
		} else if (resultEndLineNumber === otherEndLineNumber) {
			resultEndColumn = Math.min(resultEndColumn, otherEndColumn);
		}

		// Check if selection is now empty
		if (resultStartLineNumber > resultEndLineNumber) {
			return null;
		}
		if (resultStartLineNumber === resultEndLineNumber && resultStartColumn > resultEndColumn) {
			return null;
		}
		return new Range(resultStartLineNumber, resultStartColumn, resultEndLineNumber, resultEndColumn);
	}

	/**
	 * Test if this range equals other.
	 */
	public equalsRange(other: IRange | null | undefined): boolean {
		return Range.equalsRange(this, other);
	}

	/**
	 * Test if range `a` equals `b`.
	 */
	public static equalsRange(a: IRange | null | undefined, b: IRange | null | undefined): boolean {
		if (!a && !b) {
			return true;
		}
		return (
			!!a &&
			!!b &&
			a.startLineNumber === b.startLineNumber &&
			a.startColumn === b.startColumn &&
			a.endLineNumber === b.endLineNumber &&
			a.endColumn === b.endColumn
		);
	}

	/**
	 * Return the end position (which will be after or equal to the start position)
	 */
	public getEndPosition(): Position {
		return Range.getEndPosition(this);
	}

	/**
	 * Return the end position (which will be after or equal to the start position)
	 */
	public static getEndPosition(range: IRange): Position {
		return new Position(range.endLineNumber, range.endColumn);
	}

	/**
	 * Return the start position (which will be before or equal to the end position)
	 */
	public getStartPosition(): Position {
		return Range.getStartPosition(this);
	}

	/**
	 * Return the start position (which will be before or equal to the end position)
	 */
	public static getStartPosition(range: IRange): Position {
		return new Position(range.startLineNumber, range.startColumn);
	}

	/**
	 * Create a new empty range using this range's start position.
	 */
	public collapseToStart(): Range {
		return Range.collapseToStart(this);
	}

	/**
	 * Create a new empty range using this range's start position.
	 */
	public static collapseToStart(range: IRange): Range {
		return new Range(range.startLineNumber, range.startColumn, range.startLineNumber, range.startColumn);
	}

	/**
	 * Create a new empty range using this range's end position.
	 */
	public collapseToEnd(): Range {
		return Range.collapseToEnd(this);
	}

	/**
	 * Create a new empty range using this range's end position.
	 */
	public static collapseToEnd(range: IRange): Range {
		return new Range(range.endLineNumber, range.endColumn, range.endLineNumber, range.endColumn);
	}

	// ---

	public static fromPositions(start: IPosition, end: IPosition = start): Range {
		return new Range(start.lineNumber, start.column, end.lineNumber, end.column);
	}
}
