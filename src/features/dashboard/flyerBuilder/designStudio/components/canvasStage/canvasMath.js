export const HANDLE_SIZE = 12;

export const RESIZE_CORNERS = [
  { key: "nw", cursor: "nwse-resize", position: { left: -6, top: -6 } },
  { key: "ne", cursor: "nesw-resize", position: { right: -6, top: -6 } },
  { key: "sw", cursor: "nesw-resize", position: { left: -6, bottom: -6 } },
  { key: "se", cursor: "nwse-resize", position: { right: -6, bottom: -6 } },
];

export function getResizedBox({
  corner,
  originX,
  originY,
  originW,
  originH,
  dx,
  dy,
  minSize,
}) {
  const isWest = corner.includes("w");
  const isNorth = corner.includes("n");

  const rawW = isWest ? originW - dx : originW + dx;
  const rawH = isNorth ? originH - dy : originH + dy;
  let nextX = isWest ? originX + dx : originX;
  let nextY = isNorth ? originY + dy : originY;
  let nextW = rawW;
  let nextH = rawH;

  if (nextW < minSize) {
    nextW = minSize;
    nextX = isWest ? originX + (originW - minSize) : originX;
  }

  if (nextH < minSize) {
    nextH = minSize;
    nextY = isNorth ? originY + (originH - minSize) : originY;
  }

  return {
    x: Math.round(nextX),
    y: Math.round(nextY),
    w: Math.round(nextW),
    h: Math.round(nextH),
  };
}
