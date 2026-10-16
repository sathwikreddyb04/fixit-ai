import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { Express } from "express";

describe("FixIt AI REST API End-to-End Workflow", () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  it("GET /api/v1/health returns ok status and AI provider information", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.ai).toBeDefined();
    expect(res.body.ai.isDemo).toBe(true);
  });

  it("POST /api/v1/problems/analyze accepts text-only problem and returns structured analysis", async () => {
    const res = await request(app)
      .post("/api/v1/problems/analyze")
      .send({
        description: "I spilled hot black coffee on my white cotton shirt 10 minutes ago.",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const data = res.body.data;
    expect(data.problemId).toBeDefined();
    expect(data.schemaVersion).toBe("1.0.0");
    expect(data.reportedFacts.length).toBeGreaterThan(0);
    expect(data.followUpQuestions.length).toBeGreaterThan(0);
    expect(data.safetyAssessment.riskLevel).toBe("low");
    expect(data.isDemoMode).toBe(true);
  });

  it("POST /api/v1/problems/analyze rejects invalid image signature", async () => {
    const fakeTextFile = Buffer.from("Hello world, this is a plain text file");

    const res = await request(app)
      .post("/api/v1/problems/analyze")
      .field("description", "Coffee on white shirt")
      .attach("image", fakeTextFile, "test.jpg");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("Invalid file signature");
  });

  it("POST /api/v1/problems/analyze accepts valid JPEG image buffer", async () => {
    const validJpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48,
    ]);

    const res = await request(app)
      .post("/api/v1/problems/analyze")
      .field("description", "I got coffee on my cotton t-shirt")
      .attach("image", validJpegHeader, "coffee.jpg");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hasImage).toBe(true);
    expect(res.body.data.visibleObservations.length).toBeGreaterThan(0);
  });

  it("POST /api/v1/problems/analyze triggers immediate safety escalation for hazardous chemicals", async () => {
    const res = await request(app)
      .post("/api/v1/problems/analyze")
      .send({
        description: "Can I mix bleach and vinegar together to clean grease faster?",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const data = res.body.data;
    expect(data.safetyAssessment.escalationRequired).toBe(true);
    expect(data.safetyAssessment.riskLevel).toBe("critical");
    expect(data.safetyAssessment.emergencyGuidance).toBeDefined();
    expect(data.followUpQuestions.length).toBe(0); // Bypasses routine follow-up
  });

  it("Full multi-step session: analyze -> follow-up -> solution -> feedback -> troubleshooting", async () => {
    // Step 1: Analyze
    const analyzeRes = await request(app)
      .post("/api/v1/problems/analyze")
      .send({
        description: "Fresh mud on my canvas sneakers from the soccer field",
      });

    expect(analyzeRes.status).toBe(200);
    const problemId = analyzeRes.body.data.problemId;
    expect(problemId).toBeDefined();

    // Step 2: Answer follow-up
    const followUpRes = await request(app)
      .post(`/api/v1/problems/${problemId}/follow-up`)
      .send({
        answers: {
          shoe_material: "Canvas or Synthetic Mesh (e.g. running shoes)",
          mud_dryness: "Completely dried into crust",
        },
      });

    expect(followUpRes.status).toBe(200);
    expect(followUpRes.body.data.solution).toBeDefined();
    const solution = followUpRes.body.data.solution;
    expect(solution.steps.length).toBeGreaterThan(0);
    expect(solution.whatIsKnown.length).toBeGreaterThan(0);
    expect(solution.actionsToAvoid.length).toBeGreaterThan(0);

    // Step 3: Feedback (worked)
    const feedbackWorkedRes = await request(app)
      .post(`/api/v1/problems/${problemId}/feedback`)
      .send({
        problemId,
        outcome: "worked",
        whatWasTried: "Dry brushing the crust away and light soap wipe",
        outcomeDescription: "The mud flaked off cleanly without staining",
      });

    expect(feedbackWorkedRes.status).toBe(200);
    expect(feedbackWorkedRes.body.data.status).toBe("recorded");

    // Step 4: Feedback (did not work -> triggers troubleshooting adaptation)
    const feedbackTroubleRes = await request(app)
      .post(`/api/v1/problems/${problemId}/feedback`)
      .send({
        problemId,
        outcome: "did_not_work",
        whatWasTried: "Soapy water wipe",
        outcomeDescription: "A faint brown ring remains on the toe box",
        newObservations: "Mesh appears slightly discolored",
      });

    expect(feedbackTroubleRes.status).toBe(200);
    expect(feedbackTroubleRes.body.data.guidanceMessage).toBeDefined();
    expect(feedbackTroubleRes.body.data.reassessedSafety).toBeDefined();
  });
});
