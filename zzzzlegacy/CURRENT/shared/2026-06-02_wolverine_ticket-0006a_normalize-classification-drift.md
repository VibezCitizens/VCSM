# HISTORY: TICKET-0006A — Normalize SOURCE_WORKFLOW_INTAKE Classification Drift

## Artifact
- Date: 2026-06-02
- Ticket: TICKET-0006A
- Parent Ticket: TICKET-0006
- Command: /Wolverine
- Type: Governance Normalization (Document-Only)

## Scope
- File modified: /Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/CURRENT/SOURCE_WORKFLOW_INTAKE.md
- No app source code modified: CONFIRMED
- No source rescan performed: CONFIRMED
- Boundary: VCSM only

## Changes Applied

### Source Root Classification Delta — Classification column fixes
| Row | Old Value | New Value | Rule |
|---|---|---|---|
| app | APP_SHELL | PLATFORM | APP_SHELL not in approved enum |
| assets | DO_NOT_DOCUMENT | DO_NOT_DOCUMENT_AS_FEATURE | DO_NOT_DOCUMENT not in approved enum |
| debuggers-stub | DEV_TOOLS | DO_NOT_DOCUMENT_AS_FEATURE | DEV_TOOLS not in approved enum |
| dev | DEV_TOOLS | DO_NOT_DOCUMENT_AS_FEATURE | DEV_TOOLS not in approved enum |
| features | FEATURE_TREE | PLATFORM | FEATURE_TREE not in approved enum |
| i18n | I18N | SHARED_INFRA | I18N not in approved enum |
| learning | LEARNING | FEATURE | LEARNING not in approved enum; doc folder is CURRENT/features/learning/ |
| queries | QUERY_LAYER | SHARED_INFRA | QUERY_LAYER not in approved enum |
| screens | DEV_TOOLS | DO_NOT_DOCUMENT_AS_FEATURE | DEV_TOOLS not in approved enum |

### Source Root Classification Delta — Action column fixes
| Row | Old Value | New Value | Rule |
|---|---|---|---|
| assets | DO_NOT_DOCUMENT | DO_NOT_DOCUMENT_AS_FEATURE | DO_NOT_DOCUMENT not in approved action enum |
| debuggers-stub | DO_NOT_DOCUMENT | DO_NOT_DOCUMENT_AS_FEATURE | DO_NOT_DOCUMENT not in approved action enum |
| dev | DO_NOT_DOCUMENT | DO_NOT_DOCUMENT_AS_FEATURE | DO_NOT_DOCUMENT not in approved action enum |
| screens | DO_NOT_DOCUMENT | DO_NOT_DOCUMENT_AS_FEATURE | DO_NOT_DOCUMENT not in approved action enum |
| scripts | DO_NOT_DOCUMENT | DO_NOT_DOCUMENT_AS_FEATURE | DO_NOT_DOCUMENT not in approved action enum |

### Feature Intake Table — Classification conflicts with recommended doc folder
| Feature | Old Value | New Value | Rule |
|---|---|---|---|
| actors | FEATURE | PLATFORM | Doc destination: CURRENT/platform/actors/ |
| auth | FEATURE | PLATFORM | Doc destination: CURRENT/platform/auth/ |
| debug | FEATURE | SHARED_INFRA | Doc destination: CURRENT/shared/debug/ |
| hydration | FEATURE | PLATFORM | Doc destination: CURRENT/platform/hydration/ |
| identity | FEATURE | PLATFORM | Doc destination: CURRENT/platform/identity/ |
| media | FEATURE | PLATFORM | Doc destination: CURRENT/platform/media/ |
| ui | FEATURE | SHARED_INFRA | Doc destination: CURRENT/shared/ui/ |
| upload | FEATURE | PLATFORM | Doc destination: CURRENT/platform/upload/ |

## Approved Classification Enum (post-normalization)
FEATURE / PLATFORM / SHARED_INFRA / APP_SCREEN / SERVICE / STATE / STYLE / SCRIPT / DO_NOT_DOCUMENT_AS_FEATURE

## Approved Action Enum (post-normalization)
ADD_TO_WORKFLOW / UPDATE_CLASSIFICATION / OK / DO_NOT_DOCUMENT_AS_FEATURE

## No Source Code Modified
Confirmed. This was a governance document normalization only.
