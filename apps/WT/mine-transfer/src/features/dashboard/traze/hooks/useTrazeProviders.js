import { useCallback, useEffect, useState } from "react";
import { listTrazeProviders } from "@/features/traze/data/trazeProvider.repo";

function toDashboardProvider(provider) {
  return {
    ...provider,
    name: provider.displayName,
    sourceLabel: provider.source === "seed" ? "Seed" : "VPORT",
    isImportedIntake: false,
    phonePublic: provider.phone,
    email: "",
    categoryKey: provider.categoryKey || provider.businessType || provider.serviceSlug,
    city: [provider.cityName, provider.stateCode, provider.countryCode].filter(Boolean).join(", "),
    zipCode: provider.zipCode ?? "",
    addressText: provider.addressText ?? "",
    bookingUrl: null,
    createdAt: provider.createdAt,
    hasAvatar: Boolean(provider.avatarUrl || provider.logoUrl),
    hasPhone: Boolean(provider.phone),
    hasHours: Boolean(provider.hours),
    hasBooking: false,
    hasCity: Boolean(provider.citySlug || provider.cityName),
    hasService: Boolean(provider.serviceSlug || provider.businessType || provider.serviceId),
  };
}

export function useTrazeProviders() {
  const [state, setState] = useState({ status: "loading", providers: [], error: null });

  const load = useCallback(({ quiet = false } = {}) => {
    let cancelled = false;
    if (!quiet) setState((current) => ({ ...current, status: "loading", error: null }));

    listTrazeProviders()
      .then((providers) => {
        if (!cancelled) {
          setState({ status: "ready", providers: providers.map(toDashboardProvider), error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) setState({ status: "error", providers: [], error });
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => load(), [load]);

  async function updateImportedProvider(provider, fields) {
    throw new Error("Provider index rows are read-only in Mine Transfer. Seed writes need an approved write path.");
  }

  async function deleteImportedProvider(provider) {
    throw new Error("Provider index rows cannot be deleted from Mine Transfer.");
  }

  return {
    ...state,
    reload: () => load({ quiet: true }),
    updateImportedProvider,
    deleteImportedProvider,
  };
}
