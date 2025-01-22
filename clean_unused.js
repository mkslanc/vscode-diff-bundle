var ts = require("typescript");
var fs = require("fs");
var path = require("path");

const defaultFormatCodeSettings = {
    baseIndentSize: 0,
    indentSize: 4,
    tabSize: 4,
    indentStyle: ts.IndentStyle.Smart,
    newLineCharacter: "\n",
    convertTabsToSpaces: true,
    insertSpaceAfterCommaDelimiter: true,
    insertSpaceAfterSemicolonInForStatements: true,
    insertSpaceBeforeAndAfterBinaryOperators: true,
    insertSpaceAfterConstructor: false,
    insertSpaceAfterKeywordsInControlFlowStatements: true,
    insertSpaceAfterFunctionKeywordForAnonymousFunctions: false,
    insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
    insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false,
    insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: true,
    insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: false,
    insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBraces: false,
    insertSpaceAfterTypeAssertion: false,
    insertSpaceBeforeFunctionParenthesis: false,
    placeOpenBraceOnNewLineForFunctions: false,
    placeOpenBraceOnNewLineForControlBlocks: false,
    insertSpaceBeforeTypeAnnotation: false
};

let unused;

function getAllFileNames(dirPath) {
    let files = [];
    const entries = fs.readdirSync(dirPath);

    entries.sort().forEach(entry => {
        const fullPath = path.join(dirPath, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            files = files.concat(getAllFileNames(fullPath));
        }
        else if (stat.isFile()) {
            files.push(fullPath);
        }
    });

    return files;
}

const compilerOptions = {
    target: ts.ScriptTarget.ES2020,
    checkJs: true,
    allowJs: true
};

function findUnusedMethodsAndFunctions(fileNames) {
    const program = ts.createProgram(fileNames, compilerOptions);
    const checker = program.getTypeChecker();

    const declaredSymbols = new Map();
    const usedSymbols = new Set();

    fileNames.forEach((fileName) => {
        const sourceFile = program.getSourceFile(fileName);
        if (!sourceFile) return;

        ts.forEachChild(sourceFile, function visit(node) {
            if (ts.isMethodDeclaration(node) && node.name) {
                const className = getClassName(node);
                if (className) {
                    const methodName = `${className}.${node.name.getText()}`;
                    declaredSymbols.set(methodName, {
                        kind: "method",
                        file: fileName,
                        start: node.getFullStart(),
                        end: node.getEnd()
                    });
                }
            }
            else if (ts.isFunctionDeclaration(node) && node.name) {
                const functionName = `${node.name.getText()}`;
                declaredSymbols.set(functionName, {
                    kind: "function",
                    file: fileName,
                    start: node.getFullStart(),
                    end: node.getEnd()
                });
            }
            else if (ts.isImportSpecifier(node) && node.name) {
                const functionName = `${node.name.getText()}`;
                declaredSymbols.set(functionName, {
                    kind: "imported-function",
                    file: fileName,
                    start: node.getFullStart(),
                    end: node.getEnd()
                });
            }
            ts.forEachChild(node, visit);
        });
    });

    fileNames.forEach((fileName) => {
        const sourceFile = program.getSourceFile(fileName);
        if (!sourceFile) return;

        ts.forEachChild(sourceFile, function visit(node) {
            const symbol = checker.getSymbolAtLocation(node);
            if (symbol) {
                const declarations = symbol.getDeclarations();
                if (!declarations || declarations.length === 0) return;

                const declaration = declarations[0];

                // Check if the current node is a call or usage
                if (isNotDeclaration(node)) {
                    if (isMethodSymbol(declaration)) {
                        const className = getClassName(declaration);
                        if (className) {
                            const qualifiedName = `${className}.${symbol.getName()}`;
                            usedSymbols.add(qualifiedName);
                        }
                    }
                    else if (isFunctionSymbol(declaration)) {
                        const functionName = `${symbol.getName()}`;
                        usedSymbols.add(functionName);
                    }
                }
            }
            ts.forEachChild(node, visit);
        });
    });

    usedSymbols.add("computeDiff");

    unused = Array.from(declaredSymbols.entries())
        .filter(([name]) => !usedSymbols.has(name))
        .map(([name, info]) => ({name, ...info}));

    const groupedFixes = groupFixesByFile(unused);

    applyFixes(groupedFixes);

    return groupedFixes;

    // Output the results
    if (unused.length > 0) {
        console.log("Unused Methods and Functions:" + unused.length);
        unused.forEach(({
                            name,
                            kind,
                            file
                        }) => {
            console.log(`[${kind.toUpperCase()}] ${name} in ${file}`);
        });
    }
    else {
        console.log("No unused methods or functions found.");
    }
}

