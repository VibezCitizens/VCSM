const DOMAINS = [
  "booking",
  "profile",
  "directory",
  "lead",
  "review",
  "menu",
  "content",
  "notification",
  "notifications",
  "qr",
  "availability",
  "identity",
  "chat",
  "portfolio",
  "payment",
  "learning",
  "hydration",
  "media",
  "i18n"
];

export function scanEngineCandidates({ featureMap, dependencyMap, writeSurfaceMap, rpcMap }) {
  const candidates = new Map();

  for (const engine of featureMap.features.filter((entry) => entry.kind === "engine")) {
    const candidate = getCandidate(candidates, canonicalDomain(engine.feature));
    candidate.engine = engine.feature;
    candidate.evidence.add("engine folder exists");
  }

  for (const dependency of dependencyMap.dependencies) {
    for (const domain of domainsIn(`${dependency.from} ${dependency.to} ${dependency.imports.map((item) => item.file).join(" ")}`)) {
      const candidate = getCandidate(candidates, canonicalDomain(domain));
      candidate.consumers.add(dependency.from);
      candidate.evidence.add("dependency references domain");
    }
  }

  for (const surface of writeSurfaceMap.writeSurfaces) {
    for (const domain of domainsIn(`${surface.file} ${surface.table ?? ""} ${surface.rpc ?? ""} ${surface.functionName ?? ""}`)) {
      const candidate = getCandidate(candidates, canonicalDomain(domain));
      candidate.consumers.add(surface.owner);
      if (surface.layer === "controller") candidate.controllers.add(surface.file);
      if (surface.layer === "dal") candidate.dals.add(surface.file);
      candidate.writeSurfaces.push(surface);
      candidate.evidence.add("write surface references domain");
    }
  }

  for (const rpc of rpcMap.rpcs) {
    for (const domain of domainsIn(`${rpc.rpc} ${rpc.file} ${rpc.feature ?? ""} ${rpc.engine ?? ""}`)) {
      const candidate = getCandidate(candidates, canonicalDomain(domain));
      if (rpc.feature) candidate.consumers.add(`feature:${rpc.feature}`);
      if (rpc.engine) candidate.consumers.add(`engine:${rpc.engine}`);
      candidate.rpcs.push(rpc);
      candidate.evidence.add("RPC references domain");
    }
  }

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    engineCandidates: [...candidates.values()]
      .map((candidate) => ({
        engine: candidate.engine ?? candidate.domain,
        domain: candidate.domain,
        confidence: confidence(candidate),
        evidence: [...candidate.evidence, `${candidate.consumers.size} consumers found`].sort(),
        consumers: [...candidate.consumers].sort(),
        controllers: [...candidate.controllers].sort(),
        dals: [...candidate.dals].sort(),
        rpcs: candidate.rpcs,
        writeSurfaces: candidate.writeSurfaces,
        riskTier: riskTier(candidate)
      }))
      .sort((a, b) => a.domain.localeCompare(b.domain))
  };
}

function domainsIn(value) {
  const lower = value.toLowerCase();
  return DOMAINS.filter((domain) => lower.includes(domain));
}

function getCandidate(candidates, domain) {
  if (!candidates.has(domain)) {
    candidates.set(domain, {
      domain,
      engine: null,
      evidence: new Set(),
      consumers: new Set(),
      controllers: new Set(),
      dals: new Set(),
      writeSurfaces: [],
      rpcs: []
    });
  }
  return candidates.get(domain);
}

function canonicalDomain(domain) {
  if (domain === "reviews") return "review";
  return domain === "notifications" ? "notification" : domain;
}

function confidence(candidate) {
  if (candidate.evidence.has("engine folder exists") && candidate.consumers.size > 0) return "HIGH";
  if (candidate.evidence.has("engine folder exists")) return "MEDIUM";
  if (candidate.writeSurfaces.length > 0 || candidate.consumers.size > 1) return "MEDIUM";
  return "LOW";
}

function riskTier(candidate) {
  const writeCount = candidate.writeSurfaces.length;
  const consumerCount = candidate.consumers.size;
  if (writeCount >= 10 || consumerCount >= 8) return "high";
  if (writeCount >= 3 || consumerCount >= 3) return "medium";
  return "low";
}
