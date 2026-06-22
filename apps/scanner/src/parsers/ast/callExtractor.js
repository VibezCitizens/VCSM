import { calleePropertyName, nearestFunctionName, propertyName, walkAst } from "./parser.js";

export function extractCallsFromAst(ast) {
  const declarations = [];
  const imports = [];
  const calls = [];

  walkAst(ast, (node, ancestors) => {
    if (node.type === "ImportDeclaration") {
      for (const specifier of node.specifiers ?? []) {
        imports.push({
          local: specifier.local?.name,
          imported: importedName(specifier),
          importPath: node.source.value,
          kind: specifier.type
        });
      }
    }

    const declaration = declarationFromNode(node, ancestors);
    if (declaration) declarations.push(declaration);

    if (node.type === "CallExpression") {
      const callee = calleeName(node);
      if (callee) {
        calls.push({
          caller: nearestFunctionName(ancestors) ?? "<module>",
          callee,
          kind: "call",
          confidence: "HIGH",
          evidence: ["call expression extracted from AST"]
        });
      }
    }

    if (node.type === "JSXElement") {
      const component = jsxName(node.openingElement?.name);
      if (component && /^[A-Z]/.test(component)) {
        calls.push({
          caller: nearestFunctionName(ancestors) ?? "<render>",
          callee: component,
          kind: "jsx",
          confidence: "HIGH",
          evidence: ["JSX component reference extracted from AST"]
        });
      }
    }
  });

  return { declarations: dedupe(declarations, "name"), imports, calls: dedupeCalls(calls) };
}

function declarationFromNode(node, ancestors) {
  if (node.type === "FunctionDeclaration" && node.id?.name) {
    return {
      name: node.id.name,
      kind: "function",
      exported: ancestors.some((ancestor) => ancestor.type?.startsWith("Export")),
      defaultExport: ancestors.some((ancestor) => ancestor.type === "ExportDefaultDeclaration")
    };
  }

  if (node.type === "VariableDeclarator" && node.id?.name && isCallable(node.init)) {
    return {
      name: node.id.name,
      kind: "function",
      exported: ancestors.some((ancestor) => ancestor.type?.startsWith("Export")),
      defaultExport: false
    };
  }

  if (node.type === "ExportDefaultDeclaration") {
    const name = propertyName(node.declaration?.id) ?? propertyName(node.declaration);
    if (name) return { name, kind: "function", exported: true, defaultExport: true };
  }

  return null;
}

function isCallable(node) {
  return node?.type === "ArrowFunctionExpression" || node?.type === "FunctionExpression";
}

function importedName(specifier) {
  if (specifier.type === "ImportDefaultSpecifier") return "default";
  if (specifier.type === "ImportNamespaceSpecifier") return "*";
  return propertyName(specifier.imported);
}

function calleeName(node) {
  if (node.callee?.type === "Identifier") return node.callee.name;
  if (node.callee?.type === "MemberExpression") return calleePropertyName(node);
  return null;
}

function jsxName(node) {
  if (!node) return null;
  if (node.type === "JSXIdentifier") return node.name;
  if (node.type === "JSXMemberExpression") return jsxName(node.property);
  return null;
}

function dedupe(items, field) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item[field];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeCalls(calls) {
  const seen = new Set();
  return calls.filter((call) => {
    const key = `${call.caller}:${call.callee}:${call.kind}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
