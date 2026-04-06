import { createResult, summarizeResults } from "@/dev/diagnostics/helpers/testResult";
import {
  GROUP_ID as SCHEMA_GROUP_ID,
  GROUP_LABEL as SCHEMA_GROUP_LABEL,
  getSchemaIntegrityTests,
  runSchemaIntegrityGroup,
} from "@/dev/diagnostics/groups/schemaIntegrity.group";
import {
  GROUP_ID as ACTOR_GROUP_ID,
  GROUP_LABEL as ACTOR_GROUP_LABEL,
  getActorSystemTests,
  runActorSystemGroup,
} from "@/dev/diagnostics/groups/actorSystem.group";
import {
  GROUP_ID as ONBOARDING_GROUP_ID,
  GROUP_LABEL as ONBOARDING_GROUP_LABEL,
  getOnboardingTests,
  runOnboardingGroup,
} from "@/dev/diagnostics/groups/onboarding.group";
import {
  GROUP_ID as BLOCK_GROUP_ID,
  GROUP_LABEL as BLOCK_GROUP_LABEL,
  getBlockTests,
  runBlockGroup,
} from "@/dev/diagnostics/groups/block.group";
import {
  GROUP_ID as SOCIAL_GROUP_ID,
  GROUP_LABEL as SOCIAL_GROUP_LABEL,
  getSocialTests,
  runSocialGroup,
} from "@/dev/diagnostics/groups/social.group";
import {
  GROUP_ID as POSTS_GROUP_ID,
  GROUP_LABEL as POSTS_GROUP_LABEL,
  getPostsTests,
  runPostsGroup,
} from "@/dev/diagnostics/groups/posts.group";
import {
  GROUP_ID as MESSAGING_GROUP_ID,
  GROUP_LABEL as MESSAGING_GROUP_LABEL,
  getMessagingTests,
  runMessagingGroup,
} from "@/dev/diagnostics/groups/messaging.group";
import {
  GROUP_ID as CHAT_CONVERSATION_FEATURE_GROUP_ID,
  GROUP_LABEL as CHAT_CONVERSATION_FEATURE_GROUP_LABEL,
  getChatConversationFeatureTests,
  runChatConversationFeatureGroup,
} from "@/dev/diagnostics/groups/chatConversationFeature.group";
import {
  GROUP_ID as CHAT_INBOX_FEATURE_GROUP_ID,
  GROUP_LABEL as CHAT_INBOX_FEATURE_GROUP_LABEL,
  getChatInboxFeatureTests,
  runChatInboxFeatureGroup,
} from "@/dev/diagnostics/groups/chatInboxFeature.group";
import {
  GROUP_ID as CHAT_START_FEATURE_GROUP_ID,
  GROUP_LABEL as CHAT_START_FEATURE_GROUP_LABEL,
  getChatStartFeatureTests,
  runChatStartFeatureGroup,
} from "@/dev/diagnostics/groups/chatStartFeature.group";
import {
  GROUP_ID as CHAT_FEATURE_GROUP_ID,
  GROUP_LABEL as CHAT_FEATURE_GROUP_LABEL,
  getChatFeatureTests,
  runChatFeatureGroup,
} from "@/dev/diagnostics/groups/chatFeature.group";
import {
  GROUP_ID as REPORTS_GROUP_ID,
  GROUP_LABEL as REPORTS_GROUP_LABEL,
  getReportsTests,
  runReportsGroup,
} from "@/dev/diagnostics/groups/reports.group";
import {
  GROUP_ID as VPORTS_GROUP_ID,
  GROUP_LABEL as VPORTS_GROUP_LABEL,
  getVportsTests,
  runVportsGroup,
} from "@/dev/diagnostics/groups/vports.group";
import {
  GROUP_ID as BOOKINGS_GROUP_ID,
  GROUP_LABEL as BOOKINGS_GROUP_LABEL,
  getBookingsTests,
  runBookingsGroup,
} from "@/dev/diagnostics/groups/bookings.group";
import {
  GROUP_ID as BOOKING_FEATURE_GROUP_ID,
  GROUP_LABEL as BOOKING_FEATURE_GROUP_LABEL,
  getBookingFeatureTests,
  runBookingFeatureGroup,
} from "@/dev/diagnostics/groups/bookingFeature.group";
import {
  GROUP_ID as DESIGN_GROUP_ID,
  GROUP_LABEL as DESIGN_GROUP_LABEL,
  getDesignTests,
  runDesignGroup,
} from "@/dev/diagnostics/groups/design.group";
import {
  GROUP_ID as NOTIFICATIONS_GROUP_ID,
  GROUP_LABEL as NOTIFICATIONS_GROUP_LABEL,
  getNotificationsTests,
  runNotificationsGroup,
} from "@/dev/diagnostics/groups/notifications.group";
import {
  GROUP_ID as NOTIFICATIONS_FEATURE_GROUP_ID,
  GROUP_LABEL as NOTIFICATIONS_FEATURE_GROUP_LABEL,
  getNotificationsFeatureTests,
  runNotificationsFeatureGroup,
} from "@/dev/diagnostics/groups/notificationsFeature.group";
import {
  GROUP_ID as PROFILES_FEATURE_GROUP_ID,
  GROUP_LABEL as PROFILES_FEATURE_GROUP_LABEL,
  getProfilesFeatureTests,
  runProfilesFeatureGroup,
} from "@/dev/diagnostics/groups/profilesFeature.group";
import {
  GROUP_ID as PROFILES_KINDS_FEATURE_GROUP_ID,
  GROUP_LABEL as PROFILES_KINDS_FEATURE_GROUP_LABEL,
  getProfilesKindsFeatureTests,
  runProfilesKindsFeatureGroup,
} from "@/dev/diagnostics/groups/profilesKindsFeature.group";
import {
  GROUP_ID as PUBLIC_FEATURE_GROUP_ID,
  GROUP_LABEL as PUBLIC_FEATURE_GROUP_LABEL,
  getPublicFeatureTests,
  runPublicFeatureGroup,
} from "@/dev/diagnostics/groups/publicFeature.group";
import {
  GROUP_ID as SETTINGS_ACCOUNT_FEATURE_GROUP_ID,
  GROUP_LABEL as SETTINGS_ACCOUNT_FEATURE_GROUP_LABEL,
  getSettingsAccountFeatureTests,
  runSettingsAccountFeatureGroup,
} from "@/dev/diagnostics/groups/settingsAccountFeature.group";
import {
  GROUP_ID as SETTINGS_PRIVACY_FEATURE_GROUP_ID,
  GROUP_LABEL as SETTINGS_PRIVACY_FEATURE_GROUP_LABEL,
  getSettingsPrivacyFeatureTests,
  runSettingsPrivacyFeatureGroup,
} from "@/dev/diagnostics/groups/settingsPrivacyFeature.group";
import {
  GROUP_ID as SETTINGS_PROFILE_FEATURE_GROUP_ID,
  GROUP_LABEL as SETTINGS_PROFILE_FEATURE_GROUP_LABEL,
  getSettingsProfileFeatureTests,
  runSettingsProfileFeatureGroup,
} from "@/dev/diagnostics/groups/settingsProfileFeature.group";
import {
  GROUP_ID as SETTINGS_FEATURE_GROUP_ID,
  GROUP_LABEL as SETTINGS_FEATURE_GROUP_LABEL,
  getSettingsFeatureTests,
  runSettingsFeatureGroup,
} from "@/dev/diagnostics/groups/settingsFeature.group";
import {
  GROUP_ID as UPLOAD_FEATURE_GROUP_ID,
  GROUP_LABEL as UPLOAD_FEATURE_GROUP_LABEL,
  getUploadFeatureTests,
  runUploadFeatureGroup,
} from "@/dev/diagnostics/groups/uploadFeature.group";
import {
  GROUP_ID as VPORT_FEATURE_GROUP_ID,
  GROUP_LABEL as VPORT_FEATURE_GROUP_LABEL,
  getVportFeatureTests,
  runVportFeatureGroup,
} from "@/dev/diagnostics/groups/vportFeature.group";
import {
  GROUP_ID as FEED_FEATURE_GROUP_ID,
  GROUP_LABEL as FEED_FEATURE_GROUP_LABEL,
  getFeedFeatureTests,
  runFeedFeatureGroup,
} from "@/dev/diagnostics/groups/feedFeature.group";
import {
  GROUP_ID as FEATURE_COVERAGE_GROUP_ID,
  GROUP_LABEL as FEATURE_COVERAGE_GROUP_LABEL,
  getFeatureCoverageTests,
  runFeatureCoverageGroup,
} from "@/dev/diagnostics/groups/featureCoverage.group";

