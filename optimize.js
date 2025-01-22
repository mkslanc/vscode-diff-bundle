var CharCode = require("./src/vs/base/common/charCode.ts").CharCode
var fs = require("fs")
var path = require("path")
var runCleanUp = require("clean_unused").runCleanUp;

function replaceInFiles(path, fn) {
    var stat = fs.statSync(path)
    if (stat.isDirectory()) {
        var files = fs.readdirSync(path)
        files.forEach(function(x) {
            replaceInFiles(path + "/" + x, fn)
        })
    } else if (stat.isFile()) {
        var text = fs.readFileSync(path, "utf8")
        var newText = fn(text, path)
        if (newText != text && typeof newText == "string") {
            console.log("Changed:", path)
            fs.writeFileSync(path/* + ".diff"*/, newText, "utf8")
        }
    } 
}


replaceInFiles("src", function(src, path) {
    if (/charcode/i.test(path)) return;
    src = src.replace(/(function assertFn\(condition: \(\) => boolean\): void {)[\s\S]*?^}/m, "$1\n\tcondition();\n}")
    
    src = src.replace(/^export class CallbackIterable[\s\S]*?^}/gm, "");
    src = src.replace(/^export namespace CompareResult[\s\S]*?^}/gm, "");
    
    src = src.replace(/^\tpublic toTextEdit[\s\S]*?^\t}/gm, "");

    src = src.replace(/\bCharCode\.([\w]+)/g, function(_, v) {
        if (!CharCode[v]) {
            console.error(v, _, path)
            return _;
        }
        // console.log(v, CharCode[v], path)
        return CharCode[v];
    })

    return src;
})

var changed = false;
replaceInFiles(path.dirname(require.resolve("rollup")), function(src) {
    if (/rawInputOptions.treeshake = "smallest"/.test(src)) {
        changed = true;
        return;
    }
    var newSrc =  src.replace("rollup(rawInputOptions) {", '$& rawInputOptions.treeshake = "smallest";')
    if (/rawInputOptions.treeshake = "smallest"/.test(newSrc)) {
        changed = true;
    }
    return newSrc;
}) 

if (!changed) throw new Error("rollup not optimized");

runCleanUp();