function groupFixesByFile(unusedItems) {
    const fixesByFile = new Map();

    for (const item of unusedItems) {
        const changes = fixesByFile.get(item.file) || [];
        changes.push({
            start: item.start,
            end: item.end
        });
        fixesByFile.set(item.file, changes);
    }

    return fixesByFile;
}

function getClassName(node) {
    let parent = node.parent;
    while (parent) {
        if (ts.isClassDeclaration(parent) && parent.name) {
            //lets ignore all classes that have a heritage clause
            if (parent.heritageClauses) {
                return null;
            }
            return parent.name.getText();
        }
        parent = parent.parent;
    }
    return null;
}

function isNotDeclaration(node) {
    return !ts.isMethodDeclaration(node.parent) && !ts.isFunctionDeclaration(node.parent);
}

function isMethodSymbol(declaration) {
    return ts.isMethodDeclaration(declaration);
}

function isFunctionSymbol(declaration) {
    return ts.isFunctionDeclaration(declaration) || ts.isImportSpecifier(declaration);
}

function removeOverlappingChanges(changes) {
    changes.sort((a, b) => b.end - a.end);

    const result = [];
    for (let i = 0; i < changes.length; i++) {
        const current = changes[i];
        let isContained = false;

        for (let j = 0; j < result.length; j++) {
            const previous = result[j];
            if (current.start >= previous.start && current.end <= previous.end) {
                isContained = true;
                break;
            }
        }

        if (!isContained) {
            result.push(current);
        }
    }

    return result;
}

function applyFixes(sourcesToFix) {
    sourcesToFix.forEach((changes, key) => {
        let content = fs.readFileSync(key).toString();
        changes = removeOverlappingChanges(changes)

        changes.forEach(change => {
            content = content.slice(0, change.start) + content.slice(change.end);
        });

        fs.writeFileSync(key, content);
    });
}

function useTsQuickFix(declarationNames) {
    declarationNames = declarationNames.filter((el) => /\.[tj]sx?$/.test(el))

    const defaultCompilerHost = ts.createCompilerHost({});
    const sourcesToFix = new Map();
    const compilerOptions = {
        noEmit: true,
        target: ts.ScriptTarget.ES2019,
        lib: ["lib.es2019.d.ts", "lib.dom.d.ts"],
        noUnusedLocals: true,
        "noUnusedParameters": false,
    };

    const host = {
        ...defaultCompilerHost,
        getCompilationSettings: () => compilerOptions,
        getScriptFileNames: () => declarationNames,
        getScriptVersion: () => "1",
        getScriptSnapshot: fileName => {
            const content = fs.readFileSync(fileName).toString();
            return ts.ScriptSnapshot.fromString(content);
        },
        getCurrentDirectory: () => process.cwd(),
        getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
        writeFile: (fileName, content) => fs.writeFileSync(fileName, content)
    };

    const languageService = ts.createLanguageService(host);
    const diagnostics = languageService.getProgram().getSemanticDiagnostics();
    diagnostics.forEach(diagnostic => {
        if (diagnostic.file && diagnostic.start && [6192, 6196, 6138, 6200, 6133, 4113].includes(diagnostic.code)) {
            const fixes = languageService.getCodeFixesAtPosition(diagnostic.file.fileName, diagnostic.start,
                diagnostic.start + diagnostic.length, [diagnostic.code], defaultFormatCodeSettings, {}
            );
            fixes.forEach(fix => {
                if (["fixOverrideModifier", "unusedIdentifier"].includes(fix.fixName) && fix.changes.length > 0) {
                    const fileName = fix.changes[0].fileName;

                    fix.changes[0].textChanges.forEach(change => {
                        const changes = sourcesToFix.get(fileName) || [];
                        const pieceAfter = diagnostic.file.text.slice(change.span.start + change.span.length);
                        const res = /^[ ,]*/.exec(pieceAfter);
                        changes.push({
                            start: change.span.start,
                            end: change.span.start + change.span.length + res[0].length
                        });
                        sourcesToFix.set(fileName, changes);
                    });
                }
            });

        }
    });

    applyFixes(sourcesToFix);
}

function runCleanUp() {
    const files = getAllFileNames(__dirname + "/src");
    do {
        findUnusedMethodsAndFunctions(files);
        useTsQuickFix(files);
    } while (unused.length > 0);
}

exports.runCleanUp = runCleanUp;