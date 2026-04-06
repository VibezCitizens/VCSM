# Professional Feature Map (Nurse Focus)

This module is intentionally focused on one persona:

- Verified nurses

And two workflows only:

- Housing notes
- Hospital notes

## Start Here

- `src/features/professional/screens/ProfessionalAccessScreen.jsx`
  - Final screen entry for `/professional-access`.
  - Renders the nurse workspace only.

- `src/features/professional/professional-nurse/screens/NurseHomeScreen.jsx`
  - Routing guard for nurse-only rendering.

- `src/features/professional/professional-nurse/screens/NurseHomeScreenView.jsx`
  - Main view orchestration:
  - location filter
  - text search
  - tab switching
  - add-note actions

## Reused UI Building Blocks

- `src/features/settings/styles/settings-modern.css`
  - Shared surfaces/buttons for visual consistency.

- `src/features/professional/professional-nurse/housing/ui/CitySelector.jsx`
  - Lightweight city/state/ZIP filter inputs.

## Nurse Views

- `professional-nurse/screens/views/NurseWorkspaceTabs.jsx`
  - Two tabs only: Housing, Facility Insights.

- `professional-nurse/screens/views/HousingTabView.jsx`
  - Displays and filters housing notes.

- `professional-nurse/screens/views/FacilityInsightsTabView.jsx`
  - Displays and filters hospital notes.

- `professional-nurse/screens/views/NurseAddMenu.jsx`
  - Add menu with exactly two actions.

## Note Creation Flow

- `professional-nurse/housing/ui/AddForm.jsx`
  - Modal/sheet wrapper for note creation.

- `professional-nurse/housing/ui/AddHousingExperienceForm.jsx`
  - Creates a housing note.

- `professional-nurse/facility/ui/AddFacilityInsightForm.jsx`
  - Creates a hospital note.

## Intentional Scope

- No profession switching UI.
- No mixed enterprise dashboard in this entry flow.
- No city-living/food subfeatures in nurse tabs.
