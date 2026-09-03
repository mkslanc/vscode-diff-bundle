import {
    ILinesDiffComputerOptions,
    LinesDiff,
    MovedText
} from "vs/editor/common/diff/linesDiffComputer";
import {equals} from "vs/base/common/arrays";
import {DetailedLineRangeMapping} from "vs/editor/common/diff/rangeMapping";
import {
    DateTimeout,
    InfiniteTimeout,
    SequenceDiff
} from "vs/editor/common/diff/defaultLinesDiffComputer/algorithms/diffAlgorithm";
import {DynamicProgrammingDiffing} from "vs/editor/common/diff/defaultLinesDiffComputer/algorithms/dynamicProgrammingDiffing";
import {MyersDiffAlgorithm} from "vs/editor/common/diff/defaultLinesDiffComputer/algorithms/myersDiffAlgorithm";
import {LineSequence} from "vs/editor/common/diff/defaultLinesDiffComputer/lineSequence";
import {
    optimizeSequenceDiffs,
    removeVeryShortMatchingLinesBetweenDiffs
} from "vs/editor/common/diff/defaultLinesDiffComputer/heuristicSequenceOptimizations";
import {computeMovedLines} from "vs/editor/common/diff/defaultLinesDiffComputer/computeMovedLines";
import {DefaultLinesDiffComputer} from "vs/editor/common/diff/defaultLinesDiffComputer/defaultLinesDiffComputer";
import {assertFn} from "vs/base/common/assert";
import {LineRange} from "vs/editor/common/core/ranges/lineRange";

/**
 * The line-alignment phase of VS Code's DefaultLinesDiffComputer.
 *
 * Character-level refinement is deliberately omitted. A change with two
 * non-empty sides therefore has `innerChanges === undefined` and can be
 * refined later by the consumer.
 */
class DefaultLinesDiffComputerWithSeparateRefinement extends DefaultLinesDiffComputer {
    private readonly lineDynamicProgrammingDiffing = new DynamicProgrammingDiffing();
    private readonly lineMyersDiffingAlgorithm = new MyersDiffAlgorithm();

