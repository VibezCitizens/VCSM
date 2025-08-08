// src/features/vgrid/BasicSearchRouteMap.jsx
import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet-routing-machine'
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch'
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMap,
  useMapEvents,
} from 'react-leaflet'

import useRoadReports from './useRoadReports'
import ReportMarker from './ReportMarker'

// Leaflet default marker assets (Vite fix)
import marker2x from 'leaflet/dist/images/marker-icon-2x.png'
import marker1x from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker1x,
  shadowUrl: markerShadow,
})

const DEFAULT_CENTER = [27.5067, -99.5075]
const NAV_SAFE_GAP = 88
const UNITS = 'mi'

// ---------- formatters ----------
function formatDistance(meters) {
  if (UNITS === 'km') {
    const km = meters / 1000
    return km >= 100 ? `${km.toFixed(0)} km` : `${km.toFixed(1)} km`
  }
  const miles = meters / 1609.344
  return miles >= 100 ? `${miles.toFixed(0)} mi` : `${miles.toFixed(1)} mi`
}
function formatDuration(seconds) {
  const s = Math.max(0, Math.round(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h <= 0) return `${m} min`
  return `${h} hr ${m} min`
}
function formatETA(secondsFromNow) {
  const d = new Date(Date.now() + secondsFromNow * 1000)
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

// --- High-contrast waypoint icons
function waypointIcon(kind) {
  const palette = {
    start: { border: '#7c3aed', fill: 'rgba(124,58,237,0.12)' },
    dest:  { border: '#16a34a', fill: 'rgba(22,163,74,0.12)' },
  }
  const { border, fill } = palette[kind] || palette.start
  return L.divIcon({
    html: `
      <div style="
        width:40px;height:40px;border-radius:9999px;
        display:flex;align-items:center;justify-content:center;
        border:3px solid ${border}; background:${fill};
        box-shadow:0 3px 10px rgba(0,0,0,0.35);
      ">
        <div style="width:10px;height:10px;border-radius:9999px;background:${border}"></div>
      </div>`,
    className: 'vibe-waypoint',
    iconSize: [40, 40],
    iconAnchor: [20, 32],
    popupAnchor: [0, -30],
  })
}

// --- GeoSearch control: sets a "candidate" destination, NOT a route
function GeoSearch({ onPick }) {
  const map = useMap()
  useEffect(() => {
    const provider = new OpenStreetMapProvider()
    const control = new GeoSearchControl({
      provider,
      style: 'bar',
      showMarker: false,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      searchLabel: 'Search for a place…',
      keepResult: true,
      position: 'topleft',
    })
    map.addControl(control)

    const handle = (ev) => {
      const { x, y, label } = ev.location
      onPick({ lat: y, lng: x, label })
      map.setView([y, x], 16)
    }
    map.on('geosearch/showlocation', handle)

    return () => {
      map.off('geosearch/showlocation', handle)
      try { map.removeControl(control) } catch {}
    }
  }, [map, onPick])
  return null
}

// Optional: click to place candidate pin
function CandidateFromClick({ setCandidate }) {
  useMapEvents({
    click(e) {
      setCandidate({ lat: e.latlng.lat, lng: e.latlng.lng, label: 'Dropped pin' })
    },
  })
  return null
}

// Live location bubble and hand-off to "start" for routing
function LiveLocation({ setStart, follow }) {
  const map = useMap()
  const [pos, setPos] = useState(null)

  useEffect(() => {
    function onFound(e) {
      setPos(e.latlng)
      setStart(e.latlng)
      if (follow) {
        const targetZoom = Math.max(map.getZoom(), 17) // street level
        map.setView(e.latlng, targetZoom, { animate: true })
      }
    }
    map.on('locationfound', onFound)
    map.locate({ watch: true, enableHighAccuracy: true })
    return () => {
      map.off('locationfound', onFound)
      map.stopLocate()
    }
  }, [map, setStart, follow])

  return pos ? (
    <Circle
      center={pos}
      radius={10}
      pathOptions={{ color: '#7c3aed', fillColor: '#7c3aed', fillOpacity: 1 }}
    />
  ) : null
}

// Routing Machine: ONLY mounts when routing is active (no external panel)
function RoutingMachine({ start, dest, onSummary }) {
  const map = useMap()
  const ref = useRef(null)

  useEffect(() => {
    if (!start || !dest) return

    const control = L.Routing.control({
      waypoints: [L.latLng(start.lat, start.lng), L.latLng(dest.lat, dest.lng)],
      routeWhileDragging: true,
      showAlternatives: false,
      fitSelectedRoutes: true,
      addWaypoints: true,
      draggableWaypoints: true,
      // no external container → we handle our own UI, and we hide LRM's default below
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        profile: 'driving',
      }),
      lineOptions: {
        extendToWaypoints: true,
        missingRouteTolerance: 5,
        styles: [
          { color: '#000', opacity: 0.35, weight: 10 },
          { color: '#fff', opacity: 0.9,  weight: 6 },
          { color: '#2563eb', opacity: 1,  weight: 4 },
        ],
      },
      createMarker: (i, wp) =>
        L.marker(wp.latLng, {
          icon: i === 0 ? waypointIcon('start') : waypointIcon('dest'),
          keyboard: false,
        }),
      show: false,
      position: 'bottomleft',
    })

    const pushSummary = (summary) => {
      if (!summary) return
      const { totalDistance, totalTime } = summary
      onSummary?.({
        distanceText: formatDistance(totalDistance),
        durationText: formatDuration(totalTime),
        etaText: formatETA(totalTime),
        meters: totalDistance,
        seconds: totalTime,
      })
    }
    const onFound = (e) => pushSummary(e.routes?.[0]?.summary)
    const onSelected = (e) => pushSummary(e.route?.summary)

    control.on('routesfound', onFound)
    control.on('routeselected', onSelected)

    ref.current = control
    control.addTo(map)

    return () => {
      try { control.off('routesfound', onFound) } catch {}
      try { control.off('routeselected', onSelected) } catch {}
      try { control.remove() } catch {}
      ref.current = null
    }
  }, [map, start, dest, onSummary])

  return null
}

