import test from "node:test";
import assert from "node:assert/strict";
import { validateEngineMaps } from "../src/validation/validateEngineMaps.js";

test("engine validation checks schema, ownership, security, and readiness", () => {
  const maps = {
    "engine-map.json": {
      data: {
        engines: [
          { engine: "booking", path: "engines/booking", hasClaude: true, exports: 2, entrypoints: 2, controllers: 1, dals: 1, rpcs: 1, edgeFunctions: 0, tests: 1, confidence: "HIGH" },
          { engine: "hydration", path: "engines/hydration", hasClaude: false, exports: 1, entrypoints: 1, controllers: 0, dals: 0, rpcs: 0, edgeFunctions: 0, tests: 0, confidence: "HIGH" }
        ]
      }
    },
    "engine-graph.json": {
      data: { nodes: [{ id: "engine:booking", type: "EngineNode" }], edges: [{ from: "engine:booking", to: "dal:x", type: "OWNS_DAL" }] }
    },
    "engine-consumer-map.json": {
      data: {
        engines: [
          { engine: "booking", consumers: ["VCSM:booking"], confidence: "HIGH" },
          { engine: "hydration", consumers: [], confidence: "MEDIUM" }
        ]
      }
    },
    "engine-entrypoint-map.json": {
      data: {
        engines: [
          { engine: "booking", path: "engines/booking", entrypoints: ["createBooking"], confidence: "HIGH" },
          { engine: "hydration", path: "engines/hydration", entrypoints: ["hydrate"], confidence: "HIGH" }
        ]
      }
    },
    "engine-ownership-map.json": {
      data: {
        engines: [
          { engine: "booking", path: "engines/booking", hasClaude: true, ownership: "Booking", responsibility: "booking", allowedConsumers: [], boundaryRules: [], confidence: "MEDIUM" },
          { engine: "hydration", path: "engines/hydration", hasClaude: false, ownership: null, responsibility: null, allowedConsumers: [], boundaryRules: [], confidence: "LOW" }
        ]
      }
    },
    "engine-security-map.json": {
      data: {
        engines: [
          { engine: "booking", writes: 4, rpcs: 1, edgeFunctions: 0, externalApis: 0, riskTier: "MEDIUM", surfaces: {}, confidence: "HIGH" },
          { engine: "hydration", writes: 0, rpcs: 0, edgeFunctions: 0, externalApis: 0, riskTier: "LOW", surfaces: {}, confidence: "HIGH" }
        ]
      }
    },
    "engine-execution-map.json": {
      data: {
        engineExecutionPaths: [
          { engine: "engine:booking", confidence: "HIGH", evidence: [] }
        ]
      }
    }
  };

  const result = validateEngineMaps(maps);
  assert.equal(result.schemaResults.every((entry) => entry.status === "PASS"), true);
  assert.equal(result.ownershipResults.find((entry) => entry.engine === "hydration").status, "WARNING");
  assert.equal(result.securityResults.find((entry) => entry.engine === "booking").riskTier, "MEDIUM");
  assert.equal(result.readinessResults.find((entry) => entry.engine === "booking").score > result.readinessResults.find((entry) => entry.engine === "hydration").score, true);
});
