import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { createScannerConfig } from "../src/core/config.js";
import { createSourceRecords } from "../src/core/sourceRecords.js";
import { scanCallGraph } from "../src/scanners/callGraphScanner.js";
import { scanRoutes } from "../src/scanners/routeScanner.js";
import { scanRpcs } from "../src/scanners/rpcScanner.js";
import { scanWriteSurfaces } from "../src/scanners/writeSurfaceScanner.js";
import { scanEdgeFunctions } from "../src/scanners/edgeFunctionScanner.js";

test("call graph connects route through screen, hook, controller, DAL, and RPC", async () => {
  const repoRoot = path.resolve("tests/fixtures/callgraph");
  const config = createScannerConfig({
    scannerRoot: process.cwd(),
    repoRoot,
    scanRoots: ["features"]
  });
  config.aliases = new Map();

  const sourceFiles = [
    "features/booking/screens/BookingRoute.jsx",
    "features/booking/screens/BookingScreen.jsx",
    "features/booking/hooks/useBooking.js",
    "features/booking/controller/createBooking.controller.js",
    "features/booking/dal/insertBooking.dal.js"
  ].map((file) => path.join(repoRoot, file));

  const records = await createSourceRecords(config, sourceFiles);
  const routeMap = await scanRoutes(config, records);
  const writeSurfaceMap = await scanWriteSurfaces(config, records);
  const rpcMap = scanRpcs(records);
  const edgeFunctionMap = scanEdgeFunctions(records, writeSurfaceMap);
  const testMap = { tests: [] };
  const dependencyMap = { dependencies: [] };

  const result = await scanCallGraph(config, records, { routeMap, writeSurfaceMap, rpcMap, edgeFunctionMap, testMap, dependencyMap });
  const routePath = result.routeExecutionMap.routeExecutionPaths.find((item) => item.route === "/booking");

  assert.ok(routePath);
  assert.ok(routePath.path.some((item) => item.includes("BookingScreen")));
  assert.ok(routePath.path.some((item) => item.includes("useBooking")));
  assert.ok(routePath.path.some((item) => item.includes("createBookingController")));
  assert.ok(routePath.path.some((item) => item.includes("insertBookingDAL")));
  assert.equal(result.rpcExecutionMap.rpcExecutionPaths.some((item) => item.rpc === "create_booking"), true);
  assert.equal(result.writeExecutionMap.writeExecutionPaths.some((item) => item.table === "bookings"), true);
});