export default function BasicSearchRouteMap() {
  const [candidate, setCandidate] = useState(null) // picked by search/click
  const [start, setStart] = useState(null)         // live GPS
  const [dest, setDest] = useState(null)           // when set → draws route
  const [routeInfo, setRouteInfo] = useState(null)
  const [driving, setDriving] = useState(false)
  const mapRef = useRef(null)

  // Road reports
  const { reports, submitReport } = useRoadReports()

  const clearPin = () => setCandidate(null)
  const startRoute = () => {
    if (!candidate || !start) return
    setDest({ lat: candidate.lat, lng: candidate.lng })
  }
  const cancelRoute = () => {
    setDest(null)
    setRouteInfo(null)
  }

  // Add road report near GPS (fallback to map center)
  const addReport = async (kind) => {
    try {
      let latlng = start
      if (!latlng && mapRef.current) {
        const c = mapRef.current.getCenter()
        latlng = { lat: c.lat, lng: c.lng }
      }
      if (!latlng) return alert('No location yet. Please wait for GPS.')
      await submitReport({ kind, lat: latlng.lat, lng: latlng.lng })
    } catch (e) {
      alert(e.message || 'Could not submit report')
    }
  }

  return (
    <div className="absolute inset-0">
      {/* Hide LRM floating panel; improve search input; disable text selection in our overlay */}
      <style>{`
        .leaflet-routing-container { display: none !important; }

        .leaflet-control-geosearch { z-index: 1000 !important; }
        .leaflet-control-geosearch form { background: transparent !important; box-shadow: none !important; }
        .leaflet-control-geosearch form input {
          color:#111!important; background:#fff!important; border:1px solid #cfd3d7!important;
          border-radius:8px!important; font-size:15px!important; height:38px!important; padding:8px 12px!important;
          box-shadow:0 1px 2px rgba(0,0,0,0.06)!important;
        }
        .leaflet-control-geosearch form input::placeholder { color:#444!important; opacity:1!important; }
        .leaflet-control-geosearch .results {
          background:#fff!important; color:#111!important; border:1px solid #cfd3d7!important; border-radius:8px!important;
          margin-top:6px!important; max-height:260px!important; overflow:auto!important; box-shadow:0 6px 20px rgba(0,0,0,0.12)!important;
        }
        .leaflet-control-geosearch .results > * { padding:8px 10px!important; border-bottom:1px solid #eef1f4!important; cursor:pointer!important; }
        .leaflet-control-geosearch .results > *:hover { background:#f4f6f8!important; }

        /* No text selection on our overlay */
        .vibes-no-select, .vibes-no-select * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
        }
      `}</style>

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={10}
        scrollWheelZoom
        className="absolute inset-0 z-0"
        preferCanvas
        whenCreated={(map) => (mapRef.current = map)}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
          maxZoom={20}
        />

        <GeoSearch onPick={setCandidate} />
        <CandidateFromClick setCandidate={setCandidate} />

        {/* Live location bubble; follow = driving mode */}
        <LiveLocation setStart={setStart} follow={driving} />

        {/* Candidate pin */}
        {candidate && <Marker position={[candidate.lat, candidate.lng]} />}

        {/* Active route (no directions panel) */}
        {start && dest && (
          <RoutingMachine
            start={start}
            dest={dest}
            onSummary={setRouteInfo}
          />
        )}

        {/* Road reports */}
        {reports.map((r) => (
          <ReportMarker key={r.id} report={r} />
        ))}
      </MapContainer>

      {/* Overlay controls (moved up above bottom nav) */}
      <div
        className="absolute left-3 z-50 pointer-events-auto space-y-2 vibes-no-select"
        style={{ bottom: NAV_SAFE_GAP }}
      >
        {/* Action + ETA card */}
        <div className="bg-white/95 rounded-lg shadow p-3 w-[300px]">
          {!candidate && (
            <div className="text-sm text-gray-700">
              Search for a place (or tap map) to drop a pin.
            </div>
          )}

          {candidate && !dest && (
            <>
              <div className="text-sm font-medium mb-2">Destination candidate</div>
              <div className="text-xs text-gray-600 line-clamp-2 mb-2">
                {candidate.label || `${candidate.lat.toFixed(5)}, ${candidate.lng.toFixed(5)}`}
              </div>
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1 rounded text-white ${
                    start ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
                  }`}
                  onClick={startRoute}
                  disabled={!start}
                  title={start ? 'Route from your location' : 'Waiting for GPS…'}
                >
                  Route
                </button>
                <button
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={clearPin}
                >
                  Clear Pin
                </button>
              </div>
            </>
          )}

          {dest && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Routing active</span>
                <button
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={cancelRoute}
                >
                  Cancel
                </button>
              </div>

              {/* Live route summary (purple numbers) */}
              {routeInfo && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-100 rounded p-2">
                    <div className="text-[11px] uppercase text-gray-500">Distance</div>
                    <div className="text-sm font-extrabold text-purple-700">{routeInfo.distanceText}</div>
                  </div>
                  <div className="bg-gray-100 rounded p-2">
                    <div className="text-[11px] uppercase text-gray-500">Time</div>
                    <div className="text-sm font-extrabold text-purple-700">{routeInfo.durationText}</div>
                  </div>
                  <div className="bg-gray-100 rounded p-2">
                    <div className="text-[11px] uppercase text-gray-500">ETA</div>
                    <div className="text-sm font-extrabold text-purple-700">{routeInfo.etaText}</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Start/Stop Driving (follow-me) */}
        <div className="flex gap-2">
          <button
            onClick={() => setDriving(v => !v)}
            className={`px-3 py-1 rounded-lg shadow text-sm font-medium ${
              driving ? 'bg-purple-600 text-white' : 'bg-white'
            }`}
            title="Lock map to your live location at street-level zoom"
          >
            {driving ? 'Stop Driving' : 'Start Driving'}
          </button>

          {/* Quick Report buttons */}
          <button
            onClick={() => addReport('police')}
            className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
            title="Report police nearby"
          >
            🚓 Police
          </button>
          <button
            onClick={() => addReport('hazard')}
            className="px-3 py-1 rounded bg-amber-500 text-white hover:bg-amber-600 text-sm"
            title="Report hazard on road"
          >
            ⚠️ Hazard
          </button>
          <button
            onClick={() => addReport('crash')}
            className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 text-sm"
            title="Report a crash"
          >
            💥 Crash
          </button>
        </div>
      </div>
    </div>
  )
}
