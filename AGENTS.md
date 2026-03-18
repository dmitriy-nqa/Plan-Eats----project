# AGENTS.md

## Project
This repository contains **Plan&Eat** — a family web service for weekly meal planning and automatic shopping list generation based on a manually managed dish database.

The product is being built first as an internal family tool for two users.

Full project specification is in:
- `project-spec.md`

## Product Goals
The MVP should help users:
- plan meals for 7 days,
- maintain their own family dish database,
- generate a shopping list automatically from the selected dishes,
- reduce the daily mental load of deciding what to cook,
- avoid forgetting products during shopping.

## Target Users
- Two family users share one family space.
- Main user: wife — adds dishes and plans the weekly menu.
- Second user: husband — actively uses the shopping list and participates in shared usage.

## Tech Stack
- Next.js
- Tailwind CSS
- Supabase
- Mobile-first UI

## MVP Priorities
The MVP must include:
- Weekly menu for 7 days
- Shared family dish database
- Manual CRUD for dishes
- Dish ingredients with units: `g`, `ml`, `l`, `pcs`
- Weekly meal slots: breakfast / lunch / dinner
- Optional empty meal slots
- Ability to copy a dish to another day
- Automatic shopping list generation from selected dishes
- Manual shopping list editing
- Shopping item check/uncheck
- Basic ingredient synonym dictionary for cautious normalization

## Out of Scope for MVP
Do **not** add these unless explicitly requested:
- AI assistant
- Pantry / "what we already have at home" screen
- External recipe database
- Store integrations
- Calorie counter
- Dish photos
- Weekly templates
- 14-day planning
- Tags for dishes
- Audit logs / advanced roles

## Product and UX Rules
- Keep the UI **mobile-first**.
- Keep the interface **simple, cozy, and family-oriented**.
- Prioritize:
  1. maximum simplicity,
  2. visual quality,
  3. minimal number of clicks.
- The main screen is **Weekly Menu**.
- Use bottom navigation with:
  - Weekly Menu
  - Dish List
  - Products
  - Settings
- Weekly planning should display the whole week compactly.
- Tapping a meal slot should open a modal dish picker.
- Tapping a day may open a larger day card/detail view.

## Engineering Rules
- Work in **small steps**.
- Do not build the whole app in one pass.
- Prefer simple, maintainable solutions over over-engineered ones.
- Do not add unnecessary libraries.
- Do not introduce AI or advanced automation in MVP.
- If a requirement is unclear, prefer the simplest implementation consistent with `project-spec.md`.

## Data and Domain Rules
- One family has one shared dish database, one shared weekly menu, and one shared shopping list per meal plan.
- Dish database is manually managed inside the app:
  - create,
  - edit,
  - delete.
- Ingredients should support cautious normalization using a synonym dictionary.
- If the app is not confident that two ingredient names match, it should not merge automatically without explicit future confirmation logic.
- If the same ingredient uses different units, items should remain separate in MVP.
- If a meal slot is empty, there should be no slot row stored for it.

## Workflow Rules for Codex
Before implementing major features:
1. read `AGENTS.md`
2. read `project-spec.md`
3. summarize the task briefly
4. implement only the requested scope

After each task:
- summarize changed files,
- explain what was implemented,
- mention assumptions,
- provide manual test steps.

## Preferred Delivery Order
1. project skeleton
2. core screens without full logic
3. database schema
4. dish CRUD
5. weekly meal plan logic
6. shopping list generation
7. UX polishing

