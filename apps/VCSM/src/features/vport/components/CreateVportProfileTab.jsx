import { cx } from "@/features/vport/createVportForm.model";

export function CreateVportProfileTab({
  avatarPreview,
  avatarUrl,
  avatarFile,
  description,
  directoryVisible,
  inputRef,
  handlePickFile,
  setAvatarFile,
  setAvatarUrl,
  setDescription,
  setDirectoryVisible,
}) {
  return (
    <>
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-sm text-zinc-300">
          Profile image
          <span className="text-xs font-medium text-rose-400">Required</span>
        </label>
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
              style={{ display: 'none' }}
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
                onClick={() => { setAvatarFile(null); setAvatarUrl(''); }}
                className="rounded-xl bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
              >
                Remove
              </button>
            )}
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

      <button
        type="button"
        onClick={() => setDirectoryVisible((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-3 text-left"
      >
        <div>
          <div className="text-sm font-medium text-zinc-200">Show on TRAZE</div>
          <div className="mt-0.5 text-xs text-zinc-500">Get discovered by customers in your city.</div>
        </div>
        <div
          className={cx(
            'relative ml-4 h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200',
            directoryVisible ? 'bg-gradient-to-r from-violet-600 to-purple-500' : 'bg-zinc-700'
          )}
        >
          <span
            className={cx(
              'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
              directoryVisible ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </div>
      </button>
    </>
  );
}
