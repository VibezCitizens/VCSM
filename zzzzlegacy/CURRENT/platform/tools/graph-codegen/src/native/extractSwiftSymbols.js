const fs = require('fs')

// Extract the primary Swift symbol (struct/class/enum/actor name) from a file
function extractSwiftSymbols(filePath) {
  const src = fs.readFileSync(filePath, 'utf8')
  const symbols = []

  // Match top-level declarations: public/internal/private struct|class|enum|actor Name
  const declRe = /^\s*(?:public\s+|internal\s+|private\s+|open\s+|final\s+)*(?:struct|class|enum|actor)\s+([A-Z][A-Za-z0-9_]+)/gm
  let m
  while ((m = declRe.exec(src)) !== null) {
    symbols.push(m[1])
  }

  return symbols
}

// Extract the primary (first) symbol name as the node label
function primarySymbol(filePath) {
  const syms = extractSwiftSymbols(filePath)
  return syms.length > 0 ? syms[0] : null
}

module.exports = { extractSwiftSymbols, primarySymbol }
