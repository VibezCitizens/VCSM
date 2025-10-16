// C:\Users\vibez\OneDrive\Desktop\no src\src\state\identityContext.jsx
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
import vc from "@/lib/vcClient"; // must point to vc schema (vc.from('...'), vc.rpc(...))
import { onActorChange } from "@/lib/actors/actor"; // <- keep Identity in sync with actor store

/* ------------------------------------------------------------------ */
/* Debug helper                                                        */
/* ------------------------------------------------------------------ */
const DBG = (...a) => console.log("%c[Identity]", "color:#10b981", ...a);

/* ------------------------------------------------------------------ */
/* Keys (NO references before these lines)                            */
/* ------------------------------------------------------------------ */
const STORAGE_KEY = "vibez.activeActor.v1";
const ACCOUNTS_CACHE_KEY = "vibez.accountsCache.v1";

/** Public shape (default context) */
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

/* ---------------- Data fetcher ---------------- */
async function fetchAccountsFromSupabase() {
  const { data: sess } = await supabase.auth.getSession();
  const session = sess?.session;
  if (!session) return { userId: null, accounts: [], error: null };

  const userId = session.user.id;

  // 1) Citizen profile
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, username, display_name, photo_url, email")
    .eq("id", userId)
    .single();

  // 2a) Owned VPORTs
  const ownedRes = await vc
    .from("vports")
    .select("id, name, avatar_url, owner_user_id")
    .eq("owner_user_id", userId);
  const owned = ownedRes.data || [];
  const ownedErr = ownedRes.error || null;

  // 2b) VPORTs via actors membership (if you act on behalf of non-owned vports)
  const actorsRes = await vc
    .from("actors")
    .select("vport_id")
    .eq("profile_id", userId)
    .not("vport_id", "is", null);
  const actorVportIds = (actorsRes.data || []).map((r) => r.vport_id);

  let member = [];
  let memberErr = null;
  if (actorVportIds.length) {
    const memberRes = await vc
      .from("vports")
      .select("id, name, avatar_url, owner_user_id")
      .in("id", actorVportIds);
    member = memberRes.data || [];
    memberErr = memberRes.error || null;
  }

  const vportsAll = dedupeById([...(owned || []), ...(member || [])]);

  const accounts = [
    ...(profile ? [normalizeCitizen(profile)] : []),
    ...vportsAll.map(normalizeVport),
  ];

  DBG(
    "fetchAccountsFromSupabase userId=",
    userId,
    "profileErr=",
    profileErr,
    "ownedErr=",
    ownedErr,
    "memberErr=",
    memberErr
  );
  DBG(
    "owned vports =",
    owned?.map?.((v) => ({ id: v.id, name: v.name })) || []
  );
  DBG(
    "member vports =",
    member?.map?.((v) => ({ id: v.id, name: v.name })) || []
  );
  DBG("normalized accounts =", accounts);

  return {
    userId,
    accounts,
    error: profileErr || ownedErr || memberErr || null,
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

  // Hydrate from storage, then fetch fresh (initial load)
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

      DBG("hydrate: cached accounts=", cached);
      DBG("hydrate: STORAGE_KEY activeId=", storedId || null);
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
        const storedIsValid = stored && fresh.some((a) => a.id === stored);
        const next =
          (storedIsValid ? stored : null) ||
          fresh.find((a) => a.type === "citizen")?.id ||
          fresh[0].id;

        setActiveAccountId(next);
        localStorage.setItem(STORAGE_KEY, next);

        DBG("hydrate: fetched fresh accounts=", fresh);
        DBG("hydrate: picked activeAccountId=", next);
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
      DBG("persist activeAccountId", activeAccountId);
    }
  }, [activeAccountId]);

  /* -------- Keep Identity aligned with actor store (runtime sync) -------- */
  useEffect(() => {
    const unsub = onActorChange((actor) => {
      if (actor?.kind === "vport" && actor.id) {
        const nextId = `vport:${actor.id}`;
        if (nextId !== activeAccountId) {
          setActiveAccountId(nextId);
          localStorage.setItem(STORAGE_KEY, nextId);
        }
      }
      // If switching back to profile via the actor store,
      // we can optionally force citizen here. Leaving as-is keeps current account.
    });
    return () => unsub?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAccountId]);
  /* ----------------------------------------------------------------------- */

  /* -------- RESET on auth user switch -------- */
  const prevAuthIdRef = useRef(null);
  useEffect(() => {
    if (prevAuthIdRef.current === authUserId) return;

    // wipe caches tied to previous user
    localStorage.removeItem(ACCOUNTS_CACHE_KEY);
    // DO NOT remove STORAGE_KEY; preserve selected vport across refresh

    // reset in-memory state
    setAccounts([]);
    setActiveAccountId(null);

    if (authUserId) {
      // fetch fresh accounts for the new auth user
      (async () => {
        setLoading(true);
        const { accounts: fresh, error } = await fetchAccountsFromSupabase();
        if (!error && fresh?.length) {
          setAccounts(fresh);
          localStorage.setItem(ACCOUNTS_CACHE_KEY, JSON.stringify(fresh));

          const stored = localStorage.getItem(STORAGE_KEY);
          const storedIsValid = stored && fresh.some((a) => a.id === stored);
          const next =
            (storedIsValid ? stored : null) ||
            fresh.find((a) => a.type === "citizen")?.id ||
            fresh[0].id;

          setActiveAccountId(next);
          localStorage.setItem(STORAGE_KEY, next);
          DBG("[auth switch] picked activeAccountId =", next);
        }
        setError(error || null);
        setLoading(false);
      })();
    } else {
      // logged out
      setLoading(false);
    }

    prevAuthIdRef.current = authUserId;
  }, [authUserId]);

  /* -------- CRUD on account list -------- */
  const switchAccount = useCallback((nextId) => {
    DBG("switchAccount →", nextId);
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
    const { userId, accounts: fresh, error } = await fetchAccountsFromSupabase();
    if (userId) {
      // auth id can theoretically change in here too
      // but the auth-change effect above will handle full reset
    }
    if (!error && fresh?.length) {
      setAccounts(fresh);
      localStorage.setItem(ACCOUNTS_CACHE_KEY, JSON.stringify(fresh));
      const stillValid = fresh.some((a) => a.id === activeAccountId);
      if (!stillValid) {
        const fallback = fresh.find((a) => a.type === "citizen") || fresh[0];
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

  useEffect(() => {
    DBG("computed identity =", identity, "isVport=", isVport, "isUser=", isUser);
  }, [identity, isVport, isUser]);

  const actAsUser = useCallback(() => {
    DBG("actAsUser");
    const citizen = accounts.find((a) => a.type === "citizen");
    if (!citizen) return false;
    setActiveAccountId(citizen.id);
    localStorage.setItem(STORAGE_KEY, citizen.id);
    return true;
  }, [accounts]);

  const actAsVport = useCallback(
    (idOrFull) => {
      DBG("actAsVport called with", idOrFull);
      if (!idOrFull) return false;
      const idOnly = String(idOrFull).startsWith("vport:")
        ? String(idOrFull).slice("vport:".length)
        : String(idOrFull);

      const target = accounts.find(
        (a) =>
          a.type === "vport" &&
          (a.sourceId === idOnly || a.id === `vport:${idOnly}`)
      );
      DBG("actAsVport resolved target", target);
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
