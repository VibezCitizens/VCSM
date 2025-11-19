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
import vc from "@/lib/vcClient"; // re-exports supabase; shared auth/session
import { onActorChange } from "@/lib/actors/actor"; // keep Identity in sync with actor store
import { getActorIdForUser } from "@/lib/actors/actors"; // resolve user->actor id (may create for self)
import { ensureActorByVportId } from "@/features/chat/search/peopleSearch"; // resolve vport->actor id

const DBG = (...a) => console.log("%c[Identity]", "color:#10b981", ...a);

const STORAGE_KEY = "vibez.activeActor.v1";
const ACCOUNTS_CACHE_KEY = "vibez.accountsCache.v1";
const ACTOR_MAP_KEY = "vibez.actorMap.v1";

function routeWantsVport() {
  try {
    return window.location?.pathname?.startsWith("/vport");
  } catch {
    return false;
  }
}

// Parse /vport/:slug OR /vport/id/:id
function currentVportParam() {
  try {
    const p = window.location?.pathname || "";
    const byId = p.match(/^\/vport\/id\/([^/]+)/); // /vport/id/<uuid>
    if (byId?.[1]) return byId[1];
    const bySlug = p.match(/^\/vport\/([^/]+)/); // /vport/<slug-or-uuid>
    if (bySlug?.[1]) return bySlug[1];
  } catch {}
  return null;
}

const IdentityContext = createContext({
  loading: true,
  isLoading: true,
  error: null,
  accounts: [],
  activeAccountId: null,
  activeAccount: null,
  switchAccount: (_id) => false,
  addAccount: (_acct) => {},
  removeAccount: (_id) => {},
  refreshAccounts: () => {},
  identity: null, // { type: 'user'|'vport', userId, ownerId?, vportId?, actorId? }
  isUser: false,
  isVport: false,
  actAsUser: () => false,
  actAsVport: (_id) => false,
  setActingAsUser: () => false,
  setActingAsVPort: (_obj) => false,
});

function normalizeCitizen(raw, actorId = null) {
  return {
    id: `citizen:${raw.id}`,
    sourceId: raw.id,
    type: "citizen",
    displayName: raw.display_name || raw.username || raw.email || "Me",
    avatarUrl: raw.photo_url || null,
    username: raw.username || null,
    actorId, // ✔️ now properly received
  };
}


