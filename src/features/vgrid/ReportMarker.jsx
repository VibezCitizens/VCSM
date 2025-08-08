// src/features/vgrid/ReportMarker.jsx
import React, { useMemo } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

const ICONS = {
  'police':     { emoji: '🚓', border: '#0ea5e9', bg: 'rgba(14,165,233,0.12)', label: 'Police' },
  'speed-trap': { emoji: '📸', border: '#06b6d4', bg: 'rgba(6,182,212,0.12)',  label: 'Speed Trap' },
  'hazard':     { emoji: '⚠️', border: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Hazard' },
  'crash':      { emoji: '💥', border: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: 'Crash' },
  'road-closed':{ emoji: '⛔️', border: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: 'Road closed' },
  default:      { emoji: '📍', border: '#6366f1', bg: 'rgba(99,102,241,0.12)', label: 'Report' },
}

function divIconFor(kind) {
  const { emoji, border, bg } = ICONS[kind] || ICONS.default
  return L.divIcon({
    html: `
      <div style="
        width:36px;height:36px;border-radius:9999px;
        display:flex;align-items:center;justify-content:center;
        border:2px solid ${border}; background:${bg};
        box-shadow:0 2px 6px rgba(0,0,0,0.3);
      ">
        <span style="font-size:20px;line-height:1">${emoji}</span>
      </div>`,
    className: 'report-divicon',
    iconSize: [36, 36],
    iconAnchor: [18, 30],
    popupAnchor: [0, -24],
  })
}

export default function ReportMarker({ report }) {
  const icon = useMemo(() => divIconFor(report.kind), [report.kind])
  const meta = ICONS[report.kind] || ICONS.default
  const expiresInMin = Math.max(
    0,
    Math.round((new Date(report.expires_at).getTime() - Date.now()) / 60000)
  )

  return (
    <Marker position={[report.lat, report.lng]} icon={icon}>
      <Popup>
        <div className="space-y-1">
          <div className="font-semibold">{meta.label}</div>
          {report.description ? <div className="text-sm text-gray-700">{report.description}</div> : null}
          <div className="text-xs text-gray-500">Expires in ~{expiresInMin} min</div>
        </div>
      </Popup>
    </Marker>
  )
}
