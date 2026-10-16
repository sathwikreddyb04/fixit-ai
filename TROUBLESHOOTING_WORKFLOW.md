# FixIt AI — Adaptive Troubleshooting & Safety Workflow

This document describes the nine requirements implemented in the adaptive troubleshooting upgrade and how each requirement is enforced across the codebase.

---

## Requirements Overview

| # | Requirement | Status |
|---|---|---|
| 1 | Track previous attempts | ✅ Implemented |
| 2 | Ask targeted follow-up questions | ✅ Implemented |
| 3 | Generate adaptive step-by-step plan | ✅ Implemented |
| 4 | Avoid repeating failed actions | ✅ Implemented |
| 5 | Prevent unsafe chemical escalation | ✅ Implemented |
| 6 | Implement safety checks & escalation | ✅ Implemented |
| 7 | Recommend professional assistance | ✅ Implemented |
| 8 | Add 9 tests covering all requirements | ✅ Implemented (36 total tests pass) |
| 9 | Document the revised workflow | ✅ This file |

---

## Architecture

```
client (React/Vite)              server (Express)
──────────────────               ────────────────────────────────
App.tsx                          problemRoutes.ts
  handleSubmitFeedback()    →      POST /:problemId/feedback
  pendingFollowUpQuestions  ←        builds AttemptRecord
  professionalReferral card ←        calls aiService.troubleshoot(
                                        currentPlan, feedback,
                                        attemptHistory,
                                        followUpAnswers,
                                        adaptationCount
                                      )
TroubleshootingModal.tsx         demoAdapter.ts / geminiAdapter.ts
  step-status selectors              troubleshoot()
  products used field                  ↳ safety reassessment
  symptoms field                       ↳ professional referral check
  pendingFollowUpQuestions             ↳ targeted follow-up questions
  followUpAnswers                      ↳ adaptive plan generation

SolutionView.tsx                 sessionStore.ts
  expectedOutcome display          SessionData.attemptHistory[]
  stopCondition display            GET /:problemId/history
```

---

## Requirement 1 — Track Previous Attempts

**Files:**
- [`shared/src/schemas/index.ts`](./shared/src/schemas/index.ts) — `AttemptRecord`, `StepAttempt` schemas
- [`server/src/services/session/sessionStore.ts`](./server/src/services/session/sessionStore.ts) — `SessionData.attemptHistory`
- [`server/src/routes/problemRoutes.ts`](./server/src/routes/problemRoutes.ts) — builds `AttemptRecord` per feedback submission

Each time the user submits feedback, `POST /:problemId/feedback` constructs an `AttemptRecord` with:
- `attemptNumber` (auto-incremented)
- `planSummary` (what plan was active)
- `stepsAttempted` (which steps the user marked succeeded/failed/skipped)
- `productsUsed` (comma-separated products)
- `symptomsReported` (remaining issues observed)
- `outcome` (worked / did_not_work / need_alternative / abandoned)

All records are stored in `session.attemptHistory[]` and passed into every subsequent `troubleshoot()` call.

The full history is accessible at `GET /api/v1/problems/:problemId/history`.

---

## Requirement 2 — Ask Targeted Follow-Up Questions

**Files:**
- [`server/src/services/ai/demoAdapter.ts`](./server/src/services/ai/demoAdapter.ts) — `troubleshoot()` generates targeted questions
- [`client/src/features/feedback/TroubleshootingModal.tsx`](./client/src/features/feedback/TroubleshootingModal.tsx) — renders `pendingFollowUpQuestions`
- [`client/src/App.tsx`](./client/src/App.tsx) — holds `pendingFollowUpQuestions` state, keeps modal open when `needsMoreClarification=true`

When `troubleshoot()` determines it needs more detail, it returns `needsMoreClarification: true` and `followUpQuestions[]`. The modal stays open and injects these questions inline. Previously answered questions (tracked via `mergedAnswers`) are skipped — only unanswered questions are surfaced.

Questions asked depend on context:
- **Residue symptom** — when the outcome description is too vague
- **Material / care label** — when no material has been confirmed yet

---

## Requirement 3 — Generate Adaptive Step-by-Step Plan

