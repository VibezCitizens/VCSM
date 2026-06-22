const fs = require('fs')
const { spawn } = require('child_process')
const { NATIVE_ROOTS } = require('./scanSwiftFiles')

const DEBOUNCE_MS = 1200
let timer = null
let running = false
let pending = false

function runSync(reason) {
  if (running) {
    pending = true
    return
  }

  running = true
  pending = false

  console.log(`\n[native-watch] ${reason}; syncing native graph...`)

  const child = spawn(process.execPath, ['src/native/index.js'], {
    cwd: process.cwd(),
    stdio: 'inherit',
  })

  child.on('exit', (code) => {
    running = false
    if (code !== 0) {
      console.error(`[native-watch] sync failed with exit code ${code}`)
    }
    if (pending) {
      runSync('queued changes detected')
    }
  })
}

function schedule(reason) {
  clearTimeout(timer)
  timer = setTimeout(() => runSync(reason), DEBOUNCE_MS)
}

console.log('native-graph-codegen watch')
console.log('Watching Swift roots:')
for (const root of NATIVE_ROOTS) {
  console.log(`  ${root}`)
}
console.log('Press Ctrl+C to stop.')

runSync('initial scan')

for (const root of NATIVE_ROOTS) {
  fs.watch(root, { recursive: true }, (_eventType, filename) => {
    if (!filename || !filename.endsWith('.swift')) return
    schedule(filename)
  })
}