function normalizeVport(raw, actorId = null) {
  return {
    id: `vport:${raw.id}`,
    sourceId: raw.id,
    type: "vport",
    displayName: raw.name || "VPORT",
    avatarUrl: raw.avatar_url || null,
    username: null,
    actorId: actorId || null,
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

const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (s) => typeof s === "string" && UUID_RX.test(s);

function parseActiveId(s) {
  if (!s || typeof s !== "string") return null;
  const [kind, id] = s.split(":");
  if (!kind || !id) return null;
  const k = kind.toLowerCase();
  if (!isUuid(id)) return null;
  if (k === "vport" || k === "citizen") return { kind: k, id };
  return null;
}

async function fetchAccountsFromSupabase() {
  const { data: sess } = await supabase.auth.getSession();
  const session = sess?.session;
  if (!session)
    return {
      userId: null,
      userActorId: null,
      accounts: [],
      actorMap: {},
      error: null,
    };

  const userId = session.user.id;

  // profiles (no actor_id column assumed)
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, username, display_name, photo_url, email")
    .eq("id", userId)
    .single();

  // Owned vports
  const ownedRes = await vc
    .from("vports")
    .select("id, name, avatar_url, owner_user_id")
    .eq("owner_user_id", userId);
  const owned = ownedRes.data || [];
  const ownedErr = ownedRes.error || null;

  // actor_owners → actors(kind='vport')
  const aoRes = await vc.from("actor_owners").select("actor_id").eq("user_id", userId);
  const ownedActorIds = (aoRes.data || []).map((r) => r.actor_id);
  const aoErr = aoRes.error || null;

  let actorMap = {};
  let actorVportIds = [];
  if (ownedActorIds.length) {
    const aRes = await vc
      .from("actors")
      .select("id, kind, vport_id")
      .in("id", ownedActorIds);
    const aRows = aRes.data || [];
    const vActors = aRows.filter((a) => a.kind === "vport" && a.vport_id);
    actorVportIds = vActors.map((a) => a.vport_id);
    actorMap = vActors.reduce((acc, a) => {
      acc[a.vport_id] = a.id;
      return acc;
    }, {});
  }

  // Vports where I have a vport-actor (member)
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

  // Resolve user's actor id (kind='user')
  let userActorId = null;
  try {
    userActorId = await getActorIdForUser(userId);
  } catch (e) {
    DBG("getActorIdForUser error:", e?.message || e);
  }

  const vportsUnion = dedupeById([...(owned || []), ...(member || [])]);
  const accounts = [
    ...(profile ? [normalizeCitizen(profile, userActorId)] : []),
    ...vportsUnion.map((v) => normalizeVport(v, actorMap[v.id] || null)),
  ];

  DBG(
    "owned vports =",
    owned?.map?.((v) => ({ id: v.id, name: v.name })) || []
  );
  DBG(
    "member vports =",
    member?.map?.((v) => ({ id: v.id, name: v.name })) || []
  );
  DBG("actorMap(vport->actor) =", actorMap);
  DBG("normalized accounts =", accounts);

  return {
    userId,
    userActorId,
    accounts,
    actorMap,
    error: profileErr || ownedErr || memberErr || aoErr || null,
  };
}

// ---- identity equality (for log dedupe) ----
function isEqualIdentity(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.type === b.type &&
    a.userId === b.userId &&
    a.ownerId === b.ownerId &&
    a.vportId === b.vportId &&
    a.actorId === b.actorId
  );
}

function ProviderImpl({ children }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [activeAccountId, setActiveAccountId] = useState(null);
  const [authUserId, setAuthUserId] = useState(null);
  const [userActorId, setUserActorId] = useState(null);
  const [actorMap, setActorMap] = useState({});
  const initialized = useRef(false);
  const switchEpoch = useRef(0);

  const activeAccount = useMemo(
    () => accounts.find((a) => a.id === activeAccountId) || null,
    [accounts, activeAccountId]
  );

  const resolveAndCommit = useCallback(
    async (accountId) => {
      if (!accountId) return false;
      if (accountId === activeAccountId) return true; // no-op guard

      const epoch = ++switchEpoch.current;
      const acc = (accounts || []).find((a) => a.id === accountId);
      if (!acc) return false;

      let resolvedActorId = null;

      if (acc.type === "citizen") {
        resolvedActorId =
          userActorId || (await getActorIdForUser(acc.sourceId));
        if (!userActorId && resolvedActorId) setUserActorId(resolvedActorId);
      } else if (acc.type === "vport") {
        resolvedActorId =
          actorMap[acc.sourceId] || (await ensureActorByVportId(acc.sourceId));

        setActorMap((prev) => {
          const next = { ...prev, [acc.sourceId]: resolvedActorId };
          localStorage.setItem(ACTOR_MAP_KEY, JSON.stringify(next));
          return next;
        });

        setAccounts((prev) =>
          prev.map((a) =>
            a.type === "vport" && a.sourceId === acc.sourceId
              ? { ...a, actorId: resolvedActorId }
              : a
          )
        );
      }

      if (epoch !== switchEpoch.current) return false;

      if (activeAccountId !== accountId) {
        localStorage.setItem(STORAGE_KEY, accountId);
        setActiveAccountId(accountId);
      }
      return true;
    },
    [accounts, actorMap, userActorId, activeAccountId]
  );

  // ---- Auth changes ----
  useEffect(() => {
    let sub;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      setAuthUserId(sess?.session?.user?.id ?? null);
      sub = supabase.auth.onAuthStateChange(async (_ev, session) => {
        setAuthUserId(session?.user?.id ?? null);
      });
    })();
    return () => sub?.data?.subscription?.unsubscribe?.();
  }, []);

  // ---- FAST HYDRATE (StrictMode de-duped: once per authUserId) ----
 // ---- FAST HYDRATE (StrictMode de-duped: once per authUserId) ----
