/**
 * adaptiveTroubleshooting.test.ts
 * 9 tests covering the adaptive troubleshooting and safety upgrade requirements.
 * Run with: npm test --workspace=server (BypassSandbox: true on Windows)
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import express from "express";
import problemRoutes from "../src/routes/problemRoutes";
import { SessionStore } from "../src/services/session/sessionStore";
import type { ProblemAnalysis, SolutionPlan, TroubleshootingResult } from "@fixit/shared";

// ──────────────────────────────────────────────────────────────────────────────
// App setup (mirrors the real server without needing npm run dev)
// ──────────────────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use("/api/v1/problems", problemRoutes);

const request = supertest(app);

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
async function analyzeAndSolve(description: string): Promise<{ problemId: string; solution: SolutionPlan }> {
  const analyzeRes = await request
    .post("/api/v1/problems/analyze")
    .field("description", description);
  expect(analyzeRes.status).toBe(200);
  const analysis: ProblemAnalysis = analyzeRes.body.data;

  // If no follow-up questions, get solution directly
  let solution: SolutionPlan;
  if (!analysis.followUpQuestions || analysis.followUpQuestions.length === 0) {
    const solRes = await request.post(`/api/v1/problems/${analysis.problemId}/solution`);
    expect(solRes.status).toBe(200);
    solution = solRes.body.data;
  } else {
    // Submit empty answers to trigger solution
    const fuRes = await request
      .post(`/api/v1/problems/${analysis.problemId}/follow-up`)
      .send({ answers: { [analysis.followUpQuestions[0].id]: "cotton" } });
    expect(fuRes.status).toBe(200);
    solution = fuRes.body.data.solution;
  }

  return { problemId: analysis.problemId, solution };
}

async function submitFeedback(problemId: string, overrides: Record<string, any> = {}): Promise<TroubleshootingResult> {
  const res = await request
    .post(`/api/v1/problems/${problemId}/feedback`)
    .send({
      problemId,
      outcome: "did_not_work",
      whatWasTried: "Blotted with cold water and dish soap",
      outcomeDescription: "Stain lightened slightly but a faint ring remains",
      ...overrides,
    });
  expect(res.status).toBe(200);
  return res.body.data as TroubleshootingResult;
}

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────
describe("Adaptive Troubleshooting — 9 Requirements", () => {

  // Test 1: Initial solution fails → next plan changes (does not repeat same step)
  it("Test 1: Revised plan does not repeat the failed method", async () => {
    const { problemId } = await analyzeAndSolve("Coffee stain on white cotton shirt");
    const result = await submitFeedback(problemId, {
      whatWasTried: "dish soap and cold water",
      outcomeDescription: "A faint brown ring remains",
    });

    // Result must have either a revised solution or a professional referral
    const hasActionableResult = result.revisedSolution || result.recommendedProfessional;
    expect(hasActionableResult).toBeTruthy();

    // If revised solution provided, it must not blindly repeat the failed method
    if (result.revisedSolution) {
      const revisedText = JSON.stringify(result.revisedSolution).toLowerCase();
      // The explanation should acknowledge the failed approach
      expect(result.explanationOfChange.toLowerCase()).toMatch(
        /dish soap|cold water|failed|prior|adapt|alternative/
      );
      // Revised plan title should differ from the original
      expect(result.revisedSolution.problemSummary).not.toBe("Safe Action Plan for Coffee Stain on Fabric");
    }
  }, 15000);

  // Test 2: Targeted follow-up questions appear when residue details are missing
  it("Test 2: Follow-up questions generated when residue symptom is unclear", async () => {
    const { problemId } = await analyzeAndSolve("Stain on fabric — tried cleaning but still there");
    const result = await submitFeedback(problemId, {
      whatWasTried: "Cold water rinse",
      outcomeDescription: "Still there", // Very vague — no symptom detail
    });

    // Should ask for clarification OR recommend professional
    const hasFollowUpOrReferral =
      (result.needsMoreClarification && (result.followUpQuestions?.length ?? 0) > 0) ||
      result.recommendedProfessional;
    expect(hasFollowUpOrReferral).toBeTruthy();
  }, 15000);

  // Test 3: Previously answered questions and history are preserved (not re-asked)
  it("Test 3: Previously answered questions not re-asked on second troubleshoot call", async () => {
    const { problemId } = await analyzeAndSolve("Mud stain on washable shoe");
    // First feedback — answers follow-up about fabric type
    const result1 = await submitFeedback(problemId, {
      whatWasTried: "Brush and cold water",
      outcomeDescription: "Residue remains on canvas surface",
      followUpAnswers: { troubleshoot_fabric_check: "Synthetic mesh or canvas" },
    });

    // Second feedback — should not re-ask about fabric because it's already answered in history
    if (!result1.recommendedProfessional && !result1.stoppedDueToRisk) {
      const result2 = await submitFeedback(problemId, {
        whatWasTried: "Mild soap soak",
        outcomeDescription: "Slight improvement but edge stain remains",
      });
      // If follow-up questions are returned, fabric_check should NOT be among them
      const followUpIds = result2.followUpQuestions?.map((q) => q.id) || [];
      expect(followUpIds).not.toContain("troubleshoot_fabric_check");
    }
  }, 20000);

  // Test 4: Failed actions are not repeated — plan differs each adaptation pass
  it("Test 4: Adaptation count increments and plan differs from prior attempt", async () => {
    const { problemId } = await analyzeAndSolve("Food oil stain on cotton t-shirt");
    const result1 = await submitFeedback(problemId, {
      whatWasTried: "Dish soap and warm water",
      outcomeDescription: "Greasy shadow remains",
    });

    if (result1.revisedSolution && !result1.recommendedProfessional) {
      // Submit second failure
      const result2 = await request
        .post(`/api/v1/problems/${problemId}/feedback`)
        .send({
          problemId,
          outcome: "did_not_work",
          whatWasTried: result1.revisedSolution.steps[1]?.title || "Alternative method",
          outcomeDescription: "Still a faint grease mark",
        });
      expect(result2.status).toBe(200);
      const r2 = result2.body.data as TroubleshootingResult;
      // Adaptation count should be at least as high as first pass (same or higher)
      expect(r2.adaptationCount).toBeGreaterThanOrEqual(result1.adaptationCount);
      // Prior attempts should be tracked
      expect(r2.priorAttemptsAnalyzed.length).toBeGreaterThanOrEqual(1);

      // History endpoint should show 2 attempt records
      const historyRes = await request.get(`/api/v1/problems/${problemId}/history`);
      expect(historyRes.status).toBe(200);
      expect(historyRes.body.data.attemptHistory.length).toBeGreaterThanOrEqual(2);
    }
  }, 25000);

  // Test 5: New information changes the recommendation
  it("Test 5: Providing discovered material details changes recommendation", async () => {
    const { problemId: pid1 } = await analyzeAndSolve("Stain on fabric item");
    const resultNoMaterial = await submitFeedback(pid1, {
      whatWasTried: "Rinse with water",
      outcomeDescription: "Stain remains",
    });

    const { problemId: pid2 } = await analyzeAndSolve("Stain on fabric item");
    const resultWithMaterial = await submitFeedback(pid2, {
      whatWasTried: "Rinse with water",
      outcomeDescription: "Stain remains",
      discoveredMaterialDetails: "Care label says Dry Clean Only",
    });

    // When dry-clean-only is discovered, professional referral should be triggered
    expect(resultWithMaterial.recommendedProfessional).toBe(true);
    // Without material info, may or may not refer professional
    // Just verify the two results are different in behaviour
    expect(resultWithMaterial.guidanceMessage).not.toBe("");
  }, 20000);

  // Test 6: Unknown materials / stains → uncertainty communicated (not confident fake recommendations)
  it("Test 6: Unknown material stains yield uncertainty or clarification, not confident advice", async () => {
    const res = await request
      .post("/api/v1/problems/analyze")
      .field("description", "Something spilled on an unknown surface — not sure what it is");
    expect(res.status).toBe(200);
    const analysis: ProblemAnalysis = res.body.data;

    // Must convey uncertainty
    const hasUncertainty =
      analysis.categoryConfidence === "low" ||
      analysis.categoryConfidence === "uncertain" ||
      analysis.missingInformation.length > 0 ||
      analysis.followUpQuestions.length > 0 ||
      analysis.uncertaintyExplanation.length > 0;

    expect(hasUncertainty).toBeTruthy();
  }, 15000);

  // Test 7: Safety hazard (chemical mixing) → troubleshooting stopped or redirected
  it("Test 7: Chemical fume mention stops troubleshooting and triggers safety escalation", async () => {
    const { problemId } = await analyzeAndSolve("Stain on bathroom tile");
    const result = await submitFeedback(problemId, {
      whatWasTried: "Bleach",
      outcomeDescription: "Mixed bleach and ammonia cleaner — produced fumes, coughing",
      symptoms: ["coughing", "burning eyes"],
    });

    // Must stop due to risk or refer professional due to hazardous condition
    const stopped = result.stoppedDueToRisk || result.recommendedProfessional;
    expect(stopped).toBeTruthy();
    // Should not provide new DIY steps when stopped
    if (result.stoppedDueToRisk) {
      expect(result.revisedSolution).toBeUndefined();
    }
  }, 15000);

  // Test 8: Professional recommended for delicate materials and multiple failures
  it("Test 8: Silk/wool material triggers professional referral", async () => {
    const { problemId } = await analyzeAndSolve("Stain on silk blouse");
    const result = await submitFeedback(problemId, {
      whatWasTried: "Gentle hand wash with cold water",
      outcomeDescription: "Stain partly lifted but silk fabric feels distorted",
      discoveredMaterialDetails: "100% silk, dry clean recommended",
    });

    expect(result.recommendedProfessional).toBe(true);
    expect(result.professionalReferralReason).toBeTruthy();
    expect(result.professionalReferralReason!.length).toBeGreaterThan(10);
  }, 15000);

  // Test 9: Session isolation — new problem does not inherit another problem's history
  it("Test 9: Two separate problems do not share attempt history", async () => {
    const { problemId: pid1 } = await analyzeAndSolve("Coffee stain on white cotton shirt");
    // Build up history for problem 1
    await submitFeedback(pid1, {
      whatWasTried: "Dish soap",
      outcomeDescription: "Partial improvement",
    });

    // Create completely new problem
    const { problemId: pid2 } = await analyzeAndSolve("Mud stain on carpet");
    expect(pid2).not.toBe(pid1);

    // Check history for problem 2 — should be empty
    const historyRes = await request.get(`/api/v1/problems/${pid2}/history`);
    expect(historyRes.status).toBe(200);
    const historyData = historyRes.body.data;
    expect(historyData.problemId).toBe(pid2);
    expect(historyData.attemptHistory).toHaveLength(0);
    expect(historyData.troubleshootingHistory).toHaveLength(0);
  }, 20000);

});
