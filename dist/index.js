'use strict';

function findLastMonotonous(array, predicate) {
  const idx = findLastIdxMonotonous(array, predicate);
  return idx === -1 ? void 0 : array[idx];
}
function findLastIdxMonotonous(array, predicate, startIdx = 0, endIdxEx = array.length) {
  let i = startIdx;
  let j = endIdxEx;
  while (i < j) {
    const k = Math.floor((i + j) / 2);
    if (predicate(array[k])) {
      i = k + 1;
    } else {
      j = k;
    }
  }
  return i - 1;
}
function findFirstMonotonous(array, predicate) {
  const idx = findFirstIdxMonotonousOrArrLen(array, predicate);
  return idx === array.length ? void 0 : array[idx];
}
function findFirstIdxMonotonousOrArrLen(array, predicate, startIdx = 0, endIdxEx = array.length) {
  let i = startIdx;
  let j = endIdxEx;
  while (i < j) {
    const k = Math.floor((i + j) / 2);
    if (predicate(array[k])) {
      j = k;
    } else {
      i = k + 1;
    }
  }
  return i;
}
class MonotonousArray {
  constructor(_array) {
    this._array = _array;
    this._findLastMonotonousLastIdx = 0;
  }
  static {
    this.assertInvariants = false;
  }
  /**
   * The predicate must be monotonous, i.e. `arr.map(predicate)` must be like `[true, ..., true, false, ..., false]`!
   * For subsequent calls, current predicate must be weaker than (or equal to) the previous predicate, i.e. more entries must be `true`.
   */
  findLastMonotonous(predicate) {
    if (MonotonousArray.assertInvariants) {
      if (this._prevFindLastPredicate) {
        for (const item of this._array) {
          if (this._prevFindLastPredicate(item) && !predicate(item)) {
            throw new Error("MonotonousArray: current predicate must be weaker than (or equal to) the previous predicate.");
          }
        }
      }
      this._prevFindLastPredicate = predicate;
    }
    const idx = findLastIdxMonotonous(this._array, predicate, this._findLastMonotonousLastIdx);
    this._findLastMonotonousLastIdx = idx + 1;
    return idx === -1 ? void 0 : this._array[idx];
  }
}

class BugIndicatingError extends Error {
  constructor(message) {
    super(message || "An unexpected bug occurred.");
    Object.setPrototypeOf(this, BugIndicatingError.prototype);
  }
}

function equals(one, other, itemEquals = (a, b) => a === b) {
  if (one === other) {
    return true;
  }
  if (!one || !other) {
    return false;
  }
  if (one.length !== other.length) {
    return false;
  }
  for (let i = 0, len = one.length; i < len; i++) {
    if (!itemEquals(one[i], other[i])) {
      return false;
    }
  }
  return true;
}
function* groupAdjacentBy(items, shouldBeGrouped) {
  let currentGroup;
  let last;
  for (const item of items) {
    if (last !== void 0 && shouldBeGrouped(last, item)) {
      currentGroup.push(item);
    } else {
      if (currentGroup) {
        yield currentGroup;
      }
      currentGroup = [item];
    }
    last = item;
  }
  if (currentGroup) {
    yield currentGroup;
  }
}
function forEachAdjacent(arr, f) {
  for (let i = 0; i <= arr.length; i++) {
    f(i === 0 ? void 0 : arr[i - 1], i === arr.length ? void 0 : arr[i]);
  }
}
function forEachWithNeighbors(arr, f) {
  for (let i = 0; i < arr.length; i++) {
    f(i === 0 ? void 0 : arr[i - 1], arr[i], i + 1 === arr.length ? void 0 : arr[i + 1]);
  }
}
function pushMany(arr, items) {
  for (const item of items) {
    arr.push(item);
  }
}
function compareBy(selector, comparator) {
  return (a, b) => comparator(selector(a), selector(b));
}
const numberComparator = (a, b) => a - b;
function reverseOrder(comparator) {
  return (a, b) => -comparator(a, b);
}

function assert(condition, message = "unexpected state") {
  if (!condition) {
    throw new BugIndicatingError(`Assertion Failed: ${message}`);
  }
}
function assertFn(condition) {
  condition();
}
function checkAdjacentItems(items, predicate) {
  let i = 0;
  while (i < items.length - 1) {
    const a = items[i];
    const b = items[i + 1];
    if (!predicate(a, b)) {
      return false;
    }
    i++;
  }
  return true;
}

class OffsetRange {
  constructor(start, endExclusive) {
    this.start = start;
    this.endExclusive = endExclusive;
    if (start > endExclusive) {
      throw new BugIndicatingError(`Invalid range: ${this.toString()}`);
    }
  }
  static fromTo(start, endExclusive) {
    return new OffsetRange(start, endExclusive);
  }
  static addRange(range, sortedRanges) {
    let i = 0;
    while (i < sortedRanges.length && sortedRanges[i].endExclusive < range.start) {
      i++;
    }
    let j = i;
    while (j < sortedRanges.length && sortedRanges[j].start <= range.endExclusive) {
      j++;
    }
    if (i === j) {
      sortedRanges.splice(i, 0, range);
    } else {
      const start = Math.min(range.start, sortedRanges[i].start);
      const end = Math.max(range.endExclusive, sortedRanges[j - 1].endExclusive);
      sortedRanges.splice(i, j - i, new OffsetRange(start, end));
    }
  }
  static tryCreate(start, endExclusive) {
    if (start > endExclusive) {
      return void 0;
    }
    return new OffsetRange(start, endExclusive);
  }
  static ofLength(length) {
    return new OffsetRange(0, length);
  }
  static ofStartAndLength(start, length) {
    return new OffsetRange(start, start + length);
  }
  static emptyAt(offset) {
    return new OffsetRange(offset, offset);
  }
  get isEmpty() {
    return this.start === this.endExclusive;
  }
  delta(offset) {
    return new OffsetRange(this.start + offset, this.endExclusive + offset);
  }
  deltaStart(offset) {
    return new OffsetRange(this.start + offset, this.endExclusive);
  }
  deltaEnd(offset) {
    return new OffsetRange(this.start, this.endExclusive + offset);
  }
  get length() {
    return this.endExclusive - this.start;
  }
  toString() {
    return `[${this.start}, ${this.endExclusive})`;
  }
  equals(other) {
    return this.start === other.start && this.endExclusive === other.endExclusive;
  }
  containsRange(other) {
    return this.start <= other.start && other.endExclusive <= this.endExclusive;
  }
  contains(offset) {
    return this.start <= offset && offset < this.endExclusive;
  }
  /**
   * for all numbers n: range1.contains(n) or range2.contains(n) => range1.join(range2).contains(n)
   * The joined range is the smallest range that contains both ranges.
   */
  join(other) {
    return new OffsetRange(Math.min(this.start, other.start), Math.max(this.endExclusive, other.endExclusive));
  }
  /**
   * for all numbers n: range1.contains(n) and range2.contains(n) <=> range1.intersect(range2).contains(n)
   *
   * The resulting range is empty if the ranges do not intersect, but touch.
   * If the ranges don't even touch, the result is undefined.
   */
  intersect(other) {
    const start = Math.max(this.start, other.start);
    const end = Math.min(this.endExclusive, other.endExclusive);
    if (start <= end) {
      return new OffsetRange(start, end);
    }
    return void 0;
  }
  intersectionLength(range) {
    const start = Math.max(this.start, range.start);
    const end = Math.min(this.endExclusive, range.endExclusive);
    return Math.max(0, end - start);
  }
  intersects(other) {
    const start = Math.max(this.start, other.start);
    const end = Math.min(this.endExclusive, other.endExclusive);
    return start < end;
  }
  intersectsOrTouches(other) {
    const start = Math.max(this.start, other.start);
    const end = Math.min(this.endExclusive, other.endExclusive);
    return start <= end;
  }
  isBefore(other) {
    return this.endExclusive <= other.start;
  }
  isAfter(other) {
    return this.start >= other.endExclusive;
  }
  slice(arr) {
    return arr.slice(this.start, this.endExclusive);
  }
  substring(str) {
    return str.substring(this.start, this.endExclusive);
  }
  /**
   * Returns the given value if it is contained in this instance, otherwise the closest value that is contained.
   * The range must not be empty.
   */
  clip(value) {
    if (this.isEmpty) {
      throw new BugIndicatingError(`Invalid clipping range: ${this.toString()}`);
    }
    return Math.max(this.start, Math.min(this.endExclusive - 1, value));
  }
  /**
   * Returns `r := value + k * length` such that `r` is contained in this range.
   * The range must not be empty.
   *
   * E.g. `[5, 10).clipCyclic(10) === 5`, `[5, 10).clipCyclic(11) === 6` and `[5, 10).clipCyclic(4) === 9`.
   */
  clipCyclic(value) {
    if (this.isEmpty) {
      throw new BugIndicatingError(`Invalid clipping range: ${this.toString()}`);
    }
    if (value < this.start) {
      return this.endExclusive - (this.start - value) % this.length;
    }
    if (value >= this.endExclusive) {
      return this.start + (value - this.start) % this.length;
    }
    return value;
  }
  map(f) {
    const result = [];
    for (let i = this.start; i < this.endExclusive; i++) {
      result.push(f(i));
    }
    return result;
  }
  forEach(f) {
    for (let i = this.start; i < this.endExclusive; i++) {
      f(i);
    }
  }
}

class Position {
  constructor(lineNumber, column) {
    this.lineNumber = lineNumber;
    this.column = column;
  }
  /**
   * Create a new position from this position.
   *
   * @param newLineNumber new line number
   * @param newColumn new column
   */
  with(newLineNumber = this.lineNumber, newColumn = this.column) {
    if (newLineNumber === this.lineNumber && newColumn === this.column) {
      return this;
    } else {
      return new Position(newLineNumber, newColumn);
    }
  }
  /**
   * Derive a new position from this position.
   *
   * @param deltaLineNumber line number delta
   * @param deltaColumn column delta
   */
  delta(deltaLineNumber = 0, deltaColumn = 0) {
    return this.with(this.lineNumber + deltaLineNumber, this.column + deltaColumn);
  }
  /**
   * Test if this position equals other position
   */
  equals(other) {
    return Position.equals(this, other);
  }
  /**
   * Test if position `a` equals position `b`
   */
  static equals(a, b) {
    if (!a && !b) {
      return true;
    }
    return !!a && !!b && a.lineNumber === b.lineNumber && a.column === b.column;
  }
  /**
   * Test if this position is before other position.
   * If the two positions are equal, the result will be false.
   */
  isBefore(other) {
    return Position.isBefore(this, other);
  }
  /**
   * Test if position `a` is before position `b`.
   * If the two positions are equal, the result will be false.
   */
  static isBefore(a, b) {
    if (a.lineNumber < b.lineNumber) {
      return true;
    }
    if (b.lineNumber < a.lineNumber) {
      return false;
    }
    return a.column < b.column;
  }
  /**
   * Test if this position is before other position.
   * If the two positions are equal, the result will be true.
   */
  isBeforeOrEqual(other) {
    return Position.isBeforeOrEqual(this, other);
  }
  /**
   * Test if position `a` is before position `b`.
   * If the two positions are equal, the result will be true.
   */
  static isBeforeOrEqual(a, b) {
    if (a.lineNumber < b.lineNumber) {
      return true;
    }
    if (b.lineNumber < a.lineNumber) {
      return false;
    }
    return a.column <= b.column;
  }
  /**
   * A function that compares positions, useful for sorting
   */
  static compare(a, b) {
    const aLineNumber = a.lineNumber | 0;
    const bLineNumber = b.lineNumber | 0;
    if (aLineNumber === bLineNumber) {
      const aColumn = a.column | 0;
      const bColumn = b.column | 0;
      return aColumn - bColumn;
    }
    return aLineNumber - bLineNumber;
  }
  /**
   * Clone this position.
   */
  clone() {
    return new Position(this.lineNumber, this.column);
  }
  /**
   * Convert to a human-readable representation.
   */
  toString() {
    return "(" + this.lineNumber + "," + this.column + ")";
  }
  // ---
  /**
   * Create a `Position` from an `IPosition`.
   */
  static lift(pos) {
    return new Position(pos.lineNumber, pos.column);
  }
  /**
   * Test if `obj` is an `IPosition`.
   */
  static isIPosition(obj) {
    return obj && typeof obj.lineNumber === "number" && typeof obj.column === "number";
  }
  toJSON() {
    return {
      lineNumber: this.lineNumber,
      column: this.column
    };
  }
}

