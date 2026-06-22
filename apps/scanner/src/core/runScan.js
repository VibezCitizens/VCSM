import { collectSourceFiles } from "./fs.js";
import { loadAliases } from "./aliases.js";
import { countField, wrapMap } from "./metadata.js";
import { createSourceRecords } from "./sourceRecords.js";
import { scanDependencies } from "../scanners/dependencyScanner.js";
import { scanEngineCandidates } from "../scanners/engineCandidateScanner.js";
import { scanFeatureImportMap } from "../scanners/featureImportMapScanner.js";
import { scanFeatures } from "../scanners/featureScanner.js";
import { scanRoutes } from "../scanners/routeScanner.js";
import { scanRpcs } from "../scanners/rpcScanner.js";
import { scanEdgeFunctions } from "../scanners/edgeFunctionScanner.js";
import { scanCallGraph } from "../scanners/callGraphScanner.js";
import { scanBarrelReexports } from "../scanners/barrelReexportScanner.js";
import { scanDeadExports } from "../scanners/deadExportScanner.js";
import { scanEngineDiscovery } from "../scanners/engineDiscoveryScanner.js";
import { scanTrafficApp } from "../scanners/trafficAppScanner.js";
import { scanBehaviorGovernance } from "../scanners/behaviorScanner.js";
import { scanIdentityFlows } from "../scanners/identityFlowScanner.js";
import { scanDocumentationDrift } from "../scanners/documentationDriftScanner.js";
import { scanDbPolicies } from "../scanners/dbPolicyScanner.js";
import { scanFindings } from "../scanners/findingScanner.js";
import { scanBehaviorTestCoverage } from "../scanners/behaviorTestCoverageScanner.js";
import { scanRuntimeCosts } from "../scanners/runtimeCostScanner.js";
import { scanNativeParity } from "../scanners/nativeParityScanner.js";
import { scanBusinessImpact } from "../scanners/businessImpactScanner.js";
import { scanGovernanceGraph } from "../scanners/governanceGraphScanner.js";
import { discoverGovernanceDocuments } from "../scanners/governanceUtils.js";
import { scanTests } from "../scanners/testScanner.js";
import { scanWriteSurfaces } from "../scanners/writeSurfaceScanner.js";
import { scanScreens } from "../scanners/screenScanner.js";
import { buildGraph } from "../graph/buildGraph.js";
import { writeMaps } from "../outputs/writeMaps.js";
import { writeValidationReport } from "../outputs/writeValidationReport.js";
import { writeAstReadinessReport } from "../outputs/writeAstReadinessReport.js";
import { writeCallGraphReport } from "../outputs/writeCallGraphReport.js";
import { writeEngineReadinessReport } from "../outputs/writeEngineReadinessReport.js";
import { writeEngineValidationReport } from "../outputs/writeEngineValidationReport.js";
import { writeTrafficReadinessReport } from "../outputs/writeTrafficReadinessReport.js";
import { writeScreensReport } from "../outputs/writeScreensReport.js";
import { writeGovernanceIntelligenceReport } from "../outputs/writeGovernanceIntelligenceReport.js";
import { writeFeatureImportMap } from "../outputs/writeFeatureImportMap.js";
import { validateMaps } from "../validation/validateMaps.js";
import { validateEngineMaps } from "../validation/validateEngineMaps.js";
import { validateGovernanceMaps } from "../validation/validateGovernanceMaps.js";

