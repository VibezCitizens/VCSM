import React from "react";
import FS from "@/features/public/vportBusinessCard/view/businessCardFormStyles";

export function upsertMetaTag({ name, property, content }) {
  const selector = name
    ? `meta[name="${name}"]`
    : `meta[property="${property}"]`;

  let el = document.head.querySelector(selector);
  const created = !el;

  if (!el) {
    el = document.createElement("meta");
    if (name) el.setAttribute("name", name);
    if (property) el.setAttribute("property", property);
    document.head.appendChild(el);
  }

  const prev = el.getAttribute("content");
  el.setAttribute("content", String(content || ""));

  return () => {
    if (created) { el.remove(); return; }
    if (prev == null) { el.removeAttribute("content"); }
    else { el.setAttribute("content", prev); }
  };
}

export function formatPhone(raw) {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === "1") {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return raw;
}

export function composeAddressLabel(card) {
  if (!card?.address) return "";
  const parts = [
    card.address.line1,
    card.address.line2,
    [card.address.city, card.address.state].filter(Boolean).join(", "),
    card.address.zip,
    card.address.country,
  ].filter(Boolean);
  return parts.join(" · ");
}

export function UnavailableState({ title, subtitle }) {
  return (
    <div style={FS.page}>
      <div style={FS.container}>
        <div style={FS.unavailableBox}>
          <div style={FS.unavailableTitle}>{title}</div>
          <div style={FS.unavailableSubtitle}>{subtitle}</div>
        </div>
      </div>
    </div>
  );
}
