import { describe, it, expect } from "vitest";
import { evaluateSafety, sanitizeProposedPlan } from "../src/features/safety/safetyEngine";

describe("Safety Engine — Server-Side Enforcement", () => {
  it("allows standard low-risk household cleaning problems", () => {
    const assessment = evaluateSafety("I spilled some coffee on my cotton t-shirt");
    expect(assessment.riskLevel).toBe("low");
    expect(assessment.escalationRequired).toBe(false);
    expect(assessment.permittedActions.length).toBeGreaterThan(0);
    expect(assessment.prohibitedActions).toContain("Never mix different cleaning products together");
  });

  it("intercepts hazardous chemical mixing (bleach + ammonia)", () => {
    const assessment = evaluateSafety("Can I mix bleach and ammonia to get the stains out faster?");
    expect(assessment.riskLevel).toBe("critical");
    expect(assessment.escalationRequired).toBe(true);
    expect(assessment.riskCategories).toContain("Chemical Reaction Hazard");
    expect(assessment.userFacingMessage).toContain("DANGER: Mixing household cleaning chemicals");
    expect(assessment.emergencyGuidance).toBeDefined();
  });

  it("intercepts hazardous chemical mixing (bleach + vinegar)", () => {
    const assessment = evaluateSafety("I poured vinegar then bleach onto the bathroom mold");
    expect(assessment.riskLevel).toBe("critical");
    expect(assessment.escalationRequired).toBe(true);
  });

  it("intercepts electrical fire hazards", () => {
    const assessment = evaluateSafety("There are sparks and smoke coming from my wall outlet after water splashed it");
    expect(assessment.riskLevel).toBe("critical");
    expect(assessment.escalationRequired).toBe(true);
    expect(assessment.riskCategories).toContain("Electrical & Fire Hazard");
    expect(assessment.prohibitedActions).toContain("DO NOT apply water or wet cloths to electrical outlets or appliances");
  });

  it("intercepts acute medical and chemical exposure emergencies", () => {
    const assessment = evaluateSafety("Drain cleaner splashed into my roommate's eyes and burned skin");
    expect(assessment.riskLevel).toBe("critical");
    expect(assessment.escalationRequired).toBe(true);
    expect(assessment.riskCategories).toContain("Medical & Chemical Exposure");
    expect(assessment.emergencyGuidance).toContain("Poison Control");
  });

  it("intercepts structural hazards and gas leaks", () => {
    const assessment = evaluateSafety("The ceiling is bowing and sagging with water pouring through");
    expect(assessment.riskLevel).toBe("critical");
    expect(assessment.escalationRequired).toBe(true);
    expect(assessment.riskCategories).toContain("Structural Safety");
  });

  it("sanitizes and rejects model outputs that attempt to propose mixing bleach", () => {
    const assessment = evaluateSafety("I want to clean a dirty floor");
    const dangerousSteps = [
      "Mix bleach and ammonia in a bucket with warm water.",
      "Mop the floor thoroughly.",
    ];
    const sanitization = sanitizeProposedPlan(assessment, dangerousSteps);
    expect(sanitization.isSafe).toBe(false);
    expect(sanitization.violations.length).toBeGreaterThan(0);
    expect(sanitization.violations[0]).toContain("mixing incompatible chemicals");
  });
});
