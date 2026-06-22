import { collectMigrationFiles, unique } from "./governanceUtils.js";

export async function scanDbPolicies(config, maps) {
  const migrations = await collectMigrationFiles(config);
  const dbObjects = parseDbObjects(migrations);
  const dalDependencies = maps.writeSurfaceMap.writeSurfaces
    .filter((surface) => surface.appId === "VCSM")
    .map((surface) => mapSurfaceToDb(surface, dbObjects));
  const rpcDependencies = maps.rpcMap.rpcs
    .filter((rpc) => rpc.appId === "VCSM")
    .map((rpc) => mapRpcToDb(rpc, dbObjects));

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    migrationsScanned: migrations.map((migration) => migration.file),
    schemas: [...dbObjects.schemas].sort(),
    tables: [...dbObjects.tables.values()].sort((a, b) => a.table.localeCompare(b.table)),
    rpcs: [...dbObjects.rpcs.values()].sort((a, b) => a.functionName.localeCompare(b.functionName)),
    grants: dbObjects.grants,
    constraints: dbObjects.constraints,
    dalDependencies,
    rpcDependencies,
    unverified: [...dalDependencies, ...rpcDependencies].filter((item) => item.status === "DB_POLICY_UNVERIFIED")
  };
}

function parseDbObjects(migrations) {
  const schemas = new Set();
  const tables = new Map();
  const rpcs = new Map();
  const grants = [];
  const constraints = [];

  for (const migration of migrations) {
    const text = migration.text;
    for (const match of text.matchAll(/create\s+schema\s+(?:if\s+not\s+exists\s+)?("?[\w]+"?)/gi)) schemas.add(clean(match[1]));
    for (const match of text.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?("?[\w]+"?\.)?("?[\w]+"?)/gi)) {
      const schema = clean((match[1] ?? "public.").replace(".", ""));
      const table = clean(match[2]);
      upsertTable(tables, schema, table, migration.file).created = true;
    }
    for (const match of text.matchAll(/alter\s+table\s+(?:only\s+)?("?[\w]+"?\.)?("?[\w]+"?)\s+enable\s+row\s+level\s+security/gi)) {
      const schema = clean((match[1] ?? "public.").replace(".", ""));
      const table = clean(match[2]);
      upsertTable(tables, schema, table, migration.file).rlsEnabled = true;
    }
    for (const match of text.matchAll(/create\s+policy\s+"?([^"\n]+)"?\s+on\s+("?[\w]+"?\.)?("?[\w]+"?)/gi)) {
      const schema = clean((match[2] ?? "public.").replace(".", ""));
      const table = clean(match[3]);
      const entry = upsertTable(tables, schema, table, migration.file);
      entry.policies.push({ policy: match[1].trim(), file: migration.file });
    }
    for (const match of text.matchAll(/create\s+(?:or\s+replace\s+)?function\s+("?[\w]+"?\.)?("?[\w]+"?)\s*\(/gi)) {
      const schema = clean((match[1] ?? "public.").replace(".", ""));
      const functionName = clean(match[2]);
      rpcs.set(`${schema}.${functionName}`, {
        schema,
        functionName,
        file: migration.file,
        securityDefiner: new RegExp(`function\\s+(?:${schema}\\.)?${functionName}[\\s\\S]*?security\\s+definer`, "i").test(text)
      });
    }
    for (const match of text.matchAll(/grant\s+([^;]+);/gi)) grants.push({ grant: match[0].trim(), file: migration.file });
    for (const match of text.matchAll(/constraint\s+("?[\w]+"?)|check\s*\(/gi)) constraints.push({ constraint: match[0].trim(), file: migration.file });
  }

  return { schemas, tables, rpcs, grants, constraints };
}

function mapSurfaceToDb(surface, dbObjects) {
  const schema = surface.schema ?? "public";
  const key = `${schema}.${surface.table}`;
  const table = surface.table ? dbObjects.tables.get(key) : null;
  return {
    file: surface.file,
    operation: surface.operation,
    schema: surface.schema,
    table: surface.table,
    rpc: surface.rpc,
    policyEvidence: table?.policies ?? [],
    rlsEnabled: table?.rlsEnabled ?? false,
    constraints: dbObjects.constraints.filter((constraint) => surface.table && constraint.constraint.includes(surface.table)),
    status: surface.table && table ? "VERIFIED" : surface.table ? "DB_POLICY_UNVERIFIED" : "NOT_TABLE_BACKED",
    evidence: table ? unique([table.file, ...table.policies.map((policy) => policy.file)]) : []
  };
}

function mapRpcToDb(rpc, dbObjects) {
  const schema = rpc.schema ?? "public";
  const fn = dbObjects.rpcs.get(`${schema}.${rpc.rpc}`) ?? dbObjects.rpcs.get(`public.${rpc.rpc}`);
  return {
    file: rpc.file,
    rpc: rpc.rpc,
    schema: rpc.schema,
    functionEvidence: fn ? [fn.file] : [],
    securityDefiner: fn?.securityDefiner ?? false,
    status: fn ? "VERIFIED" : "DB_POLICY_UNVERIFIED"
  };
}

function upsertTable(tables, schema, table, file) {
  const key = `${schema}.${table}`;
  const current = tables.get(key) ?? { schema, table, file, created: false, rlsEnabled: false, policies: [] };
  tables.set(key, current);
  return current;
}

function clean(value) {
  return String(value ?? "").replace(/"/g, "").trim();
}