const lastRanForAuthRef = useRef(null);
useEffect(() => {
  if (!authUserId || lastRanForAuthRef.current === authUserId) return;
  lastRanForAuthRef.current = authUserId;

  let alive = true;
  (async () => {
    if (userActorId) return;
    try {
      DBG("fast-hydrate: resolving user actor via vc.actor_owners JOIN vc.actors", {
        authUserId,
      });
      const { data, error } = await vc
        .schema("vc")
        .from("actor_owners")
        .select(`
          actor_id,
          actors (
            id,
            kind,
            profile_id,
            vport_id
          )
        `)
        .eq("user_id", authUserId)
        .limit(50);

      if (!alive) return;

      if (!error && Array.isArray(data)) {
        const userActor = data.find((r) => r?.actors?.kind === "user");
        if (userActor?.actor_id) {
          setUserActorId(userActor.actor_id);
          DBG("fast-hydrate: actorId set =", userActor.actor_id);
        }
      }

      // ❌ OLD BUG:
      // if (!activeAccountId) force citizen

      // ✅ FIX: NEVER override activeAccountId if we are already acting as a vport
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!activeAccountId && !stored) {
        const cid = `citizen:${authUserId}`;
        setActiveAccountId(cid);
        localStorage.setItem(STORAGE_KEY, cid);
        DBG("fast-hydrate: primed activeAccountId =", cid);
      }
    } catch (e) {
      DBG("fast-hydrate error (non-fatal)", e);
    }
  })();

  return () => {
    alive = false;
  };
}, [authUserId, userActorId, activeAccountId]);

  // ---- Initial hydrate ----
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      const cached = JSON.parse(localStorage.getItem(ACCOUNTS_CACHE_KEY) || "[]");
      if (Array.isArray(cached)) setAccounts(cached);
      const storedId = localStorage.getItem(STORAGE_KEY);
      if (storedId) setActiveAccountId(storedId);

      const cachedActorMap = JSON.parse(localStorage.getItem(ACTOR_MAP_KEY) || "{}");
      if (cachedActorMap && typeof cachedActorMap === "object") {
        setActorMap(cachedActorMap);
      }

      DBG("hydrate: cached accounts=", cached);
      DBG("hydrate: STORAGE_KEY activeId=", storedId || null);
      DBG("hydrate: ACTOR_MAP_KEY =", cachedActorMap || {});
    } catch {}

    (async () => {
      setLoading(true);
      const {
        userId,
        userActorId: freshUserActorId,
        accounts: fresh,
        actorMap: freshActorMap,
        error,
      } = await fetchAccountsFromSupabase();

      if (userId) setAuthUserId(userId);
      if (freshUserActorId) setUserActorId(freshUserActorId);

      if (!error && fresh?.length) {
        setAccounts(fresh);
        localStorage.setItem(ACCOUNTS_CACHE_KEY, JSON.stringify(fresh));

        setActorMap(freshActorMap || {});
        localStorage.setItem(ACTOR_MAP_KEY, JSON.stringify(freshActorMap || {}));

        const stored = localStorage.getItem(STORAGE_KEY);
        const storedIsValid = stored && fresh.some((a) => a.id === stored);
        const storedIsCitizen = stored?.startsWith?.("citizen:");
        let next = null;

        if (routeWantsVport() && (!storedIsValid || storedIsCitizen)) {
          const param = currentVportParam();
          const target = param
            ? fresh.find(
                (a) =>
                  a.type === "vport" &&
                  (a.sourceId === param || a.id === `vport:${param}`)
              )
            : null;

          if (target) {
            next = target.id;
            DBG("hydrate: switch to page vport we own/member →", next);
          } else {
            next =
              fresh.find((a) => a.type === "citizen")?.id || fresh[0]?.id;
            DBG("hydrate: viewing foreign vport → keep citizen →", next);
          }
        } else if (storedIsValid) {
          next = stored;
        } else {
          next = fresh.find((a) => a.type === "citizen")?.id || fresh[0]?.id;
        }

        await resolveAndCommit(next);
        DBG("hydrate: fetched fresh accounts=", fresh);
        DBG("hydrate: picked activeAccountId (actor ensured) =", next);
      }
      setError(error);
      setLoading(false);
    })();
  }, [resolveAndCommit]);

  useEffect(() => {
    if (activeAccountId) {
      localStorage.setItem(STORAGE_KEY, activeAccountId);
      window.__VIBEZ_ACTIVE_ACTOR__ = activeAccountId;
      document.documentElement.setAttribute("data-actor", activeAccountId);
      DBG("persist activeAccountId", activeAccountId);
    }
  }, [activeAccountId]);

  // ---- Keep Identity aligned with actor store (do not switch on foreign vports) ----
  useEffect(() => {
    const unsub = onActorChange((actor) => {
      if (!actor || actor.kind !== "vport" || !actor.id) return;

      const isOurs = (accounts || []).some(
        (a) => a.type === "vport" && a.sourceId === actor.id
      );
      if (!isOurs) return; // foreign vport → ignore

      const nextId = `vport:${actor.id}`;
      const param = currentVportParam();
      const onThisVportPage =
        !!param && (param === actor.id || `vport:${param}` === nextId);
      const activeIsCitizen = activeAccountId?.startsWith?.("citizen:");

      if (
        activeAccountId === nextId ||
        !activeAccountId ||
        (onThisVportPage && activeIsCitizen)
      ) {
        resolveAndCommit(nextId); // guarded internally
      }

      if (actor?.actorId && isUuid(String(actor.actorId))) {
        setActorMap((prev) => {
          const updated = { ...prev, [actor.id]: actor.actorId };
          localStorage.setItem(ACTOR_MAP_KEY, JSON.stringify(updated));
          return updated;
        });
        setAccounts((prev) =>
          prev.map((a) =>
            a.type === "vport" && a.sourceId === actor.id
              ? { ...a, actorId: actor.actorId }
              : a
          )
        );
      }
    });
    return () => unsub?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, activeAccountId, resolveAndCommit]);

  // ---- Reset on auth switch ----
  const prevAuthIdRef = useRef(null);
  useEffect(() => {
    if (prevAuthIdRef.current === authUserId) return;

    localStorage.removeItem(ACCOUNTS_CACHE_KEY);
    localStorage.removeItem(ACTOR_MAP_KEY);
    localStorage.removeItem(STORAGE_KEY);

    setAccounts([]);
    setActorMap({});
    setActiveAccountId(null);
    setUserActorId(null);

    if (authUserId) {
      (async () => {
        setLoading(true);
        const {
          accounts: fresh,
          actorMap: freshActorMap,
          userActorId: freshUserActorId,
          error,
        } = await fetchAccountsFromSupabase();

        if (!error && fresh?.length) {
          setAccounts(fresh);
          localStorage.setItem(ACCOUNTS_CACHE_KEY, JSON.stringify(fresh));

          setActorMap(freshActorMap || {});
          localStorage.setItem(ACTOR_MAP_KEY, JSON.stringify(freshActorMap || {}));

          if (freshUserActorId) setUserActorId(freshUserActorId);

          const stored = localStorage.getItem(STORAGE_KEY);
          const storedIsValid = stored && fresh.some((a) => a.id === stored);
          const storedIsCitizen = stored?.startsWith?.("citizen:");
          let next = null;

          if (routeWantsVport() && (!storedIsValid || storedIsCitizen)) {
            const param = currentVportParam();
            const target = param
              ? fresh.find(
                  (a) =>
                    a.type === "vport" &&
                    (a.sourceId === param || a.id === `vport:${param}`)
                )
              : null;

            if (target) {
              next = target.id;
              DBG("[auth switch] switch to page vport we own/member →", next);
            } else {
              next =
                fresh.find((a) => a.type === "citizen")?.id || fresh[0]?.id;
              DBG("[auth switch] viewing foreign vport → keep citizen →", next);
            }
          } else if (storedIsValid) {
            next = stored;
          } else {
            next = fresh.find((a) => a.type === "citizen")?.id || fresh[0]?.id;
          }

          await resolveAndCommit(next);
          DBG("[auth switch] picked activeAccountId (actor ensured) =", next);
        }
        setError(error || null);
        setLoading(false);
      })();
    } else {
      setLoading(false);
    }

    prevAuthIdRef.current = authUserId;
  }, [authUserId, resolveAndCommit]);

  // ---- Optional safety: switch to page vport only if it's ours ----
  useEffect(() => {
    if (!accounts?.length || !routeWantsVport()) return;
    const activeIsCitizen = activeAccountId?.startsWith?.("citizen:");
    if (!activeIsCitizen) return;

    const param = currentVportParam();
    const target = param
      ? accounts.find(
          (a) =>
            a.type === "vport" &&
            (a.sourceId === param || a.id === `vport:${param}`)
        )
      : null;

    if (target) {
      DBG("route safety: switch to page vport we own/member =", target.id);
      resolveAndCommit(target.id);
    } else {
      DBG("route safety: foreign vport → stay citizen");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, activeAccountId, resolveAndCommit]);

  const switchAccount = useCallback(
    (nextId) => {
      DBG("switchAccount →", nextId);
      if (!nextId || nextId === activeAccountId) return false; // guard
      resolveAndCommit(nextId);
      return true;
    },
    [resolveAndCommit, activeAccountId]
  );

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
            resolveAndCommit(fallback.id);
          } else {
            setActiveAccountId(null);
            localStorage.removeItem(STORAGE_KEY);
          }
        }
        return next;
      });
    },
    [activeAccountId, resolveAndCommit]
  );

  const refreshAccounts = useCallback(async () => {
    setLoading(true);
    const {
      accounts: fresh,
      actorMap: freshActorMap,
      userActorId: freshUserActorId,
      error,
    } = await fetchAccountsFromSupabase();

    if (freshUserActorId) setUserActorId(freshUserActorId);

    if (!error && fresh?.length) {
      setAccounts(fresh);
      localStorage.setItem(ACCOUNTS_CACHE_KEY, JSON.stringify(fresh));

      setActorMap(freshActorMap || {});
      localStorage.setItem(ACTOR_MAP_KEY, JSON.stringify(freshActorMap || {}));

      const stillValid = fresh.some((a) => a.id === activeAccountId);
      if (!stillValid) {
        const fallback = fresh.find((a) => a.type === "citizen") || fresh[0];
        await resolveAndCommit(fallback.id);
      }
    }
    setError(error);
    setLoading(false);
  }, [activeAccountId, resolveAndCommit]);

  const nextIdentity = useMemo(() => {
  if (activeAccount) {
    if (activeAccount.type === "citizen") {
      return {
        type: "user",
        userId: activeAccount.sourceId,
        actorId: userActorId || null,
      };
    }

    if (activeAccount.type === "vport") {
      const vId = activeAccount.sourceId;
      const aId = activeAccount.actorId || actorMap[vId] || null;
      return {
        type: "vport",
        userId: authUserId || null,
        ownerId: authUserId || null,
        vportId: vId,
        actorId: aId,
      };
    }
  }

  // fallback if activeAccount is null but we have the ID
  const parsed = parseActiveId(activeAccountId);
  if (parsed?.kind === "vport") {
    const aId = actorMap[parsed.id] || null;
    return {
      type: "vport",
      userId: authUserId || null,
      ownerId: authUserId || null,
      vportId: parsed.id,
      actorId: aId,
    };
  }
  if (parsed?.kind === "citizen") {
    return {
      type: "user",
      userId: parsed.id,
      actorId: userActorId || null,
    };
  }

  return null;
}, [activeAccount, activeAccountId, authUserId, actorMap, userActorId]);

  // ---- Stable identity: hold last non-null while loading to remove transient null gap ----
  const [identity, setIdentity] = useState(nextIdentity);
