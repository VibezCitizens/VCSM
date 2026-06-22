const fs = require('fs')

// REST call verbs used by SupabaseClient extensions in VCSMNativeApp
const REST_VERBS = [
  'restSelect',
  'restMaybeSingle',
  'restInsert',
  'restInsertVoid',
  'restUpsertVoid',
  'restPatchVoid',
  'restPatchSingle',
  'restDeleteVoid',
  'restRPC',
]

const WRITE_VERBS = new Set([
  'restInsert', 'restInsertVoid', 'restUpsertVoid',
  'restPatchVoid', 'restPatchSingle', 'restDeleteVoid',
])

function extractNativeSupabaseCalls(filePath) {
  const src = fs.readFileSync(filePath, 'utf8')

  const tables = new Set()
  const rpcs   = new Set()
  const ops    = []

  // Detect REST verb calls
  for (const verb of REST_VERBS) {
    if (!src.includes(verb)) continue

    const re = new RegExp(`${verb}\\s*\\(`, 'g')
    let m
    while ((m = re.exec(src)) !== null) {
      // Grab the slice after the open paren to find table: or fn: argument
      const slice = src.slice(m.index, m.index + 400)

      const tableMatch = slice.match(/table:\s*"([^"]+)"/)
      const rpcMatch   = slice.match(/fn:\s*"([^"]+)"/)
      const funcMatch  = slice.match(/function:\s*"([^"]+)"/)

      if (tableMatch) tables.add(tableMatch[1])
      if (rpcMatch)   rpcs.add(rpcMatch[1])
      if (funcMatch)  rpcs.add(funcMatch[1])

      ops.push({
        verb,
        table:  tableMatch?.[1] || null,
        rpc:    rpcMatch?.[1] || funcMatch?.[1] || null,
        isWrite: WRITE_VERBS.has(verb),
      })
    }
  }

  return {
    tables: [...tables],
    rpcs:   [...rpcs],
    ops,
    hasWrites: ops.some(o => o.isWrite),
  }
}

module.exports = { extractNativeSupabaseCalls, REST_VERBS }
