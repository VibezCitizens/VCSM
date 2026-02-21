// src/features/profiles/kinds/vport/ui/menu/VportActorMenuPublicPanel.jsx

import React, { useMemo } from "react";
import useVportActorMenu from "@/features/profiles/kinds/vport/hooks/menu/useVportActorMenu";

export function VportActorMenuPublicPanel({ actorId, query = "", className = "" } = {}) {
  const { categories, loading, error } = useVportActorMenu({
    actorId,
    includeInactive: false,
  });

  const safeCategories = useMemo(() => {
    const list = Array.isArray(categories) ? categories : [];
    return list.filter((c) => c?.isActive !== false);
  }, [categories]);

  const q = (query || "").trim().toLowerCase();

  const formatPrice = (it) => {
    const cents =
      typeof it?.priceCents === "number"
        ? it.priceCents
        : typeof it?.price_cents === "number"
        ? it.price_cents
        : null;

    if (cents != null && Number.isFinite(cents)) return `$${(cents / 100).toFixed(2)}`;

    const price =
      typeof it?.price === "number"
        ? it.price
        : typeof it?.price_amount === "number"
        ? it.price_amount
        : null;

    if (price != null && Number.isFinite(price)) return `$${Number(price).toFixed(2)}`;

    return null;
  };

  const matches = (val) => {
    if (!q) return true;
    if (val == null) return false;
    return String(val).toLowerCase().includes(q);
  };

  const filteredCategories = useMemo(() => {
    if (!q) return safeCategories;

    return safeCategories
      .map((cat) => {
        const items = Array.isArray(cat?.items) ? cat.items : [];
        const activeItems = items.filter((it) => it?.isActive !== false);

        const catMatches = matches(cat?.name) || matches(cat?.description);

        if (catMatches) {
          // If category matches, keep all active items for context
          return { ...cat, __filteredItems: activeItems };
        }

        const itemMatches = activeItems.filter((it) => {
          // match item fields
          return matches(it?.name) || matches(it?.description);
        });

        if (!itemMatches.length) return null;

        return { ...cat, __filteredItems: itemMatches };
      })
      .filter(Boolean);
  }, [q, safeCategories]);

  if (!actorId) return null;

  if (loading) {
    return (
      <div
        className={className}
        style={{
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(17,17,17,0.55)",
          padding: 16,
        }}
      >
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
          borderRadius: 18,
          border: "1px solid rgba(239,68,68,0.35)",
          background: "rgba(127,29,29,0.20)",
          padding: 16,
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
      <div
        className={className}
        style={{
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(17,17,17,0.55)",
          padding: 16,
        }}
      >
        <div style={{ color: "rgba(255,255,255,0.90)", fontWeight: 700 }}>Menu</div>

        <div style={{ marginTop: 10, color: "rgba(255,255,255,0.60)", fontSize: 13 }}>
          {q ? "No matching items." : "No menu available yet."}
        </div>
      </div>
    );
  }

  // ✅ NEW: thumb style (local, tiny)
  const thumbWrap = {
    width: 54,
    height: 54,
    borderRadius: 12,
    overflow: "hidden",
    flexShrink: 0,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.35)",
  };

  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {filteredCategories.map((cat) => {
        const items = Array.isArray(cat?.items) ? cat.items : [];
        const activeItems = items.filter((it) => it?.isActive !== false);

        // if we filtered, we attach __filteredItems; otherwise show normal actives
        const shownItems = Array.isArray(cat?.__filteredItems) ? cat.__filteredItems : activeItems;

        return (
          <div
            key={cat?.id ?? cat?.key ?? Math.random()}
            style={{
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(17,17,17,0.55)",
              padding: 16,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ color: "rgba(255,255,255,0.92)", fontWeight: 800, fontSize: 16 }}>
                {cat?.name || "Untitled Category"}
              </div>

              {cat?.description ? (
                <div style={{ color: "rgba(255,255,255,0.60)", fontSize: 13, lineHeight: "18px" }}>
                  {cat.description}
                </div>
              ) : null}
            </div>

            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {shownItems.length ? (
                shownItems.map((it) => {
                  const priceLabel = formatPrice(it);

                  // ✅ NEW: accept both domain + raw shapes
                  const imageUrl = it?.imageUrl ?? it?.image_url ?? null;

                  return (
                    <div
                      key={it?.id ?? it?.key ?? Math.random()}
                      style={{
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: "rgba(255,255,255,0.04)",
                        padding: 12,
                      }}
                    >
                      {/* ✅ NEW: row with thumb + content */}
                      <div style={{ display: "flex", gap: 10, minWidth: 0 }}>
                        {imageUrl ? (
                          <div style={thumbWrap}>
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
                              {it?.name || "Untitled item"}
                            </div>

                            {priceLabel ? (
                              <div style={{ color: "rgba(255,255,255,0.92)", fontWeight: 900, fontSize: 13 }}>
                                {priceLabel}
                              </div>
                            ) : null}
                          </div>

                          {it?.description ? (
                            <div
                              style={{
                                marginTop: 6,
                                color: "rgba(255,255,255,0.60)",
                                fontSize: 13,
                                lineHeight: "18px",
                              }}
                            >
                              {it.description}
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
