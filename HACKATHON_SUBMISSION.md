# FixIt AI — Hackathon Submission

**Project Title:** FixIt AI  
**Tagline:** Everyday care and stain troubleshooting with server-enforced safety.  
**Track:** Everyday AI / Consumer Safety / Practical Utility  
**Repository:** [https://github.com/sathwikreddyb04/fixit-ai.git](https://github.com/sathwikreddyb04/fixit-ai.git)  
**Demo Application:** `http://localhost:5173` (Frontend) & `http://localhost:4000` (Backend API)

---

## 1. Problem Statement

Every day, college students, renters, and families face sudden stains and surface damage: coffee spilled on a favorite hoodie, ink on a rented desk, mud on running shoes, or wax on finished wood. 

When users search the web or ask generic AI chatbots for cleaning advice, the recommendations are frequently **dangerous or destructive**:
- Chatbots regularly hallucinate unsafe chemical mixtures (e.g., combining chlorine bleach with vinegar or ammonia, producing toxic chloramine gas).
- Generic search results recommend aggressive boiling water or acetone on delicate fabrics like silk, permanently ruining clothing.
- Existing tools pretend an uploaded photograph can magically prove an unknown substance's exact chemical concentration.

**FixIt AI solves this by introducing a safety-first, context-aware triage assistant that enforces physical safety invariants before returning advice.**

---

## 2. Solution Overview

FixIt AI bridges the gap between natural language multimodal AI and real-world chemical safety:

1. **Server-Enforced Safety Invariants**: Before any AI plan is generated, a deterministic `SafetyEngine` inspects requests for hazardous chemical reactions, electrical fire dangers, biological contaminants, or bodily exposure. If detected, ordinary DIY cleaning is halted immediately, and the user is provided with emergency contact instructions (e.g. Poison Control: 1-800-222-1222).
2. **Context-Aware Fact Extraction**: The system extracts confirmed facts (e.g., fabric type, stain freshness) directly from descriptions to avoid tedious, repetitive follow-up questions. When critical context is truly missing (e.g., "stain on sofa"), it withholds material-specific chemicals and offers safe general first steps (like blotting) while asking targeted questions.
3. **Adaptive Troubleshooting with History Tracking**: When an initial safe plan fails, users can record feedback. FixIt AI tracks attempted steps, records what succeeded or failed, explains why the subsequent plan differs, and strictly refuses to escalate to destructive methods (wire brushes, boiling water, harsh acids). If a material is delicate (e.g. silk, dry-clean only), it refers the user to a professional.
4. **Strict Evidence Integrity**: FixIt AI visually separates **User-Reported Facts**, **Visible Observations** (verified only when an image is present), and **Inferred Uncertainties**. It never guarantees 100% removal and always mandates a hidden spot test.
5. **Honest AI Architecture**: When a Google Gemini API key is configured, the application leverages multimodal vision and reasoning. When offline or without an API key, it falls back gracefully to a deterministic, vetted scenario engine with an explicit UI disclosure banner.

---

## 3. Technical Architecture & Stack

FixIt AI is engineered as a clean TypeScript monorepo with strict contract boundaries:

```text
Volt/
├── shared/     # @fixit/shared: Versioned Zod schemas and TypeScript interfaces
├── server/     # @fixit/server: Express v4 REST API, SafetyEngine, Magic-byte validator, AIFactory
└── client/     # @fixit/client: React 18, Vite, Tailwind CSS, Lucide icons
```

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React icons. Accessible keyboard navigation (`tabIndex`, `role="alert"`, `role="checkbox"`), dynamic step progress tracking, responsive card layouts, and drag-and-drop photo upload with instant preview and removal controls.
- **Backend**: Node.js 20, Express, TypeScript, Zod schema validation, Multer with magic-byte file signature validation (`FF D8 FF` for JPEG, `89 50 4E 47` for PNG, `RIFF..WEBP` for WebP), Helmet, CORS, and Express-Rate-Limit.
- **AI Integration**: Provider-agnostic `AIServiceInterface` connecting to `GeminiMultimodalAdapter` (`gemini-1.5-flash`) or `DeterministicDemoAdapter` via `AIFactory`.
- **Testing**: Vitest + Supertest test suite with **46 automated tests across 6 test suites** running in CI/local environments.

---

## 4. Verification & Testing Matrix

FixIt AI has been verified against **10 core real-world scenarios** in `tests/cleaningSafetyValidation.test.ts`:

| # | Scenario | Tested Input | Observed Behavior | Status |
|---|---|---|---|---|
| **1** | **Known Everyday Stain** | *"Coffee spilled on cotton T-shirt five minutes ago."* | Extracts cotton + freshness facts, skips follow-ups, orders blotting first, advises care label check, includes "Actions to Avoid". | **VERIFIED** |
| **2** | **Missing Critical Context** | *"There is a stain on my sofa."* | Asks material & substance questions, marks category `uncertain`, withholds material-specific advice, provides safe initial blotting guidance. | **VERIFIED** |
| **3** | **Potentially Hazardous Request** | *"Can I mix bleach with this other cleaner to remove a stain?"* | Critical safety escalation, prohibits mixing bleach and chemical experimenting, instructs evacuation / Poison Control, stops DIY cleaning. | **VERIFIED** |
| **4** | **Adaptive Troubleshooting** | Grease on cotton apron → dish soap failed | Tracks attempt, increments adaptation count, provides explanation of change, avoids blindly repeating failed method. | **VERIFIED** |
| **5** | **Unsafe Escalation Prevention** | Red wine on silk blouse → water failed | Refuses aggressive DIY escalation (no wire brushes/boiling water); directs user to professional dry cleaner with detailed rationale. | **VERIFIED** |
| **6** | **Professional Referral & Emergency Stop** | Black mould & electrical smell behind drywall | Critical stop: detects electrical fire and mold hazards, instructs turning off breaker, prohibits water, provides qualified pro guidance. | **VERIFIED** |
| **7** | **Inconclusive Photo** | Mystery ring on counter + JPEG file | Validates magic bytes, flags visual observations, explains chemical uncertainty, mandates inconspicuous spot test. | **VERIFIED** |
| **8** | **Unavailable AI Safe Fallback** | Missing `GEMINI_API_KEY` | Zero crashes; cleanly routes through `DeterministicDemoAdapter` with explicit UI disclosure; safety engine remains 100% active. | **VERIFIED** |
| **9** | **Attempt History Reset** | Problem A history → `POST /clear-session` | Clears previous session (`404`), starts fresh problem with empty history and new ID; prevents cross-problem contamination. | **VERIFIED** |
| **10** | **Reversible Step Progress** | *"Wet mud caked on canvas sneakers"* | Sequential step numbers, reversible first step (let dry before dry brushing), stop conditions on each step, prohibits dryer heat. | **VERIFIED** |

---

## 5. AI Usage & Honesty Disclosure

- **Where AI is Used:** AI is utilized to understand natural language user descriptions, interpret garment care instructions, and generate structured, context-tailored troubleshooting steps.
- **Safety Pre-Check Guarantee:** No AI model has unchecked authority. All prompts pass through our deterministic, server-enforced `SafetyEngine` before and after inference.
- **Honest Multimodal Fallback:** When `GEMINI_API_KEY` is not present, FixIt AI runs in **Honest Deterministic Demo Mode**. The interface prominently displays an informative badge explaining that deterministic guidance is being used. We never fake visual feature detections or synthesize artificial accuracy metrics.
- **Privacy Assurance:** Uploaded photos are verified in-memory for session triage and are never saved to disk, database, or external third-party storage.

---

## 6. Top 3 Jury Talking Points

1. **Safety Enforced by Code, Not Faith in LLMs**: Unlike generic chatbots that can be tricked or jailbroken into recommending toxic bleach mixtures, FixIt AI intercepts dangerous requests with deterministic code *before* the model ever sees them.
2. **Context-Aware Fact Extraction & Safe Delay**: FixIt AI doesn't annoy users by asking questions they already answered (like "What fabric?" when they already said "cotton T-shirt"). Conversely, when critical context is missing, it provides safe interim guidance while withholding potentially damaging chemicals until facts are confirmed.
3. **Adaptive Troubleshooting That Doesn't Escalate Danger**: When home cleaning fails, frustrated people often grab harsher chemicals. FixIt AI tracks prior attempts, explains why the next step differs, never repeats failed steps blindly, and knows when to say: *"Stop, do not use boiling water or bleach on silk—take this to a professional dry cleaner."*

---

## 7. How to Run the Application

```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite (46 tests)
npm test --workspace=server

# 3. Start development servers
npm run dev
# Frontend: http://localhost:5173
# Backend API: http://localhost:4000
```
