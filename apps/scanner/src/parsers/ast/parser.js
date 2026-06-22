import { parse } from "@babel/parser";

export function parseSourceAst(source, filePath = "") {
  const plugins = ["jsx", "importMeta", "dynamicImport"];
  if (/\.[cm]?tsx?$/.test(filePath)) plugins.push("typescript");

  try {
    return {
      ast: parse(source, {
        sourceType: "unambiguous",
        errorRecovery: true,
        plugins
      }),
      parseError: null
    };
  } catch (error) {
    return { ast: null, parseError: error.message };
  }
}

export function walkAst(node, visitor, ancestors = []) {
  if (!node || typeof node !== "object") return;
  visitor(node, ancestors);

  for (const [key, value] of Object.entries(node)) {
    if (key === "loc" || key === "start" || key === "end" || key === "extra") continue;
    if (Array.isArray(value)) {
      for (const child of value) {
        if (child?.type) walkAst(child, visitor, [...ancestors, node]);
      }
    } else if (value?.type) {
      walkAst(value, visitor, [...ancestors, node]);
    }
  }
}

export function nearestFunctionName(ancestors) {
  for (const node of [...ancestors].reverse()) {
    if (node.type === "FunctionDeclaration") return node.id?.name ?? null;
    if (node.type === "ObjectMethod") return propertyName(node.key);
    if (node.type === "ClassMethod") return propertyName(node.key);
    if (node.type === "VariableDeclarator" && isFunctionLike(node.init)) return node.id?.name ?? null;
    if (node.type === "AssignmentExpression" && isFunctionLike(node.right)) return propertyName(node.left);
  }
  return null;
}

export function propertyName(node) {
  if (!node) return null;
  if (node.type === "Identifier") return node.name;
  if (node.type === "StringLiteral") return node.value;
  if (node.type === "NumericLiteral") return String(node.value);
  if (node.type === "MemberExpression") return propertyName(node.property);
  return null;
}

export function stringValue(node) {
  if (!node) return null;
  if (node.type === "StringLiteral") return node.value;
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) return node.quasis[0]?.value?.cooked ?? null;
  return null;
}

export function isFunctionLike(node) {
  return node?.type === "FunctionExpression" || node?.type === "ArrowFunctionExpression";
}

export function calleePropertyName(node) {
  if (node?.type !== "CallExpression") return null;
  if (node.callee?.type === "MemberExpression") return propertyName(node.callee.property);
  if (node.callee?.type === "Identifier") return node.callee.name;
  if (node.callee?.type === "Import") return "import";
  return null;
}

export function findCallArgInChain(node, methodName) {
  if (!node) return null;
  if (node.type === "CallExpression" && calleePropertyName(node) === methodName) {
    return stringValue(node.arguments?.[0]);
  }
  if (node.type === "CallExpression") return findCallArgInChain(node.callee?.object, methodName);
  if (node.type === "MemberExpression") return findCallArgInChain(node.object, methodName);
  return null;
}
