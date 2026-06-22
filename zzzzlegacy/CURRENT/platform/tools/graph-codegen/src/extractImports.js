const traverse = require("@babel/traverse").default;

function extractImports(ast) {
  const imports = [];

  traverse(ast, {
    ImportDeclaration(path) {
      imports.push({
        source: path.node.source.value,
        specifiers: path.node.specifiers.map((specifier) => ({
          type: specifier.type,
          local: specifier.local?.name || null,
          imported: specifier.imported?.name || "default",
        })),
      });
    },
  });

  return imports;
}

module.exports = {
  extractImports,
};