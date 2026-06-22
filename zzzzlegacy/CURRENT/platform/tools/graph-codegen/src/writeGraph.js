const fs   = require('fs')
const path = require('path')

const CANONICAL_DIR  = '/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_CANONICAL/logan/marvel/architect/graph-data'
const VISUALIZER_DIR = '/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_ACTIVE/tools/shield-visualizer/src/data'

function writeGraph(graphData, options = {}) {
  const graphId   = graphData.metadata?.graph || 'output'
  const filename  = `${graphId}.graph.json`

  const targets = [path.join(CANONICAL_DIR, filename)]
  if (options.visualizer) targets.push(path.join(VISUALIZER_DIR, filename))

  for (const target of targets) {
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, JSON.stringify(graphData, null, 2), 'utf8')
    const kb = Math.round(fs.statSync(target).size / 1024)
    console.log(`  → ${target} (${kb} KB)`)
  }
}

module.exports = { writeGraph }
