import { nanoid } from "nanoid";

export const DEFAULT_CANVAS_WIDTH = 1080;
export const DEFAULT_CANVAS_HEIGHT = 1350;
export const DEFAULT_CANVAS_BG = "#0b1020";

const MIN_NODE_SIZE = 24;

function asNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function createNodeId(prefix) {
  return `${prefix}_${nanoid(8)}`;
}

export function createTextNode(overrides = {}) {
  return {
    id: createNodeId("txt"),
    type: "text",
    x: 80,
    y: 80,
    w: 460,
    h: 120,
    z: 1,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    text: "Tap to edit",
    color: "#f8fafc",
    fontSize: 64,
    fontFamily: "Georgia, serif",
    fontWeight: 700,
    ...overrides,
  };
}

export function createShapeNode(overrides = {}) {
  return {
    id: createNodeId("shp"),
    type: "shape",
    shape: "rect",
    x: 80,
    y: 80,
    w: 420,
    h: 220,
    z: 1,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fill: "#7c3aed",
    radius: 24,
    ...overrides,
  };
}

export function createImageNode(asset, overrides = {}) {
  return {
    id: createNodeId("img"),
    type: "image",
    assetId: asset?.id ?? null,
    src: asset?.url ?? "",
    mime: asset?.mime ?? "",
    x: 120,
    y: 160,
    w: asNumber(asset?.width, 420),
    h: asNumber(asset?.height, 260),
    z: 1,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fit: "cover",
    radius: 14,
    ...overrides,
  };
}

export function createBlankScene({ width, height, background } = {}) {
  return {
    meta: {
      schema: "vc.flyer.scene.v1",
      width: asNumber(width, DEFAULT_CANVAS_WIDTH),
      height: asNumber(height, DEFAULT_CANVAS_HEIGHT),
      background: background || DEFAULT_CANVAS_BG,
    },
    nodes: [],
  };
}

export function createFlyerStarterScene({
  title,
  subtitle,
  note,
  accentColor,
  width,
  height,
  background,
} = {}) {
  const scene = createBlankScene({ width, height, background });
  const accent = accentColor || "#b572ff";

  scene.nodes = [
    createShapeNode({
      x: 42,
      y: 42,
      w: scene.meta.width - 84,
      h: 220,
      z: 0,
      fill: "#111827",
      opacity: 0.7,
      radius: 28,
    }),
    createTextNode({
      x: 72,
      y: 80,
      w: scene.meta.width - 140,
      h: 84,
      z: 1,
      text: title || "Digital Menu",
      fontSize: 72,
      fontWeight: 800,
      color: "#ffffff",
    }),
    createTextNode({
      x: 74,
      y: 168,
      w: scene.meta.width - 150,
      h: 52,
      z: 2,
      text: subtitle || "Scan to explore your VPORT offerings",
      fontSize: 30,
      fontWeight: 500,
      color: "#dbeafe",
    }),
    createShapeNode({
      x: 72,
      y: scene.meta.height - 190,
      w: scene.meta.width - 144,
      h: 120,
      z: 3,
      fill: accent,
      opacity: 0.88,
      radius: 22,
    }),
    createTextNode({
      x: 98,
      y: scene.meta.height - 146,
      w: scene.meta.width - 196,
      h: 80,
      z: 4,
      text: note || "Open menu, place order, and spread the vibe",
      fontSize: 34,
      fontWeight: 700,
      color: "#09090b",
      fontFamily: "Inter, system-ui, sans-serif",
    }),
  ];

  return scene;
}

export function ensureSceneContent(raw, fallback = {}) {
  const base = createBlankScene(fallback);
  const source = raw && typeof raw === "object" ? raw : {};
  const sourceMeta = source.meta && typeof source.meta === "object" ? source.meta : {};
  const sourceNodes = Array.isArray(source.nodes) ? source.nodes : [];

  const width = clamp(asNumber(sourceMeta.width, base.meta.width), 320, 4000);
  const height = clamp(asNumber(sourceMeta.height, base.meta.height), 320, 4000);
  const background = typeof sourceMeta.background === "string" && sourceMeta.background.trim()
    ? sourceMeta.background
    : base.meta.background;

  const nodes = sourceNodes
    .map((node, idx) => normalizeNode(node, idx))
    .filter(Boolean)
    .sort((a, b) => a.z - b.z)
    .map((node, idx) => ({ ...node, z: idx }));

  return {
    meta: {
      schema: "vc.flyer.scene.v1",
      width,
      height,
      background,
    },
    nodes,
  };
}

function normalizeNode(node, fallbackZ) {
  if (!node || typeof node !== "object") return null;

  const type = String(node.type || "").trim();
  if (!["text", "shape", "image"].includes(type)) return null;

  const common = {
    id: typeof node.id === "string" && node.id ? node.id : createNodeId(type),
    type,
    x: asNumber(node.x, 0),
    y: asNumber(node.y, 0),
    w: Math.max(MIN_NODE_SIZE, asNumber(node.w, 180)),
    h: Math.max(MIN_NODE_SIZE, asNumber(node.h, 80)),
    z: asNumber(node.z, fallbackZ),
    rotation: asNumber(node.rotation, 0),
    opacity: clamp(asNumber(node.opacity, 1), 0.05, 1),
    visible: node.visible !== false,
    locked: Boolean(node.locked),
  };

  if (type === "text") {
    return {
      ...common,
      text: typeof node.text === "string" ? node.text : "Text",
      color: typeof node.color === "string" ? node.color : "#ffffff",
      fontSize: clamp(asNumber(node.fontSize, 42), 12, 300),
      fontFamily: typeof node.fontFamily === "string" && node.fontFamily
        ? node.fontFamily
        : "Inter, system-ui, sans-serif",
      fontWeight: clamp(asNumber(node.fontWeight, 600), 100, 900),
    };
  }

  if (type === "shape") {
    return {
      ...common,
      shape: node.shape === "circle" ? "circle" : "rect",
      fill: typeof node.fill === "string" ? node.fill : "#7c3aed",
      radius: clamp(asNumber(node.radius, 20), 0, 300),
    };
  }

  return {
    ...common,
    src: typeof node.src === "string" ? node.src : "",
    assetId: typeof node.assetId === "string" ? node.assetId : null,
    mime: typeof node.mime === "string" ? node.mime : "",
    fit: node.fit === "contain" ? "contain" : "cover",
    radius: clamp(asNumber(node.radius, 12), 0, 300),
  };
}

export function buildNodePatch(node, partial = {}) {
  return ensureSceneContent({ meta: {}, nodes: [{ ...node, ...partial }] }).nodes[0] || null;
}