const GROUPS = [
  {
    id: SCHEMA_GROUP_ID,
    label: SCHEMA_GROUP_LABEL,
    getTests: getSchemaIntegrityTests,
    run: runSchemaIntegrityGroup,
  },
  {
    id: ACTOR_GROUP_ID,
    label: ACTOR_GROUP_LABEL,
    getTests: getActorSystemTests,
    run: runActorSystemGroup,
  },
  {
    id: ONBOARDING_GROUP_ID,
    label: ONBOARDING_GROUP_LABEL,
    getTests: getOnboardingTests,
    run: runOnboardingGroup,
  },
  {
    id: BLOCK_GROUP_ID,
    label: BLOCK_GROUP_LABEL,
    getTests: getBlockTests,
    run: runBlockGroup,
  },
  {
    id: SOCIAL_GROUP_ID,
    label: SOCIAL_GROUP_LABEL,
    getTests: getSocialTests,
    run: runSocialGroup,
  },
  {
    id: POSTS_GROUP_ID,
    label: POSTS_GROUP_LABEL,
    getTests: getPostsTests,
    run: runPostsGroup,
  },
  {
    id: MESSAGING_GROUP_ID,
    label: MESSAGING_GROUP_LABEL,
    getTests: getMessagingTests,
    run: runMessagingGroup,
  },
  {
    id: CHAT_CONVERSATION_FEATURE_GROUP_ID,
    label: CHAT_CONVERSATION_FEATURE_GROUP_LABEL,
    getTests: getChatConversationFeatureTests,
    run: runChatConversationFeatureGroup,
  },
  {
    id: CHAT_INBOX_FEATURE_GROUP_ID,
    label: CHAT_INBOX_FEATURE_GROUP_LABEL,
    getTests: getChatInboxFeatureTests,
    run: runChatInboxFeatureGroup,
  },
  {
    id: CHAT_START_FEATURE_GROUP_ID,
    label: CHAT_START_FEATURE_GROUP_LABEL,
    getTests: getChatStartFeatureTests,
    run: runChatStartFeatureGroup,
  },
  {
    id: CHAT_FEATURE_GROUP_ID,
    label: CHAT_FEATURE_GROUP_LABEL,
    getTests: getChatFeatureTests,
    run: runChatFeatureGroup,
  },
  {
    id: REPORTS_GROUP_ID,
    label: REPORTS_GROUP_LABEL,
    getTests: getReportsTests,
    run: runReportsGroup,
  },
  {
    id: VPORTS_GROUP_ID,
    label: VPORTS_GROUP_LABEL,
    getTests: getVportsTests,
    run: runVportsGroup,
  },
  {
    id: BOOKINGS_GROUP_ID,
    label: BOOKINGS_GROUP_LABEL,
    getTests: getBookingsTests,
    run: runBookingsGroup,
  },
  {
    id: BOOKING_FEATURE_GROUP_ID,
    label: BOOKING_FEATURE_GROUP_LABEL,
    getTests: getBookingFeatureTests,
    run: runBookingFeatureGroup,
  },
  {
    id: DESIGN_GROUP_ID,
    label: DESIGN_GROUP_LABEL,
    getTests: getDesignTests,
    run: runDesignGroup,
  },
  {
    id: NOTIFICATIONS_GROUP_ID,
    label: NOTIFICATIONS_GROUP_LABEL,
    getTests: getNotificationsTests,
    run: runNotificationsGroup,
  },
  {
    id: NOTIFICATIONS_FEATURE_GROUP_ID,
    label: NOTIFICATIONS_FEATURE_GROUP_LABEL,
    getTests: getNotificationsFeatureTests,
    run: runNotificationsFeatureGroup,
  },
  {
    id: PROFILES_FEATURE_GROUP_ID,
    label: PROFILES_FEATURE_GROUP_LABEL,
    getTests: getProfilesFeatureTests,
    run: runProfilesFeatureGroup,
  },
  {
    id: PROFILES_KINDS_FEATURE_GROUP_ID,
    label: PROFILES_KINDS_FEATURE_GROUP_LABEL,
    getTests: getProfilesKindsFeatureTests,
    run: runProfilesKindsFeatureGroup,
  },
  {
    id: PUBLIC_FEATURE_GROUP_ID,
    label: PUBLIC_FEATURE_GROUP_LABEL,
    getTests: getPublicFeatureTests,
    run: runPublicFeatureGroup,
  },
  {
    id: SETTINGS_ACCOUNT_FEATURE_GROUP_ID,
    label: SETTINGS_ACCOUNT_FEATURE_GROUP_LABEL,
    getTests: getSettingsAccountFeatureTests,
    run: runSettingsAccountFeatureGroup,
  },
  {
    id: SETTINGS_PRIVACY_FEATURE_GROUP_ID,
    label: SETTINGS_PRIVACY_FEATURE_GROUP_LABEL,
    getTests: getSettingsPrivacyFeatureTests,
    run: runSettingsPrivacyFeatureGroup,
  },
  {
    id: SETTINGS_PROFILE_FEATURE_GROUP_ID,
    label: SETTINGS_PROFILE_FEATURE_GROUP_LABEL,
    getTests: getSettingsProfileFeatureTests,
    run: runSettingsProfileFeatureGroup,
  },
  {
    id: SETTINGS_FEATURE_GROUP_ID,
    label: SETTINGS_FEATURE_GROUP_LABEL,
    getTests: getSettingsFeatureTests,
    run: runSettingsFeatureGroup,
  },
  {
    id: UPLOAD_FEATURE_GROUP_ID,
    label: UPLOAD_FEATURE_GROUP_LABEL,
    getTests: getUploadFeatureTests,
    run: runUploadFeatureGroup,
  },
  {
    id: VPORT_FEATURE_GROUP_ID,
    label: VPORT_FEATURE_GROUP_LABEL,
    getTests: getVportFeatureTests,
    run: runVportFeatureGroup,
  },
  {
    id: FEED_FEATURE_GROUP_ID,
    label: FEED_FEATURE_GROUP_LABEL,
    getTests: getFeedFeatureTests,
    run: runFeedFeatureGroup,
  },
  {
    id: FEATURE_COVERAGE_GROUP_ID,
    label: FEATURE_COVERAGE_GROUP_LABEL,
    getTests: getFeatureCoverageTests,
    run: runFeatureCoverageGroup,
  },
];

