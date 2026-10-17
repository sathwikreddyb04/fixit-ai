# FixIt AI 🔧

> **Understand the problem. Find the safe next step.**  
> *Everyday problems. Clearer, safer solutions.*

FixIt AI is a safety-first, multimodal assistance application designed for everyday household, dorm, and office care problems—such as coffee on washable clothing, mud on shoes, candle wax on finished furniture, ordinary dust and grease stains, and care label interpretation.

FixIt AI enforces **server-side safety controls**, separates **user facts** from **image observations** and **inferred uncertainties**, asks targeted follow-up questions only when they materially affect safety, and delivers ordered action steps with interactive checklist controls.

---

## Key Features

1. **Safety Before Convenience**:
   - Dedicated server-side `SafetyEngine` automatically intercepts hazardous chemicals (e.g. mixing bleach with ammonia or acids), electrical hazards, medical exposures, and structural damage.
   - Prohibits mixing cleaning chemicals under all circumstances.
2. **Strict Evidence Integrity**:
   - Transparent separation between **User-Reported Facts**, **Visible Observations** (only when an image was analyzed), and **Inferred Uncertainties**.
   - Never claims a photo proves an unknown chemical or guarantees 100% removal.
3. **Structured & Actionable Plans**:
   - Clear materials list, interactive checkable step-by-step procedures, spot-test warnings, and explicit **Actions to Avoid**.
4. **Session-Based Adaptation**:
   - If a solution does not work, users can submit feedback to receive a conservative secondary alternative without false claims of permanent model training.
5. **Multimodal AI with Honest Demo Mode**:
   - Automatically connects to **Google Gemini Multimodal AI** when `GEMINI_API_KEY` is provided in `.env`.
   - Runs in **Honest Deterministic Demo Mode** when credentials are absent, powered by a vetted scenario library. Never fabricates image analysis.
6. **Hackathon Mission Architecture**:
   - Modular central `MissionRegistry` ready to accept **5 unpredictable hackathon missions** with feature flags and zero risk to the core workflow.

---

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React icons.
- **Backend**: Node.js 20, Express 4, TypeScript, Zod schema validation, Multer with magic-byte signature validation, Helmet, CORS, and Express-Rate-Limit.
- **AI Engine**: Google Gemini Multimodal adapter (`gemini-1.5-flash`) + Deterministic Demo Adapter behind a provider-agnostic `AIServiceInterface`.
- **Testing**: Vitest + Supertest (46 automated tests covering the 10 core cleaning & safety scenarios, safety engine invariants, magic-byte upload validation, API workflows, mission registry, and adaptive troubleshooting).

---

## Project Structure

```text
Volt/
├── shared/                       # Shared contracts and versioned Zod schemas
│   └── src/
│       └── schemas/              # SafetyAssessment, SolutionPlan, EvidenceItem, MissionDefinition
├── server/                       # Node.js + Express backend service
│   ├── src/
│   │   ├── config/               # Environment & runtime configuration
│   │   ├── features/
│   │   │   ├── safety/           # Server-side safetyEngine & supportedScenarios
│   │   │   └── missions/         # Central MissionRegistry & contracts
│   │   ├── routes/               # REST API endpoints (/problems, /missions, /health)
│   │   ├── services/
│   │   │   ├── ai/               # AIServiceInterface, DemoAdapter, GeminiAdapter, AIFactory
│   │   │   └── session/          # In-memory session manager with TTL cleanup
│   │   ├── utils/                # Magic-byte file validation (JPEG, PNG, WebP)
│   │   ├── app.ts                # Express app setup
│   │   └── server.ts             # Server entrypoint
│   └── tests/                    # Vitest unit and integration test suite (46 tests)
├── client/                       # React + Vite frontend
│   └── src/
│       ├── components/           # Header, Footer, HowItWorksModal, MissionsDrawer, SafetyAlert
│       ├── features/
│       │   ├── problem-input/    # ProblemInputForm & SampleScenarios
│       │   ├── analysis/         # EvidenceView (Facts vs. Observations vs. Inferences)
│       │   ├── follow-up/        # FollowUpModal (targeted questions)
│       │   ├── solution/         # SolutionView with interactive checkboxes
│       │   └── feedback/         # TroubleshootingModal (session adaptation)
│       ├── services/             # Typed API client
│       └── App.tsx               # Main application container
├── docs/
│   ├── ARCHITECTURE.md           # System architecture, Mermaid diagrams, safety engine details
│   ├── ADDING_A_MISSION.md       # 10-step guide for adding hackathon missions
│   ├── DEMO_SCRIPT.md            # 3-minute repeatable live demo script and pitch narrative
│   └── DEPLOYMENT.md             # Production hosting, Docker containerization, and cloud setup
├── TEST_REPORT.md                # 10-scenario comprehensive verification test report
├── HACKATHON_SUBMISSION.md       # Full hackathon submission overview and jury talking points
├── .env.example                  # Documented environment variables template
├── .gitignore                    # Git ignore rules
└── README.md
```

