/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { BugIndicatingError } from '../../../../base/common/errors.js';

export interface IOffsetRange {
	readonly start: number;
	readonly endExclusive: number;
}

/**
 * A range of offsets (0-based).
*/
export class OffsetRange implements IOffsetRange {

	public static ofLength(length: number): OffsetRange {
		return new OffsetRange(0, length);
	}

	constructor(public readonly start: number, public readonly endExclusive: number) {
		if (start > endExclusive) {
			throw new BugIndicatingError(`Invalid range: ${this.toString()}`);
		}
	}

	get isEmpty(): boolean {
		return this.start === this.endExclusive;
	}

	public delta(offset: number): OffsetRange {
		return new OffsetRange(this.start + offset, this.endExclusive + offset);
	}

	public deltaStart(offset: number): OffsetRange {
		return new OffsetRange(this.start + offset, this.endExclusive);
	}

	public deltaEnd(offset: number): OffsetRange {
		return new OffsetRange(this.start, this.endExclusive + offset);
	}

	public get length(): number {
		return this.endExclusive - this.start;
	}

	public toString() {
		return `[${this.start}, ${this.endExclusive})`;
	}

	/**
	 * for all numbers n: range1.contains(n) or range2.contains(n) => range1.join(range2).contains(n)
	 * The joined range is the smallest range that contains both ranges.
	 */
	public join(other: OffsetRange): OffsetRange {
		return new OffsetRange(Math.min(this.start, other.start), Math.max(this.endExclusive, other.endExclusive));
	}

	/**
	 * for all numbers n: range1.contains(n) and range2.contains(n) <=> range1.intersect(range2).contains(n)
	 *
	 * The resulting range is empty if the ranges do not intersect, but touch.
	 * If the ranges don't even touch, the result is undefined.
	 */
	public intersect(other: OffsetRange): OffsetRange | undefined {
		const start = Math.max(this.start, other.start);
		const end = Math.min(this.endExclusive, other.endExclusive);
		if (start <= end) {
			return new OffsetRange(start, end);
		}
		return undefined;
	}

	/**
	 * `a.intersects(b)` iff there exists a number n so that `a.contains(n)` and `b.contains(n)`.
	 * Warning: If one range is empty, this method returns always false.
	*/
	public intersects(other: OffsetRange): boolean {
		const start = Math.max(this.start, other.start);
		const end = Math.min(this.endExclusive, other.endExclusive);
		return start < end;
	}

	public slice<T>(arr: readonly T[]): T[] {
		return arr.slice(this.start, this.endExclusive);
	}

	public forEach(f: (offset: number) => void): void {
		for (let i = this.start; i < this.endExclusive; i++) {
			f(i);
		}
	}
}
