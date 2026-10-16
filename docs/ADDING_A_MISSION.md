# Adding a Hackathon Mission to FixIt AI

This guide provides a rapid, practical 10-step workflow to implement any of the 5 unpredictable hackathon missions without modifying or risking core FixIt AI features.

---

## Architecture Principles for New Missions
1. **Zero Core Disruption**: Core problem analysis (`/api/v1/problems/*`) and the safety engine must continue functioning even if a new mission is broken or disabled.
2. **Explicit Contracts**: Missions declare their IDs, capabilities, dependencies, version, and execution handlers in `server/src/features/missions/missionRegistry.ts`.
3. **Feature-Flag Protection**: New missions can be toggled on or off at runtime. Inactive or planned missions are strictly guarded against invocation.
4. **Shared Reuse**: Reuse existing shared schemas (`EvidenceItem`, `SafetyAssessment`, `SolutionStep`), file validation, and UI components rather than duplicating logic.

---

## The 10-Step Mission Implementation Workflow

### Step 1: Translate Acceptance Criteria
- Read the new hackathon mission brief.
- Formulate explicit input/output schemas (e.g., input: care label image or symbol code; output: recommended washing cycle and temperature limits).

### Step 2: Inspect Existing Modules
- Check `shared/src/schemas/index.ts` for applicable evidence and solution schemas.
- Check `server/src/features/safety/safetyEngine.ts` to see if the mission interacts with chemical hazards or surface damage.

### Step 3: Update Shared Contracts (if needed)
- If the mission introduces new data types, add versioned Zod schemas and TypeScript types in `shared/src/schemas/index.ts`.
- Run `npm run build --workspace=shared`.

### Step 4: Implement the Isolated Feature Module
- Create a new directory under `server/src/features/<mission-name>/`.
- Example:
  ```typescript
  // server/src/features/eco-recipes/ecoCleanerService.ts
  export interface EcoRecipe {
    name: string;
    ingredients: string[];
    safeSurfaces: string[];
  }
  export function getEcoRecipeForStain(stainType: string): EcoRecipe { ... }
  ```

### Step 5: Register the Mission in `missionRegistry.ts`
- Open `server/src/features/missions/missionRegistry.ts`.
- Register the module:
  ```typescript
  MissionRegistry.register({
    definition: {
      id: "eco_friendly_recipes",
      name: "Green & Non-Toxic Cleaning Formulations",
      description: "Safe kitchen-staple cleaning formulations.",
      version: "1.0.0",
      dependencies: ["@fixit/shared"],
      enabled: true,
      capabilities: ["low_voc", "food_grade_cleaners"],
      status: "implemented",
      routePrefix: "/eco-recipes",
    },
    execute: async (payload) => {
      return getEcoRecipeForStain(payload.stainType);
    },
  });
  ```

### Step 6: Enforce Safety Checks & Feature Flags
- If the mission generates chemical recommendations, ensure it calls `evaluateSafety(...)` to verify it never recommends mixing incompatible agents (e.g. vinegar + bleach).
- Ensure the execution handler throws an error if `!mod.definition.enabled`.

### Step 7: Add Focused Vitest Tests
- Create `server/tests/<mission-name>.test.ts`.
- Test:
  1. Valid payload produces expected structured result.
  2. Invalid payload is handled gracefully.
  3. Execution is rejected when the mission is disabled via feature flag.
  4. Core analysis still passes without interference.

### Step 8: Add Frontend UI (if required)
- If the mission requires user interaction, add a feature card or tab in `client/src/components/MissionsDrawer.tsx` or `client/src/features/missions/`.
- Use `api.executeMission(missionId, payload)` to invoke the mission.

### Step 9: Run All Quality Gates
Run the repository test and build suite:
```bash
npm run lint --workspace=server
npm run lint --workspace=client
npm run test --workspace=server
npm run build
```
Verify that all tests pass with zero errors.

### Step 10: Verify Core Regression
- Test the core Coffee on Shirt demo flow.
- Verify that toggling the new mission on and off does not alter existing problem analyses.
