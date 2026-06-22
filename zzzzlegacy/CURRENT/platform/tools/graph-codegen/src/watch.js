const fs     = require('fs')
const path   = require('path')
const { execSync } = require('child_process')

const VCSM_SRC = '/Users/vcsm/Desktop/VCSM/apps/VCSM/src'
const ARGS     = process.argv.slice(2)  // pass-through flags e.g. --visualizer

let debounceTimer = null
let running       = false

function generate() {
  if (running) return
  running = true
  console.log(`\n[watch] change detected — regenerating...`)
  try {
    const flags = ARGS.join(' ')
    execSync(`node ${path.join(__dirname, 'index.js')} ${flags}`, {
      stdio: 'inherit',
      cwd:   path.join(__dirname, '..'),
    })
  } catch {
    console.error('[watch] generate failed — check errors above')
  } finally {
    running = false
  }
}

function onFileChange(eventType, filename) {
  if (!filename) return
  if (!/\.(jsx?|mjs|cjs)$/.test(filename)) return
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(generate, 2000)
}

// Initial pass
generate()

// Watch VCSM src recursively
const watcher = fs.watch(VCSM_SRC, { recursive: true }, onFileChange)

console.log(`\n[watch] watching ${VCSM_SRC}`)
console.log('[watch] press Ctrl+C to stop\n')

process.on('SIGINT', () => {
  watcher.close()
  console.log('\n[watch] stopped.')
  process.exit(0)
})
