# FixIt AI — 24-Hour Hackathon Demo Script & Presentation Narrative

This document provides a repeatable, 3-minute live demonstration script and presentation narrative for judging FixIt AI.

---

## 3-Minute Live Demo Walkthrough

### Setup
1. Start the application:
   ```bash
   npm run dev
   ```
2. Open the browser at `http://localhost:5173`.
3. Note the top right status badge: **"Honest Demo Mode"** (or **"AI Connected"** if `GEMINI_API_KEY` is present in `.env`).

---

### Step 1: Input & Scenario Selection (30 seconds)
1. On the home screen, click the sample card: **"Coffee on Cotton Shirt"**.
   - The description auto-populates: *"I spilled hot black coffee on my white cotton shirt about 15 minutes ago. It's still damp."*
2. Optional: Click the upload area and attach any sample JPG/PNG image.
3. Click **"Find a Safe Solution"**.

---

### Step 2: Evidence Separation & Follow-Up Questions (45 seconds)
1. Point to the **Evidence & Uncertainty Breakdown**:
   - Show how FixIt AI clearly distinguishes **User-Reported Facts** from **Visible Observations** and **Uncertain Inferences**.
   - Note the uncertainty explanation: chemical composition and dye stability cannot be proven by a photo alone.
2. FixIt AI identifies that specific material details are needed before prescribing a chemical flush.
3. In the **Follow-Up Questions** card:
   - Question 1 (*"What kind of fabric is the item made of?"*): Select **"Washable Cotton / Poly Blend"**.
   - Question 2 (*"Is the coffee stain fresh or dried?"*): Select **"Fresh (spilled within the last hour)"**.
4. Click **"Generate Safe Action Plan"**.

---

### Step 3: Verified Structured Solution (45 seconds)
1. Showcase the generated solution:
   - **Materials Needed**: Clean white towels, cold tap water, mild liquid detergent.
   - **Step-by-Step Procedure with Interactive Checkboxes**:
     - *Step 1*: Blot immediately — Do not rub.
     - *Step 2*: Flush from the reverse side with cold water (explains why reverse flush prevents driving pigment through fibers).
     - *Step 3*: Pre-treat with mild liquid detergent (tagged with **Spot Test Required**).
     - *Step 4*: Rinse thoroughly and inspect before drying.
   - Click the checkbox for Step 1 and Step 2 to demonstrate interactive completion tracking.
   - Highlight the **Actions to Avoid** section: *"DO NOT use hot water on fresh coffee"* and *"DO NOT place in clothes dryer until stain is gone"*.

---

### Step 4: Session-Based Adaptation & Troubleshooting (30 seconds)
1. Under *"How did this plan work for you?"*, click **"This did not work"**.
2. A troubleshooting modal opens:
   - What did you actually try? Enter: *"Flushed with cold water and mild dish soap"*.
   - What happened afterward? Enter: *"The dark coffee faded, but a faint yellowish tannin ring remains"*.
3. Click **"Submit & Adapt Plan"**.
4. Point to the **Session Adaptation Applied** banner:
   - FixIt AI adapts to a secondary conservative method: **"Dilute white vinegar soak (for persistent tannin rings)"** and **"Oxygen-based bleach soak"**.
   - Highlight that this is clearly disclosed as **session-based adaptation**, not false permanent model training.

---

### Step 5: Safety Intercept & Mission Registry Showcase (30 seconds)
1. Click **"Start Fresh"** in the top bar.
2. Click the sample scenario: **"Bleach & Ammonia Mix"** (*"Can I mix chlorine bleach with ammonia or vinegar to sanitize faster?"*).
3. Click **"Find a Safe Solution"**.
4. Immediately show the **Critical Safety Alert**:
   - Intercepted by server-side safety engine.
   - Warns about lethal chloramine/chlorine gas release.
   - Emergency guidance with Poison Control contact instructions.
5. Click the **"Missions (5)"** button in the header:
   - Show the Hackathon Mission Registry with the 5 unpredictable mission slots.
   - Select a symbol (e.g. `wash_cold`) in the Mission 1 test box and click **"Test Execute"** to prove modular execution.

---

## Hackathon Presentation Narrative (2 Minutes)

### 1. The Problem
"When people encounter everyday stains and spills in dorms, offices, and apartments, they search the internet and often get dangerous or surface-ruining advice—like mixing bleach with vinegar or scrubbing delicate wood with abrasives. Incorrect advice ruins belongings and creates hazardous chemical reactions."

### 2. The Solution: FixIt AI
"FixIt AI is built on four core principles:
1. **Safety First**: Server-enforced safety rules run before any advice is returned. Dangerous chemical combinations and electrical hazards are intercepted automatically.
2. **Evidence Integrity**: We never pretend an image confirms an unknown chemical. We strictly separate user-reported facts, image observations, and inferred uncertainties.
3. **Structured, Actionable Guidance**: Users get checkable, step-by-step procedures, spot-test warnings, and explicit 'Actions to Avoid'.
4. **Session Adaptation**: If a gentle step fails, the system adapts within the session to a conservative alternative without claiming false permanent learning."

### 3. Architecture & Hackathon Readiness
"FixIt AI is built with Node.js, Express, TypeScript, Zod, React, and Tailwind. When an API key is configured, it connects to Google Gemini Multimodal. When no key is provided, it operates in an honest, deterministic Demo Mode.

Most importantly for a 24-hour hackathon, we built a **Mission Registry and contract architecture**. As the hackathon organizers announce 5 unpredictable missions, each mission can be implemented as an isolated module, registered with feature flags, and tested without touching or breaking our core workflow."

### 4. Honest Scope & Limitations
- FixIt AI does not claim 100% stain removal certainty.
- It operates in-memory for session privacy and resets on server restart.
- It recommends consulting qualified professional cleaners for heirloom fabrics, silk, and dry-clean-only garments.
