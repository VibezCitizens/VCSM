// src/features/vgrid/VPortMarker.jsx
import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Color per type (border + bg tint)
const TYPE_COLORS = {
  'gas station': { border: '#e11d48', bg: 'rgba(225,29,72,0.12)' },   // rose
  'restroom':    { border: '#0ea5e9', bg: 'rgba(14,165,233,0.12)' },  // sky
  'truck stop':  { border: '#22c55e', bg: 'rgba(34,197,94,0.12)' },   // green
  'amenity':     { border: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },  // amber
  default:       { border: '#6366f1', bg: 'rgba(99,102,241,0.12)' },  // indigo
};

// emoji per type
function getEmoji(type) {
  switch (type) {
    case 'gas station': return '⛽️';
    case 'restroom':    return '🚻';
    case 'truck stop':  return '🚚';
    case 'amenity':     return '⭐️';
    default:            return '📍';
  }
}

// build a high-contrast DivIcon
function buildDivIcon(type) {
  const emoji = getEmoji(type);
  const { border, bg } = TYPE_COLORS[type] || TYPE_COLORS.default;

  return L.divIcon({
    html: `
      <div style="
        display:flex;align-items:center;justify-content:center;
        width:36px;height:36px;border-radius:9999px;
        background:${bg};
        border:2px solid ${border};
        box-shadow:0 2px 6px rgba(0,0,0,0.25);
      ">
        <span style="font-size:22px;line-height:1">${emoji}</span>
      </div>
    `,
    className: 'vport-divicon', // keep class empty-ish to avoid Leaflet defaults
    iconSize: [36, 36],
    iconAnchor: [18, 34], // visually sits just above the point
    popupAnchor: [0, -30],
  });
}

/**
 * VPortMarker
 * @param {{port: {id:string,name:string,type:string,latitude:number,longitude:number,verified?:boolean}, onNavigate?: (lat:number, lng:number, label?:string) => void}} props
 */
export default function VPortMarker({ port, onNavigate }) {
  const icon = useMemo(() => buildDivIcon(port.type), [port.type]);
  const verified = port.verified ? '✅ Verified' : '⏳ Pending';

  const handleRoute = () => {
    if (typeof onNavigate === 'function') {
      onNavigate(port.latitude, port.longitude, port.name);
    }
  };

  return (
    <Marker
      position={[port.latitude, port.longitude]}
      icon={icon}
      title={`${port.name} • ${port.type}`}
    >
      <Popup>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-base">{port.name}</h3>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(0,0,0,0.06)',
                color: '#111',
              }}
            >
              {port.type}
            </span>
          </div>

          <p className="text-sm">
            Status: <span className="font-medium">{verified}</span>
          </p>

          {onNavigate && (
            <button
              onClick={handleRoute}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleRoute()}
              className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm"
              aria-label={`Route to ${port.name}`}
            >
              Route
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
