export const TRAZE_SCREEN_SEARCH = {
  home: {
    variant: "hero",
    placeholder: {
      en: "Search services or businesses",
      es: "Busca servicios o negocios"
    },
    showLocation: true,
    showUseLocation: true,
    showQuickFilters: false,
    quickFilters: [],
    submitMode: "directorySearch"
  },

  directory: {
    variant: "directory",
    placeholder: {
      en: "Search providers, categories, or services...",
      es: "Busca proveedores, categorías o servicios..."
    },
    showLocation: true,
    showUseLocation: false,
    showQuickFilters: true,
    quickFilters: ["open_now", "top_rated", "bookable", "near_me"],
    submitMode: "filterDirectory"
  },

  categories: {
    variant: "categories",
    placeholder: {
      en: "Search service categories...",
      es: "Busca categorías de servicios..."
    },
    showLocation: false,
    showUseLocation: false,
    showQuickFilters: true,
    quickFilters: [],
    submitMode: "filterCategories"
  },

  topProviders: {
    variant: "topProviders",
    placeholder: {
      en: "Search top providers...",
      es: "Busca mejores proveedores..."
    },
    showLocation: true,
    showUseLocation: false,
    showQuickFilters: true,
    quickFilters: ["top_rated", "with_reviews", "with_phone", "bookable"],
    submitMode: "filterProviders"
  }
};

export const TRAZE_QUICK_FILTER_LABELS = {
  open_now: {
    en: "Open now",
    es: "Abierto ahora"
  },
  top_rated: {
    en: "Top rated",
    es: "Mejor calificados"
  },
  bookable: {
    en: "Bookable",
    es: "Con reserva"
  },
  near_me: {
    en: "Near me",
    es: "Cerca de mi"
  },
  barber: {
    en: "Barber",
    es: "Barbería"
  },
  barbershop: {
    en: "Barbershop",
    es: "Barbería"
  },
  locksmith: {
    en: "Locksmith",
    es: "Cerrajero"
  },
  restaurant: {
    en: "Restaurant",
    es: "Restaurante"
  },
  gas: {
    en: "Gas",
    es: "Gasolina"
  },
  "gas-station": {
    en: "Gas Station",
    es: "Gasolinera"
  },
  exchange: {
    en: "Exchange",
    es: "Cambio"
  },
  "money-exchange": {
    en: "Money Exchange",
    es: "Casa de Cambio"
  },
  with_reviews: {
    en: "With reviews",
    es: "Con resenas"
  },
  with_phone: {
    en: "With phone",
    es: "Con telefono"
  }
};
