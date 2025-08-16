import React, { useEffect, useState } from 'react';

const TYPE_OPTIONS = [
  'Creator',
  'Artist',
  'Public Figure',
  'Athlete',
  'Driver',
  'Business',
  'Organization',
  'Other',
];

/**
 * Props:
 * - initial: { name, type, phone, website, description, address, city, region, country, latitude?, longitude? }
 * - onSubmit(payload)
 * - submitting: boolean
 * - onCancel?: () => void
 */
export default function VPortForm({ initial = {}, onSubmit, submitting, onCancel }) {
  const [form, setForm] = useState({
    name: initial.name ?? '',
    type: initial.type ?? '',
    phone: initial.phone ?? '',
    website: initial.website ?? '',
    description: initial.description ?? '',
    address: initial.address ?? '',
    city: initial.city ?? '',
    region: initial.region ?? '',
    country: initial.country ?? 'US',
  });
  const [err, setErr] = useState('');

  // keep form in sync if "initial" changes (e.g., edit screen load)
  useEffect(() => {
    setForm({
      name: initial.name ?? '',
      type: initial.type ?? '',
      phone: initial.phone ?? '',
      website: initial.website ?? '',
      description: initial.description ?? '',
      address: initial.address ?? '',
      city: initial.city ?? '',
      region: initial.region ?? '',
      country: initial.country ?? 'US',
    });
  }, [initial]);

  function patch(k, v) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setErr('');
    try {
      const payload = {
        ...form,
        latitude: initial.latitude ?? 0,
        longitude: initial.longitude ?? 0,
      };
      if (!payload.name.trim()) throw new Error('Name is required');
      if (!payload.type.trim()) throw new Error('Type is required');
      await onSubmit(payload);
    } catch (e2) {
      setErr(e2.message || 'Save failed');
    }
  }

  const input =
    'w-full p-2 rounded bg-white text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500';
  const select = input;
  const textarea = input;

  return (
    <form onSubmit={submit} className="space-y-3 text-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-sm opacity-80">Name*</span>
          <input className={input} required value={form.name} onChange={(e) => patch('name', e.target.value)} />
        </label>

        <label className="space-y-1">
          <span className="text-sm opacity-80">Type*</span>
          <select className={select} required value={form.type} onChange={(e) => patch('type', e.target.value)}>
            <option value="" disabled>Select type</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm opacity-80">Phone</span>
          <input className={input} value={form.phone} onChange={(e) => patch('phone', e.target.value)} />
        </label>

        <label className="space-y-1">
          <span className="text-sm opacity-80">Website</span>
          <input className={input} value={form.website} onChange={(e) => patch('website', e.target.value)} />
        </label>

        {/* About */}
        <label className="md:col-span-2 space-y-1">
          <span className="text-sm opacity-80">About</span>
          <textarea
            className={textarea}
            rows={4}
            placeholder="Tell customers about this VPort (services, hours, story)…"
            value={form.description}
            onChange={(e) => patch('description', e.target.value)}
          />
        </label>

        <label className="md:col-span-2 space-y-1">
          <span className="text-sm opacity-80">Address</span>
          <textarea className={textarea} value={form.address} onChange={(e) => patch('address', e.target.value)} />
        </label>

        <label className="space-y-1">
          <span className="text-sm opacity-80">City</span>
          <input className={input} value={form.city} onChange={(e) => patch('city', e.target.value)} />
        </label>

        <label className="space-y-1">
          <span className="text-sm opacity-80">Region (State/Province)</span>
          <input className={input} value={form.region} onChange={(e) => patch('region', e.target.value)} />
        </label>

        <label className="space-y-1">
          <span className="text-sm opacity-80">Country</span>
          <input className={input} value={form.country} onChange={(e) => patch('country', e.target.value)} />
        </label>
      </div>

      {err && <div className="text-red-400 text-sm">{err}</div>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Save'}
        </button>

        {/* Cancel: only renders if onCancel provided */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded border border-zinc-600 bg-zinc-800 hover:bg-zinc-700"
            aria-label="Cancel and go back"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
