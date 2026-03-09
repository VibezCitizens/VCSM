import { countCodeLines } from "@/dev/diagnostics/helpers/codeLineCounter";

const ROLE_KEYS = ["dal", "model", "controller", "hooks", "components", "screens", "adapters", "shared", "other"];

function getFeatureRelativePath(path, featureName) {
  const marker = `src/features/${featureName}/`;
  if (path.startsWith(marker)) {
    return path.slice(marker.length);
  }
  return path;
}

function getPathParts(path, featureName) {
  const relativePath = getFeatureRelativePath(path, featureName);
  const segments = relativePath.split("/").filter(Boolean);
  const fileName = segments[segments.length - 1] ?? "";
  const firstSegment = segments[0] ?? "";
  return {
    relativePath,
    fileName,
    firstSegment,
  };
}

function inferRoleFromPath(path, featureName) {
  const { fileName, firstSegment } = getPathParts(path, featureName);
  const normalizedFirst = firstSegment.toLowerCase();
  const normalizedFileName = fileName.toLowerCase();

  if (normalizedFirst === "dal" || normalizedFirst === "dals" || normalizedFileName.endsWith(".dal.js")) {
    return "dal";
  }
  if (normalizedFirst === "model" || normalizedFirst === "models" || normalizedFileName.endsWith(".model.js")) {
    return "model";
  }
  if (
    normalizedFirst === "controller" ||
    normalizedFirst === "controllers" ||
    normalizedFileName.endsWith(".controller.js")
  ) {
    return "controller";
  }
  if (normalizedFirst === "hooks" || normalizedFirst === "hook" || normalizedFileName.startsWith("use")) {
    return "hooks";
  }
  if (normalizedFirst === "components" || normalizedFirst === "component") {
    return "components";
  }
  if (
    normalizedFirst === "screens" ||
    normalizedFirst === "screen" ||
    normalizedFileName.endsWith("screen.jsx") ||
    normalizedFileName.endsWith(".screen.jsx") ||
    normalizedFileName.endsWith(".view.jsx") ||
    normalizedFileName.endsWith("viewscreen.jsx")
  ) {
    return "screens";
  }
  if (
    normalizedFirst === "adapters" ||
    normalizedFirst === "adapter" ||
    normalizedFileName.endsWith(".adapter.js") ||
    normalizedFileName.endsWith(".adapters.js")
  ) {
    return "adapters";
  }
  if (normalizedFirst === "shared") {
    return "shared";
  }
  return "other";
}

function getLineStatus(codeLines) {
  if (codeLines > 300) return "violation";
  if (codeLines >= 250) return "warning";
  return "ok";
}

function byLinesThenPathDesc(a, b) {
  if (b.codeLines !== a.codeLines) return b.codeLines - a.codeLines;
  return a.path.localeCompare(b.path);
}

function byPathAsc(a, b) {
  return a.path.localeCompare(b.path);
}

function toOrderedObject(map) {
  return Object.fromEntries(
    Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => [key, value])
  );
}

function summarizeByDirectory(files, featureName) {
  const totals = new Map();

  for (const file of files) {
    const { relativePath } = getPathParts(file.path, featureName);
    const lastSlash = relativePath.lastIndexOf("/");
    const directory = lastSlash >= 0 ? relativePath.slice(0, lastSlash) : "(root)";

    const current = totals.get(directory) ?? { lines: 0, fileCount: 0 };
    totals.set(directory, {
      lines: current.lines + file.codeLines,
      fileCount: current.fileCount + 1,
    });
  }

  return toOrderedObject(totals);
}

function summarizeByRole(files) {
  const totals = new Map(ROLE_KEYS.map((role) => [role, 0]));

  for (const file of files) {
    totals.set(file.role, (totals.get(file.role) ?? 0) + file.codeLines);
  }

  return Object.fromEntries(ROLE_KEYS.map((role) => [role, totals.get(role) ?? 0]));
}

export function buildFeatureFileMetrics(entries, featureName) {
  const files = entries
    .map((entry) => {
      const codeLines = countCodeLines(entry.source);
      return {
        path: entry.path,
        role: inferRoleFromPath(entry.path, featureName),
        codeLines,
        status: getLineStatus(codeLines),
      };
    })
    .sort(byPathAsc);

  const sortedBySize = [...files].sort(byLinesThenPathDesc);

  const totalCodeLines = files.reduce((sum, file) => sum + file.codeLines, 0);
  const fileCount = files.length;
  const averageLinesPerFile = fileCount === 0 ? 0 : Number((totalCodeLines / fileCount).toFixed(2));

  const largestFile = sortedBySize[0]
    ? {
        path: sortedBySize[0].path,
        lines: sortedBySize[0].codeLines,
      }
    : null;

  const largestFiles = sortedBySize.slice(0, 10).map((file) => ({
    path: file.path,
    role: file.role,
    lines: file.codeLines,
    status: file.status,
  }));

  const nearLimitFiles = sortedBySize
    .filter((file) => file.codeLines >= 250 && file.codeLines <= 300)
    .map((file) => ({
      path: file.path,
      role: file.role,
      lines: file.codeLines,
      status: file.status,
    }));

  const oversizedFiles = sortedBySize
    .filter((file) => file.codeLines > 300)
    .map((file) => ({
      path: file.path,
      role: file.role,
      lines: file.codeLines,
      status: file.status,
    }));

  return {
    featureName,
    fileCount,
    totalCodeLines,
    averageLinesPerFile,
    largestFile,
    largestFiles,
    nearLimitFiles,
    oversizedFiles,
    lineCountByDirectory: summarizeByDirectory(files, featureName),
    lineCountByRole: summarizeByRole(files),
    files,
  };
}
