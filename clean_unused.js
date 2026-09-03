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

function findUnusedDeclarations(fileNames) {
    const program = ts.createProgram(fileNames, compilerOptions);
    const checker = program.getTypeChecker();

    const declaredSymbols = new Map();
    const usedSymbols = new Set();
    const declaredClasses = new Map();
    const usedClasses = new Set();

    fileNames.forEach((fileName) => {
        const sourceFile = program.getSourceFile(fileName);
        if (!sourceFile) return;

        ts.forEachChild(sourceFile, function visit(node) {
            if (ts.isClassDeclaration(node) && node.name) {
                const symbol = checker.getSymbolAtLocation(node.name);
                if (symbol) {
                    declaredClasses.set(symbol, {
                        name: node.name.getText(),
                        kind: "class",
                        file: fileName,
                        start: node.getFullStart(),
                        end: node.getEnd(),
                        declaration: node
                    });
                }
            }

            if (isMethodLikeDeclaration(node) && node.name) {
                const className = getClassName(node, checker);
                if (className) {
                    const methodName = `${className}.${node.name.getText()}`;
                    declaredSymbols.set(methodName, {
                        kind: ts.isMethodDeclaration(node) ? "method" : "accessor",
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
            ts.forEachChild(node, visit);
        });
    });

    fileNames.forEach((fileName) => {
        const sourceFile = program.getSourceFile(fileName);
        if (!sourceFile) return;

        ts.forEachChild(sourceFile, function visit(node) {
            const symbol = checker.getSymbolAtLocation(node);
            if (symbol) {
                if (!isDeclarationName(node)) {
                    markClassAsUsed(symbol, node, checker, declaredClasses, usedClasses);
                }

                const declarations = symbol.getDeclarations();
                if (declarations && declarations.length > 0) {
                    const declaration = declarations[0];

                    // Check if the current node is a call or usage
                    if (!isDeclarationName(node)) {
                        if (isMethodLikeDeclaration(declaration)) {
                            const className = getClassName(declaration, checker);
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
            }
            ts.forEachChild(node, visit);
        });
    });

    usedSymbols.add("computeDiff");

    const unusedMethodsAndFunctions = Array.from(declaredSymbols.entries())
        .filter(([name]) => !usedSymbols.has(name))
        .map(([name, info]) => ({name, ...info}));
    const unusedClasses = Array.from(declaredClasses.entries())
        .filter(([symbol]) => !usedClasses.has(symbol))
        .map(([, info]) => info);

    unused = unusedMethodsAndFunctions.concat(unusedClasses);

    const groupedFixes = groupFixesByFile(unused);

    applyFixes(groupedFixes);

    return groupedFixes;
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

function getClassName(node, checker) {
    let parent = node.parent;
    while (parent) {
        if (ts.isClassDeclaration(parent) && parent.name) {
            // An override or interface implementation can be used through the
            // inherited declaration, so that use does not resolve to this node.
            // Unique members declared by a derived class can still be checked.
            const isStatic = node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.StaticKeyword);
            if (!isStatic && hasInheritedMember(node, parent, checker)) {
                return null;
            }
            return parent.name.getText();
        }
        parent = parent.parent;
    }
    return null;
}

function hasInheritedMember(node, classDeclaration, checker) {
    if (!classDeclaration.heritageClauses) {
        return false;
    }
    if (ts.isComputedPropertyName(node.name)) {
        return true;
    }

    const symbol = checker.getSymbolAtLocation(node.name);
    if (!symbol) {
        return true;
    }

    const memberName = symbol.getName();
    return classDeclaration.heritageClauses.some(clause =>
        clause.types.some(typeNode =>
            !!checker.getPropertyOfType(checker.getTypeAtLocation(typeNode), memberName)
        )
    );
}

function isDeclarationName(node) {
    const parent = node.parent;
    return !!parent && parent.name === node && (
        isMethodLikeDeclaration(parent)
        || ts.isFunctionDeclaration(parent)
        || ts.isImportSpecifier(parent)
        || ts.isClassDeclaration(parent)
    );
}

function markClassAsUsed(symbol, usageNode, checker, declaredClasses, usedClasses) {
    const symbols = [symbol];
    if (symbol.flags & ts.SymbolFlags.Alias) {
        symbols.push(checker.getAliasedSymbol(symbol));
    }

    for (const referencedSymbol of symbols) {
        const candidate = declaredClasses.get(referencedSymbol);
        if (candidate && !isNodeWithin(usageNode, candidate.declaration)) {
            usedClasses.add(referencedSymbol);
        }
    }
}

function isNodeWithin(node, ancestor) {
    for (let current = node; current; current = current.parent) {
        if (current === ancestor) {
            return true;
        }
    }
    return false;
}

function isMethodLikeDeclaration(node) {
    return ts.isMethodDeclaration(node)
        || ts.isGetAccessorDeclaration(node)
        || ts.isSetAccessorDeclaration(node);
}

function isFunctionSymbol(declaration) {
    return ts.isFunctionDeclaration(declaration) || ts.isImportSpecifier(declaration);
}

function removeOverlappingChanges(changes) {
    changes.sort((a, b) => a.start - b.start || a.end - b.end);

    const result = [];
    for (const current of changes) {
        const previous = result[result.length - 1];
        if (previous && current.start <= previous.end) {
            previous.end = Math.max(previous.end, current.end);
        } else {
            result.push({...current});
        }
    }

    return result.reverse();
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
                        changes.push({
                            start: change.span.start,
                            end: change.span.start + change.span.length
                        });
                        sourcesToFix.set(fileName, changes);
                    });
                }
            });

        }
    });

    applyFixes(sourcesToFix);
    return sourcesToFix.size > 0;
}

function runCleanUp(srcDir = path.join(__dirname, "src")) {
    const files = getAllFileNames(srcDir);
    let quickFixesApplied;
    do {
        findUnusedDeclarations(files);
        quickFixesApplied = useTsQuickFix(files);
    } while (unused.length > 0 || quickFixesApplied);
}

exports.runCleanUp = runCleanUp;
