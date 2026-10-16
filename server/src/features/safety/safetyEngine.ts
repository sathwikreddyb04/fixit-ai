import { SafetyAssessment } from "@fixit/shared";

interface SafetyRule {
  id: string;
  category: string;
  patterns: RegExp[];
  riskLevel: "critical" | "high" | "moderate";
  userFacingMessage: string;
  emergencyGuidance: string;
  permittedActions: string[];
  prohibitedActions: string[];
  escalationReason: string;
}

const SAFETY_RULES: SafetyRule[] = [
  {
    id: "chemical_mixing_hazard",
    category: "Chemical Reaction Hazard",
    patterns: [
      /bleach.*(ammonia|vinegar|acid|alcohol|windex|drain)/i,
      /(ammonia|vinegar|acid|alcohol).*bleach/i,
      /mix(ing)?.*(cleaner|chemical|bleach|detergent|acid)/i,
      /hydrogen peroxide.*vinegar/i,
      /drain cleaner.*(bleach|ammonia|acid)/i,
    ],
    riskLevel: "critical",
    userFacingMessage:
      "DANGER: Mixing household cleaning chemicals (especially bleach with ammonia, acids, or vinegar) can release toxic, lethal chlorine or chloramine gas.",
    emergencyGuidance:
      "Immediately stop. Do not mix these chemicals. If fumes are present, evacuate the room and open windows only if safe. If anyone feels dizziness, burning eyes, or difficulty breathing, call local emergency services or Poison Help immediately.",
    permittedActions: [
      "Evacuate room immediately if fumes or strong odor are present",
      "Ventilate the area only if safe to do so",
      "Call Poison Control or Emergency Services if exposed",
    ],
    prohibitedActions: [
      "DO NOT mix cleaning chemicals or solutions",
      "DO NOT remain in a poorly ventilated room with chemical fumes",
      "DO NOT add hot water or other chemicals to the mixture",
    ],
    escalationReason: "Potentially lethal gas hazard from incompatible chemical combination.",
  },
  {
    id: "electrical_fire_hazard",
    category: "Electrical & Fire Hazard",
    patterns: [
      /electrical.*(fire|spark|smoke|water|outlet|cord|burning)/i,
      /(spark|smoke|fire|burning).*outlet/i,
      /water.*(outlet|panel|breaker|fuse|socket|appliance)/i,
      /burnt.*smell.*outlet/i,
      /exposed wire/i,
    ],
    riskLevel: "critical",
    userFacingMessage:
      "CRITICAL SAFETY ALERT: Potential electrical fire or electrocution hazard detected.",
    emergencyGuidance:
      "Do NOT use water on electrical equipment or outlets. Turn off power at the main circuit breaker only if safe and dry to reach. If you see active smoke, fire, or continuous sparks, evacuate immediately and call emergency services (911 / 112).",
    permittedActions: [
      "Evacuate occupants safely",
      "Turn off the main electrical breaker ONLY if it is dry and safe to do so",
      "Call emergency services or a licensed electrician",
    ],
    prohibitedActions: [
      "DO NOT apply water or wet cloths to electrical outlets or appliances",
      "DO NOT touch wet electrical cords or submerged devices",
      "DO NOT attempt DIY electrical repair while energized",
    ],
    escalationReason: "Imminent danger of electrocution or electrical fire.",
  },
  {
    id: "medical_injury_hazard",
    category: "Medical & Chemical Exposure",
    patterns: [
      /chemical.*(in eye|swallow|ingest|burned skin|burn)/i,
      /(swallowed|ingested|drank).*(cleaner|detergent|bleach|soap|chemical)/i,
      /(splash|spill).*(in eye|eyes)/i,
      /severe.*(burn|wound|bleeding|pain|rash)/i,
      /unconscious|fainted|difficulty breathing/i,
    ],
    riskLevel: "critical",
    userFacingMessage:
      "MEDICAL EMERGENCY HAZARD: Direct chemical exposure, ingestion, or bodily injury reported.",
    emergencyGuidance:
      "Seek medical attention immediately. For eye or skin exposure, gently rinse with clean lukewarm tap water for at least 15 minutes while contacting Poison Control (US: 1-800-222-1222) or your local emergency emergency number.",
    permittedActions: [
      "Rinse eyes or skin with gentle lukewarm water for 15 minutes",
      "Have product container or label ready for medical personnel",
      "Contact emergency services or regional poison control immediately",
    ],
    prohibitedActions: [
      "DO NOT induce vomiting unless specifically instructed by poison control",
      "DO NOT neutralize acids with bases or vice versa on skin or eyes",
      "DO NOT delay medical evaluation",
    ],
    escalationReason: "Acute chemical exposure or physical injury requiring immediate medical triage.",
  },
  {
    id: "toxic_unknown_hazardous_substances",
    category: "Hazardous Materials",
    patterns: [
      /battery acid|mercury|asbestos|lead paint|pesticide|insecticide|radiator fluid|antifreeze/i,
      /black mold.*(widespread|entire wall|air duct)/i,
      /unknown.*(toxic|corrosive|radioactive|fuming)/i,
    ],
    riskLevel: "high",
    userFacingMessage:
      "HIGH-RISK SUBSTANCE: Handling hazardous, corrosive, or heavy metal substances requires specialized containment.",
    emergencyGuidance:
      "Do not attempt ordinary household cleaning. Isolate the area, keep children and pets away, and contact a certified hazardous materials or environmental remediation specialist.",
    permittedActions: [
      "Isolate the affected area",
      "Keep children and pets away",
      "Ventilate if safe without spreading dust or spores",
      "Contact licensed hazardous materials disposal or remediation services",
    ],
    prohibitedActions: [
      "DO NOT vacuum asbestos, mercury, or hazardous dry powders (spreads contamination)",
      "DO NOT touch corrosive battery acid with bare hands",
      "DO NOT dispose of toxic chemicals down the household drain",
    ],
    escalationReason: "Regulated or hazardous material exceeding household cleaning safety thresholds.",
  },
  {
    id: "structural_collapse_hazard",
    category: "Structural Safety",
    patterns: [
      /ceiling.*(sagging|bowing|collapsing|water pouring)/i,
      /crack(ed)?.*(foundation|load bearing|beam|support)/i,
      /wall.*buckling/i,
      /gas leak|smell.*natural gas|rotten egg smell/i,
    ],
    riskLevel: "critical",
    userFacingMessage:
      "STRUCTURAL / LIFE SAFETY WARNING: Possible structural collapse or gas leak detected.",
    emergencyGuidance:
      "Evacuate the structure immediately. If natural gas is suspected (rotten egg odor), do not flip light switches or use phones inside. Call the gas utility or emergency services from outside.",
    permittedActions: [
      "Evacuate the building immediately",
      "Call emergency services or utility from a safe distance outside",
      "Contact a licensed structural engineer",
    ],
    prohibitedActions: [
      "DO NOT stand under sagging or waterlogged ceilings",
      "DO NOT use light switches or open flames if gas odor is present",
      "DO NOT attempt DIY structural propping",
    ],
    escalationReason: "Life safety hazard due to potential collapse or gas explosion.",
  },
];

