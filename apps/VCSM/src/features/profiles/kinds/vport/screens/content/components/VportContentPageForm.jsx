// src/features/profiles/kinds/vport/screens/content/components/VportContentPageForm.jsx
// Create / edit form for a vport content page.

import { useState, useEffect, useCallback } from "react";

const CATEGORIES = [
  { value: "", label: "No category" },
  { value: "guide", label: "Guide" },
  { value: "faq", label: "FAQ" },
  { value: "emergency", label: "Emergency" },
  { value: "tips", label: "Tips" },
  { value: "educational", label: "Educational" },
];

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 160);
}

export function VportContentPageForm({ page = null, onSubmit, onCancel, loading = false }) {
  const isEditing = !!page?.id;

  const [title, setTitle] = useState(page?.title ?? "");
  const [slug, setSlug] = useState(page?.slug ?? "");
  const [summary, setSummary] = useState(page?.summary ?? "");
  const [body, setBody] = useState(page?.body ?? "");
  const [category, setCategory] = useState(page?.category ?? "");
  const [slugTouched, setSlugTouched] = useState(isEditing);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slugTouched && title) {
      setSlug(slugify(title));
    }
  }, [title, slugTouched]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError(null);

      const result = await onSubmit?.({
        title: title.trim(),
        slug: slug.trim(),
        summary: summary.trim() || null,
        body: body.trim() || null,
        category: category || null,
      });

      if (result && !result.ok) {
        setError(result.error ?? "Something went wrong.");
      }
    },
    [title, slug, summary, body, category, onSubmit]
  );

  const inputClass =
    "w-full bg-white/6 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400/50 transition";

  const labelClass = "block text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className={labelClass}>Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Emergency Lockout Guide"
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className={labelClass}>Slug *</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          placeholder="e.g. emergency-lockout-guide"
          className={`${inputClass} font-mono`}
          required
        />
        <div className="text-white/25 text-[11px] mt-1">
          Lowercase letters, numbers, and hyphens only. Max 160 characters.
        </div>
      </div>

      <div>
        <label className={labelClass}>Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`${inputClass} appearance-none`}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value} className="bg-[#0d1322] text-white">
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Summary</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="A short description shown in cards and search results."
          rows={3}
          className={`${inputClass} resize-none`}
          maxLength={500}
        />
      </div>

      <div>
        <label className={labelClass}>Content</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write the full page content here..."
          rows={10}
          className={`${inputClass} resize-y`}
        />
      </div>

      {error && (
        <div className="text-rose-400 text-sm px-1">{error}</div>
      )}

      <div className="flex gap-3 justify-end pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white/8 text-white/60 hover:bg-white/15 transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !title.trim() || !slug.trim()}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white transition disabled:opacity-40"
        >
          {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Page"}
        </button>
      </div>
    </form>
  );
}

export default VportContentPageForm;
