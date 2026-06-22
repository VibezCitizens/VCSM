const fg = require('fast-glob')

const NATIVE_ROOTS = [
  '/Users/vcsm/Documents/New project/native/VCSMNativeApp/VCSMNativeApp',
  '/Users/vcsm/Documents/New project/native/VCSMNativeCore/Sources/VCSMNativeCore',
]

async function scanSwiftFiles() {
  const patterns = NATIVE_ROOTS.map(r => `${r}/**/*.swift`)
  const files = await fg(patterns, { onlyFiles: true, followSymbolicLinks: false })
  return files.sort()
}

module.exports = { scanSwiftFiles, NATIVE_ROOTS }
