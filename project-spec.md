# Plan&Eat — Project Specification v1

## 1. Product Overview

**Plan&Eat** is a family web service for planning meals for 7 days based on a manually managed dish database and for automatically generating a shopping list from the ingredients of the dishes selected for the week.

The product is created first as an **internal family tool** for personal use by two users:
- wife — the primary user responsible for adding dishes and planning the menu,
- husband — an active user of the generated shopping list and a participant in shared family usage.

The core value of the product is:
- to assemble a clear weekly menu quickly,
- to automatically generate a shopping list,
- to reduce the daily mental load of deciding what to cook and what to buy.

---

## 2. Problem Statement

The product addresses two main household problems.

### 2.1. Repeated daily effort to decide what to cook
The family regularly faces repeated questions such as:
- what to cook today,
- what to cook tomorrow,
- how to prepare a weekly plan without constant discussion and cognitive effort.

### 2.2. Products are forgotten during shopping
Even when the menu is mostly understood, the shopping list:
- is created manually,
- is disconnected from the meal plan,
- can be incomplete,
- leads to forgotten products.

### Expected Outcome
The user should be able to:
- assemble a weekly menu in about 10 minutes,
- stop thinking every day about what to cook.

---

## 3. Target Users

### 3.1. Primary Users
- User 1: husband
- User 2: wife

### 3.2. Main Behavioral Roles
**Wife** is the primary user:
- adds dishes,
- edits dishes,
- composes the weekly meal plan.

**Husband**:
- uses the shared shopping list,
- interacts with the product as a practical household user, especially in the grocery store,
- may also use the app as a second family member.

### 3.3. Collaboration Model
The first version must support a **shared family space**:
- one shared family meal plan,
- one shared dish database,
- one shared shopping list.

### 3.4. Roles
No roles or permission separation are needed in MVP.
Both users operate in a single shared family space without admin/member separation.

---

## 4. Product Goals

### 4.1. Main Product Goal
Create a simple, visually appealing, and convenient family service that is actually used in everyday life.

### 4.2. Functional Goal
Provide the full useful cycle:
1. Add dishes to the database
2. Select dishes into the weekly menu
3. Generate a shopping list automatically
4. Edit the shopping list if needed
5. Use the shopping list in the store

### 4.3. UX Goal
The product must be:
- simple,
- understandable without onboarding,
- mobile-first,
- visually pleasant,
- minimal in clicks.

---

## 5. Core Use Cases

### Use Case 1. Manage family dish database
The user manually:
- adds a dish,
- edits a dish,
- deletes a dish.

### Use Case 2. Plan meals for 7 days
The user builds a weekly meal plan.

Each day supports three meal slots:
- breakfast
- lunch
- dinner

Any slot may remain empty.
Examples:
- lunch only,
- breakfast + dinner,
- dinner only.

### Use Case 3. Copy a dish to another day
The user can copy a dish to another day if a large portion is prepared or if leftovers are intentionally reused.

### Use Case 4. Generate shopping list
The service:
- collects ingredients from all selected dishes,
- merges matching ingredients,
- sums quantities,
- shows the resulting shopping list.

### Use Case 5. Cautious ingredient normalization
The service uses a synonym dictionary and cautious matching logic.

Examples:
- tomato / pomidor
- buckwheat / grecha
- white cabbage / cabbage white

If the system is not sure that two ingredient names match:
- it should not merge them automatically in MVP,
- advanced confirmation behavior may be added later.

### Use Case 6. Edit shopping list manually
The user can:
- delete an item,
- change quantity,
- add a new item manually,
- mark an item as purchased.

### Use Case 7. Shared family usage
Both users work with:
- one shared dish database,
- one shared weekly menu,
- one shared shopping list.

---

## 6. MVP Scope

### 6.1. Dish Database
MVP includes:
- viewing the dish list,
- adding a dish,
- editing a dish,
- deleting a dish.

### 6.2. Dish Structure
Each dish in MVP includes:
- name,
- category,
- list of ingredients,
- ingredient quantities,
- units: `g`, `ml`, `l`, `pcs`,
- comment,
- recipe text.

### 6.3. Ingredient Granularity
Use medium-level ingredient names, for example:
- chicken fillet,
- chicken thigh,
- buckwheat,
- tomato.

### 6.4. Dish Categories
MVP categories:
- breakfast
- soup
- salad
- main course
- bakery and desserts

### 6.5. Weekly Menu Screen
The main screen is **Weekly Menu**.

It should present:
- a 7-day table,
- meal slots for each day,
- short dish labels inside each slot.

Behavior:
- tapping a slot opens a **dish picker modal**,
- tapping a day may open a **day card/detail view**.

### 6.6. Slot Actions
The user can:
- select a dish,
- replace a dish,
- clear a slot,
- copy a dish to another day.

### 6.7. Shopping List
The shopping list is generated automatically from the weekly plan:
- ingredients are merged when the match is confident,
- quantities are summed,
- uncertain matches are not auto-merged in MVP.

### 6.8. Unit Limitation in MVP
If the same ingredient appears with different units, for example:
- milk 500 ml
- milk 1 l

