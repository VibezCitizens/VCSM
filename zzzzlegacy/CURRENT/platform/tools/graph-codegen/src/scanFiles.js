const fg = require("fast-glob");

const VCSM_SRC_ROOT = "/Users/vcsm/Desktop/VCSM/apps/VCSM/src";

async function scanFiles() {
  return fg(
    [
      `${VCSM_SRC_ROOT}/**/*.{js,jsx,mjs,cjs}`,
      `!${VCSM_SRC_ROOT}/**/node_modules/**`,
      `!${VCSM_SRC_ROOT}/**/dist/**`,
      `!${VCSM_SRC_ROOT}/**/build/**`,
    ],
    {
      onlyFiles: true,
      absolute: true,
    }
  );
}

module.exports = {
  scanFiles,
  VCSM_SRC_ROOT,
};