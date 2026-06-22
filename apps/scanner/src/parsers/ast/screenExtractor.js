import { isFunctionLike, walkAst } from "./parser.js";

export function extractScreensFromAst(ast) {
  if (!ast) return [];
  const screens = [];

  walkAst(ast, (node, ancestors) => {
    if (node.type === "FunctionDeclaration" && isScreenName(node.id?.name)) {
      const exported = ancestors.some((a) => a.type?.startsWith("Export"));
      const defaultExport = ancestors.some((a) => a.type === "ExportDefaultDeclaration");
      screens.push(screenEntry(node.id.name, node.body, exported, defaultExport));
    }

    if (node.type === "VariableDeclarator" && isScreenName(node.id?.name) && isFunctionLike(node.init)) {
      const exported = ancestors.some((a) => a.type?.startsWith("Export"));
      screens.push(screenEntry(node.id.name, functionBody(node.init), exported, false));
    }

    if (node.type === "ExportDefaultDeclaration") {
      const decl = node.declaration;
      if (isFunctionLike(decl) && isScreenName(decl.id?.name ?? null)) {
        screens.push(screenEntry(decl.id.name, functionBody(decl), true, true));
      }
    }
  });

  return dedupe(screens);
}

function screenEntry(name, body, exported, defaultExport) {
  const hookNames = collectHooks(body);
  return {
    name,
    exported,
    defaultExport,
    hasHooks: hookNames.length > 0,
    hookNames
  };
}

function collectHooks(body) {
  if (!body) return [];
  const names = [];
  walkAst(body, (node) => {
    if (
      node.type === "CallExpression" &&
      node.callee?.type === "Identifier" &&
      /^use[A-Z]/.test(node.callee.name)
    ) {
      names.push(node.callee.name);
    }
  });
  return [...new Set(names)];
}

function functionBody(node) {
  if (!node) return null;
  if (node.type === "ArrowFunctionExpression" || node.type === "FunctionExpression") {
    return node.body ?? null;
  }
  return null;
}

function isScreenName(name) {
  return typeof name === "string" && /Screen$/.test(name);
}

function dedupe(screens) {
  const seen = new Set();
  return screens.filter((s) => {
    if (seen.has(s.name)) return false;
    seen.add(s.name);
    return true;
  });
}
