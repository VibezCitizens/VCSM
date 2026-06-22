const fs = require("fs");
const parser = require("@babel/parser");

function parseFile(filePath) {
  const code = fs.readFileSync(filePath, "utf8");

  return parser.parse(code, {
    sourceType: "module",
    plugins: [
      "jsx",
      "classProperties",
      "dynamicImport",
      "optionalChaining",
      "nullishCoalescingOperator",
    ],
    errorRecovery: true,
  });
}

module.exports = {
  parseFile,
};