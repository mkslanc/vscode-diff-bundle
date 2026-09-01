import {ILinesDiffComputerOptions} from "vs/editor/common/diff/linesDiffComputer";
import {DefaultLinesDiffComputer} from "vs/editor/common/diff/defaultLinesDiffComputer/defaultLinesDiffComputer";

export function computeDiff(originalLines: string[], modifiedLines: string[], options: ILinesDiffComputerOptions) {
    let diffComputer = new DefaultLinesDiffComputer();
    var result = diffComputer.computeDiff(originalLines, modifiedLines, options);
    console.log(result.moves)
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