then the items may remain separate in MVP.
The user can correct them manually.

### 6.9. Shopping List Editing
MVP includes:
- deleting an item,
- changing quantity,
- adding a new item manually,
- marking an item as purchased.

### 6.10. Shared Usage
The product must support:
- one family space,
- two users inside the same family.

---

## 7. Killer Feature

## Automatic shopping list generation from the weekly menu based on the family’s own dish database

This is the core value of the product and the key MVP feature.

A critical quality factor for this feature is:
- cautious matching of different names for the same product using a synonym dictionary,
- avoiding unsafe merges when confidence is low.

---

## 8. UX Principles

### 8.1. UX Priorities
1. Maximum simplicity
2. Visual beauty
3. Minimal number of clicks

### 8.2. Device Priority
The product is designed **mobile-first**, because the main real-world device is the phone.

### 8.3. Interface Style
The interface should feel:
- cozy,
- family-oriented,
- modern,
- clean,
- not overloaded.

### 8.4. Interface References
Visual/logical references:
- **Realty Calendar** — readability and functional structure
- **Revolut** — modern cleanliness and usability

### 8.5. Main Navigation
Bottom navigation in mobile version:
- **Weekly Menu**
- **Dish List**
- **Products**
- **Settings**

**Weekly Menu** is the home screen.

---

## 9. Out of Scope for MVP

Do not include in MVP:
- AI assistant
- pantry / "What we have at home" screen
- store integrations
- calorie counter
- dish photos
- shopping history
- dish tags
- weekly templates
- 14-day planning
- external recipe database
- audit log showing who changed what
- separate user roles

---

## 10. Future Scope

Possible future extensions:
- 14-day planning
- weekly templates
- pantry screen
- automatic exclusion of already available products
- dish tags
- extended repeat / duplication options
- external recipe database
- dish photos
- change history

### Future AI Scope
- generate a weekly menu from the family dish database,
- suggest dishes from products available at home,
- if an external database is added, suggest new dishes by prompt.

---

## 11. Product Positioning

At start, **Plan&Eat** is:
- not a public marketplace,
- not a large cooking platform,
- not an AI food assistant,
- but a practical internal family tool.

Monetization is not a current priority.
The focus is real personal utility and convenience.

---

## 12. Delivery Strategy

### Working Mode
- 5–7 hours per week
- balance between speed and quality
- documentation and planning first, implementation via Codex after that

### Delivery Sequence
1. Project Brief
2. Screen Map
3. Data Model
4. Backlog
5. Step-by-step implementation via Codex

---

## 13. Screen Map v1

### 13.1. Screen: Weekly Menu
**Type:** main screen  
**Role:** central screen of the product

**Goal:** show and edit the 7-day weekly meal plan.

**Main elements:**
- title “Weekly Menu”
- 7-day table
- meal slots for each day:
  - breakfast
  - lunch
  - dinner
- short dish label in each slot
- copy action
- clear action
- CTA to refresh / open products

**Main actions:**
- tap slot → open dish picker modal
- tap day → open day card
- copy dish to another day
- remove dish from slot

### 13.2. Screen / Modal: Dish Picker
**Type:** modal  
**Role:** choose a dish for a specific slot

**Goal:** assign a dish to a selected meal slot quickly.

**Main elements:**
- search by name
- dish list
- category display
- select button
- quick action: create new dish

### 13.3. Screen: Day Card
**Type:** detail screen / day detail view  
**Role:** show one day in a larger readable format

**Goal:** make day-level editing easier than in the compact weekly table.

**Main elements:**
- date / weekday
- breakfast / lunch / dinner sections
- selected dish names
- actions:
  - replace
  - clear
  - copy

### 13.4. Screen: Dish List
**Type:** list screen  
**Role:** manage family dish database

**Goal:** show all dishes and allow CRUD operations.

**Main elements:**
- title “Dish List”
- search
- list of dish cards
- card preview:
  - name
  - category
  - short comment or recipe preview
- add dish button
- edit / delete actions

### 13.5. Screen: Add / Edit Dish
**Type:** form screen  
**Role:** create or update a dish

**Goal:** provide a fast and simple form for building the family dish database.

**Fields:**
- name
- category
- comment
- recipe text
- ingredients:
  - ingredient name
  - quantity
  - unit

**Actions:**
- add ingredient row
- remove ingredient row
- save dish
- cancel

### 13.6. Screen: Products
**Type:** list screen  
**Role:** final shopping list

**Goal:** show the generated shopping list for the weekly plan.

**Main elements:**
- title “Products”
- list of shopping items
- quantity
- unit
- purchased checkbox
- edit action
- delete action
- add manual product action
- optional block for unresolved / uncertain merges in future versions

**Actions:**
- mark purchased
- edit quantity
- delete item
- add item manually

### 13.7. Screen: Settings
**Type:** settings screen  
**Role:** minimal family and system settings

**Goal:** provide basic settings for the shared family space.

**Main elements:**
- family info
- planning mode: 7 days
- second user / family sharing options
- basic system settings

---

## 14. Data Model v1

