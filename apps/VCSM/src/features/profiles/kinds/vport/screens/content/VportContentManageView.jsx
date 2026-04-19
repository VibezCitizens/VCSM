// src/features/profiles/kinds/vport/screens/content/VportContentManageView.jsx
// Owner view: list all content pages, create/edit inline, toggle publish.

import { useState, useCallback } from "react";

import { useVportContentPages } from "@/features/profiles/kinds/vport/screens/content/hooks/useVportContentPages";
import VportContentOwnerRow from "@/features/profiles/kinds/vport/screens/content/components/VportContentOwnerRow";
import VportContentPageForm from "@/features/profiles/kinds/vport/screens/content/components/VportContentPageForm";
import VportContentEmptyState from "@/features/profiles/kinds/vport/screens/content/components/VportContentEmptyState";

export function VportContentManageView({ actorId }) {
  const { pages, loading, error, createPage, updatePage, deletePage, togglePublish } =
    useVportContentPages({ actorId });

  const [formState, setFormState] = useState(null); // null | { mode: 'create' } | { mode: 'edit', page }
  const [formLoading, setFormLoading] = useState(false);

  const openCreate = useCallback(() => setFormState({ mode: "create" }), []);
  const openEdit = useCallback((page) => setFormState({ mode: "edit", page }), []);
  const closeForm = useCallback(() => setFormState(null), []);

  const handleSubmit = useCallback(
    async (fields) => {
      setFormLoading(true);
      let result;

      if (formState?.mode === "create") {
        result = await createPage(fields);
      } else if (formState?.mode === "edit" && formState.page?.id) {
        result = await updatePage(formState.page.id, fields);
      }

      setFormLoading(false);

      if (result?.ok) {
        closeForm();
      }

      return result;
    },
    [formState, createPage, updatePage, closeForm]
  );

  return (
    <div className="profiles-card rounded-2xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-white font-semibold text-base">Content Pages</div>
          <div className="text-white/40 text-xs mt-0.5">
            Guides, FAQs, and tips for your customers.
          </div>
        </div>
        {!formState && (
          <button
            type="button"
            onClick={openCreate}
            className="profiles-pill-btn px-3 py-1.5 text-xs font-semibold shrink-0"
          >
            + New Page
          </button>
        )}
      </div>

      {formState && (
        <div className="profiles-subcard rounded-2xl p-4">
          <div className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-4">
            {formState.mode === "create" ? "New Content Page" : "Edit Content Page"}
          </div>
          <VportContentPageForm
            page={formState.mode === "edit" ? formState.page : null}
            onSubmit={handleSubmit}
            onCancel={closeForm}
            loading={formLoading}
          />
        </div>
      )}

      {loading && !formState && (
        <div className="text-white/30 text-sm text-center py-8">Loading...</div>
      )}

      {error && !loading && (
        <div className="text-rose-400 text-sm text-center py-4">{error}</div>
      )}

      {!loading && !error && !formState && pages.length === 0 && (
        <VportContentEmptyState isOwner />
      )}

      {!loading && pages.length > 0 && !formState && (
        <div className="flex flex-col gap-2">
          {pages.map((page) => (
            <VportContentOwnerRow
              key={page.id}
              page={page}
              onEdit={openEdit}
              onDelete={deletePage}
              onTogglePublish={togglePublish}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default VportContentManageView;
