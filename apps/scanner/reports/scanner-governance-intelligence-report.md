# Scanner Governance Intelligence Report

Generated: 2026-06-08T13:39:07.000Z
Root: /Users/vcsm/Desktop/VCSM

## New Maps Created
- behavior-map.json
- policy-map.json
- identity-flow-map.json
- ownership-map.json
- documentation-drift-map.json
- db-policy-map.json
- finding-map.json
- behavior-test-coverage-map.json
- runtime-cost-map.json
- native-parity-map.json
- business-impact-map.json
- governance-graph.json

## Counts Per Map
- behavior-map.json: behaviorFeatureCount=48, behaviorModuleCount=160, behaviorCount=1113
- policy-map.json: policyCount=19254
- identity-flow-map.json: identityFlowCount=8143, identityRiskFindingCount=899
- ownership-map.json: behaviorOwnershipCount=1113
- documentation-drift-map.json: documentationDriftCount=771
- db-policy-map.json: dbTableCount=116, dbRpcCount=68, dbPolicyUnverifiedCount=173
- finding-map.json: findingCount=4459
- behavior-test-coverage-map.json: behaviorTestCoverageCount=1113
- runtime-cost-map.json: runtimeCostCount=1113
- native-parity-map.json: nativeParityCount=1113
- business-impact-map.json: businessImpactCount=1113
- governance-graph.json: governanceNodeCount=24973, governanceEdgeCount=193093

## Example: Dashboard / Leads
- Behavior: BEH-DASHBOARD-LEADS-001 DASH Leads
- Surfaces: controllers=0, dals=0, tests=0
- Test coverage: MISSING
- Business impact: CRITICAL

## Validation
- behavior-map.json: PASS
- policy-map.json: PASS
- identity-flow-map.json: PASS
- ownership-map.json: PASS
- documentation-drift-map.json: PASS
- db-policy-map.json: PASS
- finding-map.json: PASS
- behavior-test-coverage-map.json: PASS
- runtime-cost-map.json: PASS
- native-parity-map.json: PASS
- business-impact-map.json: PASS
- governance-graph.json: PASS
- finding statuses: PASS
- business impact levels: PASS

## Known Limitations
- Behavior inference from code names is deterministic but semantic confidence is lower than BEHAVIOR.md extraction.
- Identity-flow classification is static and context-window based; it does not execute code.
- DB policy verification depends on migration files available in the workspace, not live database state.
- Native parity uses token matching against native roots and reports unverified parity unless source evidence is strong.

## False-Positive Risks
- Ownership assertions hidden behind helper names without owner/own/assert wording may be missed.
- SECURITY.md fixed claims can be flagged as drift when the source fix is not statically recognizable.
- Runtime-cost findings are inferred unless the source directly contains polling, cache bypass, or empty catch patterns.

## Next Recommended Scanner Upgrade
- Add AST-level dataflow from route params and form payloads through controller arguments into DAL/RPC payloads.

## Final Verdict

SCANNER_GOVERNANCE_INTELLIGENCE_COMPLETE

