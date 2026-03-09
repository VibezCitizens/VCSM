import { supabase } from "@/services/supabase/supabaseClient";
import { buildTestId } from "@/dev/diagnostics/helpers/testResult";
import { runDiagnosticsTests } from "@/dev/diagnostics/helpers/timedTest";
import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import {
  isMissingRpc,
  isPermissionDenied,
  isRlsDenied,
  makeSkipped,
} from "@/dev/diagnostics/helpers/supabaseAssert";
import { auditFeature } from "@/dev/diagnostics/helpers/featureAudit";
import { getFeatureSourceEntries } from "@/dev/diagnostics/helpers/featureSourceIndex";
import { getNotifications } from "@/features/notifications/inbox/controller/Notifications.controller";
import { getUnreadNotificationCount } from "@/features/notifications/inbox/controller/notificationsCount.controller";
import { getInboxUnreadBadgeCount } from "@/features/notifications/inbox/controller/inboxUnread.controller";
import {
  loadNotificationHeader,
  markAllNotificationsSeen,
} from "@/features/notifications/inbox/controller/NotificationsHeader.controller";
import { resolveInboxActor } from "@/features/notifications/inbox/lib/resolveInboxActor";
import { resolveSenders } from "@/features/notifications/inbox/lib/resolveSenders";
import { mapNotification } from "@/features/notifications/inbox/model/notification.mapper";
import { markNotificationRead } from "@/features/notifications/inbox/dal/notifications.write.dal";
import { dalInsertNotification } from "@/features/notifications/inbox/dal/notifications.create.dal";
import {
  subscribeInboxBadge,
  subscribeNotificationBadge,
} from "@/features/notifications/inbox/realtime/badgeSubscriptions";

export const GROUP_ID = "notificationsFeature";
export const GROUP_LABEL = "Notifications Feature";

const TEST_CATALOG = [
  { key: "feature_inventory", name: "notifications feature file inventory" },
  { key: "feature_architecture", name: "notifications feature architecture audit" },
  { key: "resolve_inbox_actor", name: "resolve inbox actor from identity" },
  { key: "list_notifications", name: "list notifications via controller" },
  { key: "header_and_count", name: "header unread and count controllers" },
  { key: "insert_and_mark_read", name: "insert notification and mark read" },
  { key: "mark_all_seen", name: "mark all notifications seen" },
  { key: "inbox_unread_badge", name: "inbox unread badge controller" },
  { key: "resolve_senders_mapper", name: "resolve senders and map notification row" },
  { key: "realtime_channels", name: "notifications realtime channel lifecycle" },
];

function failWithData(message, data) {
  return {
    skipped: false,
    data,
    error: { name: "NotificationsFeatureViolation", message },
  };
}

function trimAudit(audit, maxItems = 25) {
  return {
    ...audit,
    issues: {
      ...audit.issues,
      oversizedFiles: audit.issues.oversizedFiles.slice(0, maxItems),
      depthViolations: audit.issues.depthViolations.slice(0, maxItems),
      relativeImports: audit.issues.relativeImports.slice(0, maxItems),
      crossFeatureImports: audit.issues.crossFeatureImports.slice(0, maxItems),
      namingViolations: audit.issues.namingViolations.slice(0, maxItems),
    },
  };
}

function isPolicyOrRpc(error) {
  return (
    isPermissionDenied(error) ||
    isRlsDenied(error) ||
    isMissingRpc(error)
  );
}

function buildIdentity(context) {
  return {
    kind: context.actor.kind ?? "user",
    actorId: context.actorId,
    profileId: context.userId ?? null,
    ownerActorId: context.actorId,
  };
}

async function withActorContext(localShared, reason, run) {
  let context;
  try {
    context = await ensureActorContext(localShared);
    return await run(context);
  } catch (error) {
    if (isPolicyOrRpc(error)) {
      return makeSkipped(reason, { context, error });
    }
    throw error;
  }
}

