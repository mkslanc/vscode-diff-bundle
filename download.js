var base = "https://raw.githubusercontent.com/microsoft/vscode/refs/heads/main/"

var first = "src/vs/editor/common/diff/defaultLinesDiffComputer/defaultLinesDiffComputer.ts"

var fs = require("fs")
var Path = require("path")

fs.rmSync("./src/vs", {
    recursive: true,
    force: true
})
var downloaded = {
};
var paths = [first];
async function getFiles() {
    for (var i = 0; i < paths.length; i++) {
        var path = paths[i]
        // console.log(downloaded[path])
        if (downloaded[path]) continue;
        downloaded[path] = true;
        console.log("###" + i + "/" + paths.length, path);

        var s = await fetch(base + path)
        var text = await s.text();
        if (s.status != 200) {
            console.error(s.status, text);
            continue;
        }

        var dirname = Path.dirname(path)
        fs.mkdirSync(dirname, {recursive: true})
        fs.writeFileSync(path, text, "utf8")
        
        var imports = [];
        text.replace(/(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$|`([^`\\]|\\.)*`)/gm, "")
            .replace(/from\s*('[^'\n]+'|"[^"\n]+")/g, function(_, importPath) {
                var importPath = importPath.slice(1, -1).replace(".js", ".ts")
                imports.push(Path.join(dirname, importPath).replace(/\\/g, "/"))
            });
        console.log(imports)
        paths.push(...imports);
        // await getFiles(imports)
    }
    // console.log(i, paths)
}

!(async function() {
    try {
        await getFiles()
    } catch(e) {
        console.error(e)
    }
})()

process.on("uncaughtException", console.log)