/**
 * Server-enforced safety analysis.
 * Analyzes raw user text and any model-proposed plan to ensure zero dangerous instructions escape.
 */
export function evaluateSafety(text: string, proposedActions?: string[]): SafetyAssessment {
  const combinedText = [text, ...(proposedActions || [])].join(" ");

  for (const rule of SAFETY_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(combinedText)) {
        return {
          riskLevel: rule.riskLevel,
          riskCategories: [rule.category],
          userFacingMessage: rule.userFacingMessage,
          permittedActions: rule.permittedActions,
          prohibitedActions: rule.prohibitedActions,
          escalationRequired: true,
          escalationReason: rule.escalationReason,
          emergencyGuidance: rule.emergencyGuidance,
        };
      }
    }
  }

  // Universal baseline safety precautions for standard household tasks
  return {
    riskLevel: "low",
    riskCategories: ["Standard Household Care"],
    userFacingMessage:
      "Standard household scenario within low-risk care guidelines. Always perform an inconspicuous spot test first.",
    permittedActions: [
      "Perform a spot test in a hidden area",
      "Use mild, material-appropriate cleaning agents",
      "Work in a well-lit, ventilated space",
      "Blot gently rather than rubbing aggressively",
    ],
    prohibitedActions: [
      "Never mix different cleaning products together",
      "Do not apply excessive heat to protein-based stains (e.g. blood, milk)",
      "Do not scrub delicate fabrics aggressively",
    ],
    escalationRequired: false,
    escalationReason: null,
  };
}

/**
 * Sanitizes or validates a generated solution plan against safety rules.
 * If model output mentions prohibited actions (like mixing bleach or using heat dangerously),
 * it flags or strips them.
 */
export function sanitizeProposedPlan(
  assessment: SafetyAssessment,
  proposedSteps: string[]
): { isSafe: boolean; violations: string[] } {
  const violations: string[] = [];
  const combined = proposedSteps.join(" ").toLowerCase();

  if (
    (combined.includes("bleach") && combined.includes("ammonia")) ||
    (combined.includes("bleach") && combined.includes("vinegar"))
  ) {
    violations.push("Model output recommended mixing incompatible chemicals.");
  }

  if (assessment.escalationRequired && proposedSteps.length > 0) {
    violations.push(
      `Plan generated routine cleaning steps for high-risk situation: ${assessment.escalationReason}`
    );
  }

  return {
    isSafe: violations.length === 0,
    violations,
  };
}
