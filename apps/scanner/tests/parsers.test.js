import test from "node:test";
import assert from "node:assert/strict";
import { parseImports } from "../src/parsers/imports.js";
import { parseReactRoutes } from "../src/parsers/routes.js";
import { parseWriteSurfaces } from "../src/parsers/writeSurfaces.js";

test("parseImports discovers static and dynamic imports", () => {
  const imports = parseImports(`
    import x from "@/features/booking";
    export { y } from "../shared/y";
    const z = await import("engines/booking");
  `);

  assert.deepEqual(imports, ["@/features/booking", "../shared/y", "engines/booking"]);
});

test("parseReactRoutes discovers route object and JSX paths", () => {
  const routes = parseReactRoutes(`
    const routes = [{ path: "/booking/:id" }];
    <Route path="/settings" element={<Settings />} />
  `);

  assert.deepEqual(routes, ["/booking/:id", "/settings"]);
});

test("parseWriteSurfaces discovers Supabase writes and functions", () => {
  const surfaces = parseWriteSurfaces(`
    await supabase.schema("vc").from("bookings").insert(row);
    await supabase.rpc("create_event", {});
    await supabase.functions.invoke("send-push-notification", {});
  `);

  assert.equal(surfaces[0].operation, "insert");
  assert.equal(surfaces[0].table, "bookings");
  assert.equal(surfaces[1].operation, "rpc");
  assert.equal(surfaces[1].rpc, "create_event");
  assert.equal(surfaces[2].operation, "edge_function");
  assert.equal(surfaces[2].functionName, "send-push-notification");
});
