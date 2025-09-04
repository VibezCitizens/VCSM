// src/state/identityContext.jsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabaseClient";

const STORAGE_KEY = "vibez.activeActor.v1";
const ACCOUNTS_CACHE_KEY = "vibez.accountsCache.v1";

/** Public shape */
const IdentityContext = createContext({
  loading: true,
  error: null,
  accounts: [],
  activeAccountId: null,
  activeAccount: null,
  switchAccount: (_id) => false,
  addAccount: (_acct) => {},
  removeAccount: (_id) => {},
  refreshAccounts: () => {},

  // new API
  identity: null, // { type: 'user'|'vport', userId, ownerId?, vportId? }
  isUser: false,
  isVport: false,
  actAsUser: () => false,
  actAsVport: (_id) => false,

  // compat aliases
  setActingAsUser: () => false,
  setActingAsVPort: (_obj) => false,
});

/* ---------------- Helpers ---------------- */
function normalizeCitizen(raw) {
  return {
    id: `citizen:${raw.id}`,
    sourceId: raw.id,
    type: "citizen",
    displayName: raw.display_name || raw.username || raw.email || "Me",
    avatarUrl: raw.photo_url || null,
    username: raw.username || null,
  };
}
function normalizeVport(raw) {
  return {
    id: `vport:${raw.id}`,
    sourceId: raw.id,
    type: "vport",
    displayName: raw.name || "VPORT",
    avatarUrl: raw.avatar_url || null,
    username: null,
  };
}
function dedupeById(xs) {
  const seen = new Set();
  const out = [];
  for (const x of xs) {
    const key = x?.id;
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(x);
    }
  }
  return out;
}

async function fetchAccountsFromSupabase() {
  const { data: sess } = await supabase.auth.getSession();
  const session = sess?.session;
  if (!session) return { userId: null, accounts: [], error: null };

  const userId = session.user.id;

  // 1) Citizen profile (profiles.id == auth.users.id)
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, username, display_name, photo_url, email")
    .eq("id", userId)
    .single();

  // 2) VPORTs owned by the user (created_by = auth.users.id)
  let owned = [];
  let ownedErr = null;
  try {
    const { data, error } = await supabase
      .from("vports")
      .select("id, name, avatar_url, created_by")
      .eq("created_by", userId);
    owned = data || [];
    ownedErr = error || null;
  } catch (e) {
    ownedErr = e;
  }

  // Managers concept removed: no managed vports.
  const vportsAll = dedupeById([...(owned || [])]);

  const accounts = [
    ...(profile ? [normalizeCitizen(profile)] : []),
    ...vportsAll.map(normalizeVport),
  ];

  return {
    userId,
    accounts,
    error: profileErr || ownedErr || null,
  };
}

