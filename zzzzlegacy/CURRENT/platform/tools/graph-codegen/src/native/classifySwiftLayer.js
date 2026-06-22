const path = require('path')

// Layer x-positions for graph layout (matches PWA graph conventions, extended for native)
const NATIVE_LAYER_X = {
  nav:        0,
  button:     200,
  route:      400,
  screen:     700,
  view:       900,
  store:      1200,
  controller: 1500,
  dal:        1800,
  model:      2100,
  table:      2400,
}

function classifySwiftLayer(filePath) {
  const base = path.basename(filePath)
  const dir  = filePath

  // DAL: *.dal.swift
  if (base.endsWith('.dal.swift')) return 'dal'

  // ViewModel / Store
  if (base.endsWith('ViewModel.swift') || base.endsWith('Store.swift')) return 'store'

  // Screen: *Screen.swift or *ViewScreen.swift
  if (base.endsWith('Screen.swift')) return 'screen'

  // Service (Live*Service or *Service) — acts as controller / orchestration
  if (base.endsWith('Service.swift')) return 'controller'

  // Navigation / App shell
  if (base === 'BottomNavigationBar.swift') return 'nav'
  if (base === 'AppNavigationView.swift')   return 'nav'
  if (base === 'TopNavigationBar.swift')    return 'nav'

  // Routes
  if (base === 'NativeAppRoute.swift') return 'route'
  if (base === 'AppRouteParser.swift')  return 'route'
  if (base === 'AppDestination.swift')  return 'route'

  // Views (SwiftUI View structs that are not screens)
  if (base.endsWith('View.swift')) return 'view'

  // Models (pure data types, mostly in VCSMNativeCore)
  if (dir.includes('VCSMNativeCore')) return 'model'

  // Fallback
  return 'view'
}

function layerToNodeType(layer) {
  return layer  // our layer names already match nodeTypeConfig keys
}

module.exports = { classifySwiftLayer, layerToNodeType, NATIVE_LAYER_X }
