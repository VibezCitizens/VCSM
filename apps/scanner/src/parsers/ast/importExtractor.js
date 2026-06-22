import { calleePropertyName, stringValue, walkAst } from "./parser.js";

export function extractImportsFromAst(ast) {
  const imports = [];

  walkAst(ast, (node) => {
    if (node.type === "ImportDeclaration") {
      imports.push({ importPath: node.source.value, kind: "import" });
    }
    if (node.type === "ExportNamedDeclaration" && node.source) {
      imports.push({ importPath: node.source.value, kind: "re-export" });
    }
    if (node.type === "ExportAllDeclaration" && node.source) {
      imports.push({ importPath: node.source.value, kind: "barrel-export" });
    }
    if (node.type === "CallExpression" && calleePropertyName(node) === "import") {
      const importPath = stringValue(node.arguments?.[0]);
      if (importPath) imports.push({ importPath, kind: "dynamic-import" });
    }
    if (node.type === "CallExpression" && calleePropertyName(node) === "require") {
      const importPath = stringValue(node.arguments?.[0]);
      if (importPath) imports.push({ importPath, kind: "require" });
    }
  });

  return dedupe(imports);
}

function dedupe(imports) {
  const seen = new Set();
  return imports.filter((item) => {
    const key = `${item.kind}:${item.importPath}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
