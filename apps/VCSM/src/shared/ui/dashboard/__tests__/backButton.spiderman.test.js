import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

import VportBackButton from "@/shared/ui/dashboard/BackButton";

const currentDir = dirname(fileURLToPath(import.meta.url));
const sharedDir = join(currentDir, "..");
const backButtonPath = join(sharedDir, "BackButton.jsx");

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

describe("dashboard shared SPIDER-MAN coverage", () => {
  it("renders the back button as an accessible presentational button", () => {
    const element = VportBackButton({ onClick: vi.fn() });

    expect(element.type).toBe("button");
    expect(element.props.type).toBe("button");
    expect(element.props["aria-label"]).toBe("Back");
    expect(element.props.children).toHaveLength(2);
    expect(element.props.children[1]).toBe(false);
  });

  it("renders visible Back text in desktop mode", () => {
    const element = VportBackButton({ isDesktop: true, onClick: vi.fn() });
    const textElement = element.props.children[1];

    expect(textElement.type).toBe("span");
    expect(textElement.props.children).toBe("Back");
  });

  it("invokes the caller-provided onClick exactly once per activation", () => {
    const onClick = vi.fn();
    const element = VportBackButton({ onClick });

    element.props.onClick();

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("keeps BackButton free of data, routing, auth, and ownership logic", () => {
    const source = read(backButtonPath);
    const forbidden = [
      /use[A-Z][A-Za-z0-9_]*\(/,
      /useNavigate|react-router/,
      /actor_owners|assertActor|Owns|ownership/i,
      /supabase/i,
      /\.from\(/,
      /\.insert\(/,
      /\.update\(/,
      /\.delete\(/,
      /\.rpc\(/,
    ];

    for (const pattern of forbidden) {
      expect(source, `BackButton.jsx matched ${pattern}`).not.toMatch(pattern);
    }
  });

  it("keeps dashboard shared free of hooks, controllers, DALs, Supabase, RPC, and edge-function access", () => {
    const forbidden = [
      /from\s+["'][^"']*\/hooks?\//,
      /from\s+["'][^"']*\/controller\//,
      /from\s+["'][^"']*\/dal\//,
      /from\s+["'][^"']*supabase/i,
      /invokeEdgeFunction|functions\.invoke/,
      /\.from\(/,
      /\.insert\(/,
      /\.update\(/,
      /\.delete\(/,
      /\.rpc\(/,
    ];

    for (const filePath of walkFiles(sharedDir)) {
      if (!/\.(js|jsx)$/.test(filePath)) continue;
      if (filePath.includes("/__tests__/")) continue;
      const source = read(filePath);
      for (const pattern of forbidden) {
        expect(source, `${relative(sharedDir, filePath)} matched ${pattern}`).not.toMatch(pattern);
      }
    }
  });
});
