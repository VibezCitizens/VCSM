import { lazy } from "react";

export function lazyWithLog(label, importer) {
  return lazy(() =>
    importer().catch((e) => {
      console.error(`[lazy import] ${label} failed`, e);
      throw e;
    }),
  );
}

// ── Legal ─────────────────────────────────────────────────────────────────────
export const LegalDocumentScreen = lazyWithLog("LegalDocumentScreen", () =>
  import("@/features/legal/screens/LegalDocumentScreen"),
);

// ── About / Contact ───────────────────────────────────────────────────────────
export const AboutScreen = lazyWithLog("AboutScreen", () =>
  import("@/features/legal/screens/AboutScreen"),
);
export const ContactScreen = lazyWithLog("ContactScreen", () =>
  import("@/features/legal/screens/ContactScreen"),
);

// ── How-To Guides ─────────────────────────────────────────────────────────────
export const HowToCreateProfileScreen = lazyWithLog("HowToCreateProfileScreen", () =>
  import("@/features/legal/screens/HowToCreateProfileScreen"),
);
export const HowToCreateVportScreen = lazyWithLog("HowToCreateVportScreen", () =>
  import("@/features/legal/screens/HowToCreateVportScreen"),
);
export const VportCategoryLandingScreen = lazyWithLog("VportCategoryLandingScreen", () =>
  import("@/features/legal/screens/VportCategoryLandingScreen"),
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const LoginScreen = lazyWithLog("LoginScreen", () =>
  import("@/features/auth/screens/LoginScreen"),
);
export const RegisterScreen = lazyWithLog("RegisterScreen", () =>
  import("@/features/auth/screens/RegisterScreen"),
);
export const ForgotPasswordScreen = lazyWithLog("ForgotPasswordScreen", () =>
  import("@/features/auth/screens/ForgotPasswordScreen"),
);
export const ResetPasswordScreen = lazyWithLog("ResetPasswordScreen", () =>
  import("@/features/auth/screens/ResetPasswordScreen"),
);
export const OnboardingScreen = lazyWithLog("OnboardingScreen", () =>
  import("@/features/auth/screens/Onboarding"),
);
export const WelcomeScreen = lazyWithLog("WelcomeScreen", () =>
  import("@/features/auth/screens/WelcomeScreen"),
);
export const AuthCallbackScreen = lazyWithLog("AuthCallbackScreen", () =>
  import("@/features/auth/screens/AuthCallbackScreen"),
);
export const VerifyEmailRequiredScreen = lazyWithLog("VerifyEmailRequiredScreen", () =>
  import("@/features/auth/screens/VerifyEmailRequiredScreen"),
);

// ── Wanders (public + app) ────────────────────────────────────────────────────
export const WandersHomeScreen = lazyWithLog("WandersHomeScreen", () =>
  import("@/features/wanders/screens/WandersHome.screen"),
);
export const WandersInboxPublicScreen = lazyWithLog("WandersInboxPublicScreen", () =>
  import("@/features/wanders/screens/WandersInboxPublic.screen"),
);
export const WandersCardPublicScreen = lazyWithLog("WandersCardPublicScreen", () =>
  import("@/features/wanders/screens/WandersCardPublic.screen"),
);
export const WandersSentScreen = lazyWithLog("WandersSentScreen", () =>
  import("@/features/wanders/screens/WandersSent.screen"),
);
export const WandersIntegrateActorScreen = lazyWithLog("WandersIntegrateActorScreen", () =>
  import("@/features/wanders/screens/WandersIntegrateActor.screen"),
);
export const WandersMailboxScreen = lazyWithLog("WandersMailboxScreen", () =>
  import("@/features/wanders/screens/WandersMailbox.screen"),
);
export const WandersOutboxScreen = lazyWithLog("WandersOutboxScreen", () =>
  import("@/features/wanders/screens/WandersOutbox.screen"),
);
export const WandersCreateScreen = lazyWithLog("WandersCreateScreen", () =>
  import("@/features/wanders/screens/WandersCreate.screen"),
);
export const VportBusinessCardPublicScreen = lazyWithLog("VportBusinessCardPublicScreen", () =>
  import("@/features/public/vportBusinessCard/screen/VportBusinessCardPublic.screen"),
);

// ── Public VPORT menu ─────────────────────────────────────────────────────────
export const VportMenuRedirectScreen = lazyWithLog("VportMenuRedirectScreen", () =>
  import("@/features/public/vportMenu/screen/VportPublicMenuRedirectScreen"),
);
export const VportActorMenuPublicScreen = lazyWithLog("VportActorMenuPublicScreen", () =>
  import("@/features/public/vportMenu/screen/VportPublicMenuScreen"),
);
export const VportActorMenuQrScreen = lazyWithLog("VportActorMenuQrScreen", () =>
  import("@/features/public/vportMenu/screen/VportPublicMenuQrScreen"),
);
export const VportActorMenuFlyerScreen = lazyWithLog("VportActorMenuFlyerScreen", () =>
  import("@/features/dashboard/flyerBuilder/screens/VportActorMenuFlyerScreen"),
);
export const VportMenuBySlugScreen = lazyWithLog("VportMenuBySlugScreen", () =>
  import("@/features/public/vportMenu/screen/VportPublicMenuBySlugScreen"),
);
export const VportMenuQrBySlugScreen = lazyWithLog("VportMenuQrBySlugScreen", () =>
  import("@/features/public/vportMenu/screen/VportPublicMenuQrBySlugScreen"),
);
export const VportReviewsBySlugScreen = lazyWithLog("VportReviewsBySlugScreen", () =>
  import("@/features/public/vportMenu/screen/VportPublicReviewsBySlugScreen"),
);
export const VportReviewsQrBySlugScreen = lazyWithLog("VportReviewsQrBySlugScreen", () =>
  import("@/features/public/vportMenu/screen/VportPublicReviewsQrBySlugScreen"),
);
