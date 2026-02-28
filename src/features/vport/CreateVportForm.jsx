// src/features/vport/CreateVportForm.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/app/providers/AuthProvider';
import { VPORT_TYPE_GROUPS as TYPE_GROUPS } from '@/features/profiles/kinds/vport/config/vportTypes.config';
import useUpsertVportServices from '@/features/profiles/kinds/vport/hooks/services/useUpsertVportServices';
import useVportServiceCatalog from '@/features/vport/hooks/useVportServiceCatalog';
import { listMyVports } from '@/features/vport/model/vport.read.vportRecords';
import { createVport } from '@/features/vport/model/vport.model';

const UPLOAD_ENDPOINT = 'https://upload.vibezcitizens.com';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

function cx(...xs) {
  return xs.filter(Boolean).join(' ');
}

export default function CreateVportForm({ onCreated }) {
  const navigate = useNavigate();
  const { user } = useAuth() || {};

  const [name, setName] = useState('');
  const [type, setType] = useState('other');
  const [activeTab, setActiveTab] = useState('profile');
  const [description, setDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedServiceKeys, setSelectedServiceKeys] = useState(() => new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const inputRef = useRef(null);

  const serviceCatalog = useVportServiceCatalog({ vportType: type });
  const upsertServices = useUpsertVportServices();

  const catalogServices = useMemo(() => {
    return Array.isArray(serviceCatalog.data?.services) ? serviceCatalog.data.services : [];
  }, [serviceCatalog.data?.services]);

  const groupedCatalogServices = useMemo(() => {
    return groupServicesByCategory(catalogServices);
  }, [catalogServices]);

  const isBusy = submitting || upsertServices.isPending;

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview('');
      return;
    }

    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  useEffect(() => {
    const allowedKeys = new Set(catalogServices.map((service) => service?.key).filter(Boolean));

    setSelectedServiceKeys((prev) => {
      const next = new Set([...prev].filter((key) => allowedKeys.has(key)));
      return setsEqual(prev, next) ? prev : next;
    });
  }, [catalogServices]);

  const canSubmit = !!(user?.id && name.trim() && type);

  async function handlePickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image is too large (max 5MB).');
      return;
    }

    setError('');
    setAvatarFile(file);
  }

  async function uploadAvatar() {
    if (!avatarFile) return '';

    const fd = new FormData();
    fd.append('file', avatarFile);
    fd.append('folder', `vports/${user.id}`);

    const res = await fetch(UPLOAD_ENDPOINT, { method: 'POST', body: fd });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);

    const json = await res.json();
    if (!json?.url) throw new Error('Upload response missing URL');

    return json.url;
  }

  function toggleServiceKey(key) {
    if (!key) return;

    setSelectedServiceKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError('');

    try {
      let finalAvatarUrl = avatarUrl;
      if (!finalAvatarUrl && avatarFile) {
        finalAvatarUrl = await uploadAvatar();
        setAvatarUrl(finalAvatarUrl);
      }

      const normalizedType = String(type).toLowerCase();
      const allTypes = Object.values(TYPE_GROUPS).flat();
      if (!allTypes.includes(normalizedType)) {
        throw new Error('Invalid Vport type.');
      }

      const res = await createVport({
        name: name.trim(),
        slug: nullIfEmpty(slugifyMaybe(name)),
        avatarUrl: finalAvatarUrl || null,
        bio: (description || '').trim() || null,
        ownerUserId: user?.id ?? null,
        vportType: normalizedType,
      });

      if (selectedServiceKeys.size > 0 && res?.actor_id) {
        const selectedItems = [...selectedServiceKeys].map((key) => ({ key, enabled: true }));

        try {
          await upsertServices.mutate({
            targetActorId: res.actor_id,
            vportType: normalizedType,
            items: selectedItems,
          });
        } catch (serviceError) {
          console.error('[CreateVportForm] failed to persist selected services', serviceError);
        }
      }

      if (onCreated) {
        const list = await listMyVports().catch(() => null);
        onCreated({ created: res, list });
      } else {
        navigate(`/vport/${res.vport_id}`);
      }

      setName('');
      setType('other');
      setActiveTab('profile');
      setSelectedServiceKeys(new Set());
      setAvatarFile(null);
      setAvatarPreview('');
      setAvatarUrl('');
      setDescription('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create Vport.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm text-zinc-300">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Joseline's Trucking"
          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-black outline-none focus:ring-2 focus:ring-violet-600"
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-zinc-300">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-black outline-none focus:ring-2 focus:ring-violet-600"
          required
        >
          {Object.entries(TYPE_GROUPS).map(([groupName, types]) => (
            <optgroup key={groupName} label={groupName}>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t[0].toUpperCase() + t.slice(1)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-zinc-700 bg-zinc-900/40 p-1">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={cx(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              activeTab === 'profile' ? 'bg-violet-600 text-white' : 'text-zinc-300 hover:bg-zinc-800'
            )}
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={cx(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              activeTab === 'services' ? 'bg-violet-600 text-white' : 'text-zinc-300 hover:bg-zinc-800'
            )}
          >
            Services ({selectedServiceKeys.size})
          </button>
        </div>
      </div>

      {activeTab === 'profile' ? (
        <>
          <div>
            <label className="mb-1.5 block text-sm text-zinc-300">Avatar</label>
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-zinc-900">
                {avatarPreview || avatarUrl ? (
                  <img src={avatarPreview || avatarUrl} alt="avatar preview" className="h-full w-full object-cover" />
                ) : (
                  <svg viewBox="0 0 24 24" className="h-7 w-7 text-zinc-500">
                    <path
                      fill="currentColor"
                      d="M12 12a5 5 0 100-10 5 5 0 000 10Zm-7 9a7 7 0 0114 0v1H5v-1Z"
                    />
                  </svg>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePickFile}
                />
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
                >
                  Choose image
                </button>

                {(avatarFile || avatarUrl) && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarUrl('');
                    }}
                    className="rounded-xl bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
                  >
                    Remove
                  </button>
                )}

                <span className="text-xs text-zinc-500">PNG/JPG up to 5MB.</span>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-zinc-300">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Tell people what this Vport is about..."
              className="min-h-24 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-black outline-none placeholder-black/50 focus:ring-2 focus:ring-violet-600"
            />
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-zinc-400">
            Select the services this VPORT offers. You can edit these later.
          </div>

          {serviceCatalog.isLoading ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-400">
              Loading services...
            </div>
          ) : null}

          {serviceCatalog.error ? (
            <div className="rounded-xl border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-200">
              Failed to load services for this type.
            </div>
          ) : null}

          {!serviceCatalog.isLoading && !serviceCatalog.error && catalogServices.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-400">
              No catalog services found for this type.
            </div>
          ) : null}

          {!serviceCatalog.isLoading && !serviceCatalog.error && catalogServices.length > 0 ? (
            <div className="space-y-3">
              {groupedCatalogServices.map(([category, services]) => (
                <section key={category} className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{category}</div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {services.map((service) => {
                      const key = service?.key ?? '';
                      const selected = selectedServiceKeys.has(key);

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleServiceKey(key)}
                          className={cx(
                            'rounded-xl border px-3 py-2 text-left transition-colors',
                            selected
                              ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200'
                              : 'border-zinc-700 bg-zinc-900/40 text-zinc-200 hover:border-zinc-500'
                          )}
                        >
                          <div className="text-sm font-medium">{service.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {error ? (
        <div className="rounded-xl border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-200">{error}</div>
      ) : null}

      <div className="flex items-center gap-3 pt-2">
        {activeTab === 'profile' ? (
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            Services
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            Profile
          </button>
        )}

        <button
          type="submit"
          disabled={!canSubmit || isBusy}
          className={cx(
            'rounded-xl px-5 py-2.5 font-semibold transition-colors',
            canSubmit && !isBusy
              ? 'bg-violet-600 hover:bg-violet-700'
              : 'cursor-not-allowed bg-zinc-800 text-zinc-400'
          )}
        >
          {isBusy ? 'Creating...' : 'Create Vport'}
        </button>
      </div>
    </form>
  );
}

function nullIfEmpty(s) {
  return s && s.trim() ? s.trim() : null;
}

function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const value of a.values()) {
    if (!b.has(value)) return false;
  }
  return true;
}

function groupServicesByCategory(services) {
  const groups = new Map();

  for (const service of services ?? []) {
    const category = (service?.category ?? 'Other').toString().trim() || 'Other';
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(service);
  }

  return [...groups.entries()];
}

function slugifyMaybe(name) {
  return name
    ?.toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
