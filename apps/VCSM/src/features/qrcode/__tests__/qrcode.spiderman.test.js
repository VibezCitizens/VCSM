import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { QrCode } from "@/features/qrcode/components/QrCode";
import {
  buildBusinessCardQrUrl,
  buildMenuQrUrl,
  buildMenuShortDisplayUrl,
  buildReviewsQrUrl,
  isQrSafeSlug,
} from "@/shared/lib/qrUrlBuilders";

const currentDir = dirname(fileURLToPath(import.meta.url));
const appSrcDir = join(currentDir, "../../../..");
const qrcodeDir = join(currentDir, "..");
const publicMenuDir = join(appSrcDir, "features/public/vportMenu/view");
const flyerViewPath = join(appSrcDir, "features/flyerBuilder/screens/VportActorMenuFlyerView.jsx");
const settingsQrModalPath = join(appSrcDir, "features/settings/vports/ui/VportsQrModal.jsx");

function walkFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return walkFiles(path);
    return [path];
  });
}

function read(path) {
  return readFileSync(path, "utf8");
}

describe("qrcode SPIDER-MAN coverage", () => {
  it("rejects null, empty, whitespace, and raw UUID slugs in every QR URL builder", () => {
    const unsafeValues = [
      null,
      undefined,
      "",
      "   ",
      "550e8400-e29b-41d4-a716-446655440000",
      " 550e8400-e29b-41d4-a716-446655440000 ",
    ];

    for (const value of unsafeValues) {
      expect(isQrSafeSlug(value)).toBe(false);
      expect(buildMenuQrUrl(value)).toBe("");
      expect(buildReviewsQrUrl(value)).toBe("");
      expect(buildBusinessCardQrUrl(value)).toBe("");
      expect(buildMenuShortDisplayUrl(value)).toBe("");
    }
  });

  it("builds slug-encoded public QR URLs only for safe slugs", () => {
    expect(isQrSafeSlug("marias-menu")).toBe(true);
    expect(buildMenuQrUrl("marias menu")).toBe("/profile/marias%20menu/menu");
    expect(buildReviewsQrUrl("marias/menu")).toBe("/profile/marias%2Fmenu/reviews");
    expect(buildBusinessCardQrUrl("marias-card")).toBe("/vport/marias-card/card");
    expect(buildMenuShortDisplayUrl("marias menu")).toBe("/profile/marias%20menu/menu");
  });

  it("does not render the low-level QR component for empty values", () => {
    expect(QrCode({ value: "" })).toBeNull();
    expect(QrCode({ value: "   " })).toBeNull();

    const element = QrCode({ value: "https://example.test/profile/marias/menu", size: 128 });
    expect(element).not.toBeNull();
    expect(element.props.style).toMatchObject({ width: 128, height: 128 });
  });

  it("keeps public menu and reviews QR views gated by safe canonical slugs", () => {
    for (const fileName of ["VportPublicMenuQrView.jsx", "VportPublicReviewsQrView.jsx"]) {
      const source = read(join(publicMenuDir, fileName));
      expect(source).toMatch(/isQrSafeSlug\s*=\s*isQrSafe\(canonicalSlug\)/);
      expect(source).toMatch(/loading\s*\|\|\s*!isQrSafeSlug/);
      expect(source).toMatch(/!\s*loading\s*&&\s*isQrSafeSlug/);
    }
  });

  it("keeps flyer print and printable QR body gated by safe slugs", () => {
    const source = read(flyerViewPath);
    expect(source).toMatch(/const\s+isQrSafe\s*=\s*isQrSafeSlug\(canonicalSlug\)/);
    expect(source).toMatch(/disabled=\{!isQrSafe\}/);
    expect(source).toMatch(/!\s*isQrSafe\s*\?/);
    expect(source).toContain("Preparing flyer");
  });

  it("keeps settings business-card QR actions bound to the safe built URL", () => {
    const source = read(settingsQrModalPath);
    expect(source).toMatch(/const\s+cardUrl\s*=\s*buildBusinessCardQrUrl/);
    expect(source).toMatch(/if\s*\(!cardUrl\)\s*return/);
    expect(source).toMatch(/disabled=\{!cardUrl\}/);
    expect(source).toMatch(/if\s*\(cardUrl\)\s*window\.open\(cardUrl,\s*['_"]_blank['_"]\)/);
  });

  it("keeps dashboard/qrcode free of local write, controller, DAL, RPC, and Supabase imports", () => {
    const forbidden = [
      /from\s+["'][^"']*\/dal\//,
      /from\s+["'][^"']*\/controller\//,
      /from\s+["'][^"']*supabase/i,
      /\.from\(/,
      /\.insert\(/,
      /\.update\(/,
      /\.delete\(/,
      /\.rpc\(/,
      /invokeEdgeFunction|functions\.invoke/,
    ];

    for (const filePath of walkFiles(qrcodeDir)) {
      if (!/\.(js|jsx)$/.test(filePath)) continue;
      if (filePath.includes("/__tests__/")) continue;
      const source = read(filePath);
      for (const pattern of forbidden) {
        expect(source, `${relative(qrcodeDir, filePath)} matched ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it("keeps external consumers behind the qrcode adapter instead of component internals", () => {
    const offenders = walkFiles(appSrcDir).filter((filePath) => {
      if (!/\.(js|jsx)$/.test(filePath)) return false;
      if (filePath.includes("/features/qrcode/")) return false;
      return read(filePath).includes("@/features/qrcode/components/");
    });

    expect(offenders.map((filePath) => relative(appSrcDir, filePath))).toEqual([]);
  });
});
