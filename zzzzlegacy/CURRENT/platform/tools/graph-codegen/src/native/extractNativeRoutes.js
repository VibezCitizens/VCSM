const fs   = require('fs')
const path = require('path')

const ROUTE_FILE = '/Users/vcsm/Documents/New project/native/VCSMNativeCore/Sources/VCSMNativeCore/NativeAppRoute.swift'

// Parse enum cases from NativeAppRoute.swift and return route descriptors
function extractNativeRoutes() {
  if (!fs.existsSync(ROUTE_FILE)) return []

  const src  = fs.readFileSync(ROUTE_FILE, 'utf8')
  const routes = []

  // Match: case caseName or case caseName(...)
  const caseRe = /^\s+case\s+([a-z][A-Za-z0-9_]*)(?:\([^)]*\))?/gm
  let m
  while ((m = caseRe.exec(src)) !== null) {
    routes.push({
      caseName: m[1],
      filePath: ROUTE_FILE,
      relPath:  path.relative('/Users/vcsm/Documents/New project/native', ROUTE_FILE),
    })
  }

  return routes
}

module.exports = { extractNativeRoutes }
