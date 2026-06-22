import { calleePropertyName, findCallArgInChain, nearestFunctionName, stringValue, walkAst } from "./parser.js";

const WRITE_METHODS = new Set(["insert", "update", "delete", "upsert"]);
const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function extractWritesFromAst(ast) {
  const writes = [];
  const rpcs = [];
  const edgeCalls = [];

  walkAst(ast, (node, ancestors) => {
    if (node.type !== "CallExpression") return;

    const method = calleePropertyName(node);
    const caller = nearestFunctionName(ancestors);

    if (WRITE_METHODS.has(method)) {
      const table = findCallArgInChain(node.callee?.object, "from");
      if (table) {
        writes.push({
          operation: method,
          schema: findCallArgInChain(node.callee?.object, "schema"),
          table,
          rpc: null,
          functionName: null,
          function: caller,
          confidence: "HIGH",
          evidence: ["Supabase write call extracted from AST"]
        });
      }
    }

    if (method === "rpc") {
      const rpc = stringValue(node.arguments?.[0]);
      if (rpc) {
        const entry = {
          operation: "rpc",
          schema: findCallArgInChain(node.callee?.object, "schema"),
          table: null,
          rpc,
          functionName: null,
          function: caller,
          confidence: "HIGH",
          evidence: ["RPC call extracted from AST"]
        };
        writes.push(entry);
        rpcs.push({ rpc, caller, schema: entry.schema, confidence: "HIGH", evidence: ["rpc() extracted from AST"] });
      }
    }

    if (method === "invoke") {
      const functionName = stringValue(node.arguments?.[0]);
      if (functionName) {
        const entry = {
          operation: "edge_function",
          functionName,
          caller,
          confidence: "HIGH",
          evidence: ["Supabase function invoke extracted from AST"]
        };
        writes.push({ ...entry, schema: null, table: null, rpc: null, function: caller });
        edgeCalls.push(entry);
      }
    }

    if (method === "fetch") {
      const mutationMethod = fetchMethod(node);
      if (mutationMethod) {
        edgeCalls.push({
          operation: mutationMethod.toLowerCase(),
          functionName: stringValue(node.arguments?.[0]) ?? "fetch",
          caller,
          confidence: "HIGH",
          evidence: ["mutation fetch extracted from AST"]
        });
      }
    }
  });

  return { writes, rpcs, edgeCalls };
}

function fetchMethod(node) {
  const init = node.arguments?.[1];
  if (!init || init.type !== "ObjectExpression") return null;
  const methodProperty = init.properties.find((property) => property.key?.name === "method" || property.key?.value === "method");
  const method = stringValue(methodProperty?.value)?.toUpperCase();
  return MUTATION_METHODS.has(method) ? method : null;
}
