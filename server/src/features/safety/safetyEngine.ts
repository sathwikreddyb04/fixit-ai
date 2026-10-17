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
      /bleach.*(ammonia|vinegar|acid|alcohol|windex|drain|toilet|rubbing alcohol|isopropanol|peroxide)/i,
      /(ammonia|vinegar|acid|alcohol|windex|drain|toilet|rubbing alcohol|isopropanol|peroxide).*bleach/i,
      /mix(ing)?.*(cleaner|chemical|bleach|detergent|acid|ammonia|vinegar)/i,
      /bleach.*(other cleaner|another cleaner|unknown cleaner|cleaner|product|chemical|substance)/i,
      /(mix|combining|combine).*bleach/i,
      /bleach.*(mix|combining|combine)/i,
      /hydrogen peroxide.*(vinegar|bleach)/i,
      /(vinegar|bleach).*hydrogen peroxide/i,
      /drain cleaner.*(bleach|ammonia|acid|cleaner)/i,
      /muriatic acid|hydrochloric acid.*(bleach|cleaner)/i,
      /toxic fumes|chemical fumes|noxious (fumes|odor)|chlorine gas|mustard gas|fizzing and (smoking|fuming)/i,
    ],
    riskLevel: "critical",
    userFacingMessage:
      "DANGER: Mixing household cleaning chemicals (especially combining bleach with ammonia, vinegar, rubbing alcohol, acids, or any unknown cleaner) can produce toxic, lethal chlorine, chloramine, or chloroform gas. Never mix bleach with another cleaner or unknown cleaning product.",
    emergencyGuidance:
      "Immediately stop. Do not mix these chemicals or experiment with chemical combinations. If exposure, chemical mixing, or dangerous fumes have occurred, prioritize leaving the affected area immediately when safe. Avoid further contact with the chemicals. Contact local emergency services (911 / 112) or Poison Control (US: 1-800-222-1222) immediately for medical and safety assistance. Do not return to the area until thoroughly ventilated by professionals.",
    permittedActions: [
      "Read and strictly follow individual manufacturer product-label instructions and safety directions on each cleaning container",
      "Use only a single cleaning product at a time according to its label directions, with thorough water rinsing between separate cleaning steps",
      "Leave and evacuate the affected area immediately when safe to do so if fumes, vapors, or chemical reactions occur",
      "Avoid further contact with the chemicals or contaminated area",
      "Call Poison Control (US: 1-800-222-1222) or Emergency Services (911 / 112) immediately if exposed or experiencing symptoms",
      "Ventilate the area from a safe exterior location only if safe to do so",
    ],
    prohibitedActions: [
      "DO NOT mix bleach with any other cleaning product, chemical, detergent, or unknown substance",
      "NEVER experiment with chemical combinations or homemade chemical mixtures to treat stains",
      "DO NOT attempt cleanup actions (such as mopping, wiping, or neutralizing) that could increase your exposure if fumes or chemical reactions are present",
      "DO NOT remain in a room with chemical fumes, vapors, or strong odors",
      "DO NOT add hot water, acids, or dish soaps to bleach solutions",
    ],
    escalationReason: "Potentially lethal gas hazard from mixing bleach with another chemical cleaner.",
  },
  {
    id: "cooking_grease_fire_hazard",
    category: "Grease & Oil Fire Hazard",
    patterns: [
      /grease fire|oil fire|burning oil|pan.*(caught fire|on fire)|oil.*(caught fire|on fire)/i,
      /(fire|flames).*stove/i,
      /water.*(grease fire|burning oil|hot oil)/i,
    ],
    riskLevel: "critical",
    userFacingMessage:
      "CRITICAL FIRE SAFETY ALERT: Burning cooking oil or grease fires must NEVER be treated with water.",
    emergencyGuidance:
      "NEVER throw water on a grease fire (water instantly vaporizes, exploding oil into a massive fireball). Turn off the heat source if safe. Carefully slide a metal lid or baking sheet over the pan to smother flames, or use a certified Class B or K fire extinguisher. If fire spreads, evacuate immediately and call 911 / 112.",
    permittedActions: [
      "Turn off the heat source ONLY if you can reach it safely",
      "Slide a metal lid or cookie sheet over the pan to smother flames",
      "Use a Class B or K dry chemical or fire extinguisher",
      "Evacuate immediately and call emergency services if flames escape the pan",
    ],
    prohibitedActions: [
      "NEVER throw water or wet towels on a grease or oil fire (causes explosive fireball)",
      "DO NOT move or carry a burning pan (spills burning liquid)",
      "DO NOT use flour or baking powder (flour is combustible)",
    ],
    escalationReason: "Imminent danger of explosive fire spread from cooking oil combustion.",
  },
  {
    id: "electrical_fire_hazard",
    category: "Electrical & Fire Hazard",
    patterns: [
      /electrical.*(fire|spark|smoke|water|outlet|cord|burning|smell|wire)/i,
      /(burning|burnt|smoke|spark|fire).*electrical/i,
      /(spark|smoke|fire|burning).*outlet/i,
      /water.*(outlet|panel|breaker|fuse|socket|appliance)/i,
      /burnt.*smell.*(outlet|wall|drywall)/i,
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
      /unconscious|fainted|difficulty breathing|shortness of breath|dizzy.*(fumes|chemical|odor)|coughing.*(fumes|chemical)/i,
      /burning eyes|eyes? (are )?burning|throat (is )?burning|lungs? (are )?burning/i,
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
      /black mo[u]?ld/i,
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
 * Analyzes raw user text, any visible image observations, and model-proposed plan steps
 * to ensure zero dangerous instructions escape.
 */
export function evaluateSafety(
  text: string,
  proposedActions?: string[],
  imageObservations?: string[]
): SafetyAssessment {
  const combinedText = [
    text,
    ...(proposedActions || []),
    ...(imageObservations || []),
  ].join(" ");

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
      "Perform an inconspicuous spot test on a hidden seam first",
      "Use mild, material-appropriate cleaning agents",
      "Work in a well-lit, ventilated space",
      "Blot gently from perimeter inward rather than rubbing aggressively",
    ],
    prohibitedActions: [
      "Never mix different cleaning products or chemicals together",
      "Do not apply excessive heat to protein-based stains (e.g. blood, milk)",
      "Do not scrub delicate fabrics or varnished surfaces aggressively",
    ],
    escalationRequired: false,
    escalationReason: null,
  };
}

