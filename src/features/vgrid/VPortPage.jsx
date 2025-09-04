// src/features/vgrid/VPortPage.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '@/lib/supabaseClient'

// ---------------- helpers ----------------
const TYPE_EMOJI = {
  'gas station': '⛽️',
  restroom: '🚻',
  'truck stop': '🚚',
  amenity: '⭐️',
  other: '📍',
}
const typeLabel = (t) => (t && TYPE_EMOJI[t] ? t : 'other')
const clamp = (n, a, b) => Math.max(a, Math.min(b, n))

const normalizeUrl = (url) => {
  if (!url) return null
  try {
    const hasProtocol = /^https?:\/\//i.test(url)
    return hasProtocol ? url : `https://${url}`
  } catch {
    return url
  }
}

const formatTime = (t) => (t ? t.toString().slice(0, 5) : '--:--')

// ---------------- data hook ----------------
function useVPortData(id) {
  const [vport, setVport] = useState(null)
  const [hours, setHours] = useState([])
  const [photos, setPhotos] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [
        { data: vp, error: e1 },
        { data: hrs, error: e2 },
        { data: ph, error: e3 },
        { data: rv, error: e4 },
      ] = await Promise.all([
        supabase.from('vports').select('*').eq('id', id).single(),
        supabase.from('vport_hours').select('*').eq('vport_id', id).order('day_of_week', { ascending: true }),
        supabase.from('vport_photos').select('*').eq('vport_id', id).order('created_at', { ascending: true }),
        supabase.from('vport_reviews').select('*').eq('vport_id', id).order('created_at', { ascending: false }),
      ])
      if (e1 || e2 || e3 || e4) throw (e1 || e2 || e3 || e4)
      setVport(vp)
      setHours(hrs || [])
      setPhotos(ph || [])
      setReviews(rv || [])
    } catch (err) {
      setError(err?.message || 'Failed to load VPort')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  return { vport, hours, photos, reviews, reload: load, loading, error }
}

// ---------------- UI bits ----------------
function AvgRating({ reviews }) {
  const { avg, count } = useMemo(() => {
    if (!reviews?.length) return { avg: 0, count: 0 }
    const s = reviews.reduce((a, r) => a + (r.rating || 0), 0)
    const a = Math.round((s / reviews.length) * 10) / 10
    return { avg: a, count: reviews.length }
  }, [reviews])

  if (!count) return <span className="text-xs text-gray-500">No reviews</span>

  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className="font-semibold">{avg.toFixed(1)}</span>
      <span aria-hidden className="text-yellow-600">★</span>
      <span className="text-xs text-gray-500">({count})</span>
    </span>
  )
}