function nowMs() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

function groupLookup() {
  return new Map(GROUPS.map((group) => [group.id, group]));
}

function normalizeGroupIds(groupIds) {
  if (!Array.isArray(groupIds) || !groupIds.length) {
    return GROUPS.map((group) => group.id);
  }

  const known = new Set(GROUPS.map((group) => group.id));
  return groupIds.filter((groupId, index) => known.has(groupId) && groupIds.indexOf(groupId) === index);
}

function createGroupFailureResult({ groupId, groupLabel, error }) {
  return createResult({
    id: `${groupId}.__group__`,
    group: groupId,
    name: `${groupLabel} group runner failure`,
    ok: false,
    skipped: false,
    durationMs: 0,
    data: null,
    error: {
      name: error?.name ?? "Error",
      message: error?.message ?? "Group runner failed",
      code: error?.code ?? null,
      details: error?.details ?? null,
    },
  });
}

async function runOneGroup({ group, shared, onTestUpdate, onGroupUpdate }) {
  const started = nowMs();
  onGroupUpdate?.({ groupId: group.id, groupLabel: group.label, status: "running" });

  try {
    const results = await group.run({ onTestUpdate, shared });
    const rows = Array.isArray(results) ? results : [];

    const payload = {
      groupId: group.id,
      groupLabel: group.label,
      durationMs: nowMs() - started,
      results: rows,
      summary: summarizeResults(rows),
    };

    onGroupUpdate?.({
      groupId: group.id,
      groupLabel: group.label,
      status: "completed",
      ...payload,
    });

    return payload;
  } catch (error) {
    const failureRow = createGroupFailureResult({
      groupId: group.id,
      groupLabel: group.label,
      error,
    });

    const payload = {
      groupId: group.id,
      groupLabel: group.label,
      durationMs: nowMs() - started,
      results: [failureRow],
      summary: summarizeResults([failureRow]),
    };

    onTestUpdate?.({
      id: failureRow.id,
      group: group.id,
      name: failureRow.name,
      status: "failed",
      result: failureRow,
    });

    onGroupUpdate?.({
      groupId: group.id,
      groupLabel: group.label,
      status: "failed",
      ...payload,
    });

    return payload;
  }
}

