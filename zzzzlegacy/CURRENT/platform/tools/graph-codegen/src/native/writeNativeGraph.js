const fs   = require('fs')
const path = require('path')

const VISUALIZER_NATIVE_DIR = '/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_ACTIVE/tools/shield-visualizer/src/data/native'

function writeNativeGraph(graphData, graphId) {
  const filename = `${graphId}.graph.json`
  const target   = path.join(VISUALIZER_NATIVE_DIR, filename)

  fs.mkdirSync(VISUALIZER_NATIVE_DIR, { recursive: true })
  fs.writeFileSync(target, JSON.stringify(graphData, null, 2), 'utf8')

  const kb = Math.round(fs.statSync(target).size / 1024)
  console.log(`  → ${target} (${kb} KB)`)

  return target
}

module.exports = { writeNativeGraph }
