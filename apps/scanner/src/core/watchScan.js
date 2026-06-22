import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const DEBOUNCE_MS = 500;

export function watchScan(config) {
  const cliEntry = path.join(config.scannerRoot, "src", "cli", "index.js");

  // App source roots + scanner's own src/ (not maps/ or reports/ to avoid feedback)
  const watchRoots = [
    ...config.scanRoots.map((root) => path.join(config.repoRoot, root)),
    path.join(config.scannerRoot, "src"),
  ].filter((root) => fs.existsSync(root));

  let debounceTimer = null;
  let child = null;

  function run(changedFile) {
    if (child) {
      child.kill();
      child = null;
    }

    const rel = path.relative(config.repoRoot, changedFile);
    process.stdout.write(`\n[watch] ${rel} changed — scanning...\n`);
    const start = Date.now();

    const args = [
      cliEntry,
      "scan",
      "--root", config.repoRoot,
      "--output", config.outputRoot,
      "--docs", config.docsRoot,
    ];

    child = spawn(process.execPath, args, { stdio: "inherit" });

    child.on("close", (code) => {
      child = null;
      if (code === 0) {
        process.stdout.write(`[watch] done in ${Date.now() - start}ms\n`);
      } else if (code !== null) {
        process.stdout.write(`[watch] scan exited with code ${code}\n`);
      }
    });
  }

  function schedule(filePath) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => run(filePath), DEBOUNCE_MS);
  }

  const watchers = watchRoots.map((root) =>
    fs.watch(root, { recursive: true }, (_, filename) => {
      if (!filename) return;
      const filePath = path.join(root, filename);
      if (shouldIgnore(filePath, config)) return;
      schedule(filePath);
    })
  );

  process.stdout.write(`[watch] watching ${watchRoots.length} root(s) — press Ctrl+C to stop\n`);
  watchRoots.forEach((root) => process.stdout.write(`  ${root}\n`));

  process.on("SIGINT", () => {
    if (child) child.kill();
    watchers.forEach((w) => w.close());
    process.stdout.write("\n[watch] stopped\n");
    process.exit(0);
  });
}

function shouldIgnore(filePath, config) {
  const parts = filePath.split(path.sep);
  if (parts.some((part) => config.ignoredDirs.has(part))) return true;
  const ext = path.extname(filePath);
  return ext !== "" && !config.sourceExtensions.has(ext);
}