export async function runScan(config) {
  const startedAt = Date.now();
  config.aliases = await loadAliases(config);
  const sourceFiles = await collectSourceFiles(config);
  const sourceRecords = await createSourceRecords(config, sourceFiles);
  const featureMap = await scanFeatures(config);
  const dependencyMap = await scanDependencies(config, sourceRecords);
  const routeMap = await scanRoutes(config, sourceRecords);
  const writeSurfaceMap = await scanWriteSurfaces(config, sourceRecords);
  const screenMap = scanScreens(config, sourceRecords, { routeMap });
  const rpcMap = scanRpcs(sourceRecords);
  const edgeFunctionMap = scanEdgeFunctions(sourceRecords, writeSurfaceMap);
  const testMap = scanTests(config, sourceRecords, featureMap);
  const callGraphMaps = await scanCallGraph(config, sourceRecords, { routeMap, writeSurfaceMap, rpcMap, edgeFunctionMap, testMap, dependencyMap });
  const barrelMaps = scanBarrelReexports(config, sourceRecords, callGraphMaps.reexportIndex, callGraphMaps.barrelResolutions);
  const deadExportMap = scanDeadExports(config, sourceRecords, callGraphMaps.callGraph);
  const engineDiscoveryMaps = await scanEngineDiscovery(config, sourceRecords, {
    dependencyMap,
    writeSurfaceMap,
    rpcMap,
    edgeFunctionMap,
    callGraphMaps
  });
  const trafficAppMap = await scanTrafficApp(config, sourceRecords, {
    featureMap,
    routeMap,
    writeSurfaceMap,
    rpcMap,
    edgeFunctionMap,
    testMap,
    dependencyMap,
    engineConsumerMap: engineDiscoveryMaps.engineConsumerMap
  });
  const behaviorGovernanceMaps = await scanBehaviorGovernance(config, sourceRecords, {
    featureMap,
    routeMap,
    screenMap,
    writeSurfaceMap,
    rpcMap,
    edgeFunctionMap,
    testMap,
    testTraceabilityMap: callGraphMaps.testTraceabilityMap
  });
  const governanceDocs = await discoverGovernanceDocuments(config);
  const identityFlowMap = scanIdentityFlows(sourceRecords, {
    behaviorSurfaceMap: behaviorGovernanceMaps.behaviorSurfaceMap,
    writeSurfaceMap,
    rpcMap,
    edgeFunctionMap
  });
  const documentationDriftMap = scanDocumentationDrift(sourceRecords, governanceDocs, behaviorGovernanceMaps);
  const dbPolicyMap = await scanDbPolicies(config, { writeSurfaceMap, rpcMap });
  const findingMap = scanFindings(governanceDocs, behaviorGovernanceMaps);
  const behaviorTestCoverageMap = scanBehaviorTestCoverage({
    behaviorSurfaceMap: behaviorGovernanceMaps.behaviorSurfaceMap,
    policyMap: behaviorGovernanceMaps.policyMap,
    testMap
  });
  const runtimeCostMap = scanRuntimeCosts(sourceRecords, { behaviorSurfaceMap: behaviorGovernanceMaps.behaviorSurfaceMap });
  const nativeParityMap = await scanNativeParity(config, { behaviorMap: behaviorGovernanceMaps.behaviorMap });
  const businessImpactMap = scanBusinessImpact({
    behaviorSurfaceMap: behaviorGovernanceMaps.behaviorSurfaceMap,
    findingMap,
    policyMap: behaviorGovernanceMaps.policyMap
  });
  const governanceGraphMap = scanGovernanceGraph({
    behaviorMap: behaviorGovernanceMaps.behaviorMap,
    behaviorSurfaceMap: behaviorGovernanceMaps.behaviorSurfaceMap,
    behaviorDocumentMap: behaviorGovernanceMaps.behaviorDocumentMap,
    ownershipMap: behaviorGovernanceMaps.ownershipMap,
    policyMap: behaviorGovernanceMaps.policyMap,
    findingMap
  });
  const graph = buildGraph({ featureMap, dependencyMap, routeMap, writeSurfaceMap, testMap, sourceRecords, callGraphMaps });
  const engineCandidates = scanEngineCandidates({ featureMap, dependencyMap, writeSurfaceMap, rpcMap });
  const featureImportMap = scanFeatureImportMap({ featureMap, dependencyMap });

  const maps = {
    "feature-map.json": wrapMap({ config, startedAt, data: featureMap, counts: countField("featureCount", featureMap.features) }),
    "dependency-map.json": wrapMap({ config, startedAt, data: dependencyMap, counts: countField("dependencyCount", dependencyMap.dependencies) }),
    "route-map.json": wrapMap({ config, startedAt, data: routeMap, counts: countField("routeCount", routeMap.routes) }),
    "screen-map.json": wrapMap({ config, startedAt, data: screenMap, counts: countField("screenCount", screenMap.screens) }),
    "write-surface-map.json": wrapMap({ config, startedAt, data: writeSurfaceMap, counts: countField("writeSurfaceCount", writeSurfaceMap.writeSurfaces) }),
    "rpc-map.json": wrapMap({ config, startedAt, data: rpcMap, counts: countField("rpcCount", rpcMap.rpcs) }),
    "edge-function-map.json": wrapMap({ config, startedAt, data: edgeFunctionMap, counts: countField("edgeFunctionCount", edgeFunctionMap.edgeFunctions) }),
    "callgraph.json": wrapMap({ config, startedAt, data: callGraphMaps.callGraph, counts: { callNodeCount: callGraphMaps.callGraph.nodes.length, callEdgeCount: callGraphMaps.callGraph.edges.length } }),
    "route-execution-map.json": wrapMap({ config, startedAt, data: callGraphMaps.routeExecutionMap, counts: countField("routeExecutionPathCount", callGraphMaps.routeExecutionMap.routeExecutionPaths) }),
    "write-execution-map.json": wrapMap({ config, startedAt, data: callGraphMaps.writeExecutionMap, counts: countField("writeExecutionPathCount", callGraphMaps.writeExecutionMap.writeExecutionPaths) }),
    "rpc-execution-map.json": wrapMap({ config, startedAt, data: callGraphMaps.rpcExecutionMap, counts: countField("rpcExecutionPathCount", callGraphMaps.rpcExecutionMap.rpcExecutionPaths) }),
    "edge-execution-map.json": wrapMap({ config, startedAt, data: callGraphMaps.edgeExecutionMap, counts: countField("edgeExecutionPathCount", callGraphMaps.edgeExecutionMap.edgeExecutionPaths) }),
    "test-traceability-map.json": wrapMap({ config, startedAt, data: callGraphMaps.testTraceabilityMap, counts: countField("testTraceabilityCount", callGraphMaps.testTraceabilityMap.testTraceability) }),
    "security-path-map.json": wrapMap({ config, startedAt, data: callGraphMaps.securityPathMap, counts: countField("securityPathCount", callGraphMaps.securityPathMap.securityPaths) }),
    "engine-map.json": wrapMap({ config, startedAt, data: engineDiscoveryMaps.engineMap, counts: countField("engineCount", engineDiscoveryMaps.engineMap.engines) }),
    "engine-graph.json": wrapMap({ config, startedAt, data: engineDiscoveryMaps.engineGraph, counts: { engineGraphNodeCount: engineDiscoveryMaps.engineGraph.nodes.length, engineGraphEdgeCount: engineDiscoveryMaps.engineGraph.edges.length } }),
    "engine-consumer-map.json": wrapMap({ config, startedAt, data: engineDiscoveryMaps.engineConsumerMap, counts: countField("engineConsumerCount", engineDiscoveryMaps.engineConsumerMap.engines) }),
    "engine-entrypoint-map.json": wrapMap({ config, startedAt, data: engineDiscoveryMaps.engineEntrypointMap, counts: countField("engineEntrypointCount", engineDiscoveryMaps.engineEntrypointMap.engines) }),
    "engine-ownership-map.json": wrapMap({ config, startedAt, data: engineDiscoveryMaps.engineOwnershipMap, counts: countField("engineOwnershipCount", engineDiscoveryMaps.engineOwnershipMap.engines) }),
    "engine-security-map.json": wrapMap({ config, startedAt, data: engineDiscoveryMaps.engineSecurityMap, counts: countField("engineSecurityCount", engineDiscoveryMaps.engineSecurityMap.engines) }),
    "engine-execution-map.json": wrapMap({ config, startedAt, data: engineDiscoveryMaps.engineExecutionMap, counts: countField("engineExecutionPathCount", engineDiscoveryMaps.engineExecutionMap.engineExecutionPaths) }),
    "traffic-app-map.json": wrapMap({ config, startedAt, data: trafficAppMap, counts: { trafficFeatureCount: trafficAppMap.app.features, trafficRouteCount: trafficAppMap.app.routes } }),
    "behavior-map.json": wrapMap({ config, startedAt, confidence: "MEDIUM", data: behaviorGovernanceMaps.behaviorMap, counts: { behaviorFeatureCount: behaviorGovernanceMaps.behaviorMap.features.length, behaviorModuleCount: behaviorGovernanceMaps.behaviorMap.modules.length, behaviorCount: behaviorGovernanceMaps.behaviorMap.behaviors.length } }),
    "behavior-surface-map.json": wrapMap({ config, startedAt, confidence: "MEDIUM", data: behaviorGovernanceMaps.behaviorSurfaceMap, counts: countField("behaviorSurfaceCount", behaviorGovernanceMaps.behaviorSurfaceMap.behaviorSurfaces) }),
    "behavior-document-map.json": wrapMap({ config, startedAt, confidence: "MEDIUM", data: behaviorGovernanceMaps.behaviorDocumentMap, counts: countField("behaviorDocumentCoverageCount", behaviorGovernanceMaps.behaviorDocumentMap.documents) }),
    "ownership-map.json": wrapMap({ config, startedAt, confidence: "MEDIUM", data: behaviorGovernanceMaps.ownershipMap, counts: countField("behaviorOwnershipCount", behaviorGovernanceMaps.ownershipMap.ownership) }),
    "policy-map.json": wrapMap({ config, startedAt, confidence: "MEDIUM", data: behaviorGovernanceMaps.policyMap, counts: countField("policyCount", behaviorGovernanceMaps.policyMap.policies) }),
    "identity-flow-map.json": wrapMap({ config, startedAt, confidence: "MEDIUM", data: identityFlowMap, counts: { identityFlowCount: identityFlowMap.identityFlows.length, identityRiskFindingCount: identityFlowMap.riskFindings.length } }),
    "documentation-drift-map.json": wrapMap({ config, startedAt, confidence: "MEDIUM", data: documentationDriftMap, counts: countField("documentationDriftCount", documentationDriftMap.drift) }),
    "db-policy-map.json": wrapMap({ config, startedAt, confidence: "MEDIUM", data: dbPolicyMap, counts: { dbTableCount: dbPolicyMap.tables.length, dbRpcCount: dbPolicyMap.rpcs.length, dbPolicyUnverifiedCount: dbPolicyMap.unverified.length } }),
    "finding-map.json": wrapMap({ config, startedAt, confidence: "MEDIUM", data: findingMap, counts: countField("findingCount", findingMap.findings) }),
    "behavior-test-coverage-map.json": wrapMap({ config, startedAt, confidence: "MEDIUM", data: behaviorTestCoverageMap, counts: countField("behaviorTestCoverageCount", behaviorTestCoverageMap.behaviorTestCoverage) }),
    "runtime-cost-map.json": wrapMap({ config, startedAt, confidence: "MEDIUM", data: runtimeCostMap, counts: countField("runtimeCostCount", runtimeCostMap.runtimeCosts) }),
    "native-parity-map.json": wrapMap({ config, startedAt, confidence: "MEDIUM", data: nativeParityMap, counts: countField("nativeParityCount", nativeParityMap.nativeParity) }),
    "business-impact-map.json": wrapMap({ config, startedAt, confidence: "MEDIUM", data: businessImpactMap, counts: countField("businessImpactCount", businessImpactMap.businessImpact) }),
    "behavior-coverage-map.json": wrapMap({ config, startedAt, confidence: "MEDIUM", data: behaviorGovernanceMaps.behaviorCoverageMap, counts: countField("behaviorCoverageCount", behaviorGovernanceMaps.behaviorCoverageMap.coverage) }),
    "governance-graph.json": wrapMap({ config, startedAt, confidence: "MEDIUM", data: governanceGraphMap, counts: { governanceNodeCount: governanceGraphMap.nodes.length, governanceEdgeCount: governanceGraphMap.edges.length } }),
    "reexport-map.json": wrapMap({ config, startedAt, data: barrelMaps.reexportMap, counts: countField("reexportCount", barrelMaps.reexportMap.reexports) }),
    "symbol-resolution-map.json": wrapMap({ config, startedAt, data: barrelMaps.symbolResolutionMap, counts: countField("resolutionCount", barrelMaps.symbolResolutionMap.resolutions) }),
    "dead-export-map.json": wrapMap({ config, startedAt, data: deadExportMap, counts: countField("deadExportCount", deadExportMap.deadExports) }),
    "test-map.json": wrapMap({ config, startedAt, data: testMap, counts: countField("testCount", testMap.tests) }),
    "graph.json": wrapMap({ config, startedAt, data: graph, counts: { nodeCount: graph.nodes.length, edgeCount: graph.edges.length } }),
    "engine-candidates.json": wrapMap({ config, startedAt, confidence: "MEDIUM", data: engineCandidates, counts: countField("engineCandidateCount", engineCandidates.engineCandidates) })
  };

  await writeMaps(config, maps);
  const validationResults = validateMaps(maps);
  const engineValidation = validateEngineMaps(maps);
  const governanceValidation = validateGovernanceMaps(maps);
  await writeValidationReport(config, maps, validationResults);
  await writeAstReadinessReport(config, maps);
  await writeCallGraphReport(config, maps);
  await writeEngineReadinessReport(config, maps, engineValidation);
  await writeEngineValidationReport(config, engineValidation);
  await writeTrafficReadinessReport(config, maps);
  await writeScreensReport(config, screenMap);
  await writeGovernanceIntelligenceReport(config, maps, governanceValidation);
  await writeFeatureImportMap(config, featureImportMap);

  return {
    sourceFileCount: sourceFiles.length,
    outputRoot: config.outputRoot,
    violations: featureImportMap.total_violations,
    missingAdapters: featureImportMap.missing_adapter_count,
    maps
  };
}
