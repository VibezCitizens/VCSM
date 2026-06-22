import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { parseSourceAst } from "../src/parsers/ast/parser.js";
import { extractImportsFromAst } from "../src/parsers/ast/importExtractor.js";
import { extractRoutesFromAst } from "../src/parsers/ast/routeExtractor.js";
import { extractTestsFromAst } from "../src/parsers/ast/testExtractor.js";
import { extractWritesFromAst } from "../src/parsers/ast/writeExtractor.js";

test("AST extractors discover imports, routes, writes, RPCs, edge calls, and tests", async () => {
  const source = await fs.readFile(new URL("./fixtures/sampleSource.jsx", import.meta.url), "utf8");
  const { ast, parseError } = parseSourceAst(source, "sampleSource.jsx");
  assert.equal(parseError, null);

  const imports = extractImportsFromAst(ast);
  assert.deepEqual(imports.map((item) => item.importPath), [
    "@/features/booking",
    "@booking",
    "@/features/shared",
    "@booking"
  ]);

  const routes = extractRoutesFromAst(ast);
  assert.ok(routes.some((route) => route.route === "/booking/:id" && route.routeType === "dynamic"));
  assert.ok(routes.some((route) => route.route === "*" && route.routeType === "wildcard"));
  assert.ok(routes.some((route) => route.route === "/settings"));

  const writes = extractWritesFromAst(ast);
  assert.equal(writes.writes.find((item) => item.operation === "insert")?.table, "bookings");
  assert.equal(writes.rpcs[0].rpc, "create_booking_event");
  assert.equal(writes.edgeCalls.some((item) => item.functionName === "send-booking-confirmation"), true);
  assert.equal(writes.edgeCalls.some((item) => item.operation === "post"), true);

  const tests = extractTestsFromAst(ast);
  assert.deepEqual(tests.map((item) => item.call), ["describe", "it"]);
});