### 14.1. Main Entities
For MVP, the product uses these entities:
- families
- users
- family_members
- dishes
- dish_ingredients
- meal_plans
- meal_plan_slots
- shopping_lists
- shopping_list_items
- ingredient_synonyms

Optional later extension:
- ingredient_merge_reviews

### 14.2. Entity Purpose
- **families** — shared family space
- **users** — user profiles
- **family_members** — link between users and family
- **dishes** — family dishes
- **dish_ingredients** — ingredients belonging to a dish
- **meal_plans** — weekly plan headers
- **meal_plan_slots** — selected dishes inside the weekly plan
- **shopping_lists** — shopping list headers linked to meal plans
- **shopping_list_items** — individual products inside shopping list
- **ingredient_synonyms** — synonym dictionary for cautious ingredient normalization

### 14.3. Data Logic Rules
- one family has one shared dish database,
- one meal plan belongs to one family,
- one shopping list belongs to one meal plan,
- if a meal slot is empty, no slot record exists,
- if units differ, shopping list items are not merged in MVP,
- cautious synonym normalization is allowed only when confidence is sufficient.

---

## 15. ER Structure v1

### 15.1. Compact Entity Diagram

```text
users
  └── family_members
        └── families
              ├── dishes
              │     └── dish_ingredients
              ├── meal_plans
              │     └── meal_plan_slots ─── dishes
              ├── shopping_lists
              │     └── shopping_list_items
              └── ingredient_synonyms
```

Possible future extension:

```text
ingredient_merge_reviews
```

### 15.2. Tables and Fields

#### users
- id (uuid, pk)
- email (text, unique, not null)
- display_name (text)
- created_at
- updated_at

#### families
- id (uuid, pk)
- name (text, not null)
- created_at
- updated_at

#### family_members
- id (uuid, pk)
- family_id (uuid, fk -> families.id, not null)
- user_id (uuid, fk -> users.id, not null)
- status (text, not null)
- created_at

#### dishes
- id (uuid, pk)
- family_id (uuid, fk -> families.id, not null)
- name (text, not null)
- category (text, not null)
- comment (text)
- recipe_text (text)
- created_by_user_id (uuid, fk -> users.id)
- is_archived (boolean, not null, default false)
- created_at
- updated_at

#### dish_ingredients
- id (uuid, pk)
- dish_id (uuid, fk -> dishes.id, not null)
- ingredient_name (text, not null)
- quantity (numeric(10,2), not null)
- unit (text, not null)
- sort_order (integer)
- created_at
- updated_at

#### meal_plans
- id (uuid, pk)
- family_id (uuid, fk -> families.id, not null)
- start_date (date, not null)
- end_date (date, not null)
- status (text)
- created_at
- updated_at

#### meal_plan_slots
- id (uuid, pk)
- meal_plan_id (uuid, fk -> meal_plans.id, not null)
- day_index (integer, not null)
- meal_type (text, not null)
- dish_id (uuid, fk -> dishes.id, not null)
- created_at
- updated_at

#### shopping_lists
- id (uuid, pk)
- family_id (uuid, fk -> families.id, not null)
- meal_plan_id (uuid, fk -> meal_plans.id, not null, unique)
- generated_at
- created_at
- updated_at

#### shopping_list_items
- id (uuid, pk)
- shopping_list_id (uuid, fk -> shopping_lists.id, not null)
- ingredient_name (text, not null)
- normalized_name (text)
- quantity (numeric(10,2), not null)
- unit (text, not null)
- is_checked (boolean, not null, default false)
- is_manual (boolean, not null, default false)
- source_type (text, not null)
- created_at
- updated_at

#### ingredient_synonyms
- id (uuid, pk)
- family_id (uuid, fk -> families.id)
- raw_name (text, not null)
- canonical_name (text, not null)
- confidence_type (text, not null)
- created_at
- updated_at

### 15.3. Main Relations
- `family_members.user_id -> users.id`
- `family_members.family_id -> families.id`
- `dishes.family_id -> families.id`
- `dishes.created_by_user_id -> users.id`
- `dish_ingredients.dish_id -> dishes.id`
- `meal_plans.family_id -> families.id`
- `meal_plan_slots.meal_plan_id -> meal_plans.id`
- `meal_plan_slots.dish_id -> dishes.id`
- `shopping_lists.family_id -> families.id`
- `shopping_lists.meal_plan_id -> meal_plans.id`
- `shopping_list_items.shopping_list_id -> shopping_lists.id`
- `ingredient_synonyms.family_id -> families.id` (nullable)

### 15.4. MVP Rules for Data Layer
- If a slot is empty, there is no `meal_plan_slots` row.
- If the same ingredient uses different units, do not merge in MVP.
- If synonym matching is uncertain, do not auto-merge in MVP.
- `shopping_list_items.source_type` values:
  - `auto`
  - `manual`

---

## 16. Recommended MVP Implementation Scope

For the first real SQL schema and first implementation wave, include these tables:
- users
- families
- family_members
- dishes
- dish_ingredients
- meal_plans
- meal_plan_slots
- shopping_lists
- shopping_list_items
- ingredient_synonyms

Postpone for now:
- ingredient_merge_reviews

This keeps MVP simple enough to start coding today without losing future extensibility.