useEffect(() => {
  setIdentity((prev) => {
    // NEVER drop identity back to null once it exists
    if (nextIdentity == null) return prev ?? null;
    return nextIdentity;
  });
}, [nextIdentity]);


  const isUser = identity?.type === "user";
  const isVport = identity?.type === "vport";

  // 🔇 Log only when identity actually changes
  const lastLoggedIdentityRef = useRef(null);
  useEffect(() => {
    const last = lastLoggedIdentityRef.current;
    if (!isEqualIdentity(last, identity)) {
      DBG("computed identity =", identity, "isVport=", isVport, "isUser=", isUser);
      lastLoggedIdentityRef.current = identity ? { ...identity } : identity;
    }
  }, [identity, isVport, isUser]);

  const actAsUser = useCallback(() => {
    DBG("actAsUser");
    const citizen = accounts.find((a) => a.type === "citizen");
    if (!citizen || citizen.id === activeAccountId) return false;
    resolveAndCommit(citizen.id);
    return true;
  }, [accounts, resolveAndCommit, activeAccountId]);

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
      if (!target || target.id === activeAccountId) return false;
      resolveAndCommit(target.id);
      return true;
    },
    [accounts, resolveAndCommit, activeAccountId]
  );

  const setActingAsUser = actAsUser;
  const setActingAsVPort = ({ vportId }) => actAsVport(vportId);

  const value = useMemo(
    () => ({
      loading,
      isLoading: loading,
      error,
      accounts,
      activeAccountId,
      activeAccount,
      switchAccount,
      addAccount,
      removeAccount,
      refreshAccounts,
      identity, // now stable across transient nulls during loading
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

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
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