---

## Quickstart

### Prerequisites
- Node.js `v18.0.0` or higher (`v20+` recommended)
- npm `v10+`

### 1. Install Dependencies
Run from the repository root:
```bash
npm install
```

### 2. Configure Environment (Optional)
Copy the example environment configuration:
```bash
cp .env.example .env
```

To enable live Google Gemini multimodal inference, set your API key in `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
AI_PROVIDER=gemini
```
*Note: If no API key is set, FixIt AI will automatically and honestly run in **Deterministic Demo Mode**.*

### 3. Start Development Servers
Start both backend (port 4000) and frontend (port 5173) concurrently:
```bash
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## Quality Gates & Testing

Run the automated test suite (46 unit and end-to-end tests covering all 10 scenarios):
```bash
npm test --workspace=server
```

Run TypeScript type checks and linting across all packages:
```bash
npm run lint
```

Build all packages for production:
```bash
npm run build
```

See **[`TEST_REPORT.md`](file:///c:/Users/sathw/OneDrive/Documents/Volt/TEST_REPORT.md)** for detailed evidence and observations across all 10 verified scenarios.

---

## REST API Overview

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/health` | `GET` | Health status, uptime, and active AI provider mode |
| `/api/v1/problems/analyze` | `POST` | Accepts text + optional image. Returns structured analysis |
| `/api/v1/problems/:id/follow-up` | `POST` | Submits targeted follow-up answers and returns solution plan |
| `/api/v1/problems/:id/solution` | `POST` | Generates solution plan directly if no follow-ups were needed |
| `/api/v1/problems/:id/feedback` | `POST` | Records feedback and generates session-adapted troubleshooting |
| `/api/v1/problems/:id/history` | `GET` | Retrieves recorded attempt and troubleshooting history |
| `/api/v1/problems/clear-session` | `POST` | Clears in-memory session cache |
| `/api/v1/missions` | `GET` | Lists all registered hackathon missions and status |
| `/api/v1/missions/:id/toggle` | `POST` | Enables or disables a mission feature flag |
| `/api/v1/missions/:id/execute` | `POST` | Executes an active, implemented mission handler |

---

## Screenshots

> *Add application screenshots below before submission:*

### 1. Hero & Problem Input with Sample Scenarios
*Screenshot showing brand header, input textarea, image upload dropzone, and sample scenario cards.*

### 2. Evidence Breakdown & Targeted Follow-Up
*Screenshot showing separation of User-Reported Facts, Image Observations, and Inferred Uncertainties.*

### 3. Structured Solution Plan with Interactive Checklists
*Screenshot showing step-by-step checklist, spot-test warning, materials list, and Actions to Avoid.*

### 4. Safety Escalation Circuit Breaker
*Screenshot showing red alert banner when bleach + ammonia or hazardous chemicals are detected.*

### 5. Hackathon Mission Registry
*Screenshot showing the Mission Drawer with the 5 unpredictable mission slots and Care Label test tool.*

---

## Adding a Hackathon Mission
See **[`docs/ADDING_A_MISSION.md`](file:///c:/Users/sathw/OneDrive/Documents/Volt/docs/ADDING_A_MISSION.md)** for the complete 10-step mission guide.

---

## Known Limitations & Safety Boundaries
- **No Infallibility Claim**: FixIt AI does not guarantee 100% stain removal; underlying fiber damage or dye fading may have already occurred.
- **In-Memory Privacy**: Problem sessions reset when the server restarts. No persistent tracking database is used.
- **Professional Referral**: Delicate fabrics (100% silk, fine wool, tailored suiting) and hazardous substances trigger clear instructions to halt DIY attempts and consult a qualified professional.