/* ---------------- Provider ---------------- */
function ProviderImpl({ children }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [activeAccountId, setActiveAccountId] = useState(null);
  const [authUserId, setAuthUserId] = useState(null);
  const initialized = useRef(false);

  const activeAccount = useMemo(
    () => accounts.find((a) => a.id === activeAccountId) || null,
    [accounts, activeAccountId]
  );

  // Track auth changes
  useEffect(() => {
    let sub;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      setAuthUserId(sess?.session?.user?.id ?? null);
      sub = supabase.auth.onAuthStateChange((_ev, session) => {
        setAuthUserId(session?.user?.id ?? null);
      });
    })();
    return () => sub?.data?.subscription?.unsubscribe?.();
  }, []);

  // Hydrate from storage, then fetch fresh
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      const cached = JSON.parse(
        localStorage.getItem(ACCOUNTS_CACHE_KEY) || "[]"
      );
      if (Array.isArray(cached)) setAccounts(cached);
      const storedId = localStorage.getItem(STORAGE_KEY);
      if (storedId) setActiveAccountId(storedId);
    } catch {}

    (async () => {
      setLoading(true);
      const { userId, accounts: fresh, error } =
        await fetchAccountsFromSupabase();
      if (userId) setAuthUserId(userId);
      if (!error && fresh?.length) {
        setAccounts(fresh);
        localStorage.setItem(ACCOUNTS_CACHE_KEY, JSON.stringify(fresh));
        const stored = localStorage.getItem(STORAGE_KEY);
        const next =
          stored ||
          fresh.find((a) => a.type === "citizen")?.id ||
          fresh[0].id;
        setActiveAccountId(next);
        localStorage.setItem(STORAGE_KEY, next);
      }
      setError(error);
      setLoading(false);
    })();
  }, []);

  // Persist active actor
  useEffect(() => {
    if (activeAccountId) {
      localStorage.setItem(STORAGE_KEY, activeAccountId);
      window.__VIBEZ_ACTIVE_ACTOR__ = activeAccountId;
      document.documentElement.setAttribute("data-actor", activeAccountId);
    }
  }, [activeAccountId]);

  /* -------- CRUD on account list -------- */
  const switchAccount = useCallback((nextId) => {
    if (!nextId) return false;
    setActiveAccountId(nextId);
    localStorage.setItem(STORAGE_KEY, nextId);
    return true;
  }, []);

  const addAccount = useCallback((account) => {
    setAccounts((prev) => {
      const next = dedupeById([
        ...prev.filter((a) => a.id !== account.id),
        account,
      ]);
      localStorage.setItem(ACCOUNTS_CACHE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeAccount = useCallback(
    (accountId) => {
      setAccounts((prev) => {
        const next = prev.filter((a) => a.id !== accountId);
        localStorage.setItem(ACCOUNTS_CACHE_KEY, JSON.stringify(next));
        if (activeAccountId === accountId) {
          const fallback =
            next.find((a) => a.type === "citizen") || next[0] || null;
          if (fallback) {
            setActiveAccountId(fallback.id);
            localStorage.setItem(STORAGE_KEY, fallback.id);
          } else {
            setActiveAccountId(null);
            localStorage.removeItem(STORAGE_KEY);
          }
        }
        return next;
      });
    },
    [activeAccountId]
  );

  const refreshAccounts = useCallback(async () => {
    setLoading(true);
    const { userId, accounts: fresh, error } =
      await fetchAccountsFromSupabase();
    if (userId) setAuthUserId(userId);
    if (!error && fresh?.length) {
      setAccounts(fresh);
      localStorage.setItem(ACCOUNTS_CACHE_KEY, JSON.stringify(fresh));
      const stillValid = fresh.some((a) => a.id === activeAccountId);
      if (!stillValid) {
        const fallback =
          fresh.find((a) => a.type === "citizen") || fresh[0];
        setActiveAccountId(fallback.id);
        localStorage.setItem(STORAGE_KEY, fallback.id);
      }
    }
    setError(error);
    setLoading(false);
  }, [activeAccountId]);

  /* -------- New API the app should use -------- */
  const identity = useMemo(() => {
    if (!activeAccount) return null;
    if (activeAccount.type === "citizen") {
      return { type: "user", userId: activeAccount.sourceId };
    }
    // ownerId == authUserId in this model
    return {
      type: "vport",
      userId: authUserId || null,
      ownerId: authUserId || null,
      vportId: activeAccount.sourceId,
    };
  }, [activeAccount, authUserId]);

  const isUser = identity?.type === "user";
  const isVport = identity?.type === "vport";

  const actAsUser = useCallback(() => {
    const citizen = accounts.find((a) => a.type === "citizen");
    if (!citizen) return false;
    setActiveAccountId(citizen.id);
    localStorage.setItem(STORAGE_KEY, citizen.id);
    return true;
  }, [accounts]);

  const actAsVport = useCallback(
    (idOrFull) => {
      if (!idOrFull) return false;
      const idOnly = String(idOrFull).startsWith("vport:")
        ? String(idOrFull).slice("vport:".length)
        : String(idOrFull);

      const target = accounts.find(
        (a) =>
          a.type === "vport" &&
          (a.sourceId === idOnly || a.id === `vport:${idOnly}`)
      );
      if (!target) return false;
      setActiveAccountId(target.id);
      localStorage.setItem(STORAGE_KEY, target.id);
      return true;
    },
    [accounts]
  );

  /* -------- Compat aliases -------- */
  const setActingAsUser = actAsUser;
  const setActingAsVPort = ({ vportId }) => actAsVport(vportId);

  const value = useMemo(
    () => ({
      loading,
      error,
      accounts,
      activeAccountId,
      activeAccount,
      switchAccount,
      addAccount,
      removeAccount,
      refreshAccounts,
      identity,
      isUser,
      isVport,
      actAsUser,
      actAsVport,
      setActingAsUser,
      setActingAsVPort,
    }),
    [
      loading,
      error,
      accounts,
      activeAccountId,
      activeAccount,
      switchAccount,
      addAccount,
      removeAccount,
      refreshAccounts,
      identity,
      isUser,
      isVport,
      actAsUser,
      actAsVport,
      setActingAsUser,
      setActingAsVPort,
    ]
  );

  return (
    <IdentityContext.Provider value={value}>
      {children}
    </IdentityContext.Provider>
  );
}

export function IdentityProvider({ children }) {
  return <ProviderImpl>{children}</ProviderImpl>;
}

export function useIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useIdentity must be used within IdentityProvider");
  return ctx;
}

export { IdentityContext };
