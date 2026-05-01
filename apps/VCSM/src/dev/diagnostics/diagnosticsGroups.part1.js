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

export const GROUPS_PART1 = [
  { id: SCHEMA_GROUP_ID, label: SCHEMA_GROUP_LABEL, getTests: getSchemaIntegrityTests, run: runSchemaIntegrityGroup },
  { id: ACTOR_GROUP_ID, label: ACTOR_GROUP_LABEL, getTests: getActorSystemTests, run: runActorSystemGroup },
  { id: ONBOARDING_GROUP_ID, label: ONBOARDING_GROUP_LABEL, getTests: getOnboardingTests, run: runOnboardingGroup },
  { id: BLOCK_GROUP_ID, label: BLOCK_GROUP_LABEL, getTests: getBlockTests, run: runBlockGroup },
  { id: SOCIAL_GROUP_ID, label: SOCIAL_GROUP_LABEL, getTests: getSocialTests, run: runSocialGroup },
  { id: POSTS_GROUP_ID, label: POSTS_GROUP_LABEL, getTests: getPostsTests, run: runPostsGroup },
  { id: MESSAGING_GROUP_ID, label: MESSAGING_GROUP_LABEL, getTests: getMessagingTests, run: runMessagingGroup },
  { id: CHAT_CONVERSATION_FEATURE_GROUP_ID, label: CHAT_CONVERSATION_FEATURE_GROUP_LABEL, getTests: getChatConversationFeatureTests, run: runChatConversationFeatureGroup },
  { id: CHAT_INBOX_FEATURE_GROUP_ID, label: CHAT_INBOX_FEATURE_GROUP_LABEL, getTests: getChatInboxFeatureTests, run: runChatInboxFeatureGroup },
  { id: CHAT_START_FEATURE_GROUP_ID, label: CHAT_START_FEATURE_GROUP_LABEL, getTests: getChatStartFeatureTests, run: runChatStartFeatureGroup },
  { id: CHAT_FEATURE_GROUP_ID, label: CHAT_FEATURE_GROUP_LABEL, getTests: getChatFeatureTests, run: runChatFeatureGroup },
  { id: REPORTS_GROUP_ID, label: REPORTS_GROUP_LABEL, getTests: getReportsTests, run: runReportsGroup },
  { id: VPORTS_GROUP_ID, label: VPORTS_GROUP_LABEL, getTests: getVportsTests, run: runVportsGroup },
  { id: BOOKINGS_GROUP_ID, label: BOOKINGS_GROUP_LABEL, getTests: getBookingsTests, run: runBookingsGroup },
  { id: BOOKING_FEATURE_GROUP_ID, label: BOOKING_FEATURE_GROUP_LABEL, getTests: getBookingFeatureTests, run: runBookingFeatureGroup },
];
