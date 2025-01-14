interface ILinesDiffComputerOptions {
    readonly ignoreTrimWhitespace: boolean;
    readonly maxComputationTimeMs: number;
    readonly computeMoves: boolean;
    readonly extendToSubwords?: boolean;
}

declare function computeDiff(originalLines: string[], modifiedLines: string[], options: ILinesDiffComputerOptions): {
    origStart: any;
    origEnd: any;
    editStart: any;
    editEnd: any;
    charChanges: {
        originalStartLineNumber: number;
        originalStartColumn: number;
        originalEndLineNumber: number;
        originalEndColumn: number;
        modifiedStartLineNumber: number;
        modifiedStartColumn: number;
        modifiedEndLineNumber: number;
        modifiedEndColumn: number;
    }[];
}[];

export { computeDiff };
