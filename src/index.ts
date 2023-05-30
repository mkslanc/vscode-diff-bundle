import {ILinesDiffComputerOptions} from "vs/editor/common/diff/linesDiffComputer";
import {StandardLinesDiffComputer} from "vs/editor/common/diff/standardLinesDiffComputer";

export function computeDiff(originalLines: string[], modifiedLines: string[], options: ILinesDiffComputerOptions) {
    let diffComputer = new StandardLinesDiffComputer();
    return diffComputer.computeDiff(originalLines, modifiedLines, options)?.changes.map((changes) => {
        let originalStartLineNumber;
        let originalEndLineNumber;
        let modifiedStartLineNumber;
        let modifiedEndLineNumber;
        let innerChanges = changes.innerChanges;
        
        originalStartLineNumber = changes.originalRange.startLineNumber - 1;
        originalEndLineNumber = changes.originalRange.endLineNumberExclusive - 1;
        modifiedStartLineNumber = changes.modifiedRange.startLineNumber - 1;
        modifiedEndLineNumber = changes.modifiedRange.endLineNumberExclusive - 1;
        return {
            origStart: originalStartLineNumber,
            origEnd: originalEndLineNumber,
            editStart: modifiedStartLineNumber,
            editEnd: modifiedEndLineNumber,
            charChanges: innerChanges?.map(m => ({
                originalStartLineNumber: m.originalRange.startLineNumber - 1,
                originalStartColumn: m.originalRange.startColumn - 1,
                originalEndLineNumber: m.originalRange.endLineNumber - 1,
                originalEndColumn: m.originalRange.endColumn - 1,
                modifiedStartLineNumber: m.modifiedRange.startLineNumber - 1,
                modifiedStartColumn: m.modifiedRange.startColumn - 1,
                modifiedEndLineNumber: m.modifiedRange.endLineNumber - 1,
                modifiedEndColumn: m.modifiedRange.endColumn - 1,
            }))
        };
    });
}
