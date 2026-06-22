const traverse = require('@babel/traverse').default

function extractSupabaseReads(ast) {
  const tables = new Set()
  const rpcs   = new Set()

  traverse(ast, {
    CallExpression(nodePath) {
      const { callee, arguments: args } = nodePath.node
      if (
        callee.type === 'MemberExpression' &&
        callee.property.type === 'Identifier' &&
        args.length > 0 &&
        args[0].type === 'StringLiteral'
      ) {
        const name = callee.property.name
        if (name === 'from') tables.add(args[0].value)
        if (name === 'rpc')  rpcs.add(args[0].value)
      }
    },
  })

  return {
    tables: [...tables],
    rpcs:   [...rpcs],
  }
}

module.exports = { extractSupabaseReads }