**Files:**
- [`server/src/services/ai/demoAdapter.ts`](./server/src/services/ai/demoAdapter.ts) — `troubleshoot()` builds `revisedSteps`
- [`server/src/features/safety/supportedScenarios.ts`](./server/src/features/safety/supportedScenarios.ts) — `alternativeSteps[]` per scenario
- [`shared/src/schemas/index.ts`](./shared/src/schemas/index.ts) — `SolutionStep.expectedOutcome`, `SolutionStep.stopCondition`

Each revised plan:
1. Starts with a mandatory **rinse step** to remove prior chemical residues
2. Selects `alternativeSteps` from the matched scenario (filtered to avoid already-tried methods)
3. Sets `expectedOutcome` on each step ("what you should see if working")
4. Sets `stopCondition` on each step ("stop immediately if…")
5. Includes a `whyTheseStepsExplanation` naming the failed approach and the reason for the change

Steps are displayed in [`SolutionView.tsx`](./client/src/features/solution/SolutionView.tsx) with colour-coded outcome (green) and stop-condition (red) badges under each step card.

---

## Requirement 4 — Avoid Repeating Failed Actions

**Files:**
- [`server/src/services/ai/demoAdapter.ts`](./server/src/services/ai/demoAdapter.ts) — `alternativeSteps` filtered by keyword-matching against `triedText`
- [`server/src/services/ai/geminiAdapter.ts`](./server/src/services/ai/geminiAdapter.ts) — prompt explicitly forbids repeating `feedback.whatWasTried`

Demo mode filters `alternativeSteps` by checking whether each step title's keywords appear in the compiled `triedText` string. If all alternatives have been tried, it falls back to the safest available option with a professional referral.

Gemini mode includes the explicit instruction: *"Does NOT repeat the previously failed approach: '…'"* in its prompt.

The `actionsToAvoid` list on every revised plan includes `DO NOT repeat previously failed step: "…"`.

---

## Requirement 5 — Prevent Unsafe Chemical Escalation

**Files:**
- [`server/src/features/safety/safetyEngine.ts`](./server/src/features/safety/safetyEngine.ts) — `sanitizeProposedPlan()`, `HAZARD_PATTERNS`
- [`server/src/services/ai/demoAdapter.ts`](./server/src/services/ai/demoAdapter.ts) — mandatory rinse step before any secondary chemistry

`sanitizeProposedPlan()` rejects proposed plan steps that:
- Contain corrosive chemical escalation (`strong acid`, `muriatic acid`, `caustic`, `lye`)
- Apply harsh abrasives to delicate surfaces (`steel wool`, `wire brush`, `sandpaper` on fabric/silk/wool)

`HAZARD_PATTERNS` includes:
- `chemical_mixing_hazard` — bleach+ammonia, bleach+vinegar, toxic fumes, chlorine gas
- `fire_hazard` — grease fires + water, flammable solvents near heat
- `medical_injury_hazard` — respiratory symptoms from fumes, chemical burns

The mandatory rinse step in every revised plan prevents accidental mixing of cleaning products between attempts.

---

## Requirement 6 — Safety Checks & Escalation

**Files:**
- [`server/src/features/safety/safetyEngine.ts`](./server/src/features/safety/safetyEngine.ts) — `evaluateSafety()`
- [`server/src/routes/problemRoutes.ts`](./server/src/routes/problemRoutes.ts) — safety checked at analysis time
- [`server/src/services/ai/demoAdapter.ts`](./server/src/services/ai/demoAdapter.ts) — `reassessedSafety` checked again in `troubleshoot()`
- [`client/src/App.tsx`](./client/src/App.tsx) — Safety Stop Banner rendered when `stoppedDueToRisk=true`

Safety is evaluated **twice per session**:
1. At initial analysis (`POST /analyze`) — blocks unsafe problems before any plan is generated
2. At every feedback submission (`POST /:problemId/feedback`) — re-evaluated against the user's latest feedback text, symptoms, and products used

If safety escalation is triggered during troubleshooting:
- `stoppedDueToRisk: true` is returned
- No `revisedSolution` is included
- `recommendedProfessional: true` is set
- The frontend renders a rose-coloured "Troubleshooting Stopped — Safety Hazard" banner

