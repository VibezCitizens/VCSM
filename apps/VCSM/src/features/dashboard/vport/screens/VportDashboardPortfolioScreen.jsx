import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { Image as ImageIcon, Plus } from "lucide-react";

import { useIdentity } from "@/state/identity/identityContext";
import useDesktopBreakpoint from "@/features/dashboard/vport/screens/useDesktopBreakpoint";
import { createVportDashboardShellStyles } from "@/features/dashboard/vport/screens/styles/vportDashboardShellStyles";
import VportBackButton from "@/features/dashboard/vport/screens/components/VportBackButton";

import { deleteItem } from "@portfolio";
import { useVportPortfolio } from "@/features/profiles/adapters/profiles.adapter";
import { PortfolioBugsBunnyPanel } from "./components/PortfolioBugsBunnyPanel";
import PortfolioItemForm from "./components/portfolio/PortfolioItemForm";
import PortfolioManagerCard from "./components/portfolio/PortfolioManagerCard";
import { usePublishBarbershopPortfolioPost } from "@/features/profiles/kinds/vport/hooks/barbershop/usePublishBarbershopPortfolioPost";

function buildInitialValues(detail) {
  if (!detail) return null;
  return {
    title: detail.title ?? "",
    description: detail.description ?? "",
    kind: detail.portfolioKind ?? "work",
    tagsInput: (detail.tags ?? []).join(", "),
    existingMediaCount: (detail.media ?? []).length || detail.mediaCount || 0,
    locksmith: detail.locksmithDetails
      ? {
          jobType: detail.locksmithDetails.jobType ?? "other",
          propertyType: detail.locksmithDetails.propertyType ?? "",
          lockType: detail.locksmithDetails.lockType ?? "",
          hardwareBrand: detail.locksmithDetails.hardwareBrand ?? "",
          serviceMode: detail.locksmithDetails.serviceMode ?? "",
          estimatedDurationMinutes: String(detail.locksmithDetails.estimatedDurationMinutes ?? ""),
          isEmergencyJob: detail.locksmithDetails.isEmergencyJob ?? false,
          isSecurityUpgrade: detail.locksmithDetails.isSecurityUpgrade ?? false,
        }
      : null,
  };
}