function HoursTable({ hours }) {
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  if (!hours?.length) return <div className="text-sm text-gray-600">Hours not provided</div>
  return (
    <div className="text-sm">
      <div className="grid grid-cols-2 gap-y-1">
        {hours.map(h => (
          <React.Fragment key={h.id ?? h.day_of_week}>
            <div className="text-gray-600">{days[h.day_of_week]}</div>
            <div className="font-medium">
              {h.is_24h ? 'Open 24 hours' : `${formatTime(h.open_time)} – ${formatTime(h.close_time)}`}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

function Photos({ photos }) {
  if (!photos?.length) return null
  return (
    <div className="flex gap-2 overflow-x-auto py-1">
      {photos.map(p => (
        <img
          key={p.id}
          src={p.url}
          alt={p.caption || 'photo'}
          className="h-28 w-44 object-cover rounded-lg shadow-sm flex-none"
          loading="lazy"
        />
      ))}
    </div>
  )
}

function AddReview({ vportId, onAdded }) {
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    try {
      setBusy(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return alert('Please sign in to post a review.')
      const { error } = await supabase.from('vport_reviews').insert({
        vport_id: vportId,
        user_id: user.id,
        rating: clamp(Number(rating) || 0, 1, 5),
        body: body?.trim() || null,
      })
      if (error) throw error
      setBody('')
      setRating(5)
      onAdded?.()
    } catch (e) {
      alert(e.message || 'Could not add review')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="flex items-center gap-2 mb-2">
        <label className="text-sm text-gray-600">Your rating</label>
        <select
          value={rating}
          onChange={(e)=>setRating(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          {[5,4,3,2,1].map(v => <option key={v} value={v}>{v} ★</option>)}
        </select>
      </div>
      <textarea
        value={body}
        onChange={(e)=>setBody(e.target.value)}
        rows={3}
        placeholder="Share details about this place…"
        className="w-full border rounded px-3 py-2 text-sm"
      />
      <div className="mt-2 flex justify-end">
        <button
          disabled={busy}
          onClick={submit}
          className={`px-3 py-1.5 rounded ${busy ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700'} text-white text-sm`}
        >
          {busy ? 'Posting…' : 'Post review'}
        </button>
      </div>
    </div>
  )
}

function Reviews({ reviews }) {
  if (!reviews?.length) return <div className="text-sm text-gray-600">No reviews yet.</div>
  return (
    <div className="space-y-3">
      {reviews.map(r => {
        const filled = Math.max(0, Math.min(5, Number(r.rating) || 0))
        const empty = 5 - filled
        return (
          <div key={r.id} className="border border-gray-100 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-sm">
                {'★'.repeat(filled)}{'☆'.repeat(empty)}
              </div>
              <div className="text-xs text-gray-500">
                {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}
              </div>
            </div>
            {r.body && <p className="text-sm mt-1">{r.body}</p>}
          </div>
        )
      })}
    </div>
  )
}

function ClaimBanner({ vportId }) {
  const [busy, setBusy] = useState(false)
  const requestClaim = async () => {
    try {
      setBusy(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return alert('Please sign in to request ownership.')
      const { error } = await supabase.from('vport_claims').insert({
        vport_id: vportId,
        user_id: user.id,
        status: 'pending',
      })
      if (error) throw error
      alert('Claim submitted. We will review it soon.')
    } catch (e) {
      alert(e.message || 'Could not submit claim')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm">
          Are you the owner of this place? Request verification/ownership.
        </div>
        <button
          disabled={busy}
          onClick={requestClaim}
          className={`px-3 py-1.5 rounded ${busy ? 'bg-gray-300' : 'bg-amber-500 hover:bg-amber-600'} text-white text-sm`}
        >
          {busy ? 'Sending…' : 'Claim'}
        </button>
      </div>
    </div>
  )
}

function ActionBar({ vport }) {
  const navTo = () => {
    const { latitude: lat, longitude: lng, name } = vport
    const q = encodeURIComponent(`${lat},${lng} (${name})`)
    const gmaps = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    const apple = `http://maps.apple.com/?q=${q}&ll=${lat},${lng}`
    window.open(gmaps, '_blank', 'noopener') || window.open(apple, '_blank', 'noopener')
  }
  const call = () => {
    if (!vport.phone) return alert('No phone on file.')
    window.location.href = `tel:${vport.phone.replace(/\s+/g,'')}`
  }
  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: vport.name, text: `${vport.name} on Vibez`, url })
      } else {
        await navigator.clipboard.writeText(url)
        alert('Link copied!')
      }
    } catch { /* user cancelled */ }
  }
  const report = () => {
    alert('Thanks! Reporting flow coming soon.')
  }
  return (
    <div className="grid grid-cols-4 gap-2">
      <button onClick={navTo} className="rounded-lg bg-purple-600 hover:bg-purple-700 text-white py-2 text-sm">Route</button>
      <button onClick={call} className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2 text-sm">Call</button>
      <button onClick={share} className="rounded-lg bg-gray-900 hover:bg-black text-white py-2 text-sm">Share</button>
      <button onClick={report} className="rounded-lg bg-red-600 hover:bg-red-700 text-white py-2 text-sm">Report</button>
    </div>
  )
}

function MiniMap({ vport }) {
  const icon = useMemo(() => L.divIcon({
    html: `<div style="width:30px;height:30px;border-radius:9999px;display:flex;align-items:center;justify-content:center;border:2px solid #7c3aed;background:rgba(124,58,237,0.12);box-shadow:0 2px 6px rgba(0,0,0,0.25)"><span style="font-size:18px">${TYPE_EMOJI[typeLabel(vport.type)] || '📍'}</span></div>`,
    className: 'vport-minimap',
    iconSize: [30,30],
    iconAnchor: [15,28],
    popupAnchor: [0,-26]
  }), [vport.type])
  return (
    <div className="h-52 rounded-xl overflow-hidden border">
      <MapContainer
        center={[vport.latitude, vport.longitude]}
        zoom={16}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        className="h-full"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        <Marker position={[vport.latitude, vport.longitude]} icon={icon}>
          <Popup>{vport.name}</Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}

// ---------------- main page ----------------
export default function VPortPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { vport, hours, photos, reviews, reload, loading, error } = useVPortData(id)

  const emoji = TYPE_EMOJI[typeLabel(vport?.type)] || '📍'
  const website = normalizeUrl(vport?.website)

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-gray-200 rounded w-2/3" />
          <div className="h-48 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (error || !vport) {
    return (
      <div className="p-4">
        <div className="text-red-600 mb-2">{error || 'VPort not found.'}</div>
        <button onClick={()=>nav(-1)} className="px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300 text-sm">Go back</button>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl">{emoji}</div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold leading-tight">{vport.name}</h1>
              {vport.verified && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">Verified</span>}
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{typeLabel(vport.type)}</span>
            </div>
            <div className="text-sm text-gray-600">
              <AvgRating reviews={reviews} />
            </div>
          </div>
        </div>

        {/* View in VGrid */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => nav('/vgrid', {
              state: {
                focusVPort: {
                  id: vport.id,
                  name: vport.name,
                  lat: vport.latitude,
                  lng: vport.longitude,
                }
              }
            })}
            className="px-3 py-1.5 rounded-lg bg-black text-white hover:bg-gray-800 text-sm"
            title="Open the map centered on this VPort"
          >
            View in VGrid
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <ActionBar vport={vport} />

      {/* Photos */}
      <Photos photos={photos} />

      {/* About / Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border p-3 space-y-2">
          <div className="font-semibold">Details</div>
          <div className="text-sm text-gray-700 space-y-1.5">
            {vport.address ? <div>{vport.address}</div> : null}
            <div>{[vport.city, vport.region, vport.country].filter(Boolean).join(', ')}</div>
            {website && (
              <a className="text-blue-600 underline break-all" href={website} target="_blank" rel="noreferrer">
                {website}
              </a>
            )}
            <div>
              Phone:{' '}
              {vport.phone
                ? <a className="text-blue-600 underline" href={`tel:${vport.phone.replace(/\s+/g,'')}`}>{vport.phone}</a>
                : '—'}
            </div>
            <div className="pt-2">
              <MiniMap vport={vport} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border p-3 space-y-2">
          <div className="font-semibold">Hours</div>
          <HoursTable hours={hours} />
        </div>
      </div>

      {/* Reviews */}
      <div className="rounded-xl border p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Reviews</div>
          <button onClick={reload} className="text-sm px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">Refresh</button>
        </div>
        <AddReview vportId={vport.id} onAdded={reload} />
        <Reviews reviews={reviews} />
      </div>

      {/* Claim */}
      <ClaimBanner vportId={vport.id} />
    </div>
  )
}
