
var computeDiff =  require("./dist/index.js").computeDiff
var nn = 4
var moved = "yyy\nbbb\n".repeat(4) 
var text1 = moved + "hello\nworld\n111\n".repeat(nn) + "\n"
var text2 = "Hello\nworlD\n111\n".repeat(nn) + "\n"
var text2 = "hello\nworld\n111\n".repeat(nn) + "\n" + "f"+ moved
var diff = computeDiff(
    text1.split("\n"),
    text2.split("\n"), {
        maxComputationTimeMs: 10000,
        computeMoves: true,
        computeDiff: true,
        ignoreTrimWhitespace: true,
    }
)
console.log(diff)
console.log(diff[0].charChanges)