export default function VportDashboardPortfolioScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const { identity } = useIdentity();
  const targetActorId = params?.actorId ?? null;
  const viewerActorId = identity?.actorId ?? null;
  const isDesktop = useDesktopBreakpoint();
  const isOwner = Boolean(targetActorId) && Boolean(viewerActorId) && String(viewerActorId) === String(targetActorId);

  const isBarbershop = ["barbershop", "barber"].includes(
    String(identity?.vportType ?? "").toLowerCase()
  );

  const { allItems, loading, error, reload, optimisticRemove, optimisticAdd, optimisticUpdate, getItem } =
    useVportPortfolio(targetActorId);

  const [shareToFeed, setShareToFeed] = useState(false);
  const { publishBarbershopPortfolioPost } = usePublishBarbershopPortfolioPost({
    actorId: targetActorId,
  });

  const [showCreate, setShowCreate] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingItemDetail, setEditingItemDetail] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const handleCreated = useCallback(
    (optimisticItem, { firstMediaUrl } = {}) => {
      setShowCreate(false);
      setShareToFeed(false);
      if (optimisticItem) optimisticAdd(optimisticItem);
      if (shareToFeed && isBarbershop) {
        const title = optimisticItem?.title ?? null;
        try {
          publishBarbershopPortfolioPost({ portfolioTitle: title, mediaUrl: firstMediaUrl ?? null });
        } catch {
          // non-blocking — portfolio item already created
        }
      }
    },
    [optimisticAdd, shareToFeed, isBarbershop, publishBarbershopPortfolioPost]
  );

  const handleEdit = useCallback(async (item) => {
    setLoadingEdit(true);
    setEditingItem(item);
    setEditingItemDetail(null);
    setShowCreate(false);
    try {
      const detail = await getItem(item.id, { includeLocksmithDetails: true });
      setEditingItemDetail(detail);
    } catch (_) {
      setEditingItem(null);
    } finally {
      setLoadingEdit(false);
    }
  }, []);

  const handleEdited = useCallback(() => {
    setEditingItem(null);
    setEditingItemDetail(null);
    reload();
  }, [reload]);

  const handleCancelEdit = useCallback(() => {
    setEditingItem(null);
    setEditingItemDetail(null);
  }, []);

  const handleDelete = useCallback(async (item) => {
    if (!item?.id || !targetActorId) return;
    setDeletingId(item.id);
    const rollback = optimisticRemove(item.id);
    try {
      await deleteItem({ itemId: item.id, actorId: targetActorId });
    } catch (_) {
      rollback();
    } finally {
      setDeletingId(null);
    }
  }, [targetActorId, optimisticRemove]);

  const shell = createVportDashboardShellStyles({ isDesktop, maxWidthDesktop: 900 });

  if (!targetActorId) return null;
  if (!isOwner) return <div className="p-10 text-center text-white/50">Owner access only.</div>;

  const content = (
    <div style={shell.page}>
      <div style={shell.container}>
        <div style={shell.headerWrap}>
          <div style={shell.topBar}>
            <VportBackButton isDesktop={isDesktop} onClick={() => navigate(`/actor/${targetActorId}/dashboard`)} />
            <div style={shell.title}>PORTFOLIO</div>
            <div style={shell.rightSpacer} />
          </div>

          <div style={{ padding: 16 }}>
            {import.meta.env.DEV && (
              <PortfolioBugsBunnyPanel actorId={targetActorId} identity={identity} />
            )}

            {!showCreate && !editingItem ? (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] py-4 text-sm font-medium text-white/50 hover:border-sky-300/30 hover:text-sky-200/70 transition-colors"
              >
                <Plus size={18} />
                Add portfolio item
              </button>
            ) : null}

            {showCreate ? (
              <div className="mb-4">
                <PortfolioItemForm
                  mode="create"
                  actorId={targetActorId}
                  vportType={identity?.vportType ?? null}
                  onDone={handleCreated}
                  onCancel={() => { setShowCreate(false); setShareToFeed(false); }}
                  shareToFeed={isBarbershop ? shareToFeed : false}
                  onToggleShareToFeed={isBarbershop ? setShareToFeed : null}
                />
              </div>
            ) : null}

            {editingItem && loadingEdit ? (
              <div className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/[0.02] py-8 text-sm text-white/40">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                Loading item...
              </div>
            ) : null}

            {editingItem && editingItemDetail && !loadingEdit ? (
              <div className="mb-4">
                <PortfolioItemForm
                  mode="edit"
                  editItemId={editingItem.id}
                  existingItem={editingItem}
                  initialValues={buildInitialValues(editingItemDetail)}
                  actorId={targetActorId}
                  vportType={identity?.vportType ?? null}
                  onOptimisticUpdate={optimisticUpdate}
                  onDone={handleEdited}
                  onCancel={handleCancelEdit}
                />
              </div>
            ) : null}

            {loading ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                <div className="text-sm text-white/40">Loading portfolio...</div>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-200">
                {String(error?.message ?? error)}
              </div>
            ) : !allItems.length ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <ImageIcon size={32} className="text-white/15" />
                <div className="text-sm font-medium text-white/40">No portfolio items yet</div>
                <div className="text-xs text-white/25">Tap "Add portfolio item" above to showcase your work.</div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="mb-2 text-xs text-white/35">{allItems.length} item{allItems.length !== 1 ? "s" : ""}</div>
                {allItems.map((item) => (
                  <PortfolioManagerCard
                    key={item.id}
                    item={item}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    deleting={deletingId === item.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isDesktop && typeof document !== "undefined") {
    return createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, overflow: "auto", background: "#000" }}>
        {content}
      </div>,
      document.body
    );
  }

  return content;
}
