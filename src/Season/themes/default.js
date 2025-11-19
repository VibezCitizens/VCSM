// src/Season/themes/default.js

export const DefaultTheme = {
  name: "default",

  apply() {
    return {
      wrapper:
        "min-h-screen bg-black text-white flex items-center justify-center px-4",
      fog1: null,
      fog2: null,
      loginHat: null   // <-- REQUIRED
    };
  }
};