---

## Requirement 7 — Recommend Professional Assistance

**Files:**
- [`server/src/services/ai/demoAdapter.ts`](./server/src/services/ai/demoAdapter.ts) — three referral triggers
- [`client/src/App.tsx`](./client/src/App.tsx) — amber "Professional Assistance Recommended" card

Three conditions trigger professional referral:

| Trigger | Pattern |
|---|---|
| **Delicate / Dry-Clean material** | `silk\|wool\|cashmere\|suede\|nubuck\|leather\|velvet\|dry clean only` + ≥1 attempt |
| **Multiple failed attempts** | `adaptationCount >= 2` OR `attemptHistory.length >= 2` OR phrase-matched |
| **Adverse surface reaction** | `color bleeding\|fabric thinned\|finish peeling\|texture damaged` in feedback |

When triggered, the response includes:
- `recommendedProfessional: true`
- `professionalReferralReason` — specific explanation
- `guidanceMessage` — user-facing advice to disclose products used to the specialist
- No further DIY `revisedSolution` is attached

---

## Requirement 8 — Test Suite

**File:** [`server/tests/adaptiveTroubleshooting.test.ts`](./server/tests/adaptiveTroubleshooting.test.ts)

9 integration tests run against an in-process Express app (no running server required):

| Test | What it verifies |
|---|---|
| T1 | Revised plan differs from and explains departure from failed step |
| T2 | Vague outcome triggers follow-up questions or professional referral |
| T3 | Previously answered follow-up IDs not re-asked in subsequent calls |
| T4 | Adaptation count tracked; history endpoint returns 2 records after 2 feedback submissions |
| T5 | Dry-clean-only discovery triggers professional referral; separate problem without material does not |
| T6 | Unknown material/stain surfaces uncertainty (low confidence, missing info, or follow-ups) |
| T7 | Chemical fume + bleach+ammonia report triggers safety stop with no revised DIY steps |
| T8 | Silk/delicate material + distortion → `recommendedProfessional: true` + non-empty referral reason |
| T9 | Two separate problem IDs each have isolated, empty attempt histories |

**Run:**
```bash
npm test --workspace=server
```
All 36 tests (including 27 pre-existing) pass in ~1.4 s.

---

## Data Model Summary

```typescript
// Per-step tracking
interface StepAttempt {
  stepNumber: number;
  title: string;
  status: "succeeded" | "failed" | "skipped" | "untried";
}

// Per-attempt record (one per feedback submission)
interface AttemptRecord {
  attemptNumber: number;
  timestamp: string;
  planSummary: string;
  stepsAttempted?: StepAttempt[];
  productsUsed?: string[];
  symptomsReported?: string[];
  outcome: "worked" | "did_not_work" | "need_alternative" | "abandoned";
  userNotes?: string;
}

// Extended feedback
interface UserFeedback {
  stepStatuses?: StepAttempt[];
  productsUsed?: string[];
  symptoms?: string[];
  discoveredMaterialDetails?: string;
  followUpAnswers?: Record<string, string>;
  // ...existing fields
}

// Extended troubleshooting result
interface TroubleshootingResult {
  recommendedProfessional?: boolean;
  professionalReferralReason?: string;
  followUpQuestions?: FollowUpQuestion[];
  needsMoreClarification?: boolean;
  attemptHistory?: AttemptRecord[];
  // ...existing fields
}
```

---

## Limitations & Known Constraints

- **Demo mode only** — The deterministic `demoAdapter` covers 6+ specific stain scenarios. Problems that don't match any scenario fall back to a conservative professional referral after one failed attempt.
- **Session isolation** — All state is in-memory (`Map`). Sessions expire after 2 hours. Restarting the server clears all sessions.
- **No persistent history** — Attempt history is not written to a database. It exists only for the lifetime of the server process.
- **Gemini adapter** — With a valid `GEMINI_API_KEY`, the real Gemini adapter now passes full attempt history, follow-up answers, and step statuses in the prompt. Quality of adaptation depends on the model's output.
