# Rules Engine

The simulator uses a **database-driven, versioned rules framework**. Operational doctrine is not hard-coded; it lives in the database as **RuleSets** and **Rules**.

## Concepts

- **RuleSet** – Named, versioned container (e.g. `default-v1`). Only one RuleSet can be **active** at a time.
- **Rule** – A single rule inside a RuleSet with:
  - **name** – Identifier.
  - **priority** – Integer; higher = evaluated first. First matching rule wins.
  - **when** – JSON condition (e.g. incident type, priority).
  - **recommend** – JSON output: `requiredCapabilities[]`, `minimumCounts` (per capability), `maxTravelMinutes` (optional).
  - **scoreWeights** – Optional JSON for AAR scoring.

## How to edit rules in the DB

1. **List active rulesets**
   - `GET /rules/active` – Returns active RuleSet(s) with their rules.

2. **Create or update rules**
   - Use Prisma Studio (`pnpm db:studio`) or direct SQL/Prisma.
   - Add a new **RuleSet** (e.g. `default-v2`) with **version** and **isActive: false**.
   - Add **Rule** rows with **ruleSetId** pointing to that RuleSet.
   - Set **when** and **recommend** as JSON.

3. **Activate a ruleset**
   - `POST /rules/sets/:id/activate` (admin) – Deactivates all others and activates the given RuleSet.

4. **Seed default rules**
   - `POST /rules/seed-default` (admin) – Ensures a default RuleSet exists and is active (idempotent).

## Rule condition format (`when`)

- **type** – Incident type (e.g. `"HOUSE_FIRE"`) or array of types.
- **priority** – 1–5 or array of priorities.
- Extend with more keys as needed; the engine evaluates in priority order and returns the first match.

## Recommendation format (`recommend`)

- **requiredCapabilities** – Array of capability codes: `PUMP`, `RESCUE`, `COMMAND`, `WATER_SUPPLY_SUPPORT`, `HAZMAT_SUPPORT`, `MEDICAL_SUPPORT`.
- **minimumCounts** – Object mapping capability to minimum count (e.g. `{ "PUMP": 2, "RESCUE": 1 }`).
- **maxTravelMinutes** – Optional maximum travel time for dispatch suitability.

## Versioning

- Use **name + version** (e.g. `default-v1`, `default-v2`) to keep history.
- Activate the version you want; old versions remain in the DB for audit.
