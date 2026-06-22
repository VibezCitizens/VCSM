import fs from "node:fs/promises";
import path from "node:path";

const APP_ROOTS = ["apps/VCSM", "apps/wentrex", "apps/Traffic"];

const DEFAULT_ALIASES = [
  ["@booking", "engines/booking/index.js"],
  ["@chat", "engines/chat/index.js"],
  ["@hydration", "engines/hydration/index.js"],
  ["@identity", "engines/identity/index.js"],
  ["@i18n", "engines/i18n/index.js"],
  ["@i18n/*", "engines/i18n/*"],
  ["@media", "engines/media/index.js"],
  ["@notifications", "engines/notifications/index.js"],
  ["@portfolio", "engines/portfolio/index.js"],
  ["@reviews", "engines/reviews/index.js"],
  ["@/engines/*", "engines/*"],
  ["@/features/*", "src/features/*"],
  ["@/*", "src/*"]
];

export async function loadAliases(config) {
  const aliases = new Map();

  for (const appRoot of APP_ROOTS) {
    for (const [find, replacement] of DEFAULT_ALIASES) {
      addAlias(aliases, appRoot, find, replacement);
    }
    await loadJsConfigAliases(config, appRoot, aliases);
    await loadViteAliasHints(config, appRoot, aliases);
  }

  return aliases;
}

function addAlias(aliases, appRoot, find, replacement) {
  const list = (aliases.get(appRoot) ?? []).filter((entry) => entry.find !== find);
  list.push({ find, replacement });
  aliases.set(appRoot, list);
}

async function loadJsConfigAliases(config, appRoot, aliases) {
  const filePath = path.join(config.repoRoot, appRoot, "jsconfig.json");
  try {
    const json = JSON.parse(await fs.readFile(filePath, "utf8"));
    const paths = json.compilerOptions?.paths ?? {};
    for (const [find, replacements] of Object.entries(paths)) {
      for (const replacement of replacements) addAlias(aliases, appRoot, find, replacement);
    }
  } catch {
    // Missing or invalid project config leaves default aliases in place.
  }
}

async function loadViteAliasHints(config, appRoot, aliases) {
  const filePath = path.join(config.repoRoot, appRoot, "vite.config.js");
  let source;
  try {
    source = await fs.readFile(filePath, "utf8");
  } catch {
    return;
  }

  const aliasPattern = /find:\s*['"](@[^'"]+)['"][\s\S]{0,220}new URL\(['"]([^'"]+)['"]/g;
  for (const match of source.matchAll(aliasPattern)) {
    addAlias(aliases, appRoot, match[1], match[2]);
  }

  if (source.includes("find: '@'")) addAlias(aliases, appRoot, "@/*", "src/*");
}
