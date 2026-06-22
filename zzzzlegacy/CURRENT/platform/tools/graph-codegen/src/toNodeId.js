const path = require('path')
const { VCSM_SRC_ROOT } = require('./scanFiles')

function toNodeId(absolutePath) {
  let rel = absolutePath
  const prefix = VCSM_SRC_ROOT + '/'
  if (rel.startsWith(prefix)) {
    rel = rel.slice(prefix.length)
  } else if (rel.startsWith(VCSM_SRC_ROOT)) {
    rel = rel.slice(VCSM_SRC_ROOT.length)
  }
  rel = rel.replace(/\.(jsx?|mjs|cjs)$/, '')
  return rel.replace(/\//g, '__').replace(/\./g, '_')
}

function toLabel(absolutePath) {
  return path.basename(absolutePath).replace(/\.(jsx?|mjs|cjs)$/, '')
}

module.exports = { toNodeId, toLabel }
