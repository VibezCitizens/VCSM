const path = require('path')

// Architecture layer order: left = low-level, right = user-facing
const LAYER_ORDER = [
  'dal',
  'model',
  'adapter',
  'service',
  'engine',      // synthetic — engines imported by controllers/hooks
  'controller',
  'store',
  'cache',
  'hook',
  'component',
  'view',
  'screen',
  'route',
  'debugger',
  'asset',
  'unknown',
]

const LAYER_X = Object.fromEntries(LAYER_ORDER.map((l, i) => [l, i * 320]))

function classifyLayer(filePath) {
  const basename = path.basename(filePath)
  const name = basename.replace(/\.(jsx?|mjs|cjs)$/, '')
  const fp = filePath.replace(/\\/g, '/')

  if (fp.includes('/debuggers/') || fp.includes('/debuggers-stub/')) return 'debugger'
  if (fp.includes('/assets/')) return 'asset'
  if (fp.includes('/routes/')) return 'route'
  if (name.includes('Screen') || fp.includes('/screens/')) return 'screen'
  if (fp.includes('/components/')) return 'component'
  if (name.startsWith('use') || fp.includes('/hooks/')) return 'hook'
  if (name.includes('.controller') || fp.includes('/controller/')) return 'controller'
  if (name.includes('.model')      || fp.includes('/model/'))      return 'model'
  if (name.includes('.service')    || fp.includes('/service/'))    return 'service'
  if (name.includes('.adapter')    || fp.includes('/adapter/'))    return 'adapter'
  if (name.includes('.dal')        || fp.includes('/dal/'))        return 'dal'
  if (name.includes('.store')      || fp.includes('/store/'))      return 'store'
  if (name.toLowerCase().includes('cache') || fp.toLowerCase().includes('cache')) return 'cache'
  return 'unknown'
}

const LAYER_TO_NODE_TYPE = {
  route:      'route',
  screen:     'screen',
  view:       'view',
  component:  'component',
  hook:       'hook',
  controller: 'controller',
  model:      'model',
  service:    'adapter',
  adapter:    'adapter',
  dal:        'dal',
  store:      'store',
  cache:      'cache',
  engine:     'engine',
  debugger:   'component',
  asset:      'component',
  unknown:    'component',
}

function layerToNodeType(layer) {
  return LAYER_TO_NODE_TYPE[layer] || 'component'
}

module.exports = { classifyLayer, layerToNodeType, LAYER_ORDER, LAYER_X }