/**
 * Sanitizes or validates a generated solution plan against safety rules.
 * If model output mentions prohibited actions (like mixing bleach, using water on grease fires,
 * or applying water to electrical outlets), it flags violations to trigger circuit breakers.
 */
export function sanitizeProposedPlan(
  assessment: SafetyAssessment,
  proposedSteps: string[]
): { isSafe: boolean; violations: string[] } {
  const violations: string[] = [];
  const combined = proposedSteps.join(" ");

  // Prohibit incompatible chemical combinations
  if (
    /bleach.*(ammonia|vinegar|acid|alcohol|rubbing alcohol|isopropanol|peroxide|drain|toilet)/i.test(combined) ||
    /(ammonia|vinegar|acid|alcohol|rubbing alcohol|isopropanol|peroxide|drain|toilet).*bleach/i.test(combined)
  ) {
    violations.push("Model output recommended mixing bleach with incompatible chemicals.");
  }

  // Prohibit generic mixing of multiple cleaners
  if (/(mix|combine|blend)\s+(together\s+)?(two|multiple|different)?\s*(cleaners|chemicals|solutions|bleach|detergents)/i.test(combined)) {
    violations.push("Model output recommended combining multiple cleaning products.");
  }

  // Prohibit water on grease / oil fires
  if (/(throw|pour|use|apply|spray)\s+water.*(grease|oil|pan|stove\s+fire)/i.test(combined)) {
    violations.push("Model output recommended applying water to a grease or oil fire.");
  }

  // Prohibit water on live electrical equipment
  if (/(throw|pour|use|apply|spray)\s+(water|wet)\s+.*(outlet|breaker|socket|live\s+wire)/i.test(combined)) {
    violations.push("Model output recommended water on electrical outlet or equipment.");
  }

  // Prohibit excessively harsh or corrosive chemical escalation
  if (/(muriatic acid|hydrochloric acid|pure bleach|pure ammonia|caustic soda|drain cleaner)\s+(on|for|to)/i.test(combined)) {
    violations.push("Model output recommended unsafe corrosive chemical escalation.");
  }

  // Prohibit damaging abrasives on delicate surfaces
  if (/(steel wool|wire brush|scouring pad|razor blade|sandpaper)\s+(on|to)\s+(wood|varnish|acrylic|delicate|silk|wool|leather|furniture)/i.test(combined)) {
    violations.push("Model output recommended damaging abrasive escalation on delicate surface.");
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
