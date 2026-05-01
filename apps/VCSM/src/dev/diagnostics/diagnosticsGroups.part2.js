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

export const GROUPS_PART2 = [
  { id: DESIGN_GROUP_ID, label: DESIGN_GROUP_LABEL, getTests: getDesignTests, run: runDesignGroup },
  { id: NOTIFICATIONS_GROUP_ID, label: NOTIFICATIONS_GROUP_LABEL, getTests: getNotificationsTests, run: runNotificationsGroup },
  { id: NOTIFICATIONS_FEATURE_GROUP_ID, label: NOTIFICATIONS_FEATURE_GROUP_LABEL, getTests: getNotificationsFeatureTests, run: runNotificationsFeatureGroup },
  { id: PROFILES_FEATURE_GROUP_ID, label: PROFILES_FEATURE_GROUP_LABEL, getTests: getProfilesFeatureTests, run: runProfilesFeatureGroup },
  { id: PROFILES_KINDS_FEATURE_GROUP_ID, label: PROFILES_KINDS_FEATURE_GROUP_LABEL, getTests: getProfilesKindsFeatureTests, run: runProfilesKindsFeatureGroup },
  { id: PUBLIC_FEATURE_GROUP_ID, label: PUBLIC_FEATURE_GROUP_LABEL, getTests: getPublicFeatureTests, run: runPublicFeatureGroup },
  { id: SETTINGS_ACCOUNT_FEATURE_GROUP_ID, label: SETTINGS_ACCOUNT_FEATURE_GROUP_LABEL, getTests: getSettingsAccountFeatureTests, run: runSettingsAccountFeatureGroup },
  { id: SETTINGS_PRIVACY_FEATURE_GROUP_ID, label: SETTINGS_PRIVACY_FEATURE_GROUP_LABEL, getTests: getSettingsPrivacyFeatureTests, run: runSettingsPrivacyFeatureGroup },
  { id: SETTINGS_PROFILE_FEATURE_GROUP_ID, label: SETTINGS_PROFILE_FEATURE_GROUP_LABEL, getTests: getSettingsProfileFeatureTests, run: runSettingsProfileFeatureGroup },
  { id: SETTINGS_FEATURE_GROUP_ID, label: SETTINGS_FEATURE_GROUP_LABEL, getTests: getSettingsFeatureTests, run: runSettingsFeatureGroup },
  { id: UPLOAD_FEATURE_GROUP_ID, label: UPLOAD_FEATURE_GROUP_LABEL, getTests: getUploadFeatureTests, run: runUploadFeatureGroup },
  { id: VPORT_FEATURE_GROUP_ID, label: VPORT_FEATURE_GROUP_LABEL, getTests: getVportFeatureTests, run: runVportFeatureGroup },
  { id: FEED_FEATURE_GROUP_ID, label: FEED_FEATURE_GROUP_LABEL, getTests: getFeedFeatureTests, run: runFeedFeatureGroup },
  { id: FEATURE_COVERAGE_GROUP_ID, label: FEATURE_COVERAGE_GROUP_LABEL, getTests: getFeatureCoverageTests, run: runFeatureCoverageGroup },
];