    override computeDiff(
        originalLines: string[],
        modifiedLines: string[],
        options: ILinesDiffComputerOptions
    ): LinesDiff {
        if (originalLines.length <= 1 && equals(originalLines, modifiedLines, (a, b) => a === b)) {
            return new LinesDiff([], [], false);
        }
        if (originalLines.length === 1 && originalLines[0].length === 0 || modifiedLines.length === 1 && modifiedLines[0].length === 0) {
            return new LinesDiff([
                new DetailedLineRangeMapping(
                    new LineRange(1, originalLines.length + 1),
                    new LineRange(1, modifiedLines.length + 1),
                    undefined
                )
            ], [], false);
        }
        const timeout = options.maxComputationTimeMs === 0 ? InfiniteTimeout.instance : new DateTimeout(options.maxComputationTimeMs);
        const perfectHashes = new Map<string, number>();
        function getOrCreateHash(text: string): number {
            let hash = perfectHashes.get(text);
            if (hash === undefined) {
                hash = perfectHashes.size;
                perfectHashes.set(text, hash);
            }
            return hash;
        }
        // A rough diff has no eager character pass to recover whitespace-only
        // changes. Use exact lines unless the caller explicitly ignores trim
        // whitespace, in which case trimmed lines are intentionally equivalent.
        const getLineKey = options.ignoreTrimWhitespace ? (line: string) => line.trim() : (line: string) => line;
        const originalLinesHashes = originalLines.map((l) => getOrCreateHash(getLineKey(l)));
        const modifiedLinesHashes = modifiedLines.map((l) => getOrCreateHash(getLineKey(l)));
        const sequence1 = new LineSequence(originalLinesHashes, originalLines);
        const sequence2 = new LineSequence(modifiedLinesHashes, modifiedLines);
        const lineAlignmentResult = (() => {
            if (sequence1.length + sequence2.length < 1700) {
                return this.lineDynamicProgrammingDiffing.compute(
                    sequence1,
                    sequence2,
                    timeout,
                    (offset1, offset2) => originalLines[offset1] === modifiedLines[offset2] ? modifiedLines[offset2].length === 0 ? 0.1 : 1 + Math.log(1 + modifiedLines[offset2].length) : 0.99
                );
            }
            return this.lineMyersDiffingAlgorithm.compute(
                sequence1,
                sequence2,
                timeout
            );
        })();
        let lineAlignments = lineAlignmentResult.diffs;
        lineAlignments = optimizeSequenceDiffs(sequence1, sequence2, lineAlignments);
        lineAlignments = removeVeryShortMatchingLinesBetweenDiffs(sequence1, sequence2, lineAlignments);
        const changes = lineAlignments.map(toDetailedLineRangeMapping);
        let moves: MovedText[] = [];
        if (options.computeMoves && !lineAlignmentResult.hitTimeout) {
            const lineMoves = computeMovedLines(
                changes,
                originalLines,
                modifiedLines,
                originalLinesHashes,
                modifiedLinesHashes,
                timeout
            );
            // Precise diffs inside moved blocks belong to the deferred phase too.
            moves = lineMoves.map(move => new MovedText(move, []));
        }
        assertFn(() => {
            function validateRange(range: LineRange, lines: readonly string[]): boolean {
                if (range.startLineNumber < 1 || range.startLineNumber > lines.length + 1) {
                    return false;
                }
                if (range.endLineNumberExclusive < 1 || range.endLineNumberExclusive > lines.length + 1) {
                    return false;
                }
                return true;
            }
            for (const c of changes) {
                if (!validateRange(c.modified, modifiedLines) || !validateRange(c.original, originalLines)) {
                    return false;
                }
            }
            return true;
        });
        return new LinesDiff(changes, moves, lineAlignmentResult.hitTimeout);
    }
}

function toDetailedLineRangeMapping(sequenceDiff: SequenceDiff): DetailedLineRangeMapping {
    return new DetailedLineRangeMapping(
        new LineRange(sequenceDiff.seq1Range.start + 1, sequenceDiff.seq1Range.endExclusive + 1),
        new LineRange(sequenceDiff.seq2Range.start + 1, sequenceDiff.seq2Range.endExclusive + 1),
        undefined
    );
}

function rangeMappingToCharChange(mapping: NonNullable<DetailedLineRangeMapping["innerChanges"]>[number]) {
    return {
        originalStartLineNumber: mapping.originalRange.startLineNumber - 1,
        originalStartColumn: mapping.originalRange.startColumn - 1,
        originalEndLineNumber: mapping.originalRange.endLineNumber - 1,
        originalEndColumn: mapping.originalRange.endColumn - 1,
        modifiedStartLineNumber: mapping.modifiedRange.startLineNumber - 1,
        modifiedStartColumn: mapping.modifiedRange.startColumn - 1,
        modifiedEndLineNumber: mapping.modifiedRange.endLineNumber - 1,
        modifiedEndColumn: mapping.modifiedRange.endColumn - 1
    };
}

export function computeDiff(originalLines: string[], modifiedLines: string[], options: ILinesDiffComputerOptions) {
    const diffComputer = new DefaultLinesDiffComputerWithSeparateRefinement();
    const result = diffComputer.computeDiff(originalLines, modifiedLines, options);
    return result.changes.map((change) => {
        return {
            origStart: change.original.startLineNumber - 1,
            origEnd: change.original.endLineNumberExclusive - 1,
            editStart: change.modified.startLineNumber - 1,
            editEnd: change.modified.endLineNumberExclusive - 1,
            charChanges: change.innerChanges?.map(rangeMappingToCharChange),
            inlinePending: !result.hitTimeout
                && change.original.length > 0
                && change.modified.length > 0
        };
    });
}
