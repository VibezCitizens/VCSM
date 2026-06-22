import { MarkerType } from 'reactflow'
import { edgeTypeConfig } from '../data/graph'

import combinedRaw from '../data/bottom-navigation.graph.json'
import homeFeedRaw from '../data/bottom-navigation/home-feed.graph.json'
import exploreRaw from '../data/bottom-navigation/explore.graph.json'
import messagesRaw from '../data/bottom-navigation/messages.graph.json'
import notificationsRaw from '../data/bottom-navigation/notifications.graph.json'
import profileRaw from '../data/bottom-navigation/profile.graph.json'
import uploadRaw from '../data/bottom-navigation/upload.graph.json'
import settingsRaw from '../data/bottom-navigation/settings.graph.json'

function processNodes(rawNodes) {
  return rawNodes.map((node) => ({
    ...node,
    type: 'archNode',
    data: {
      ...node.data,
      file: node.data.filePath || node.data.file || '',
      risk: node.data.riskLevel || node.data.risk || 'none',
    },
  }))
}

function processEdges(rawEdges) {
  return rawEdges.map((edge) => {
    const ec = edgeTypeConfig[edge.data?.edgeType] || {}
    return {
      ...edge,
      style: ec.style || { stroke: '#334155', strokeWidth: 1.5 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 12,
        height: 12,
        color: ec.stroke || '#334155',
      },
      labelStyle: {
        fill: '#4b5563',
        fontSize: 9,
        fontFamily: 'system-ui, sans-serif',
        fontWeight: 500,
      },
      labelBgStyle: { fill: '#09090b', fillOpacity: 0.9 },
      labelBgPadding: [4, 6],
      labelBgBorderRadius: 3,
    }
  })
}

function buildGraph(raw) {
  return {
    metadata: raw.metadata,
    nodes: processNodes(raw.nodes),
    edges: processEdges(raw.edges),
  }
}

export const BOTTOM_NAV_GRAPHS = [
  {
    id: 'combined-bottom-nav',
    label: 'Full Bottom Nav Map',
    group: 'Combined',
    ...buildGraph(combinedRaw),
  },
  {
    id: 'home-feed',
    label: 'Home / Feed',
    group: 'Screen',
    ...buildGraph(homeFeedRaw),
  },
  {
    id: 'explore',
    label: 'Explore / Search',
    group: 'Screen',
    ...buildGraph(exploreRaw),
  },
  {
    id: 'messages',
    label: 'Vox / Chat',
    group: 'Screen',
    ...buildGraph(messagesRaw),
  },
  {
    id: 'notifications',
    label: 'Notifications',
    group: 'Screen',
    ...buildGraph(notificationsRaw),
  },
  {
    id: 'profile',
    label: 'Citizen / Profile',
    group: 'Screen',
    ...buildGraph(profileRaw),
  },
  {
    id: 'upload',
    label: 'Upload / Create',
    group: 'Screen',
    ...buildGraph(uploadRaw),
  },
  {
    id: 'settings',
    label: 'Settings',
    group: 'Screen',
    ...buildGraph(settingsRaw),
  },
]

export function getGraphById(id) {
  return BOTTOM_NAV_GRAPHS.find((g) => g.id === id) || null
}
