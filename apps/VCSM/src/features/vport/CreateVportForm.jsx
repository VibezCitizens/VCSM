// src/features/vport/CreateVportForm.jsx
import { useEffect, useMemo, useRef, useState } from 'react';

import { VPORT_TYPE_GROUPS as TYPE_GROUPS } from '@/features/profiles/kinds/vport/adapters/config/vportTypes.config.adapter';
import useVportServiceCatalog from '@/features/vport/hooks/useVportServiceCatalog';
import { useCreateVport } from '@/features/vport/hooks/useCreateVport';
import { MAX_IMAGE_BYTES, cx, setsEqual, groupServicesByCategory } from '@/features/vport/createVportForm.model';
import { CreateVportProfileTab } from '@/features/vport/components/CreateVportProfileTab';
import { CreateVportServicesTab } from '@/features/vport/components/CreateVportServicesTab';
import { CreateVportDebugPanel } from '@/features/vport/components/CreateVportDebugPanel';

export default function CreateVportForm({ onCreated }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('other');
  const [activeTab, setActiveTab] = useState('profile');
  const [description, setDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedServiceKeys, setSelectedServiceKeys] = useState(() => new Set());
  const [directoryVisible, setDirectoryVisible] = useState(true);
  const [fileError, setFileError] = useState('');

  const inputRef = useRef(null);

  const serviceCatalog = useVportServiceCatalog({ vportType: type });
  const { submit, isBusy, error, _bbDebug, _setBbDebug } = useCreateVport({ onCreated });

  const catalogServices = useMemo(() => {
    return Array.isArray(serviceCatalog.data?.services) ? serviceCatalog.data.services : [];
  }, [serviceCatalog.data?.services]);

  const groupedCatalogServices = useMemo(() => {
    return groupServicesByCategory(catalogServices);
  }, [catalogServices]);

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

  const canSubmit = !!(name.trim() && type && (avatarFile || avatarUrl));

  function handlePickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFileError('Please choose an image file.');
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setFileError('Image is too large (max 5MB).');
      return;
    }

    setFileError('');
    setAvatarFile(file);
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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit || isBusy) return;

    const result = await submit({
      name,
      type,
      description,
      avatarFile,
      avatarUrl,
      directoryVisible,
      selectedServiceKeys,
    });

    if (result?.ok) {
      setName('');
      setType('other');
      setActiveTab('profile');
      setSelectedServiceKeys(new Set());
      setAvatarFile(null);
      setAvatarPreview('');
      setAvatarUrl('');
      setDescription('');
      setDirectoryVisible(true);
    }
  }

  const displayError = fileError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm text-zinc-300">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Joseline's Trucking"
          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-black outline-none focus:ring-2 focus:ring-violet-600"
          required
        />
        <p className="mt-1 text-xs text-zinc-500">
          Handle is generated automatically (example: @jorsh4821).
        </p>
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
        <CreateVportProfileTab
          avatarPreview={avatarPreview}
          avatarUrl={avatarUrl}
          avatarFile={avatarFile}
          description={description}
          directoryVisible={directoryVisible}
          inputRef={inputRef}
          handlePickFile={handlePickFile}
          setAvatarFile={setAvatarFile}
          setAvatarUrl={setAvatarUrl}
          setDescription={setDescription}
          setDirectoryVisible={setDirectoryVisible}
        />
      ) : (
        <CreateVportServicesTab
          serviceCatalog={serviceCatalog}
          catalogServices={catalogServices}
          groupedCatalogServices={groupedCatalogServices}
          selectedServiceKeys={selectedServiceKeys}
          toggleServiceKey={toggleServiceKey}
        />
      )}

      {displayError ? (
        <div className="rounded-xl border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-200">{displayError}</div>
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

      <CreateVportDebugPanel _bbDebug={_bbDebug} _setBbDebug={_setBbDebug} />
    </form>
  );
}
