import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { Express } from "express";

describe("Mission Registry & Contract Architecture", () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  it("GET /api/v1/missions returns the registered hackathon missions", async () => {
    const res = await request(app).get("/api/v1/missions");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(5);

    const careLabels = res.body.data.find((m: any) => m.id === "care_label_symbols");
    expect(careLabels).toBeDefined();
    expect(careLabels.status).toBe("implemented");
  });

  it("Executes implemented and enabled mission handler", async () => {
    const res = await request(app)
      .post("/api/v1/missions/care_label_symbols/execute")
      .send({ symbolCode: "wash_cold" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.interpretation).toContain("Machine wash at max 30°C");
  });

  it("Rejects execution of planned or disabled mission", async () => {
    // eco_friendly_recipes is status: "planned" and enabled: false
    const res = await request(app)
      .post("/api/v1/missions/eco_friendly_recipes/execute")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("not currently active or enabled");
  });

  it("Toggling mission status disables execution", async () => {
    // Disable care_label_symbols
    const toggleRes = await request(app)
      .post("/api/v1/missions/care_label_symbols/toggle")
      .send({ enabled: false });

    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.mission.enabled).toBe(false);

    // Execution should now be rejected
    const execRes = await request(app)
      .post("/api/v1/missions/care_label_symbols/execute")
      .send({ symbolCode: "wash_cold" });

    expect(execRes.status).toBe(400);
    expect(execRes.body.success).toBe(false);

    // Re-enable for subsequent usage
    await request(app)
      .post("/api/v1/missions/care_label_symbols/toggle")
      .send({ enabled: true });
  });
});