export function createDiagnosticsSharedContext() {
  return {
    cache: {},
    meta: {
      startedAt: new Date().toISOString(),
    },
  };
}

export function getDiagnosticsGroups() {
  return GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
  }));
}

export function getDiagnosticsCatalog() {
  return GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    tests: group.getTests(),
  }));
}

export async function runDiagnosticsGroup({ groupId, shared, onTestUpdate, onGroupUpdate }) {
  const lookup = groupLookup();
  const group = lookup.get(groupId);

  if (!group) {
    throw new Error(`Unknown diagnostics group: ${groupId}`);
  }

  const sharedContext = shared ?? createDiagnosticsSharedContext();
  return runOneGroup({
    group,
    shared: sharedContext,
    onTestUpdate,
    onGroupUpdate,
  });
}

export async function runAllDiagnostics({ groupIds, shared, onTestUpdate, onGroupUpdate }) {
  const started = nowMs();
  const selectedIds = normalizeGroupIds(groupIds);
  const lookup = groupLookup();
  const sharedContext = shared ?? createDiagnosticsSharedContext();
  const groupRuns = [];

  for (const groupId of selectedIds) {
    const group = lookup.get(groupId);
    if (!group) continue;

    const run = await runOneGroup({
      group,
      shared: sharedContext,
      onTestUpdate,
      onGroupUpdate,
    });

    groupRuns.push(run);
  }

  const results = groupRuns.flatMap((groupRun) => groupRun.results || []);

  return {
    durationMs: nowMs() - started,
    groups: groupRuns,
    results,
    summary: summarizeResults(results),
  };
}