class Range {
  constructor(startLineNumber, startColumn, endLineNumber, endColumn) {
    if (startLineNumber > endLineNumber || startLineNumber === endLineNumber && startColumn > endColumn) {
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
  isEmpty() {
    return Range.isEmpty(this);
  }
  /**
   * Test if `range` is empty.
   */
  static isEmpty(range) {
    return range.startLineNumber === range.endLineNumber && range.startColumn === range.endColumn;
  }
  /**
   * Test if position is in this range. If the position is at the edges, will return true.
   */
  containsPosition(position) {
    return Range.containsPosition(this, position);
  }
  /**
   * Test if `position` is in `range`. If the position is at the edges, will return true.
   */
  static containsPosition(range, position) {
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
   * Test if `position` is in `range`. If the position is at the edges, will return false.
   * @internal
   */
  static strictContainsPosition(range, position) {
    if (position.lineNumber < range.startLineNumber || position.lineNumber > range.endLineNumber) {
      return false;
    }
    if (position.lineNumber === range.startLineNumber && position.column <= range.startColumn) {
      return false;
    }
    if (position.lineNumber === range.endLineNumber && position.column >= range.endColumn) {
      return false;
    }
    return true;
  }
  /**
   * Test if range is in this range. If the range is equal to this range, will return true.
   */
  containsRange(range) {
    return Range.containsRange(this, range);
  }
  /**
   * Test if `otherRange` is in `range`. If the ranges are equal, will return true.
   */
  static containsRange(range, otherRange) {
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
  strictContainsRange(range) {
    return Range.strictContainsRange(this, range);
  }
  /**
   * Test if `otherRange` is strictly in `range` (must start after, and end before). If the ranges are equal, will return false.
   */
  static strictContainsRange(range, otherRange) {
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
  plusRange(range) {
    return Range.plusRange(this, range);
  }
  /**
   * A reunion of the two ranges.
   * The smallest position will be used as the start point, and the largest one as the end point.
   */
  static plusRange(a, b) {
    let startLineNumber;
    let startColumn;
    let endLineNumber;
    let endColumn;
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
  intersectRanges(range) {
    return Range.intersectRanges(this, range);
  }
  /**
   * A intersection of the two ranges.
   */
  static intersectRanges(a, b) {
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
  equalsRange(other) {
    return Range.equalsRange(this, other);
  }
  /**
   * Test if range `a` equals `b`.
   */
  static equalsRange(a, b) {
    if (!a && !b) {
      return true;
    }
    return !!a && !!b && a.startLineNumber === b.startLineNumber && a.startColumn === b.startColumn && a.endLineNumber === b.endLineNumber && a.endColumn === b.endColumn;
  }
  /**
   * Return the end position (which will be after or equal to the start position)
   */
  getEndPosition() {
    return Range.getEndPosition(this);
  }
  /**
   * Return the end position (which will be after or equal to the start position)
   */
  static getEndPosition(range) {
    return new Position(range.endLineNumber, range.endColumn);
  }
  /**
   * Return the start position (which will be before or equal to the end position)
   */
  getStartPosition() {
    return Range.getStartPosition(this);
  }
  /**
   * Return the start position (which will be before or equal to the end position)
   */
  static getStartPosition(range) {
    return new Position(range.startLineNumber, range.startColumn);
  }
  /**
   * Transform to a user presentable string representation.
   */
  toString() {
    return "[" + this.startLineNumber + "," + this.startColumn + " -> " + this.endLineNumber + "," + this.endColumn + "]";
  }
  /**
   * Create a new range using this range's start position, and using endLineNumber and endColumn as the end position.
   */
  setEndPosition(endLineNumber, endColumn) {
    return new Range(this.startLineNumber, this.startColumn, endLineNumber, endColumn);
  }
  /**
   * Create a new range using this range's end position, and using startLineNumber and startColumn as the start position.
   */
  setStartPosition(startLineNumber, startColumn) {
    return new Range(startLineNumber, startColumn, this.endLineNumber, this.endColumn);
  }
  /**
   * Create a new empty range using this range's start position.
   */
  collapseToStart() {
    return Range.collapseToStart(this);
  }
  /**
   * Create a new empty range using this range's start position.
   */
  static collapseToStart(range) {
    return new Range(range.startLineNumber, range.startColumn, range.startLineNumber, range.startColumn);
  }
  /**
   * Create a new empty range using this range's end position.
   */
  collapseToEnd() {
    return Range.collapseToEnd(this);
  }
  /**
   * Create a new empty range using this range's end position.
   */
  static collapseToEnd(range) {
    return new Range(range.endLineNumber, range.endColumn, range.endLineNumber, range.endColumn);
  }
  /**
   * Moves the range by the given amount of lines.
   */
  delta(lineCount) {
    return new Range(this.startLineNumber + lineCount, this.startColumn, this.endLineNumber + lineCount, this.endColumn);
  }
  isSingleLine() {
    return this.startLineNumber === this.endLineNumber;
  }
  // ---
  static fromPositions(start, end = start) {
    return new Range(start.lineNumber, start.column, end.lineNumber, end.column);
  }
  static lift(range) {
    if (!range) {
      return null;
    }
    return new Range(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn);
  }
  /**
   * Test if `obj` is an `IRange`.
   */
  static isIRange(obj) {
    return obj && typeof obj.startLineNumber === "number" && typeof obj.startColumn === "number" && typeof obj.endLineNumber === "number" && typeof obj.endColumn === "number";
  }
  /**
   * Test if the two ranges are touching in any way.
   */
  static areIntersectingOrTouching(a, b) {
    if (a.endLineNumber < b.startLineNumber || a.endLineNumber === b.startLineNumber && a.endColumn < b.startColumn) {
      return false;
    }
    if (b.endLineNumber < a.startLineNumber || b.endLineNumber === a.startLineNumber && b.endColumn < a.startColumn) {
      return false;
    }
    return true;
  }
  /**
   * Test if the two ranges are intersecting. If the ranges are touching it returns true.
   */
  static areIntersecting(a, b) {
    if (a.endLineNumber < b.startLineNumber || a.endLineNumber === b.startLineNumber && a.endColumn <= b.startColumn) {
      return false;
    }
    if (b.endLineNumber < a.startLineNumber || b.endLineNumber === a.startLineNumber && b.endColumn <= a.startColumn) {
      return false;
    }
    return true;
  }
  /**
   * A function that compares ranges, useful for sorting ranges
   * It will first compare ranges on the startPosition and then on the endPosition
   */
  static compareRangesUsingStarts(a, b) {
    if (a && b) {
      const aStartLineNumber = a.startLineNumber | 0;
      const bStartLineNumber = b.startLineNumber | 0;
      if (aStartLineNumber === bStartLineNumber) {
        const aStartColumn = a.startColumn | 0;
        const bStartColumn = b.startColumn | 0;
        if (aStartColumn === bStartColumn) {
          const aEndLineNumber = a.endLineNumber | 0;
          const bEndLineNumber = b.endLineNumber | 0;
          if (aEndLineNumber === bEndLineNumber) {
            const aEndColumn = a.endColumn | 0;
            const bEndColumn = b.endColumn | 0;
            return aEndColumn - bEndColumn;
          }
          return aEndLineNumber - bEndLineNumber;
        }
        return aStartColumn - bStartColumn;
      }
      return aStartLineNumber - bStartLineNumber;
    }
    const aExists = a ? 1 : 0;
    const bExists = b ? 1 : 0;
    return aExists - bExists;
  }
  /**
   * A function that compares ranges, useful for sorting ranges
   * It will first compare ranges on the endPosition and then on the startPosition
   */
  static compareRangesUsingEnds(a, b) {
    if (a.endLineNumber === b.endLineNumber) {
      if (a.endColumn === b.endColumn) {
        if (a.startLineNumber === b.startLineNumber) {
          return a.startColumn - b.startColumn;
        }
        return a.startLineNumber - b.startLineNumber;
      }
      return a.endColumn - b.endColumn;
    }
    return a.endLineNumber - b.endLineNumber;
  }
  /**
   * Test if the range spans multiple lines.
   */
  static spansMultipleLines(range) {
    return range.endLineNumber > range.startLineNumber;
  }
  toJSON() {
    return this;
  }
}

class LineRange {
  static fromRange(range) {
    return new LineRange(range.startLineNumber, range.endLineNumber);
  }
  static fromRangeInclusive(range) {
    return new LineRange(range.startLineNumber, range.endLineNumber + 1);
  }
  static subtract(a, b) {
    if (!b) {
      return [a];
    }
    if (a.startLineNumber < b.startLineNumber && b.endLineNumberExclusive < a.endLineNumberExclusive) {
      return [
        new LineRange(a.startLineNumber, b.startLineNumber),
        new LineRange(b.endLineNumberExclusive, a.endLineNumberExclusive)
      ];
    } else if (b.startLineNumber <= a.startLineNumber && a.endLineNumberExclusive <= b.endLineNumberExclusive) {
      return [];
    } else if (b.endLineNumberExclusive < a.endLineNumberExclusive) {
      return [new LineRange(Math.max(b.endLineNumberExclusive, a.startLineNumber), a.endLineNumberExclusive)];
    } else {
      return [new LineRange(a.startLineNumber, Math.min(b.startLineNumber, a.endLineNumberExclusive))];
    }
  }
  /**
   * @param lineRanges An array of sorted line ranges.
   */
  static joinMany(lineRanges) {
    if (lineRanges.length === 0) {
      return [];
    }
    let result = new LineRangeSet(lineRanges[0].slice());
    for (let i = 1; i < lineRanges.length; i++) {
      result = result.getUnion(new LineRangeSet(lineRanges[i].slice()));
    }
    return result.ranges;
  }
  static join(lineRanges) {
    if (lineRanges.length === 0) {
      throw new BugIndicatingError("lineRanges cannot be empty");
    }
    let startLineNumber = lineRanges[0].startLineNumber;
    let endLineNumberExclusive = lineRanges[0].endLineNumberExclusive;
    for (let i = 1; i < lineRanges.length; i++) {
      startLineNumber = Math.min(startLineNumber, lineRanges[i].startLineNumber);
      endLineNumberExclusive = Math.max(endLineNumberExclusive, lineRanges[i].endLineNumberExclusive);
    }
    return new LineRange(startLineNumber, endLineNumberExclusive);
  }
  static ofLength(startLineNumber, length) {
    return new LineRange(startLineNumber, startLineNumber + length);
  }
  /**
   * @internal
   */
  static deserialize(lineRange) {
    return new LineRange(lineRange[0], lineRange[1]);
  }
  constructor(startLineNumber, endLineNumberExclusive) {
    if (startLineNumber > endLineNumberExclusive) {
      throw new BugIndicatingError(`startLineNumber ${startLineNumber} cannot be after endLineNumberExclusive ${endLineNumberExclusive}`);
    }
    this.startLineNumber = startLineNumber;
    this.endLineNumberExclusive = endLineNumberExclusive;
  }
  /**
   * Indicates if this line range contains the given line number.
   */
  contains(lineNumber) {
    return this.startLineNumber <= lineNumber && lineNumber < this.endLineNumberExclusive;
  }
  /**
   * Indicates if this line range is empty.
   */
  get isEmpty() {
    return this.startLineNumber === this.endLineNumberExclusive;
  }
  /**
   * Moves this line range by the given offset of line numbers.
   */
  delta(offset) {
    return new LineRange(this.startLineNumber + offset, this.endLineNumberExclusive + offset);
  }
  deltaLength(offset) {
    return new LineRange(this.startLineNumber, this.endLineNumberExclusive + offset);
  }
  /**
   * The number of lines this line range spans.
   */
  get length() {
    return this.endLineNumberExclusive - this.startLineNumber;
  }
  /**
   * Creates a line range that combines this and the given line range.
   */
  join(other) {
    return new LineRange(
      Math.min(this.startLineNumber, other.startLineNumber),
      Math.max(this.endLineNumberExclusive, other.endLineNumberExclusive)
    );
  }
  toString() {
    return `[${this.startLineNumber},${this.endLineNumberExclusive})`;
  }
  /**
   * The resulting range is empty if the ranges do not intersect, but touch.
   * If the ranges don't even touch, the result is undefined.
   */
  intersect(other) {
    const startLineNumber = Math.max(this.startLineNumber, other.startLineNumber);
    const endLineNumberExclusive = Math.min(this.endLineNumberExclusive, other.endLineNumberExclusive);
    if (startLineNumber <= endLineNumberExclusive) {
      return new LineRange(startLineNumber, endLineNumberExclusive);
    }
    return void 0;
  }
  intersectsStrict(other) {
    return this.startLineNumber < other.endLineNumberExclusive && other.startLineNumber < this.endLineNumberExclusive;
  }
  overlapOrTouch(other) {
    return this.startLineNumber <= other.endLineNumberExclusive && other.startLineNumber <= this.endLineNumberExclusive;
  }
  equals(b) {
    return this.startLineNumber === b.startLineNumber && this.endLineNumberExclusive === b.endLineNumberExclusive;
  }
  toInclusiveRange() {
    if (this.isEmpty) {
      return null;
    }
    return new Range(this.startLineNumber, 1, this.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER);
  }
  /**
   * @deprecated Using this function is discouraged because it might lead to bugs: The end position is not guaranteed to be a valid position!
  */
  toExclusiveRange() {
    return new Range(this.startLineNumber, 1, this.endLineNumberExclusive, 1);
  }
  mapToLineArray(f) {
    const result = [];
    for (let lineNumber = this.startLineNumber; lineNumber < this.endLineNumberExclusive; lineNumber++) {
      result.push(f(lineNumber));
    }
    return result;
  }
  forEach(f) {
    for (let lineNumber = this.startLineNumber; lineNumber < this.endLineNumberExclusive; lineNumber++) {
      f(lineNumber);
    }
  }
  /**
   * @internal
   */
  serialize() {
    return [this.startLineNumber, this.endLineNumberExclusive];
  }
  includes(lineNumber) {
    return this.startLineNumber <= lineNumber && lineNumber < this.endLineNumberExclusive;
  }
  /**
   * Converts this 1-based line range to a 0-based offset range (subtracts 1!).
   * @internal
   */
  toOffsetRange() {
    return new OffsetRange(this.startLineNumber - 1, this.endLineNumberExclusive - 1);
  }
  distanceToRange(other) {
    if (this.endLineNumberExclusive <= other.startLineNumber) {
      return other.startLineNumber - this.endLineNumberExclusive;
    }
    if (other.endLineNumberExclusive <= this.startLineNumber) {
      return this.startLineNumber - other.endLineNumberExclusive;
    }
    return 0;
  }
  distanceToLine(lineNumber) {
    if (this.contains(lineNumber)) {
      return 0;
    }
    if (lineNumber < this.startLineNumber) {
      return this.startLineNumber - lineNumber;
    }
    return lineNumber - this.endLineNumberExclusive;
  }
  addMargin(marginTop, marginBottom) {
    return new LineRange(
      this.startLineNumber - marginTop,
      this.endLineNumberExclusive + marginBottom
    );
  }
}
class LineRangeSet {
  constructor(_normalizedRanges = []) {
    this._normalizedRanges = _normalizedRanges;
  }
  get ranges() {
    return this._normalizedRanges;
  }
  addRange(range) {
    if (range.length === 0) {
      return;
    }
    const joinRangeStartIdx = findFirstIdxMonotonousOrArrLen(this._normalizedRanges, (r) => r.endLineNumberExclusive >= range.startLineNumber);
    const joinRangeEndIdxExclusive = findLastIdxMonotonous(this._normalizedRanges, (r) => r.startLineNumber <= range.endLineNumberExclusive) + 1;
    if (joinRangeStartIdx === joinRangeEndIdxExclusive) {
      this._normalizedRanges.splice(joinRangeStartIdx, 0, range);
    } else if (joinRangeStartIdx === joinRangeEndIdxExclusive - 1) {
      const joinRange = this._normalizedRanges[joinRangeStartIdx];
      this._normalizedRanges[joinRangeStartIdx] = joinRange.join(range);
    } else {
      const joinRange = this._normalizedRanges[joinRangeStartIdx].join(this._normalizedRanges[joinRangeEndIdxExclusive - 1]).join(range);
      this._normalizedRanges.splice(joinRangeStartIdx, joinRangeEndIdxExclusive - joinRangeStartIdx, joinRange);
    }
  }
  contains(lineNumber) {
    const rangeThatStartsBeforeEnd = findLastMonotonous(this._normalizedRanges, (r) => r.startLineNumber <= lineNumber);
    return !!rangeThatStartsBeforeEnd && rangeThatStartsBeforeEnd.endLineNumberExclusive > lineNumber;
  }
  intersects(range) {
    const rangeThatStartsBeforeEnd = findLastMonotonous(this._normalizedRanges, (r) => r.startLineNumber < range.endLineNumberExclusive);
    return !!rangeThatStartsBeforeEnd && rangeThatStartsBeforeEnd.endLineNumberExclusive > range.startLineNumber;
  }
  getUnion(other) {
    if (this._normalizedRanges.length === 0) {
      return other;
    }
    if (other._normalizedRanges.length === 0) {
      return this;
    }
    const result = [];
    let i1 = 0;
    let i2 = 0;
    let current = null;
    while (i1 < this._normalizedRanges.length || i2 < other._normalizedRanges.length) {
      let next = null;
      if (i1 < this._normalizedRanges.length && i2 < other._normalizedRanges.length) {
        const lineRange1 = this._normalizedRanges[i1];
        const lineRange2 = other._normalizedRanges[i2];
        if (lineRange1.startLineNumber < lineRange2.startLineNumber) {
          next = lineRange1;
          i1++;
        } else {
          next = lineRange2;
          i2++;
        }
      } else if (i1 < this._normalizedRanges.length) {
        next = this._normalizedRanges[i1];
        i1++;
      } else {
        next = other._normalizedRanges[i2];
        i2++;
      }
      if (current === null) {
        current = next;
      } else {
        if (current.endLineNumberExclusive >= next.startLineNumber) {
          current = new LineRange(current.startLineNumber, Math.max(current.endLineNumberExclusive, next.endLineNumberExclusive));
        } else {
          result.push(current);
          current = next;
        }
      }
    }
    if (current !== null) {
      result.push(current);
    }
    return new LineRangeSet(result);
  }
  /**
   * Subtracts all ranges in this set from `range` and returns the result.
   */
  subtractFrom(range) {
    const joinRangeStartIdx = findFirstIdxMonotonousOrArrLen(this._normalizedRanges, (r) => r.endLineNumberExclusive >= range.startLineNumber);
    const joinRangeEndIdxExclusive = findLastIdxMonotonous(this._normalizedRanges, (r) => r.startLineNumber <= range.endLineNumberExclusive) + 1;
    if (joinRangeStartIdx === joinRangeEndIdxExclusive) {
      return new LineRangeSet([range]);
    }
    const result = [];
    let startLineNumber = range.startLineNumber;
    for (let i = joinRangeStartIdx; i < joinRangeEndIdxExclusive; i++) {
      const r = this._normalizedRanges[i];
      if (r.startLineNumber > startLineNumber) {
        result.push(new LineRange(startLineNumber, r.startLineNumber));
      }
      startLineNumber = r.endLineNumberExclusive;
    }
    if (startLineNumber < range.endLineNumberExclusive) {
      result.push(new LineRange(startLineNumber, range.endLineNumberExclusive));
    }
    return new LineRangeSet(result);
  }
  toString() {
    return this._normalizedRanges.map((r) => r.toString()).join(", ");
  }
  getIntersection(other) {
    const result = [];
    let i1 = 0;
    let i2 = 0;
    while (i1 < this._normalizedRanges.length && i2 < other._normalizedRanges.length) {
      const r1 = this._normalizedRanges[i1];
      const r2 = other._normalizedRanges[i2];
      const i = r1.intersect(r2);
      if (i && !i.isEmpty) {
        result.push(i);
      }
      if (r1.endLineNumberExclusive < r2.endLineNumberExclusive) {
        i1++;
      } else {
        i2++;
      }
    }
    return new LineRangeSet(result);
  }
  getWithDelta(value) {
    return new LineRangeSet(this._normalizedRanges.map((r) => r.delta(value)));
  }
}

class SetMap {
  constructor() {
    this.map = /* @__PURE__ */ new Map();
  }
  add(key, value) {
    let values = this.map.get(key);
    if (!values) {
      values = /* @__PURE__ */ new Set();
      this.map.set(key, values);
    }
    values.add(value);
  }
  delete(key, value) {
    const values = this.map.get(key);
    if (!values) {
      return;
    }
    values.delete(value);
    if (values.size === 0) {
      this.map.delete(key);
    }
  }
  forEach(key, fn) {
    const values = this.map.get(key);
    if (!values) {
      return;
    }
    values.forEach(fn);
  }
  get(key) {
    const values = this.map.get(key);
    if (!values) {
      return /* @__PURE__ */ new Set();
    }
    return values;
  }
}

function splitLines(str) {
  return str.split(/\r\n|\r|\n/);
}
class InvisibleCharacters {
  static getRawData() {
    return JSON.parse("[9,10,11,12,13,32,127,160,173,847,1564,4447,4448,6068,6069,6155,6156,6157,6158,7355,7356,8192,8193,8194,8195,8196,8197,8198,8199,8200,8201,8202,8203,8204,8205,8206,8207,8234,8235,8236,8237,8238,8239,8287,8288,8289,8290,8291,8292,8293,8294,8295,8296,8297,8298,8299,8300,8301,8302,8303,10240,12288,12644,65024,65025,65026,65027,65028,65029,65030,65031,65032,65033,65034,65035,65036,65037,65038,65039,65279,65440,65520,65521,65522,65523,65524,65525,65526,65527,65528,65532,78844,119155,119156,119157,119158,119159,119160,119161,119162,917504,917505,917506,917507,917508,917509,917510,917511,917512,917513,917514,917515,917516,917517,917518,917519,917520,917521,917522,917523,917524,917525,917526,917527,917528,917529,917530,917531,917532,917533,917534,917535,917536,917537,917538,917539,917540,917541,917542,917543,917544,917545,917546,917547,917548,917549,917550,917551,917552,917553,917554,917555,917556,917557,917558,917559,917560,917561,917562,917563,917564,917565,917566,917567,917568,917569,917570,917571,917572,917573,917574,917575,917576,917577,917578,917579,917580,917581,917582,917583,917584,917585,917586,917587,917588,917589,917590,917591,917592,917593,917594,917595,917596,917597,917598,917599,917600,917601,917602,917603,917604,917605,917606,917607,917608,917609,917610,917611,917612,917613,917614,917615,917616,917617,917618,917619,917620,917621,917622,917623,917624,917625,917626,917627,917628,917629,917630,917631,917760,917761,917762,917763,917764,917765,917766,917767,917768,917769,917770,917771,917772,917773,917774,917775,917776,917777,917778,917779,917780,917781,917782,917783,917784,917785,917786,917787,917788,917789,917790,917791,917792,917793,917794,917795,917796,917797,917798,917799,917800,917801,917802,917803,917804,917805,917806,917807,917808,917809,917810,917811,917812,917813,917814,917815,917816,917817,917818,917819,917820,917821,917822,917823,917824,917825,917826,917827,917828,917829,917830,917831,917832,917833,917834,917835,917836,917837,917838,917839,917840,917841,917842,917843,917844,917845,917846,917847,917848,917849,917850,917851,917852,917853,917854,917855,917856,917857,917858,917859,917860,917861,917862,917863,917864,917865,917866,917867,917868,917869,917870,917871,917872,917873,917874,917875,917876,917877,917878,917879,917880,917881,917882,917883,917884,917885,917886,917887,917888,917889,917890,917891,917892,917893,917894,917895,917896,917897,917898,917899,917900,917901,917902,917903,917904,917905,917906,917907,917908,917909,917910,917911,917912,917913,917914,917915,917916,917917,917918,917919,917920,917921,917922,917923,917924,917925,917926,917927,917928,917929,917930,917931,917932,917933,917934,917935,917936,917937,917938,917939,917940,917941,917942,917943,917944,917945,917946,917947,917948,917949,917950,917951,917952,917953,917954,917955,917956,917957,917958,917959,917960,917961,917962,917963,917964,917965,917966,917967,917968,917969,917970,917971,917972,917973,917974,917975,917976,917977,917978,917979,917980,917981,917982,917983,917984,917985,917986,917987,917988,917989,917990,917991,917992,917993,917994,917995,917996,917997,917998,917999]");
  }
  static {
    this._data = void 0;
  }
  static getData() {
    if (!this._data) {
      this._data = new Set(InvisibleCharacters.getRawData());
    }
    return this._data;
  }
  static isInvisibleCharacter(codePoint) {
    return InvisibleCharacters.getData().has(codePoint);
  }
  static containsInvisibleCharacter(str) {
    for (let i = 0; i < str.length; i++) {
      const codePoint = str.codePointAt(i);
      if (typeof codePoint === "number" && InvisibleCharacters.isInvisibleCharacter(codePoint)) {
        return true;
      }
    }
    return false;
  }
  static get codePoints() {
    return InvisibleCharacters.getData();
  }
}

class TextLength {
  constructor(lineCount, columnCount) {
    this.lineCount = lineCount;
    this.columnCount = columnCount;
  }
  static {
    this.zero = new TextLength(0, 0);
  }
  static lengthDiffNonNegative(start, end) {
    if (end.isLessThan(start)) {
      return TextLength.zero;
    }
    if (start.lineCount === end.lineCount) {
      return new TextLength(0, end.columnCount - start.columnCount);
    } else {
      return new TextLength(end.lineCount - start.lineCount, end.columnCount);
    }
  }
  static betweenPositions(position1, position2) {
    if (position1.lineNumber === position2.lineNumber) {
      return new TextLength(0, position2.column - position1.column);
    } else {
      return new TextLength(position2.lineNumber - position1.lineNumber, position2.column - 1);
    }
  }
  static fromPosition(pos) {
    return new TextLength(pos.lineNumber - 1, pos.column - 1);
  }
  static ofRange(range) {
    return TextLength.betweenPositions(range.getStartPosition(), range.getEndPosition());
  }
  static ofText(text) {
    let line = 0;
    let column = 0;
    for (const c of text) {
      if (c === "\n") {
        line++;
        column = 0;
      } else {
        column++;
      }
    }
    return new TextLength(line, column);
  }
  isZero() {
    return this.lineCount === 0 && this.columnCount === 0;
  }
  isLessThan(other) {
    if (this.lineCount !== other.lineCount) {
      return this.lineCount < other.lineCount;
    }
    return this.columnCount < other.columnCount;
  }
  isGreaterThan(other) {
    if (this.lineCount !== other.lineCount) {
      return this.lineCount > other.lineCount;
    }
    return this.columnCount > other.columnCount;
  }
  isGreaterThanOrEqualTo(other) {
    if (this.lineCount !== other.lineCount) {
      return this.lineCount > other.lineCount;
    }
    return this.columnCount >= other.columnCount;
  }
  equals(other) {
    return this.lineCount === other.lineCount && this.columnCount === other.columnCount;
  }
  compare(other) {
    if (this.lineCount !== other.lineCount) {
      return this.lineCount - other.lineCount;
    }
    return this.columnCount - other.columnCount;
  }
  add(other) {
    if (other.lineCount === 0) {
      return new TextLength(this.lineCount, this.columnCount + other.columnCount);
    } else {
      return new TextLength(this.lineCount + other.lineCount, other.columnCount);
    }
  }
  createRange(startPosition) {
    if (this.lineCount === 0) {
      return new Range(startPosition.lineNumber, startPosition.column, startPosition.lineNumber, startPosition.column + this.columnCount);
    } else {
      return new Range(startPosition.lineNumber, startPosition.column, startPosition.lineNumber + this.lineCount, this.columnCount + 1);
    }
  }
  toRange() {
    return new Range(1, 1, this.lineCount + 1, this.columnCount + 1);
  }
  toLineRange() {
    return LineRange.ofLength(1, this.lineCount);
  }
  addToPosition(position) {
    if (this.lineCount === 0) {
      return new Position(position.lineNumber, position.column + this.columnCount);
    } else {
      return new Position(position.lineNumber + this.lineCount, this.columnCount + 1);
    }
  }
  addToRange(range) {
    return Range.fromPositions(
      this.addToPosition(range.getStartPosition()),
      this.addToPosition(range.getEndPosition())
    );
  }
  toString() {
    return `${this.lineCount},${this.columnCount}`;
  }
}

class PositionOffsetTransformer {
  constructor(text) {
    this.text = text;
    this.lineStartOffsetByLineIdx = [];
    this.lineEndOffsetByLineIdx = [];
    this.lineStartOffsetByLineIdx.push(0);
    for (let i = 0; i < text.length; i++) {
      if (text.charAt(i) === "\n") {
        this.lineStartOffsetByLineIdx.push(i + 1);
        if (i > 0 && text.charAt(i - 1) === "\r") {
          this.lineEndOffsetByLineIdx.push(i - 1);
        } else {
          this.lineEndOffsetByLineIdx.push(i);
        }
      }
    }
    this.lineEndOffsetByLineIdx.push(text.length);
  }
  getOffset(position) {
    return this.lineStartOffsetByLineIdx[position.lineNumber - 1] + position.column - 1;
  }
  getOffsetRange(range) {
    return new OffsetRange(
      this.getOffset(range.getStartPosition()),
      this.getOffset(range.getEndPosition())
    );
  }
  getPosition(offset) {
    const idx = findLastIdxMonotonous(this.lineStartOffsetByLineIdx, (i) => i <= offset);
    const lineNumber = idx + 1;
    const column = offset - this.lineStartOffsetByLineIdx[idx] + 1;
    return new Position(lineNumber, column);
  }
  getRange(offsetRange) {
    return Range.fromPositions(
      this.getPosition(offsetRange.start),
      this.getPosition(offsetRange.endExclusive)
    );
  }
  getTextLength(offsetRange) {
    return TextLength.ofRange(this.getRange(offsetRange));
  }
  get textLength() {
    const lineIdx = this.lineStartOffsetByLineIdx.length - 1;
    return new TextLength(lineIdx, this.text.length - this.lineStartOffsetByLineIdx[lineIdx]);
  }
  getLineLength(lineNumber) {
    return this.lineEndOffsetByLineIdx[lineNumber - 1] - this.lineStartOffsetByLineIdx[lineNumber - 1];
  }
}

class AbstractText {
  constructor() {
    this._transformer = void 0;
  }
  get endPositionExclusive() {
    return this.length.addToPosition(new Position(1, 1));
  }
  get lineRange() {
    return this.length.toLineRange();
  }
  getValue() {
    return this.getValueOfRange(this.length.toRange());
  }
  getLineLength(lineNumber) {
    return this.getValueOfRange(new Range(lineNumber, 1, lineNumber, Number.MAX_SAFE_INTEGER)).length;
  }
  getTransformer() {
    if (!this._transformer) {
      this._transformer = new PositionOffsetTransformer(this.getValue());
    }
    return this._transformer;
  }
  getLineAt(lineNumber) {
    return this.getValueOfRange(new Range(lineNumber, 1, lineNumber, Number.MAX_SAFE_INTEGER));
  }
  getLines() {
    const value = this.getValue();
    return splitLines(value);
  }
}
class LineBasedText extends AbstractText {
  constructor(_getLineContent, _lineCount) {
    assert(_lineCount >= 1);
    super();
    this._getLineContent = _getLineContent;
    this._lineCount = _lineCount;
  }
  getValueOfRange(range) {
    if (range.startLineNumber === range.endLineNumber) {
      return this._getLineContent(range.startLineNumber).substring(range.startColumn - 1, range.endColumn - 1);
    }
    let result = this._getLineContent(range.startLineNumber).substring(range.startColumn - 1);
    for (let i = range.startLineNumber + 1; i < range.endLineNumber; i++) {
      result += "\n" + this._getLineContent(i);
    }
    result += "\n" + this._getLineContent(range.endLineNumber).substring(0, range.endColumn - 1);
    return result;
  }
  getLineLength(lineNumber) {
    return this._getLineContent(lineNumber).length;
  }
  get length() {
    const lastLine = this._getLineContent(this._lineCount);
    return new TextLength(this._lineCount - 1, lastLine.length);
  }
}
class ArrayText extends LineBasedText {
  constructor(lines) {
    super(
      (lineNumber) => lines[lineNumber - 1],
      lines.length
    );
  }
}

class LinesDiff {
  constructor(changes, moves, hitTimeout) {
    this.changes = changes;
    this.moves = moves;
    this.hitTimeout = hitTimeout;
  }
}
class MovedText {
  constructor(lineRangeMapping, changes) {
    this.lineRangeMapping = lineRangeMapping;
    this.changes = changes;
  }
  flip() {
    return new MovedText(this.lineRangeMapping.flip(), this.changes.map((c) => c.flip()));
  }
}

class LineRangeMapping {
  static inverse(mapping, originalLineCount, modifiedLineCount) {
    const result = [];
    let lastOriginalEndLineNumber = 1;
    let lastModifiedEndLineNumber = 1;
    for (const m of mapping) {
      const r2 = new LineRangeMapping(
        new LineRange(lastOriginalEndLineNumber, m.original.startLineNumber),
        new LineRange(lastModifiedEndLineNumber, m.modified.startLineNumber)
      );
      if (!r2.modified.isEmpty) {
        result.push(r2);
      }
      lastOriginalEndLineNumber = m.original.endLineNumberExclusive;
      lastModifiedEndLineNumber = m.modified.endLineNumberExclusive;
    }
    const r = new LineRangeMapping(
      new LineRange(lastOriginalEndLineNumber, originalLineCount + 1),
      new LineRange(lastModifiedEndLineNumber, modifiedLineCount + 1)
    );
    if (!r.modified.isEmpty) {
      result.push(r);
    }
    return result;
  }
  static clip(mapping, originalRange, modifiedRange) {
    const result = [];
    for (const m of mapping) {
      const original = m.original.intersect(originalRange);
      const modified = m.modified.intersect(modifiedRange);
      if (original && !original.isEmpty && modified && !modified.isEmpty) {
        result.push(new LineRangeMapping(original, modified));
      }
    }
    return result;
  }
  constructor(originalRange, modifiedRange) {
    this.original = originalRange;
    this.modified = modifiedRange;
  }
  toString() {
    return `{${this.original.toString()}->${this.modified.toString()}}`;
  }
  flip() {
    return new LineRangeMapping(this.modified, this.original);
  }
  join(other) {
    return new LineRangeMapping(
      this.original.join(other.original),
      this.modified.join(other.modified)
    );
  }
  get changedLineCount() {
    return Math.max(this.original.length, this.modified.length);
  }
  /**
   * This method assumes that the LineRangeMapping describes a valid diff!
   * I.e. if one range is empty, the other range cannot be the entire document.
   * It avoids various problems when the line range points to non-existing line-numbers.
  */
  toRangeMapping() {
    const origInclusiveRange = this.original.toInclusiveRange();
    const modInclusiveRange = this.modified.toInclusiveRange();
    if (origInclusiveRange && modInclusiveRange) {
      return new RangeMapping(origInclusiveRange, modInclusiveRange);
    } else if (this.original.startLineNumber === 1 || this.modified.startLineNumber === 1) {
      if (!(this.modified.startLineNumber === 1 && this.original.startLineNumber === 1)) {
        throw new BugIndicatingError("not a valid diff");
      }
      return new RangeMapping(
        new Range(this.original.startLineNumber, 1, this.original.endLineNumberExclusive, 1),
        new Range(this.modified.startLineNumber, 1, this.modified.endLineNumberExclusive, 1)
      );
    } else {
      return new RangeMapping(
        new Range(this.original.startLineNumber - 1, Number.MAX_SAFE_INTEGER, this.original.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER),
        new Range(this.modified.startLineNumber - 1, Number.MAX_SAFE_INTEGER, this.modified.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER)
      );
    }
  }
  /**
   * This method assumes that the LineRangeMapping describes a valid diff!
   * I.e. if one range is empty, the other range cannot be the entire document.
   * It avoids various problems when the line range points to non-existing line-numbers.
  */
  toRangeMapping2(original, modified) {
    if (isValidLineNumber(this.original.endLineNumberExclusive, original) && isValidLineNumber(this.modified.endLineNumberExclusive, modified)) {
      return new RangeMapping(
        new Range(this.original.startLineNumber, 1, this.original.endLineNumberExclusive, 1),
        new Range(this.modified.startLineNumber, 1, this.modified.endLineNumberExclusive, 1)
      );
    }
    if (!this.original.isEmpty && !this.modified.isEmpty) {
      return new RangeMapping(
        Range.fromPositions(
          new Position(this.original.startLineNumber, 1),
          normalizePosition(new Position(this.original.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER), original)
        ),
        Range.fromPositions(
          new Position(this.modified.startLineNumber, 1),
          normalizePosition(new Position(this.modified.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER), modified)
        )
      );
    }
    if (this.original.startLineNumber > 1 && this.modified.startLineNumber > 1) {
      return new RangeMapping(
        Range.fromPositions(
          normalizePosition(new Position(this.original.startLineNumber - 1, Number.MAX_SAFE_INTEGER), original),
          normalizePosition(new Position(this.original.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER), original)
        ),
        Range.fromPositions(
          normalizePosition(new Position(this.modified.startLineNumber - 1, Number.MAX_SAFE_INTEGER), modified),
          normalizePosition(new Position(this.modified.endLineNumberExclusive - 1, Number.MAX_SAFE_INTEGER), modified)
        )
      );
    }
    throw new BugIndicatingError();
  }
}
function normalizePosition(position, content) {
  if (position.lineNumber < 1) {
    return new Position(1, 1);
  }
  if (position.lineNumber > content.length) {
    return new Position(content.length, content[content.length - 1].length + 1);
  }
  const line = content[position.lineNumber - 1];
  if (position.column > line.length + 1) {
    return new Position(position.lineNumber, line.length + 1);
  }
  return position;
}
function isValidLineNumber(lineNumber, lines) {
  return lineNumber >= 1 && lineNumber <= lines.length;
}
class DetailedLineRangeMapping extends LineRangeMapping {
  static fromRangeMappings(rangeMappings) {
    const originalRange = LineRange.join(rangeMappings.map((r) => LineRange.fromRangeInclusive(r.originalRange)));
    const modifiedRange = LineRange.join(rangeMappings.map((r) => LineRange.fromRangeInclusive(r.modifiedRange)));
    return new DetailedLineRangeMapping(originalRange, modifiedRange, rangeMappings);
  }
  constructor(originalRange, modifiedRange, innerChanges) {
    super(originalRange, modifiedRange);
    this.innerChanges = innerChanges;
  }
  flip() {
    return new DetailedLineRangeMapping(this.modified, this.original, this.innerChanges?.map((c) => c.flip()));
  }
  withInnerChangesFromLineRanges() {
    return new DetailedLineRangeMapping(this.original, this.modified, [this.toRangeMapping()]);
  }
}
class RangeMapping {
  static fromEdit(edit) {
    const newRanges = edit.getNewRanges();
    const result = edit.edits.map((e, idx) => new RangeMapping(e.range, newRanges[idx]));
    return result;
  }
  static fromEditJoin(edit) {
    const newRanges = edit.getNewRanges();
    const result = edit.edits.map((e, idx) => new RangeMapping(e.range, newRanges[idx]));
    return RangeMapping.join(result);
  }
  static join(rangeMappings) {
    if (rangeMappings.length === 0) {
      throw new BugIndicatingError("Cannot join an empty list of range mappings");
    }
    let result = rangeMappings[0];
    for (let i = 1; i < rangeMappings.length; i++) {
      result = result.join(rangeMappings[i]);
    }
    return result;
  }
  static assertSorted(rangeMappings) {
    for (let i = 1; i < rangeMappings.length; i++) {
      const previous = rangeMappings[i - 1];
      const current = rangeMappings[i];
      if (!(previous.originalRange.getEndPosition().isBeforeOrEqual(current.originalRange.getStartPosition()) && previous.modifiedRange.getEndPosition().isBeforeOrEqual(current.modifiedRange.getStartPosition()))) {
        throw new BugIndicatingError("Range mappings must be sorted");
      }
    }
  }
  constructor(originalRange, modifiedRange) {
    this.originalRange = originalRange;
    this.modifiedRange = modifiedRange;
  }
  toString() {
    return `{${this.originalRange.toString()}->${this.modifiedRange.toString()}}`;
  }
  flip() {
    return new RangeMapping(this.modifiedRange, this.originalRange);
  }
  /**
   * Creates a single text edit that describes the change from the original to the modified text.
  */
  join(other) {
    return new RangeMapping(
      this.originalRange.plusRange(other.originalRange),
      this.modifiedRange.plusRange(other.modifiedRange)
    );
  }
}
function lineRangeMappingFromRangeMappings(alignments, originalLines, modifiedLines, dontAssertStartLine = false) {
  const changes = [];
  for (const g of groupAdjacentBy(
    alignments.map((a) => getLineRangeMapping(a, originalLines, modifiedLines)),
    (a1, a2) => a1.original.overlapOrTouch(a2.original) || a1.modified.overlapOrTouch(a2.modified)
  )) {
    const first = g[0];
    const last = g[g.length - 1];
    changes.push(new DetailedLineRangeMapping(
      first.original.join(last.original),
      first.modified.join(last.modified),
      g.map((a) => a.innerChanges[0])
    ));
  }
  assertFn(() => {
    if (!dontAssertStartLine && changes.length > 0) {
      if (changes[0].modified.startLineNumber !== changes[0].original.startLineNumber) {
        return false;
      }
      if (modifiedLines.length.lineCount - changes[changes.length - 1].modified.endLineNumberExclusive !== originalLines.length.lineCount - changes[changes.length - 1].original.endLineNumberExclusive) {
        return false;
      }
    }
    return checkAdjacentItems(
      changes,
      (m1, m2) => m2.original.startLineNumber - m1.original.endLineNumberExclusive === m2.modified.startLineNumber - m1.modified.endLineNumberExclusive && // There has to be an unchanged line in between (otherwise both diffs should have been joined)
      m1.original.endLineNumberExclusive < m2.original.startLineNumber && m1.modified.endLineNumberExclusive < m2.modified.startLineNumber
    );
  });
  return changes;
}
function getLineRangeMapping(rangeMapping, originalLines, modifiedLines) {
  let lineStartDelta = 0;
  let lineEndDelta = 0;
  if (rangeMapping.modifiedRange.endColumn === 1 && rangeMapping.originalRange.endColumn === 1 && rangeMapping.originalRange.startLineNumber + lineStartDelta <= rangeMapping.originalRange.endLineNumber && rangeMapping.modifiedRange.startLineNumber + lineStartDelta <= rangeMapping.modifiedRange.endLineNumber) {
    lineEndDelta = -1;
  }
  if (rangeMapping.modifiedRange.startColumn - 1 >= modifiedLines.getLineLength(rangeMapping.modifiedRange.startLineNumber) && rangeMapping.originalRange.startColumn - 1 >= originalLines.getLineLength(rangeMapping.originalRange.startLineNumber) && rangeMapping.originalRange.startLineNumber <= rangeMapping.originalRange.endLineNumber + lineEndDelta && rangeMapping.modifiedRange.startLineNumber <= rangeMapping.modifiedRange.endLineNumber + lineEndDelta) {
    lineStartDelta = 1;
  }
  const originalLineRange = new LineRange(
    rangeMapping.originalRange.startLineNumber + lineStartDelta,
    rangeMapping.originalRange.endLineNumber + 1 + lineEndDelta
  );
  const modifiedLineRange = new LineRange(
    rangeMapping.modifiedRange.startLineNumber + lineStartDelta,
    rangeMapping.modifiedRange.endLineNumber + 1 + lineEndDelta
  );
  return new DetailedLineRangeMapping(originalLineRange, modifiedLineRange, [rangeMapping]);
}

class DiffAlgorithmResult {
  constructor(diffs, hitTimeout) {
    this.diffs = diffs;
    this.hitTimeout = hitTimeout;
  }
  static trivial(seq1, seq2) {
    return new DiffAlgorithmResult([new SequenceDiff(OffsetRange.ofLength(seq1.length), OffsetRange.ofLength(seq2.length))], false);
  }
  static trivialTimedOut(seq1, seq2) {
    return new DiffAlgorithmResult([new SequenceDiff(OffsetRange.ofLength(seq1.length), OffsetRange.ofLength(seq2.length))], true);
  }
}
class SequenceDiff {
  constructor(seq1Range, seq2Range) {
    this.seq1Range = seq1Range;
    this.seq2Range = seq2Range;
  }
  static invert(sequenceDiffs, doc1Length) {
    const result = [];
    forEachAdjacent(sequenceDiffs, (a, b) => {
      result.push(SequenceDiff.fromOffsetPairs(
        a ? a.getEndExclusives() : OffsetPair.zero,
        b ? b.getStarts() : new OffsetPair(doc1Length, (a ? a.seq2Range.endExclusive - a.seq1Range.endExclusive : 0) + doc1Length)
      ));
    });
    return result;
  }
  static fromOffsetPairs(start, endExclusive) {
    return new SequenceDiff(
      new OffsetRange(start.offset1, endExclusive.offset1),
      new OffsetRange(start.offset2, endExclusive.offset2)
    );
  }
  static assertSorted(sequenceDiffs) {
    let last = void 0;
    for (const cur of sequenceDiffs) {
      if (last) {
        if (!(last.seq1Range.endExclusive <= cur.seq1Range.start && last.seq2Range.endExclusive <= cur.seq2Range.start)) {
          throw new BugIndicatingError("Sequence diffs must be sorted");
        }
      }
      last = cur;
    }
  }
  swap() {
    return new SequenceDiff(this.seq2Range, this.seq1Range);
  }
  toString() {
    return `${this.seq1Range} <-> ${this.seq2Range}`;
  }
  join(other) {
    return new SequenceDiff(this.seq1Range.join(other.seq1Range), this.seq2Range.join(other.seq2Range));
  }
  delta(offset) {
    if (offset === 0) {
      return this;
    }
    return new SequenceDiff(this.seq1Range.delta(offset), this.seq2Range.delta(offset));
  }
  deltaStart(offset) {
    if (offset === 0) {
      return this;
    }
    return new SequenceDiff(this.seq1Range.deltaStart(offset), this.seq2Range.deltaStart(offset));
  }
  deltaEnd(offset) {
    if (offset === 0) {
      return this;
    }
    return new SequenceDiff(this.seq1Range.deltaEnd(offset), this.seq2Range.deltaEnd(offset));
  }
  intersectsOrTouches(other) {
    return this.seq1Range.intersectsOrTouches(other.seq1Range) || this.seq2Range.intersectsOrTouches(other.seq2Range);
  }
  intersect(other) {
    const i1 = this.seq1Range.intersect(other.seq1Range);
    const i2 = this.seq2Range.intersect(other.seq2Range);
    if (!i1 || !i2) {
      return void 0;
    }
    return new SequenceDiff(i1, i2);
  }
  getStarts() {
    return new OffsetPair(this.seq1Range.start, this.seq2Range.start);
  }
  getEndExclusives() {
    return new OffsetPair(this.seq1Range.endExclusive, this.seq2Range.endExclusive);
  }
}
class OffsetPair {
  constructor(offset1, offset2) {
    this.offset1 = offset1;
    this.offset2 = offset2;
  }
  static {
    this.zero = new OffsetPair(0, 0);
  }
  static {
    this.max = new OffsetPair(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
  }
  toString() {
    return `${this.offset1} <-> ${this.offset2}`;
  }
  delta(offset) {
    if (offset === 0) {
      return this;
    }
    return new OffsetPair(this.offset1 + offset, this.offset2 + offset);
  }
  equals(other) {
    return this.offset1 === other.offset1 && this.offset2 === other.offset2;
  }
}
class InfiniteTimeout {
  static {
    this.instance = new InfiniteTimeout();
  }
  isValid() {
    return true;
  }
}
class DateTimeout {
  constructor(timeout) {
    this.timeout = timeout;
    this.startTime = Date.now();
    this.valid = true;
    if (timeout <= 0) {
      throw new BugIndicatingError("timeout must be positive");
    }
  }
  // Recommendation: Set a log-point `{this.disable()}` in the body
  isValid() {
    const valid = Date.now() - this.startTime < this.timeout;
    if (!valid && this.valid) {
      this.valid = false;
    }
    return this.valid;
  }
  disable() {
    this.timeout = Number.MAX_SAFE_INTEGER;
    this.isValid = () => true;
    this.valid = true;
  }
}

class Array2D {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.array = [];
    this.array = new Array(width * height);
  }
  get(x, y) {
    return this.array[x + y * this.width];
  }
  set(x, y, value) {
    this.array[x + y * this.width] = value;
  }
}
function isSpace(charCode) {
  return charCode === 32 || charCode === 9;
}
class LineRangeFragment {
  constructor(range, lines, source) {
    this.range = range;
    this.lines = lines;
    this.source = source;
    this.histogram = [];
    let counter = 0;
    for (let i = range.startLineNumber - 1; i < range.endLineNumberExclusive - 1; i++) {
      const line = lines[i];
      for (let j = 0; j < line.length; j++) {
        counter++;
        const chr = line[j];
        const key2 = LineRangeFragment.getKey(chr);
        this.histogram[key2] = (this.histogram[key2] || 0) + 1;
      }
      counter++;
      const key = LineRangeFragment.getKey("\n");
      this.histogram[key] = (this.histogram[key] || 0) + 1;
    }
    this.totalCount = counter;
  }
  static {
    this.chrKeys = /* @__PURE__ */ new Map();
  }
  static getKey(chr) {
    let key = this.chrKeys.get(chr);
    if (key === void 0) {
      key = this.chrKeys.size;
      this.chrKeys.set(chr, key);
    }
    return key;
  }
  computeSimilarity(other) {
    let sumDifferences = 0;
    const maxLength = Math.max(this.histogram.length, other.histogram.length);
    for (let i = 0; i < maxLength; i++) {
      sumDifferences += Math.abs((this.histogram[i] ?? 0) - (other.histogram[i] ?? 0));
    }
    return 1 - sumDifferences / (this.totalCount + other.totalCount);
  }
}

class DynamicProgrammingDiffing {
  compute(sequence1, sequence2, timeout = InfiniteTimeout.instance, equalityScore) {
    if (sequence1.length === 0 || sequence2.length === 0) {
      return DiffAlgorithmResult.trivial(sequence1, sequence2);
    }
    const lcsLengths = new Array2D(sequence1.length, sequence2.length);
    const directions = new Array2D(sequence1.length, sequence2.length);
    const lengths = new Array2D(sequence1.length, sequence2.length);
    for (let s12 = 0; s12 < sequence1.length; s12++) {
      for (let s22 = 0; s22 < sequence2.length; s22++) {
        if (!timeout.isValid()) {
          return DiffAlgorithmResult.trivialTimedOut(sequence1, sequence2);
        }
        const horizontalLen = s12 === 0 ? 0 : lcsLengths.get(s12 - 1, s22);
        const verticalLen = s22 === 0 ? 0 : lcsLengths.get(s12, s22 - 1);
        let extendedSeqScore;
        if (sequence1.getElement(s12) === sequence2.getElement(s22)) {
          if (s12 === 0 || s22 === 0) {
            extendedSeqScore = 0;
          } else {
            extendedSeqScore = lcsLengths.get(s12 - 1, s22 - 1);
          }
          if (s12 > 0 && s22 > 0 && directions.get(s12 - 1, s22 - 1) === 3) {
            extendedSeqScore += lengths.get(s12 - 1, s22 - 1);
          }
          extendedSeqScore += equalityScore ? equalityScore(s12, s22) : 1;
        } else {
          extendedSeqScore = -1;
        }
        const newValue = Math.max(horizontalLen, verticalLen, extendedSeqScore);
        if (newValue === extendedSeqScore) {
          const prevLen = s12 > 0 && s22 > 0 ? lengths.get(s12 - 1, s22 - 1) : 0;
          lengths.set(s12, s22, prevLen + 1);
          directions.set(s12, s22, 3);
        } else if (newValue === horizontalLen) {
          lengths.set(s12, s22, 0);
          directions.set(s12, s22, 1);
        } else if (newValue === verticalLen) {
          lengths.set(s12, s22, 0);
          directions.set(s12, s22, 2);
        }
        lcsLengths.set(s12, s22, newValue);
      }
    }
    const result = [];
    let lastAligningPosS1 = sequence1.length;
    let lastAligningPosS2 = sequence2.length;
    function reportDecreasingAligningPositions(s12, s22) {
      if (s12 + 1 !== lastAligningPosS1 || s22 + 1 !== lastAligningPosS2) {
        result.push(new SequenceDiff(
          new OffsetRange(s12 + 1, lastAligningPosS1),
          new OffsetRange(s22 + 1, lastAligningPosS2)
        ));
      }
      lastAligningPosS1 = s12;
      lastAligningPosS2 = s22;
    }
    let s1 = sequence1.length - 1;
    let s2 = sequence2.length - 1;
    while (s1 >= 0 && s2 >= 0) {
      if (directions.get(s1, s2) === 3) {
        reportDecreasingAligningPositions(s1, s2);
        s1--;
        s2--;
      } else {
        if (directions.get(s1, s2) === 1) {
          s1--;
        } else {
          s2--;
        }
      }
    }
    reportDecreasingAligningPositions(-1, -1);
    result.reverse();
    return new DiffAlgorithmResult(result, false);
  }
}

class MyersDiffAlgorithm {
  compute(seq1, seq2, timeout = InfiniteTimeout.instance) {
    if (seq1.length === 0 || seq2.length === 0) {
      return DiffAlgorithmResult.trivial(seq1, seq2);
    }
    const seqX = seq1;
    const seqY = seq2;
    function getXAfterSnake(x, y) {
      while (x < seqX.length && y < seqY.length && seqX.getElement(x) === seqY.getElement(y)) {
        x++;
        y++;
      }
      return x;
    }
    let d = 0;
    const V = new FastInt32Array();
    V.set(0, getXAfterSnake(0, 0));
    const paths = new FastArrayNegativeIndices();
    paths.set(0, V.get(0) === 0 ? null : new SnakePath(null, 0, 0, V.get(0)));
    let k = 0;
    loop: while (true) {
      d++;
      if (!timeout.isValid()) {
        return DiffAlgorithmResult.trivialTimedOut(seqX, seqY);
      }
      const lowerBound = -Math.min(d, seqY.length + d % 2);
      const upperBound = Math.min(d, seqX.length + d % 2);
      for (k = lowerBound; k <= upperBound; k += 2) {
        const maxXofDLineTop = k === upperBound ? -1 : V.get(k + 1);
        const maxXofDLineLeft = k === lowerBound ? -1 : V.get(k - 1) + 1;
        const x = Math.min(Math.max(maxXofDLineTop, maxXofDLineLeft), seqX.length);
        const y = x - k;
        if (x > seqX.length || y > seqY.length) {
          continue;
        }
        const newMaxX = getXAfterSnake(x, y);
        V.set(k, newMaxX);
        const lastPath = x === maxXofDLineTop ? paths.get(k + 1) : paths.get(k - 1);
        paths.set(k, newMaxX !== x ? new SnakePath(lastPath, x, y, newMaxX - x) : lastPath);
        if (V.get(k) === seqX.length && V.get(k) - k === seqY.length) {
          break loop;
        }
      }
    }
    let path = paths.get(k);
    const result = [];
    let lastAligningPosS1 = seqX.length;
    let lastAligningPosS2 = seqY.length;
    while (true) {
      const endX = path ? path.x + path.length : 0;
      const endY = path ? path.y + path.length : 0;
      if (endX !== lastAligningPosS1 || endY !== lastAligningPosS2) {
        result.push(new SequenceDiff(
          new OffsetRange(endX, lastAligningPosS1),
          new OffsetRange(endY, lastAligningPosS2)
        ));
      }
      if (!path) {
        break;
      }
      lastAligningPosS1 = path.x;
      lastAligningPosS2 = path.y;
      path = path.prev;
    }
    result.reverse();
    return new DiffAlgorithmResult(result, false);
  }
}
class SnakePath {
  constructor(prev, x, y, length) {
    this.prev = prev;
    this.x = x;
    this.y = y;
    this.length = length;
  }
}
class FastInt32Array {
  constructor() {
    this.positiveArr = new Int32Array(10);
    this.negativeArr = new Int32Array(10);
  }
  get(idx) {
    if (idx < 0) {
      idx = -idx - 1;
      return this.negativeArr[idx];
    } else {
      return this.positiveArr[idx];
    }
  }
  set(idx, value) {
    if (idx < 0) {
      idx = -idx - 1;
      if (idx >= this.negativeArr.length) {
        const arr = this.negativeArr;
        this.negativeArr = new Int32Array(arr.length * 2);
        this.negativeArr.set(arr);
      }
      this.negativeArr[idx] = value;
    } else {
      if (idx >= this.positiveArr.length) {
        const arr = this.positiveArr;
        this.positiveArr = new Int32Array(arr.length * 2);
        this.positiveArr.set(arr);
      }
      this.positiveArr[idx] = value;
    }
  }
}
class FastArrayNegativeIndices {
  constructor() {
    this.positiveArr = [];
    this.negativeArr = [];
  }
  get(idx) {
    if (idx < 0) {
      idx = -idx - 1;
      return this.negativeArr[idx];
    } else {
      return this.positiveArr[idx];
    }
  }
  set(idx, value) {
    if (idx < 0) {
      idx = -idx - 1;
      this.negativeArr[idx] = value;
    } else {
      this.positiveArr[idx] = value;
    }
  }
}

class LinesSliceCharSequence {
  constructor(lines, range, considerWhitespaceChanges) {
    this.lines = lines;
    this.range = range;
    this.considerWhitespaceChanges = considerWhitespaceChanges;
    this.elements = [];
    this.firstElementOffsetByLineIdx = [];
    this.lineStartOffsets = [];
    this.trimmedWsLengthsByLineIdx = [];
    this.firstElementOffsetByLineIdx.push(0);
    for (let lineNumber = this.range.startLineNumber; lineNumber <= this.range.endLineNumber; lineNumber++) {
      let line = lines[lineNumber - 1];
      let lineStartOffset = 0;
      if (lineNumber === this.range.startLineNumber && this.range.startColumn > 1) {
        lineStartOffset = this.range.startColumn - 1;
        line = line.substring(lineStartOffset);
      }
      this.lineStartOffsets.push(lineStartOffset);
      let trimmedWsLength = 0;
      if (!considerWhitespaceChanges) {
        const trimmedStartLine = line.trimStart();
        trimmedWsLength = line.length - trimmedStartLine.length;
        line = trimmedStartLine.trimEnd();
      }
      this.trimmedWsLengthsByLineIdx.push(trimmedWsLength);
      const lineLength = lineNumber === this.range.endLineNumber ? Math.min(this.range.endColumn - 1 - lineStartOffset - trimmedWsLength, line.length) : line.length;
      for (let i = 0; i < lineLength; i++) {
        this.elements.push(line.charCodeAt(i));
      }
      if (lineNumber < this.range.endLineNumber) {
        this.elements.push("\n".charCodeAt(0));
        this.firstElementOffsetByLineIdx.push(this.elements.length);
      }
    }
  }
  toString() {
    return `Slice: "${this.text}"`;
  }
  get text() {
    return this.getText(new OffsetRange(0, this.length));
  }
  getText(range) {
    return this.elements.slice(range.start, range.endExclusive).map((e) => String.fromCharCode(e)).join("");
  }
  getElement(offset) {
    return this.elements[offset];
  }
  get length() {
    return this.elements.length;
  }
  getBoundaryScore(length) {
    const prevCategory = getCategory(length > 0 ? this.elements[length - 1] : -1);
    const nextCategory = getCategory(length < this.elements.length ? this.elements[length] : -1);
    if (prevCategory === 7 /* LineBreakCR */ && nextCategory === 8 /* LineBreakLF */) {
      return 0;
    }
    if (prevCategory === 8 /* LineBreakLF */) {
      return 150;
    }
    let score2 = 0;
    if (prevCategory !== nextCategory) {
      score2 += 10;
      if (prevCategory === 0 /* WordLower */ && nextCategory === 1 /* WordUpper */) {
        score2 += 1;
      }
    }
    score2 += getCategoryBoundaryScore(prevCategory);
    score2 += getCategoryBoundaryScore(nextCategory);
    return score2;
  }
  translateOffset(offset, preference = "right") {
    const i = findLastIdxMonotonous(this.firstElementOffsetByLineIdx, (value) => value <= offset);
    const lineOffset = offset - this.firstElementOffsetByLineIdx[i];
    return new Position(
      this.range.startLineNumber + i,
      1 + this.lineStartOffsets[i] + lineOffset + (lineOffset === 0 && preference === "left" ? 0 : this.trimmedWsLengthsByLineIdx[i])
    );
  }
  translateRange(range) {
    const pos1 = this.translateOffset(range.start, "right");
    const pos2 = this.translateOffset(range.endExclusive, "left");
    if (pos2.isBefore(pos1)) {
      return Range.fromPositions(pos2, pos2);
    }
    return Range.fromPositions(pos1, pos2);
  }
  /**
   * Finds the word that contains the character at the given offset
   */
  findWordContaining(offset) {
    if (offset < 0 || offset >= this.elements.length) {
      return void 0;
    }
    if (!isWordChar(this.elements[offset])) {
      return void 0;
    }
    let start = offset;
    while (start > 0 && isWordChar(this.elements[start - 1])) {
      start--;
    }
    let end = offset;
    while (end < this.elements.length && isWordChar(this.elements[end])) {
      end++;
    }
    return new OffsetRange(start, end);
  }
  /** fooBar has the two sub-words foo and bar */
  findSubWordContaining(offset) {
    if (offset < 0 || offset >= this.elements.length) {
      return void 0;
    }
    if (!isWordChar(this.elements[offset])) {
      return void 0;
    }
    let start = offset;
    while (start > 0 && isWordChar(this.elements[start - 1]) && !isUpperCase(this.elements[start])) {
      start--;
    }
    let end = offset;
    while (end < this.elements.length && isWordChar(this.elements[end]) && !isUpperCase(this.elements[end])) {
      end++;
    }
    return new OffsetRange(start, end);
  }
  countLinesIn(range) {
    return this.translateOffset(range.endExclusive).lineNumber - this.translateOffset(range.start).lineNumber;
  }
  isStronglyEqual(offset1, offset2) {
    return this.elements[offset1] === this.elements[offset2];
  }
  extendToFullLines(range) {
    const start = findLastMonotonous(this.firstElementOffsetByLineIdx, (x) => x <= range.start) ?? 0;
    const end = findFirstMonotonous(this.firstElementOffsetByLineIdx, (x) => range.endExclusive <= x) ?? this.elements.length;
    return new OffsetRange(start, end);
  }
}
function isWordChar(charCode) {
  return charCode >= 97 && charCode <= 122 || charCode >= 65 && charCode <= 90 || charCode >= 48 && charCode <= 57;
}
function isUpperCase(charCode) {
  return charCode >= 65 && charCode <= 90;
}
const score = {
  [0 /* WordLower */]: 0,
  [1 /* WordUpper */]: 0,
  [2 /* WordNumber */]: 0,
  [3 /* End */]: 10,
  [4 /* Other */]: 2,
  [5 /* Separator */]: 30,
  [6 /* Space */]: 3,
  [7 /* LineBreakCR */]: 10,
  [8 /* LineBreakLF */]: 10
};
function getCategoryBoundaryScore(category) {
  return score[category];
}
function getCategory(charCode) {
  if (charCode === 10) {
    return 8 /* LineBreakLF */;
  } else if (charCode === 13) {
    return 7 /* LineBreakCR */;
  } else if (isSpace(charCode)) {
    return 6 /* Space */;
  } else if (charCode >= 97 && charCode <= 122) {
    return 0 /* WordLower */;
  } else if (charCode >= 65 && charCode <= 90) {
    return 1 /* WordUpper */;
  } else if (charCode >= 48 && charCode <= 57) {
    return 2 /* WordNumber */;
  } else if (charCode === -1) {
    return 3 /* End */;
  } else if (charCode === 44 || charCode === 59) {
    return 5 /* Separator */;
  } else {
    return 4 /* Other */;
  }
}

function computeMovedLines(changes, originalLines, modifiedLines, hashedOriginalLines, hashedModifiedLines, timeout) {
  let { moves, excludedChanges } = computeMovesFromSimpleDeletionsToSimpleInsertions(changes, originalLines, modifiedLines, timeout);
  if (!timeout.isValid()) {
    return [];
  }
  const filteredChanges = changes.filter((c) => !excludedChanges.has(c));
  const unchangedMoves = computeUnchangedMoves(filteredChanges, hashedOriginalLines, hashedModifiedLines, originalLines, modifiedLines, timeout);
  pushMany(moves, unchangedMoves);
  moves = joinCloseConsecutiveMoves(moves);
  moves = moves.filter((current) => {
    const lines = current.original.toOffsetRange().slice(originalLines).map((l) => l.trim());
    const originalText = lines.join("\n");
    return originalText.length >= 15 && countWhere(lines, (l) => l.length >= 2) >= 2;
  });
  moves = removeMovesInSameDiff(changes, moves);
  return moves;
}
function countWhere(arr, predicate) {
  let count = 0;
  for (const t of arr) {
    if (predicate(t)) {
      count++;
    }
  }
  return count;
}
function computeMovesFromSimpleDeletionsToSimpleInsertions(changes, originalLines, modifiedLines, timeout) {
  const moves = [];
  const deletions = changes.filter((c) => c.modified.isEmpty && c.original.length >= 3).map((d) => new LineRangeFragment(d.original, originalLines, d));
  const insertions = new Set(changes.filter((c) => c.original.isEmpty && c.modified.length >= 3).map((d) => new LineRangeFragment(d.modified, modifiedLines, d)));
  const excludedChanges = /* @__PURE__ */ new Set();
  for (const deletion of deletions) {
    let highestSimilarity = -1;
    let best;
    for (const insertion of insertions) {
      const similarity = deletion.computeSimilarity(insertion);
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        best = insertion;
      }
    }
    if (highestSimilarity > 0.9 && best) {
      insertions.delete(best);
      moves.push(new LineRangeMapping(deletion.range, best.range));
      excludedChanges.add(deletion.source);
      excludedChanges.add(best.source);
    }
    if (!timeout.isValid()) {
      return { moves, excludedChanges };
    }
  }
  return { moves, excludedChanges };
}
function computeUnchangedMoves(changes, hashedOriginalLines, hashedModifiedLines, originalLines, modifiedLines, timeout) {
  const moves = [];
  const original3LineHashes = new SetMap();
  for (const change of changes) {
    for (let i = change.original.startLineNumber; i < change.original.endLineNumberExclusive - 2; i++) {
      const key = `${hashedOriginalLines[i - 1]}:${hashedOriginalLines[i + 1 - 1]}:${hashedOriginalLines[i + 2 - 1]}`;
      original3LineHashes.add(key, { range: new LineRange(i, i + 3) });
    }
  }
  const possibleMappings = [];
  changes.sort(compareBy((c) => c.modified.startLineNumber, numberComparator));
  for (const change of changes) {
    let lastMappings = [];
    for (let i = change.modified.startLineNumber; i < change.modified.endLineNumberExclusive - 2; i++) {
      const key = `${hashedModifiedLines[i - 1]}:${hashedModifiedLines[i + 1 - 1]}:${hashedModifiedLines[i + 2 - 1]}`;
      const currentModifiedRange = new LineRange(i, i + 3);
      const nextMappings = [];
      original3LineHashes.forEach(key, ({ range }) => {
        for (const lastMapping of lastMappings) {
          if (lastMapping.originalLineRange.endLineNumberExclusive + 1 === range.endLineNumberExclusive && lastMapping.modifiedLineRange.endLineNumberExclusive + 1 === currentModifiedRange.endLineNumberExclusive) {
            lastMapping.originalLineRange = new LineRange(lastMapping.originalLineRange.startLineNumber, range.endLineNumberExclusive);
            lastMapping.modifiedLineRange = new LineRange(lastMapping.modifiedLineRange.startLineNumber, currentModifiedRange.endLineNumberExclusive);
            nextMappings.push(lastMapping);
            return;
          }
        }
        const mapping = {
          modifiedLineRange: currentModifiedRange,
          originalLineRange: range
        };
        possibleMappings.push(mapping);
        nextMappings.push(mapping);
      });
      lastMappings = nextMappings;
    }
    if (!timeout.isValid()) {
      return [];
    }
  }
  possibleMappings.sort(reverseOrder(compareBy((m) => m.modifiedLineRange.length, numberComparator)));
  const modifiedSet = new LineRangeSet();
  const originalSet = new LineRangeSet();
  for (const mapping of possibleMappings) {
    const diffOrigToMod = mapping.modifiedLineRange.startLineNumber - mapping.originalLineRange.startLineNumber;
    const modifiedSections = modifiedSet.subtractFrom(mapping.modifiedLineRange);
    const originalTranslatedSections = originalSet.subtractFrom(mapping.originalLineRange).getWithDelta(diffOrigToMod);
    const modifiedIntersectedSections = modifiedSections.getIntersection(originalTranslatedSections);
    for (const s of modifiedIntersectedSections.ranges) {
      if (s.length < 3) {
        continue;
      }
      const modifiedLineRange = s;
      const originalLineRange = s.delta(-diffOrigToMod);
      moves.push(new LineRangeMapping(originalLineRange, modifiedLineRange));
      modifiedSet.addRange(modifiedLineRange);
      originalSet.addRange(originalLineRange);
    }
  }
  moves.sort(compareBy((m) => m.original.startLineNumber, numberComparator));
  const monotonousChanges = new MonotonousArray(changes);
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const firstTouchingChangeOrig = monotonousChanges.findLastMonotonous((c) => c.original.startLineNumber <= move.original.startLineNumber);
    const firstTouchingChangeMod = findLastMonotonous(changes, (c) => c.modified.startLineNumber <= move.modified.startLineNumber);
    const linesAbove = Math.max(
      move.original.startLineNumber - firstTouchingChangeOrig.original.startLineNumber,
      move.modified.startLineNumber - firstTouchingChangeMod.modified.startLineNumber
    );
    const lastTouchingChangeOrig = monotonousChanges.findLastMonotonous((c) => c.original.startLineNumber < move.original.endLineNumberExclusive);
    const lastTouchingChangeMod = findLastMonotonous(changes, (c) => c.modified.startLineNumber < move.modified.endLineNumberExclusive);
    const linesBelow = Math.max(
      lastTouchingChangeOrig.original.endLineNumberExclusive - move.original.endLineNumberExclusive,
      lastTouchingChangeMod.modified.endLineNumberExclusive - move.modified.endLineNumberExclusive
    );
    let extendToTop;
    for (extendToTop = 0; extendToTop < linesAbove; extendToTop++) {
      const origLine = move.original.startLineNumber - extendToTop - 1;
      const modLine = move.modified.startLineNumber - extendToTop - 1;
      if (origLine > originalLines.length || modLine > modifiedLines.length) {
        break;
      }
      if (modifiedSet.contains(modLine) || originalSet.contains(origLine)) {
        break;
      }
      if (!areLinesSimilar(originalLines[origLine - 1], modifiedLines[modLine - 1], timeout)) {
        break;
      }
    }
    if (extendToTop > 0) {
      originalSet.addRange(new LineRange(move.original.startLineNumber - extendToTop, move.original.startLineNumber));
      modifiedSet.addRange(new LineRange(move.modified.startLineNumber - extendToTop, move.modified.startLineNumber));
    }
    let extendToBottom;
    for (extendToBottom = 0; extendToBottom < linesBelow; extendToBottom++) {
      const origLine = move.original.endLineNumberExclusive + extendToBottom;
      const modLine = move.modified.endLineNumberExclusive + extendToBottom;
      if (origLine > originalLines.length || modLine > modifiedLines.length) {
        break;
      }
      if (modifiedSet.contains(modLine) || originalSet.contains(origLine)) {
        break;
      }
      if (!areLinesSimilar(originalLines[origLine - 1], modifiedLines[modLine - 1], timeout)) {
        break;
      }
    }
    if (extendToBottom > 0) {
      originalSet.addRange(new LineRange(move.original.endLineNumberExclusive, move.original.endLineNumberExclusive + extendToBottom));
      modifiedSet.addRange(new LineRange(move.modified.endLineNumberExclusive, move.modified.endLineNumberExclusive + extendToBottom));
    }
    if (extendToTop > 0 || extendToBottom > 0) {
      moves[i] = new LineRangeMapping(
        new LineRange(move.original.startLineNumber - extendToTop, move.original.endLineNumberExclusive + extendToBottom),
        new LineRange(move.modified.startLineNumber - extendToTop, move.modified.endLineNumberExclusive + extendToBottom)
      );
    }
  }
  return moves;
}
function areLinesSimilar(line1, line2, timeout) {
  if (line1.trim() === line2.trim()) {
    return true;
  }
  if (line1.length > 300 && line2.length > 300) {
    return false;
  }
  const myersDiffingAlgorithm = new MyersDiffAlgorithm();
  const result = myersDiffingAlgorithm.compute(
    new LinesSliceCharSequence([line1], new Range(1, 1, 1, line1.length), false),
    new LinesSliceCharSequence([line2], new Range(1, 1, 1, line2.length), false),
    timeout
  );
  let commonNonSpaceCharCount = 0;
  const inverted = SequenceDiff.invert(result.diffs, line1.length);
  for (const seq of inverted) {
    seq.seq1Range.forEach((idx) => {
      if (!isSpace(line1.charCodeAt(idx))) {
        commonNonSpaceCharCount++;
      }
    });
  }
  function countNonWsChars(str) {
    let count = 0;
    for (let i = 0; i < line1.length; i++) {
      if (!isSpace(str.charCodeAt(i))) {
        count++;
      }
    }
    return count;
  }
  const longerLineLength = countNonWsChars(line1.length > line2.length ? line1 : line2);
  const r = commonNonSpaceCharCount / longerLineLength > 0.6 && longerLineLength > 10;
  return r;
}
function joinCloseConsecutiveMoves(moves) {
  if (moves.length === 0) {
    return moves;
  }
  moves.sort(compareBy((m) => m.original.startLineNumber, numberComparator));
  const result = [moves[0]];
  for (let i = 1; i < moves.length; i++) {
    const last = result[result.length - 1];
    const current = moves[i];
    const originalDist = current.original.startLineNumber - last.original.endLineNumberExclusive;
    const modifiedDist = current.modified.startLineNumber - last.modified.endLineNumberExclusive;
    const currentMoveAfterLast = originalDist >= 0 && modifiedDist >= 0;
    if (currentMoveAfterLast && originalDist + modifiedDist <= 2) {
      result[result.length - 1] = last.join(current);
      continue;
    }
    result.push(current);
  }
  return result;
}
function removeMovesInSameDiff(changes, moves) {
  const changesMonotonous = new MonotonousArray(changes);
  moves = moves.filter((m) => {
    const diffBeforeEndOfMoveOriginal = changesMonotonous.findLastMonotonous((c) => c.original.startLineNumber < m.original.endLineNumberExclusive) || new LineRangeMapping(new LineRange(1, 1), new LineRange(1, 1));
    const diffBeforeEndOfMoveModified = findLastMonotonous(changes, (c) => c.modified.startLineNumber < m.modified.endLineNumberExclusive);
    const differentDiffs = diffBeforeEndOfMoveOriginal !== diffBeforeEndOfMoveModified;
    return differentDiffs;
  });
  return moves;
}

function optimizeSequenceDiffs(sequence1, sequence2, sequenceDiffs) {
  let result = sequenceDiffs;
  result = joinSequenceDiffsByShifting(sequence1, sequence2, result);
  result = joinSequenceDiffsByShifting(sequence1, sequence2, result);
  result = shiftSequenceDiffs(sequence1, sequence2, result);
  return result;
}
function joinSequenceDiffsByShifting(sequence1, sequence2, sequenceDiffs) {
  if (sequenceDiffs.length === 0) {
    return sequenceDiffs;
  }
  const result = [];
  result.push(sequenceDiffs[0]);
  for (let i = 1; i < sequenceDiffs.length; i++) {
    const prevResult = result[result.length - 1];
    let cur = sequenceDiffs[i];
    if (cur.seq1Range.isEmpty || cur.seq2Range.isEmpty) {
      const length = cur.seq1Range.start - prevResult.seq1Range.endExclusive;
      let d;
      for (d = 1; d <= length; d++) {
        if (sequence1.getElement(cur.seq1Range.start - d) !== sequence1.getElement(cur.seq1Range.endExclusive - d) || sequence2.getElement(cur.seq2Range.start - d) !== sequence2.getElement(cur.seq2Range.endExclusive - d)) {
          break;
        }
      }
      d--;
      if (d === length) {
        result[result.length - 1] = new SequenceDiff(
          new OffsetRange(prevResult.seq1Range.start, cur.seq1Range.endExclusive - length),
          new OffsetRange(prevResult.seq2Range.start, cur.seq2Range.endExclusive - length)
        );
        continue;
      }
      cur = cur.delta(-d);
    }
    result.push(cur);
  }
  const result2 = [];
  for (let i = 0; i < result.length - 1; i++) {
    const nextResult = result[i + 1];
    let cur = result[i];
    if (cur.seq1Range.isEmpty || cur.seq2Range.isEmpty) {
      const length = nextResult.seq1Range.start - cur.seq1Range.endExclusive;
      let d;
      for (d = 0; d < length; d++) {
        if (!sequence1.isStronglyEqual(cur.seq1Range.start + d, cur.seq1Range.endExclusive + d) || !sequence2.isStronglyEqual(cur.seq2Range.start + d, cur.seq2Range.endExclusive + d)) {
          break;
        }
      }
      if (d === length) {
        result[i + 1] = new SequenceDiff(
          new OffsetRange(cur.seq1Range.start + length, nextResult.seq1Range.endExclusive),
          new OffsetRange(cur.seq2Range.start + length, nextResult.seq2Range.endExclusive)
        );
        continue;
      }
      if (d > 0) {
        cur = cur.delta(d);
      }
    }
    result2.push(cur);
  }
  if (result.length > 0) {
    result2.push(result[result.length - 1]);
  }
  return result2;
}
function shiftSequenceDiffs(sequence1, sequence2, sequenceDiffs) {
  if (!sequence1.getBoundaryScore || !sequence2.getBoundaryScore) {
    return sequenceDiffs;
  }
  for (let i = 0; i < sequenceDiffs.length; i++) {
    const prevDiff = i > 0 ? sequenceDiffs[i - 1] : void 0;
    const diff = sequenceDiffs[i];
    const nextDiff = i + 1 < sequenceDiffs.length ? sequenceDiffs[i + 1] : void 0;
    const seq1ValidRange = new OffsetRange(prevDiff ? prevDiff.seq1Range.endExclusive + 1 : 0, nextDiff ? nextDiff.seq1Range.start - 1 : sequence1.length);
    const seq2ValidRange = new OffsetRange(prevDiff ? prevDiff.seq2Range.endExclusive + 1 : 0, nextDiff ? nextDiff.seq2Range.start - 1 : sequence2.length);
    if (diff.seq1Range.isEmpty) {
      sequenceDiffs[i] = shiftDiffToBetterPosition(diff, sequence1, sequence2, seq1ValidRange, seq2ValidRange);
    } else if (diff.seq2Range.isEmpty) {
      sequenceDiffs[i] = shiftDiffToBetterPosition(diff.swap(), sequence2, sequence1, seq2ValidRange, seq1ValidRange).swap();
    }
  }
  return sequenceDiffs;
}
function shiftDiffToBetterPosition(diff, sequence1, sequence2, seq1ValidRange, seq2ValidRange) {
  const maxShiftLimit = 100;
  let deltaBefore = 1;
  while (diff.seq1Range.start - deltaBefore >= seq1ValidRange.start && diff.seq2Range.start - deltaBefore >= seq2ValidRange.start && sequence2.isStronglyEqual(diff.seq2Range.start - deltaBefore, diff.seq2Range.endExclusive - deltaBefore) && deltaBefore < maxShiftLimit) {
    deltaBefore++;
  }
  deltaBefore--;
  let deltaAfter = 0;
  while (diff.seq1Range.start + deltaAfter < seq1ValidRange.endExclusive && diff.seq2Range.endExclusive + deltaAfter < seq2ValidRange.endExclusive && sequence2.isStronglyEqual(diff.seq2Range.start + deltaAfter, diff.seq2Range.endExclusive + deltaAfter) && deltaAfter < maxShiftLimit) {
    deltaAfter++;
  }
  if (deltaBefore === 0 && deltaAfter === 0) {
    return diff;
  }
  let bestDelta = 0;
  let bestScore = -1;
  for (let delta = -deltaBefore; delta <= deltaAfter; delta++) {
    const seq2OffsetStart = diff.seq2Range.start + delta;
    const seq2OffsetEndExclusive = diff.seq2Range.endExclusive + delta;
    const seq1Offset = diff.seq1Range.start + delta;
    const score = sequence1.getBoundaryScore(seq1Offset) + sequence2.getBoundaryScore(seq2OffsetStart) + sequence2.getBoundaryScore(seq2OffsetEndExclusive);
    if (score > bestScore) {
      bestScore = score;
      bestDelta = delta;
    }
  }
  return diff.delta(bestDelta);
}
function removeShortMatches(sequence1, sequence2, sequenceDiffs) {
  const result = [];
  for (const s of sequenceDiffs) {
    const last = result[result.length - 1];
    if (!last) {
      result.push(s);
      continue;
    }
    if (s.seq1Range.start - last.seq1Range.endExclusive <= 2 || s.seq2Range.start - last.seq2Range.endExclusive <= 2) {
      result[result.length - 1] = new SequenceDiff(last.seq1Range.join(s.seq1Range), last.seq2Range.join(s.seq2Range));
    } else {
      result.push(s);
    }
  }
  return result;
}
function extendDiffsToEntireWordIfAppropriate(sequence1, sequence2, sequenceDiffs, findParent, force = false) {
  const equalMappings = SequenceDiff.invert(sequenceDiffs, sequence1.length);
  const additional = [];
  let lastPoint = new OffsetPair(0, 0);
  function scanWord(pair, equalMapping) {
    if (pair.offset1 < lastPoint.offset1 || pair.offset2 < lastPoint.offset2) {
      return;
    }
    const w1 = findParent(sequence1, pair.offset1);
    const w2 = findParent(sequence2, pair.offset2);
    if (!w1 || !w2) {
      return;
    }
    let w = new SequenceDiff(w1, w2);
    const equalPart = w.intersect(equalMapping);
    let equalChars1 = equalPart.seq1Range.length;
    let equalChars2 = equalPart.seq2Range.length;
    while (equalMappings.length > 0) {
      const next = equalMappings[0];
      const intersects = next.seq1Range.intersects(w.seq1Range) || next.seq2Range.intersects(w.seq2Range);
      if (!intersects) {
        break;
      }
      const v1 = findParent(sequence1, next.seq1Range.start);
      const v2 = findParent(sequence2, next.seq2Range.start);
      const v = new SequenceDiff(v1, v2);
      const equalPart2 = v.intersect(next);
      equalChars1 += equalPart2.seq1Range.length;
      equalChars2 += equalPart2.seq2Range.length;
      w = w.join(v);
      if (w.seq1Range.endExclusive >= next.seq1Range.endExclusive) {
        equalMappings.shift();
      } else {
        break;
      }
    }
    if (force && equalChars1 + equalChars2 < w.seq1Range.length + w.seq2Range.length || equalChars1 + equalChars2 < (w.seq1Range.length + w.seq2Range.length) * 2 / 3) {
      additional.push(w);
    }
    lastPoint = w.getEndExclusives();
  }
  while (equalMappings.length > 0) {
    const next = equalMappings.shift();
    if (next.seq1Range.isEmpty) {
      continue;
    }
    scanWord(next.getStarts(), next);
    scanWord(next.getEndExclusives().delta(-1), next);
  }
  const merged = mergeSequenceDiffs(sequenceDiffs, additional);
  return merged;
}
function mergeSequenceDiffs(sequenceDiffs1, sequenceDiffs2) {
  const result = [];
  while (sequenceDiffs1.length > 0 || sequenceDiffs2.length > 0) {
    const sd1 = sequenceDiffs1[0];
    const sd2 = sequenceDiffs2[0];
    let next;
    if (sd1 && (!sd2 || sd1.seq1Range.start < sd2.seq1Range.start)) {
      next = sequenceDiffs1.shift();
    } else {
      next = sequenceDiffs2.shift();
    }
    if (result.length > 0 && result[result.length - 1].seq1Range.endExclusive >= next.seq1Range.start) {
      result[result.length - 1] = result[result.length - 1].join(next);
    } else {
      result.push(next);
    }
  }
  return result;
}
function removeVeryShortMatchingLinesBetweenDiffs(sequence1, _sequence2, sequenceDiffs) {
  let diffs = sequenceDiffs;
  if (diffs.length === 0) {
    return diffs;
  }
  let counter = 0;
  let shouldRepeat;
  do {
    shouldRepeat = false;
    const result = [
      diffs[0]
    ];
    for (let i = 1; i < diffs.length; i++) {
      let shouldJoinDiffs = function(before, after) {
        const unchangedRange = new OffsetRange(lastResult.seq1Range.endExclusive, cur.seq1Range.start);
        const unchangedText = sequence1.getText(unchangedRange);
        const unchangedTextWithoutWs = unchangedText.replace(/\s/g, "");
        if (unchangedTextWithoutWs.length <= 4 && (before.seq1Range.length + before.seq2Range.length > 5 || after.seq1Range.length + after.seq2Range.length > 5)) {
          return true;
        }
        return false;
      };
      const cur = diffs[i];
      const lastResult = result[result.length - 1];
      const shouldJoin = shouldJoinDiffs(lastResult, cur);
      if (shouldJoin) {
        shouldRepeat = true;
        result[result.length - 1] = result[result.length - 1].join(cur);
      } else {
        result.push(cur);
      }
    }
    diffs = result;
  } while (counter++ < 10 && shouldRepeat);
  return diffs;
}
function removeVeryShortMatchingTextBetweenLongDiffs(sequence1, sequence2, sequenceDiffs) {
  let diffs = sequenceDiffs;
  if (diffs.length === 0) {
    return diffs;
  }
  let counter = 0;
  let shouldRepeat;
  do {
    shouldRepeat = false;
    const result = [
      diffs[0]
    ];
    for (let i = 1; i < diffs.length; i++) {
      let shouldJoinDiffs = function(before, after) {
        const unchangedRange = new OffsetRange(lastResult.seq1Range.endExclusive, cur.seq1Range.start);
        const unchangedLineCount = sequence1.countLinesIn(unchangedRange);
        if (unchangedLineCount > 5 || unchangedRange.length > 500) {
          return false;
        }
        const unchangedText = sequence1.getText(unchangedRange).trim();
        if (unchangedText.length > 20 || unchangedText.split(/\r\n|\r|\n/).length > 1) {
          return false;
        }
        const beforeLineCount1 = sequence1.countLinesIn(before.seq1Range);
        const beforeSeq1Length = before.seq1Range.length;
        const beforeLineCount2 = sequence2.countLinesIn(before.seq2Range);
        const beforeSeq2Length = before.seq2Range.length;
        const afterLineCount1 = sequence1.countLinesIn(after.seq1Range);
        const afterSeq1Length = after.seq1Range.length;
        const afterLineCount2 = sequence2.countLinesIn(after.seq2Range);
        const afterSeq2Length = after.seq2Range.length;
        const max = 2 * 40 + 50;
        function cap(v) {
          return Math.min(v, max);
        }
        if (Math.pow(Math.pow(cap(beforeLineCount1 * 40 + beforeSeq1Length), 1.5) + Math.pow(cap(beforeLineCount2 * 40 + beforeSeq2Length), 1.5), 1.5) + Math.pow(Math.pow(cap(afterLineCount1 * 40 + afterSeq1Length), 1.5) + Math.pow(cap(afterLineCount2 * 40 + afterSeq2Length), 1.5), 1.5) > (max ** 1.5) ** 1.5 * 1.3) {
          return true;
        }
        return false;
      };
      const cur = diffs[i];
      const lastResult = result[result.length - 1];
      const shouldJoin = shouldJoinDiffs(lastResult, cur);
      if (shouldJoin) {
        shouldRepeat = true;
        result[result.length - 1] = result[result.length - 1].join(cur);
      } else {
        result.push(cur);
      }
    }
    diffs = result;
  } while (counter++ < 10 && shouldRepeat);
  const newDiffs = [];
  forEachWithNeighbors(diffs, (prev, cur, next) => {
    let newDiff = cur;
    function shouldMarkAsChanged(text) {
      return text.length > 0 && text.trim().length <= 3 && cur.seq1Range.length + cur.seq2Range.length > 100;
    }
    const fullRange1 = sequence1.extendToFullLines(cur.seq1Range);
    const prefix = sequence1.getText(new OffsetRange(fullRange1.start, cur.seq1Range.start));
    if (shouldMarkAsChanged(prefix)) {
      newDiff = newDiff.deltaStart(-prefix.length);
    }
    const suffix = sequence1.getText(new OffsetRange(cur.seq1Range.endExclusive, fullRange1.endExclusive));
    if (shouldMarkAsChanged(suffix)) {
      newDiff = newDiff.deltaEnd(suffix.length);
    }
    const availableSpace = SequenceDiff.fromOffsetPairs(
      prev ? prev.getEndExclusives() : OffsetPair.zero,
      next ? next.getStarts() : OffsetPair.max
    );
    const result = newDiff.intersect(availableSpace);
    if (newDiffs.length > 0 && result.getStarts().equals(newDiffs[newDiffs.length - 1].getEndExclusives())) {
      newDiffs[newDiffs.length - 1] = newDiffs[newDiffs.length - 1].join(result);
    } else {
      newDiffs.push(result);
    }
  });
  return newDiffs;
}

class LineSequence {
  constructor(trimmedHash, lines) {
    this.trimmedHash = trimmedHash;
    this.lines = lines;
  }
  getElement(offset) {
    return this.trimmedHash[offset];
  }
  get length() {
    return this.trimmedHash.length;
  }
  getBoundaryScore(length) {
    const indentationBefore = length === 0 ? 0 : getIndentation(this.lines[length - 1]);
    const indentationAfter = length === this.lines.length ? 0 : getIndentation(this.lines[length]);
    return 1e3 - (indentationBefore + indentationAfter);
  }
  getText(range) {
    return this.lines.slice(range.start, range.endExclusive).join("\n");
  }
  isStronglyEqual(offset1, offset2) {
    return this.lines[offset1] === this.lines[offset2];
  }
}
function getIndentation(str) {
  let i = 0;
  while (i < str.length && (str.charCodeAt(i) === 32 || str.charCodeAt(i) === 9)) {
    i++;
  }
  return i;
}

class DefaultLinesDiffComputer {
  constructor() {
    this.dynamicProgrammingDiffing = new DynamicProgrammingDiffing();
    this.myersDiffingAlgorithm = new MyersDiffAlgorithm();
  }
  computeDiff(originalLines, modifiedLines, options) {
    if (originalLines.length <= 1 && equals(originalLines, modifiedLines, (a, b) => a === b)) {
      return new LinesDiff([], [], false);
    }
    if (originalLines.length === 1 && originalLines[0].length === 0 || modifiedLines.length === 1 && modifiedLines[0].length === 0) {
      return new LinesDiff([
        new DetailedLineRangeMapping(
          new LineRange(1, originalLines.length + 1),
          new LineRange(1, modifiedLines.length + 1),
          [
            new RangeMapping(
              new Range(1, 1, originalLines.length, originalLines[originalLines.length - 1].length + 1),
              new Range(1, 1, modifiedLines.length, modifiedLines[modifiedLines.length - 1].length + 1)
            )
          ]
        )
      ], [], false);
    }
    const timeout = options.maxComputationTimeMs === 0 ? InfiniteTimeout.instance : new DateTimeout(options.maxComputationTimeMs);
    const considerWhitespaceChanges = !options.ignoreTrimWhitespace;
    const perfectHashes = /* @__PURE__ */ new Map();
    function getOrCreateHash(text) {
      let hash = perfectHashes.get(text);
      if (hash === void 0) {
        hash = perfectHashes.size;
        perfectHashes.set(text, hash);
      }
      return hash;
    }
    const originalLinesHashes = originalLines.map((l) => getOrCreateHash(l.trim()));
    const modifiedLinesHashes = modifiedLines.map((l) => getOrCreateHash(l.trim()));
    const sequence1 = new LineSequence(originalLinesHashes, originalLines);
    const sequence2 = new LineSequence(modifiedLinesHashes, modifiedLines);
    const lineAlignmentResult = (() => {
      if (sequence1.length + sequence2.length < 1700) {
        return this.dynamicProgrammingDiffing.compute(
          sequence1,
          sequence2,
          timeout,
          (offset1, offset2) => originalLines[offset1] === modifiedLines[offset2] ? modifiedLines[offset2].length === 0 ? 0.1 : 1 + Math.log(1 + modifiedLines[offset2].length) : 0.99
        );
      }
      return this.myersDiffingAlgorithm.compute(
        sequence1,
        sequence2,
        timeout
      );
    })();
    let lineAlignments = lineAlignmentResult.diffs;
    let hitTimeout = lineAlignmentResult.hitTimeout;
    lineAlignments = optimizeSequenceDiffs(sequence1, sequence2, lineAlignments);
    lineAlignments = removeVeryShortMatchingLinesBetweenDiffs(sequence1, sequence2, lineAlignments);
    const alignments = [];
    const scanForWhitespaceChanges = (equalLinesCount) => {
      if (!considerWhitespaceChanges) {
        return;
      }
      for (let i = 0; i < equalLinesCount; i++) {
        const seq1Offset = seq1LastStart + i;
        const seq2Offset = seq2LastStart + i;
        if (originalLines[seq1Offset] !== modifiedLines[seq2Offset]) {
          const characterDiffs = this.refineDiff(originalLines, modifiedLines, new SequenceDiff(
            new OffsetRange(seq1Offset, seq1Offset + 1),
            new OffsetRange(seq2Offset, seq2Offset + 1)
          ), timeout, considerWhitespaceChanges, options);
          for (const a of characterDiffs.mappings) {
            alignments.push(a);
          }
          if (characterDiffs.hitTimeout) {
            hitTimeout = true;
          }
        }
      }
    };
    let seq1LastStart = 0;
    let seq2LastStart = 0;
    for (const diff of lineAlignments) {
      assertFn(() => diff.seq1Range.start - seq1LastStart === diff.seq2Range.start - seq2LastStart);
      const equalLinesCount = diff.seq1Range.start - seq1LastStart;
      scanForWhitespaceChanges(equalLinesCount);
      seq1LastStart = diff.seq1Range.endExclusive;
      seq2LastStart = diff.seq2Range.endExclusive;
      const characterDiffs = this.refineDiff(originalLines, modifiedLines, diff, timeout, considerWhitespaceChanges, options);
      if (characterDiffs.hitTimeout) {
        hitTimeout = true;
      }
      for (const a of characterDiffs.mappings) {
        alignments.push(a);
      }
    }
    scanForWhitespaceChanges(originalLines.length - seq1LastStart);
    const changes = lineRangeMappingFromRangeMappings(alignments, new ArrayText(originalLines), new ArrayText(modifiedLines));
    let moves = [];
    if (options.computeMoves) {
      moves = this.computeMoves(changes, originalLines, modifiedLines, originalLinesHashes, modifiedLinesHashes, timeout, considerWhitespaceChanges, options);
    }
    assertFn(() => {
      function validatePosition(pos, lines) {
        if (pos.lineNumber < 1 || pos.lineNumber > lines.length) {
          return false;
        }
        const line = lines[pos.lineNumber - 1];
        if (pos.column < 1 || pos.column > line.length + 1) {
          return false;
        }
        return true;
      }
      function validateRange(range, lines) {
        if (range.startLineNumber < 1 || range.startLineNumber > lines.length + 1) {
          return false;
        }
        if (range.endLineNumberExclusive < 1 || range.endLineNumberExclusive > lines.length + 1) {
          return false;
        }
        return true;
      }
      for (const c of changes) {
        if (!c.innerChanges) {
          return false;
        }
        for (const ic of c.innerChanges) {
          const valid = validatePosition(ic.modifiedRange.getStartPosition(), modifiedLines) && validatePosition(ic.modifiedRange.getEndPosition(), modifiedLines) && validatePosition(ic.originalRange.getStartPosition(), originalLines) && validatePosition(ic.originalRange.getEndPosition(), originalLines);
          if (!valid) {
            return false;
          }
        }
        if (!validateRange(c.modified, modifiedLines) || !validateRange(c.original, originalLines)) {
          return false;
        }
      }
      return true;
    });
    return new LinesDiff(changes, moves, hitTimeout);
  }
  computeMoves(changes, originalLines, modifiedLines, hashedOriginalLines, hashedModifiedLines, timeout, considerWhitespaceChanges, options) {
    const moves = computeMovedLines(
      changes,
      originalLines,
      modifiedLines,
      hashedOriginalLines,
      hashedModifiedLines,
      timeout
    );
    const movesWithDiffs = moves.map((m) => {
      const moveChanges = this.refineDiff(originalLines, modifiedLines, new SequenceDiff(
        m.original.toOffsetRange(),
        m.modified.toOffsetRange()
      ), timeout, considerWhitespaceChanges, options);
      const mappings = lineRangeMappingFromRangeMappings(moveChanges.mappings, new ArrayText(originalLines), new ArrayText(modifiedLines), true);
      return new MovedText(m, mappings);
    });
    return movesWithDiffs;
  }
  refineDiff(originalLines, modifiedLines, diff, timeout, considerWhitespaceChanges, options) {
    const lineRangeMapping = toLineRangeMapping(diff);
    const rangeMapping = lineRangeMapping.toRangeMapping2(originalLines, modifiedLines);
    const slice1 = new LinesSliceCharSequence(originalLines, rangeMapping.originalRange, considerWhitespaceChanges);
    const slice2 = new LinesSliceCharSequence(modifiedLines, rangeMapping.modifiedRange, considerWhitespaceChanges);
    const diffResult = slice1.length + slice2.length < 500 ? this.dynamicProgrammingDiffing.compute(slice1, slice2, timeout) : this.myersDiffingAlgorithm.compute(slice1, slice2, timeout);
    let diffs = diffResult.diffs;
    diffs = optimizeSequenceDiffs(slice1, slice2, diffs);
    diffs = extendDiffsToEntireWordIfAppropriate(slice1, slice2, diffs, (seq, idx) => seq.findWordContaining(idx));
    if (options.extendToSubwords) {
      diffs = extendDiffsToEntireWordIfAppropriate(slice1, slice2, diffs, (seq, idx) => seq.findSubWordContaining(idx), true);
    }
    diffs = removeShortMatches(slice1, slice2, diffs);
    diffs = removeVeryShortMatchingTextBetweenLongDiffs(slice1, slice2, diffs);
    const result = diffs.map(
      (d) => new RangeMapping(
        slice1.translateRange(d.seq1Range),
        slice2.translateRange(d.seq2Range)
      )
    );
    return {
      mappings: result,
      hitTimeout: diffResult.hitTimeout
    };
  }
}
function toLineRangeMapping(sequenceDiff) {
  return new LineRangeMapping(
    new LineRange(sequenceDiff.seq1Range.start + 1, sequenceDiff.seq1Range.endExclusive + 1),
    new LineRange(sequenceDiff.seq2Range.start + 1, sequenceDiff.seq2Range.endExclusive + 1)
  );
}

function computeDiff(originalLines, modifiedLines, options) {
  let diffComputer = new DefaultLinesDiffComputer();
  var result = diffComputer.computeDiff(originalLines, modifiedLines, options);
  console.log(result.moves);
  return result?.changes.map((changes) => {
    let originalStartLineNumber;
    let originalEndLineNumber;
    let modifiedStartLineNumber;
    let modifiedEndLineNumber;
    let innerChanges = changes.innerChanges;
    originalStartLineNumber = changes.original.startLineNumber - 1;
    originalEndLineNumber = changes.original.endLineNumberExclusive - 1;
    modifiedStartLineNumber = changes.modified.startLineNumber - 1;
    modifiedEndLineNumber = changes.modified.endLineNumberExclusive - 1;
    return {
      origStart: originalStartLineNumber,
      origEnd: originalEndLineNumber,
      editStart: modifiedStartLineNumber,
      editEnd: modifiedEndLineNumber,
      charChanges: innerChanges?.map((m) => ({
        originalStartLineNumber: m.originalRange.startLineNumber - 1,
        originalStartColumn: m.originalRange.startColumn - 1,
        originalEndLineNumber: m.originalRange.endLineNumber - 1,
        originalEndColumn: m.originalRange.endColumn - 1,
        modifiedStartLineNumber: m.modifiedRange.startLineNumber - 1,
        modifiedStartColumn: m.modifiedRange.startColumn - 1,
        modifiedEndLineNumber: m.modifiedRange.endLineNumber - 1,
        modifiedEndColumn: m.modifiedRange.endColumn - 1
      }))
    };
  });
}

exports.computeDiff = computeDiff;
