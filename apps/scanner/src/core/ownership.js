export function classifyPath(relativePath) {
  const parts = relativePath.split("/");
  const appMatch = relativePath.match(/^apps\/([^/]+)\/src\/features\/([^/]+)/);
  const engineMatch = relativePath.match(/^engines\/([^/]+)/);
  const appId = appIdFromPath(relativePath);
  const root = rootFromPath(relativePath);

  if (appMatch) {
    return {
      app: appMatch[1],
      appId: appMatch[1],
      root,
      kind: "feature",
      owner: `${appMatch[1]}:${appMatch[2]}`,
      feature: appMatch[2],
      engine: null
    };
  }

  if (engineMatch) {
    return {
      app: null,
      appId: null,
      root,
      kind: "engine",
      owner: `engine:${engineMatch[1]}`,
      feature: null,
      engine: engineMatch[1]
    };
  }

  if (parts[0] === "apps" && parts[2] === "src") {
    return {
      app: parts[1],
      appId: parts[1],
      root,
      kind: "app-area",
      owner: `${parts[1]}:${parts[3] ?? "src"}`,
      feature: null,
      engine: null
    };
  }

  return {
    app: null,
    appId,
    root,
    kind: parts[0] ?? "unknown",
    owner: parts[0] ?? "unknown",
    feature: null,
    engine: null
  };
}

export function appIdFromPath(relativePath) {
  return relativePath.match(/^apps\/([^/]+)\//)?.[1] ?? null;
}

export function rootFromPath(relativePath) {
  const app = relativePath.match(/^(apps\/[^/]+)/)?.[1];
  if (app) return app;
  const engine = relativePath.match(/^(engines\/[^/]+)/)?.[1];
  if (engine) return engine;
  return relativePath.split("/")[0] ?? null;
}

export function layerFromPath(relativePath) {
  const lower = relativePath.toLowerCase();
  if (lower.includes("/controller") || lower.includes("/controllers")) return "controller";
  if (lower.includes("/dal/") || lower.includes(".dal.")) return "dal";
  if (lower.includes("/adapters/") || lower.includes("/adapter/")) return "adapter";
  if (lower.includes("/hooks/") || /\/use[A-Z]/.test(relativePath)) return "hook";
  if (lower.includes("/model/") || lower.includes(".model.")) return "model";
  if (lower.includes("/screens/") || lower.includes("/screen/") || lower.includes(".screen.") || lower.includes(".view.")) return "screen";
  if (lower.includes("/components/") || lower.includes("/ui/")) return "component";
  if (lower.includes("/store/") || lower.includes("zustand")) return "state";
  if (lower.includes("/styles/") || lower.endsWith(".css")) return "style";
  return "module";
}
