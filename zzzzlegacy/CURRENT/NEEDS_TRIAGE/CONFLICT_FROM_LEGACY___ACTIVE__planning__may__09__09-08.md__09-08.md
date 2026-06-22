# Planning — May / 09 / Sequence 08

> Active task: i18n architecture review + implementation plan

## Execution Plan

Task: Deep read-only i18n / language architecture review for VCSM + implementation plan output
Application Scope: VCSM
Task Class: CONTRACT_REVIEW
Estimated Time: 12–18 minutes
Execution Type: Split

Slices:
- S1: Read src/i18n/ — translation files, config, locale detection, storage, hooks, providers, formatters
- S2: Read app root / layout / routing — locale plumbing, hydration risk surface
- S3: Read dashboard pages, public pages, navigation, shared components — hardcoded string audit
- S4: Read forms, settings, profile, toasts, error messages — untranslated surface audit
- S5: Synthesize current architecture, gaps, risks
- S6: Produce recommended architecture + phased implementation plan (Phases 1–6)

Files Expected To Change: NONE (read-only review)
SENTRY Review: Not Needed
Status: COMPLETE

## Execution Summary

What was completed:
- Full read-only i18n architecture review across platform/i18n/, apps/VCSM/src/i18n/, and apps/VCSM/src/platform/i18n/
- Inspected all translation files (13 namespace files + 2 artifact files), provider, hook, setup assembly, vite aliases, and jsconfig
- Audited navigation, auth forms, settings, onboarding, and shared components for hardcoded strings
- Read the existing AST audit tool and its generated output (784 phrases, 1,324 files)

Why it was done this way:
- Read-only pass per plan — no code changed
- Sampled highest-value screens (auth, nav, settings, onboarding) for hardcoded string density
- Used the existing audit tool output rather than re-scanning to confirm scale

Key findings:
1. The i18n engine and provider chain are production-ready and well-designed
2. ALL 13 Spanish translation files (8 platform + 5 app) are English copies — zero actual translations
3. Only 1 component (BookingCalendarDayPanel) calls useTranslation() — rest of app is hardcoded
4. LocaleSwitcher exists but is never mounted — users cannot switch language
5. Flat en.json/es.json at src/i18n/ are machine-generated audit artifacts, NOT production files
6. es.json contains broken Spanglish machine translations (not usable as a base)
7. @i18n and @platform/i18n aliases are in vite.config.js only — missing from jsconfig.json
8. features/language/ audit tool folder is inside src/features/ (wrong location per CLAUDE.md rules)
9. No date/number/currency formatting utility exists
10. No pluralization support in createTranslator

Files changed: NONE
Documentation Drift Status: N/A (review only)
SENTRY: Not applied

NOTE OF COMPLETITION
