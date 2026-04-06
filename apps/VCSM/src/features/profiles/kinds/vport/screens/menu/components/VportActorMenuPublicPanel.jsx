import React, { useMemo } from "react";

import useVportActorMenu from "@/features/profiles/kinds/vport/hooks/menu/useVportActorMenu";
import {
  filterMenuCategories,
  formatMenuItemPrice,
  PANEL_STYLE,
  THUMB_WRAP_STYLE,
} from "@/features/profiles/kinds/vport/screens/menu/model/vportActorMenuPublicPanel.model";

export function VportActorMenuPublicPanel({ actorId, query = "", className = "" } = {}) {
  const { categories, loading, error } = useVportActorMenu({
    actorId,
    includeInactive: false,
  });

  const q = (query || "").trim().toLowerCase();
  const filteredCategories = useMemo(() => {
    return filterMenuCategories(categories, query);
  }, [categories, query]);

  if (!actorId) return null;

  if (loading) {
    return (
      <div className={className} style={PANEL_STYLE}>
        <div style={{ color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>Menu</div>
        <div style={{ marginTop: 8, color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
          Loading menu...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={className}
        style={{
          ...PANEL_STYLE,
          border: "1px solid rgba(239,68,68,0.35)",
          background: "rgba(127,29,29,0.24)",
        }}
      >
        <div style={{ color: "rgba(255,255,255,0.90)", fontWeight: 700 }}>Menu</div>
        <div style={{ marginTop: 8, color: "rgba(255,255,255,0.70)", fontSize: 13 }}>
          {error?.message ?? "Failed to load menu."}
        </div>
      </div>
    );
  }

  if (!filteredCategories.length) {
    return (
      <div className={className} style={PANEL_STYLE}>
        <div style={{ color: "rgba(255,255,255,0.90)", fontWeight: 700 }}>Menu</div>
        <div style={{ marginTop: 10, color: "rgba(255,255,255,0.60)", fontSize: 13 }}>
          {q ? "No matching items." : "No menu available yet."}
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {filteredCategories.map((category) => {
        const items = Array.isArray(category?.items) ? category.items : [];
        const activeItems = items.filter((item) => item?.isActive !== false);
        const shownItems = Array.isArray(category?.__filteredItems)
          ? category.__filteredItems
          : activeItems;

        return (
          <div key={category?.id ?? category?.key ?? `cat-${category?.name || "x"}`} style={PANEL_STYLE}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ color: "rgba(255,255,255,0.92)", fontWeight: 800, fontSize: 16 }}>
                {category?.name || "Untitled Category"}
              </div>
              {category?.description ? (
                <div style={{ color: "rgba(255,255,255,0.60)", fontSize: 13, lineHeight: "18px" }}>
                  {category.description}
                </div>
              ) : null}
            </div>

            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {shownItems.length ? (
                shownItems.map((item) => {
                  const priceLabel = formatMenuItemPrice(item);
                  const imageUrl = item?.imageUrl ?? item?.image_url ?? null;

                  return (
                    <div
                      key={item?.id ?? item?.key ?? `item-${item?.name || "x"}`}
                      style={{
                        borderRadius: 14,
                        border: "1px solid var(--profiles-border)",
                        background: "rgba(148, 163, 184, 0.08)",
                        padding: 12,
                      }}
                    >
                      <div style={{ display: "flex", gap: 10, minWidth: 0 }}>
                        {imageUrl ? (
                          <div style={THUMB_WRAP_STYLE}>
                            <img
                              src={imageUrl}
                              alt=""
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        ) : null}

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "baseline",
                              justifyContent: "space-between",
                              gap: 10,
                            }}
                          >
                            <div style={{ color: "rgba(255,255,255,0.92)", fontWeight: 800 }}>
                              {item?.name || "Untitled item"}
                            </div>
                            {priceLabel ? (
                              <div
                                style={{
                                  color: "rgba(255,255,255,0.92)",
                                  fontWeight: 900,
                                  fontSize: 13,
                                }}
                              >
                                {priceLabel}
                              </div>
                            ) : null}
                          </div>

                          {item?.description ? (
                            <div
                              style={{
                                marginTop: 6,
                                color: "rgba(255,255,255,0.60)",
                                fontSize: 13,
                                lineHeight: "18px",
                              }}
                            >
                              {item.description}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>No items yet.</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default VportActorMenuPublicPanel;
