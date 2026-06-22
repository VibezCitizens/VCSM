import { calleePropertyName, stringValue, walkAst } from "./parser.js";

const TEST_CALLS = new Set(["describe", "it", "test"]);

export function extractTestsFromAst(ast) {
  const tests = [];

  walkAst(ast, (node) => {
    if (node.type !== "CallExpression") return;
    const call = calleePropertyName(node);
    if (!TEST_CALLS.has(call)) return;
    tests.push({
      call,
      name: stringValue(node.arguments?.[0]) ?? null,
      confidence: "HIGH",
      evidence: ["test declaration extracted from AST"]
    });
  });

  return tests;
}
