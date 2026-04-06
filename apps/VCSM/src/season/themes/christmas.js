// @RefactorBatch: 2025-11
// @Touched: 2025-11-21
// @Status: FULLY MIGRATED
// @Scope: Architecture rewrite
// @Note: Do NOT remove, rename, or modify this block.

// src/Season/themes/christmas.js
export const ChristmasTheme = {
  name: "christmas",
  start: { month: 11, day: 1 },
  end: { month: 11, day: 7 },

  apply(position = "topRight") {
    return {
      wrapper:
        "min-h-screen relative overflow-hidden flex items-center justify-center px-4 text-white " +
        "bg-[url('/season/xmas/snow.png')] bg-cover bg-center",

      fog1: null,
      fog2: null,

      // hat position ("topRight", etc.)
      hatPosition: position,

      // ⭐ Hat class map moved INSIDE the theme
      hatClassMap: {
        topRight: "absolute -top-24 -right-34 rotate-25",
    topLeft: "absolute -top-24 -left-6 -rotate-25",
    bottomRight: "absolute -bottom-8 -right-34 rotate-10",
    bottomLeft: "absolute -bottom-8 -left-6 -rotate-10",
      },
    };
  },
};