async function latestDiagnosticsNotification(actorId) {
  const { data, error } = await supabase
    .schema("vc")
    .from("notifications")
    .select("id,recipient_actor_id,actor_id,kind,is_read,is_seen,created_at,context")
    .eq("recipient_actor_id", actorId)
    .eq("kind", "diagnostics")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export function getNotificationsFeatureTests() {
  return TEST_CATALOG.map((row) => ({
    id: buildTestId(GROUP_ID, row.key),
    group: GROUP_ID,
    name: row.name,
  }));
}

export async function runNotificationsFeatureGroup({ onTestUpdate, shared }) {
  const tests = [
    {
      id: buildTestId(GROUP_ID, "feature_inventory"),
      name: "notifications feature file inventory",
      run: async () => {
        const entries = getFeatureSourceEntries().filter((entry) => entry.featureName === "notifications");
        const byDomain = entries.reduce((acc, entry) => {
          const domain = entry.path.split("/")[3] ?? "(root)";
          acc[domain] = (acc[domain] ?? 0) + 1;
          return acc;
        }, {});
        return { fileCount: entries.length, byDomain };
      },
    },
    {
      id: buildTestId(GROUP_ID, "feature_architecture"),
      name: "notifications feature architecture audit",
      run: async () => {
        const audit = trimAudit(auditFeature("notifications"));
        if (audit.issueCount > 0) {
          return failWithData(`Notifications feature has ${audit.issueCount} architecture issues`, audit);
        }
        return audit;
      },
    },
    {
      id: buildTestId(GROUP_ID, "resolve_inbox_actor"),
      name: "resolve inbox actor from identity",
      run: ({ shared: localShared }) =>
        withActorContext(localShared, "Identity context unavailable for resolveInboxActor.", async (context) => ({
          identity: buildIdentity(context),
          resolved: resolveInboxActor(buildIdentity(context)),
        })),
    },
    {
      id: buildTestId(GROUP_ID, "list_notifications"),
      name: "list notifications via controller",
      run: ({ shared: localShared }) =>
        withActorContext(localShared, "Notifications list controller blocked by policy.", async (context) => {
          const rows = await getNotifications(buildIdentity(context));
          return { count: rows.length, sample: rows.slice(0, 5) };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "header_and_count"),
      name: "header unread and count controllers",
      run: ({ shared: localShared }) =>
        withActorContext(localShared, "Notifications count/header flow blocked by policy.", async (context) => {
          const [header, unread] = await Promise.all([
            loadNotificationHeader(context.actorId),
            getUnreadNotificationCount(context.actorId),
          ]);
          return {
            actorId: context.actorId,
            headerUnreadCount: header?.unreadCount ?? null,
            unreadCountController: unread,
          };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "insert_and_mark_read"),
      name: "insert notification and mark read",
      run: ({ shared: localShared }) =>
        withActorContext(localShared, "Notification insert/mark-read flow blocked by policy.", async (context) => {
          const inserted = await dalInsertNotification({
            recipientActorId: context.actorId,
            actorId: context.actorId,
            kind: "diagnostics",
            objectType: "actor",
            objectId: context.actorId,
            linkPath: `/profile/${context.actorId}`,
            context: { source: "dev-notifications-feature", ts: new Date().toISOString() },
            asActorId: context.actorId,
          });

          if (inserted === false) {
            return makeSkipped("Notification insert intentionally blocked for this notification kind/path.");
          }

          const latest = await latestDiagnosticsNotification(context.actorId);
          if (!latest?.id) {
            return makeSkipped("No diagnostics notification row was readable after insert.");
          }

          await markNotificationRead(latest.id, context.actorId);
          const { data: reread, error } = await supabase
            .schema("vc")
            .from("notifications")
            .select("id,is_read,is_seen,recipient_actor_id,kind")
            .eq("id", latest.id)
            .maybeSingle();
          if (error) throw error;

          return { inserted, notificationId: latest.id, reread };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "mark_all_seen"),
      name: "mark all notifications seen",
      run: ({ shared: localShared }) =>
        withActorContext(localShared, "markAllNotificationsSeen blocked by policy.", async (context) => {
          await markAllNotificationsSeen(context.actorId);
          const latest = await latestDiagnosticsNotification(context.actorId);
          return { actorId: context.actorId, latestDiagnosticsNotification: latest };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "inbox_unread_badge"),
      name: "inbox unread badge controller",
      run: ({ shared: localShared }) =>
        withActorContext(localShared, "Inbox unread badge count blocked by policy.", async (context) => ({
          actorId: context.actorId,
          unreadInboxCount: await getInboxUnreadBadgeCount(context.actorId),
        })),
    },
    {
      id: buildTestId(GROUP_ID, "resolve_senders_mapper"),
      name: "resolve senders and map notification row",
      run: ({ shared: localShared }) =>
        withActorContext(localShared, "Sender resolve/mapper flow blocked by policy.", async (context) => {
          const { data: rows, error } = await supabase
            .schema("vc")
            .from("notifications")
            .select("id,recipient_actor_id,actor_id,kind,object_type,object_id,link_path,context,is_read,is_seen,created_at")
            .eq("recipient_actor_id", context.actorId)
            .order("created_at", { ascending: false })
            .limit(10);
          if (error) throw error;
          if (!rows?.length) return makeSkipped("No notifications available for sender resolution/map test.");
          const actorIds = rows.map((row) => row.actor_id).filter(Boolean);
          const senderMap = await resolveSenders(actorIds);
          return { inputCount: rows.length, mappedSample: mapNotification(rows[0], senderMap), senderMapSize: Object.keys(senderMap).length };
        }),
    },
    {
      id: buildTestId(GROUP_ID, "realtime_channels"),
      name: "notifications realtime channel lifecycle",
      run: ({ shared: localShared }) =>
        withActorContext(localShared, "Realtime badge channel flow unavailable.", async (context) => {
          const unsubNoti = subscribeNotificationBadge({ actorId: context.actorId, onChange: () => {} });
          const unsubInbox = subscribeInboxBadge({ actorId: context.actorId, onChange: () => {} });
          unsubNoti?.();
          unsubInbox?.();
          return { actorId: context.actorId, notificationChannel: "created+disposed", inboxChannel: "created+disposed" };
        }),
    },
  ];

  return runDiagnosticsTests({
    group: GROUP_ID,
    tests,
    onTestUpdate,
    shared,
  });
}
