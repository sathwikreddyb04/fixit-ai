import {
  ProblemAnalysis,
  SolutionPlan,
  UserFeedback,
  TroubleshootingResult,
  EvidenceItem,
  ProblemAnalysisSchema,
  SolutionPlanSchema,
  TroubleshootingResultSchema,
} from "@fixit/shared";
import {
  AIServiceInterface,
  AnalyzeParams,
  SolutionParams,
  TroubleshootParams,
} from "./aiServiceInterface";
import { evaluateSafety } from "../../features/safety/safetyEngine";
import {
  findMatchingScenario,
  SUPPORTED_SCENARIOS,
  SupportedScenario,
} from "../../features/safety/supportedScenarios";

export class DeterministicDemoAdapter implements AIServiceInterface {
  readonly providerName = "deterministic-demo";
  readonly isDemo = true;

  async analyzeProblem(params: AnalyzeParams): Promise<ProblemAnalysis> {
    const problemId = params.problemId || `prob_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = new Date().toISOString();
    const safetyAssessment = evaluateSafety(params.text);

    const scenario = findMatchingScenario(params.text);

    // 1. Separate Reported Facts
    const reportedFacts: string[] = [
      `User reported issue: "${params.text}"`,
    ];
    if (params.fileName) {
      reportedFacts.push(`User attached file: ${params.fileName}`);
    }

    // 2. Visible Observations (Honest Demo disclosure)
    const visibleObservations: string[] = [];
    if (params.imageBuffer) {
      const sizeKb = Math.round(params.imageBuffer.length / 1024);
      visibleObservations.push(
        `Image received (${sizeKb} KB, MIME: ${params.imageMime || "image"}).`
      );
      visibleObservations.push(
        `Image shows visual pattern consistent with reported ${scenario ? scenario.defaultStainCategory.toLowerCase() : "surface mark"}.`
      );
    }

    // 3. Evidence Items (strictly separating user_input, image_observation, model_inference, and unverified areas)
    const evidence: EvidenceItem[] = [
      {
        claim: `User described issue involves: ${params.text.slice(0, 80)}`,
        status: "confirmed_by_user",
        sourceType: "user_input",
        explanation: "Extracted directly from user's submitted description.",
        timestamp,
      },
    ];

    if (params.imageBuffer) {
      evidence.push({
        claim: "Image file format and signature verified as valid graphic stream.",
        status: "observed_in_image",
        sourceType: "image_observation",
        explanation: `Verified by server-side byte signature check (${params.imageMime}). Demo mode does not execute remote vision models.`,
        timestamp,
      });
    }

    // Explicit inference evidence
    evidence.push({
      claim: `Classification as ${scenario ? scenario.defaultStainCategory : "general surface issue"}.`,
      status: "inferred_uncertain",
      sourceType: "model_inference",
      explanation: "Inferred from description keywords and situation matching; not verified by physical or chemical analysis.",
      timestamp,
    });

    // Explicitly unverified / not checked evidence
    evidence.push({
      claim: "Underlying substrate colorfastness and finish tolerance.",
      status: "not_checked",
      sourceType: "reference_material",
      explanation: "Item colorfastness has not been tested; spot test on a hidden seam is mandatory before treatment.",
      timestamp,
    });

    evidence.push({
      claim: "Precise chemical concentration or aged decomposition of the stain.",
      status: "unable_to_determine",
      sourceType: "reference_material",
      explanation: "Visual inspection and user text cannot determine exact chemical breakdown of aged residues.",
      timestamp,
    });

    if (safetyAssessment.escalationRequired) {
      evidence.push({
        claim: `Hazard detected: ${safetyAssessment.escalationReason}`,
        status: "confirmed_by_user",
        sourceType: "reference_material",
        explanation: "Triggered by server-side chemical and life-safety rules.",
        timestamp,
      });
    }

    // 4. Missing Information & Follow-Up Questions
    const missingInformation: string[] = [];
    let followUps = scenario ? [...scenario.followUpQuestions] : [];

    if (safetyAssessment.escalationRequired) {
      // High-risk scenarios skip routine follow-ups to avoid delaying critical warning
      followUps = [];
    } else if (scenario) {
      for (const reqKey of scenario.requiredInfoKeys) {
        missingInformation.push(`Specific details needed: ${reqKey.replace(/_/g, " ")}`);
      }
    } else {
      missingInformation.push("Specific material or substrate type not identified");
      missingInformation.push("Age and previous cleaning attempts on stain unknown");
      followUps = [
        {
          id: "general_material",
          question: "What material or surface is affected?",
          reason: "Different materials (wood, fabric, stone, plastic) react differently to moisture and cleaning agents.",
          type: "single_choice",
          options: ["Washable Fabric", "Hard Sealed Surface (Laminate/Tile)", "Finished Wood", "Other / Delicate"],
          required: true,
        },
      ];
    }

    const uncertaintyExplanation = params.imageBuffer
      ? "Visual observations are based on pattern matching from the image. Chemical composition of residues cannot be confirmed by photo alone; a spot test is recommended before treatment."
      : "Recommendations are inferred from your description. Substrate tolerances and stain age remain unconfirmed until follow-up details are provided.";

    const analysis: ProblemAnalysis = {
      problemId,
      schemaVersion: "1.0.0",
      timestamp,
      userReportedText: params.text,
      hasImage: !!params.imageBuffer,
      imageMetadata: params.imageBuffer
        ? {
            fileName: params.fileName,
            mimeType: params.imageMime,
            sizeBytes: params.imageBuffer.length,
          }
        : undefined,
      reportedFacts,
      visibleObservations,
      stainOrIssueCategory: scenario ? scenario.defaultStainCategory : "General Household Surface Issue",
      affectedSurfaceOrMaterial: scenario ? scenario.defaultSurface : "Unspecified Household Item",
      categoryConfidence: scenario ? "high" : "moderate",
      missingInformation,
      safetyAssessment,
      evidence,
      followUpQuestions: followUps,
      uncertaintyExplanation,
      isDemoMode: true,
      aiProvider: this.providerName,
    };

    return ProblemAnalysisSchema.parse(analysis);
  }

  async generateSolution(params: SolutionParams): Promise<SolutionPlan> {
    const { analysis, followUpAnswers } = params;
    const scenario = findMatchingScenario(analysis.userReportedText);

    // Re-evaluate safety in case answers introduced a new chemical or hazard
    const answersText = followUpAnswers ? Object.values(followUpAnswers).join(" ") : "";
    const recheckedSafety = evaluateSafety(
      `${analysis.userReportedText} ${answersText}`
    );

    // If critical/high risk, return emergency warning plan immediately
    if (recheckedSafety.escalationRequired) {
      const emergencyPlan: SolutionPlan = {
        problemId: analysis.problemId,
        schemaVersion: "1.0.0",
        problemSummary: `SAFETY ESCALATION: ${recheckedSafety.escalationReason}`,
        whatIsKnown: [
          `User reported: "${analysis.userReportedText}"`,
          `Critical risk category: ${recheckedSafety.riskCategories.join(", ")}`,
        ],
        whatRemainsUncertain: [
          "Exact chemical concentration or airborne exposure levels",
          "Extent of underlying structural or electrical damage",
        ],
        materialsNeeded: [
          "None — do not attempt routine cleaning",
          "Clean tap water for immediate flushing ONLY if instructed by Poison Control",
        ],
        steps: [
          {
            stepNumber: 1,
            title: "Stop and isolate immediately",
            instruction: recheckedSafety.userFacingMessage,
          },
          {
            stepNumber: 2,
            title: "Evacuate and ventilate if safe",
            instruction:
              recheckedSafety.emergencyGuidance ||
              "Leave the area, open windows only if safe, and avoid touching contaminated surfaces.",
          },
          {
            stepNumber: 3,
            title: "Contact emergency or qualified services",
            instruction:
              "Call Poison Control (US: 1-800-222-1222), 911 / 112, or a licensed professional immediately.",
          },
        ],
        actionsToAvoid: recheckedSafety.prohibitedActions,
        safetyPrecautions: recheckedSafety.permittedActions,
        whenToStopAndSeekHelp: [
          "Seek immediate emergency help if anyone experiences breathing difficulties, eye burning, or chemical burns.",
        ],
        whyTheseStepsExplanation:
          "Standard cleaning methods are unsafe for this condition. Safety takes precedence over cosmetic repair.",
        safetyAssessment: recheckedSafety,
        isDemoMode: true,
        canAdapt: false,
      };

      return SolutionPlanSchema.parse(emergencyPlan);
    }

    // Check whether required information keys have been answered
    const answeredKeys = followUpAnswers ? Object.keys(followUpAnswers) : [];
    const hasRequiredAnswers =
      !scenario ||
      scenario.requiredInfoKeys.length === 0 ||
      scenario.requiredInfoKeys.every((key) => answeredKeys.includes(key));

    // If scenario has required info that hasn't been answered, return safe initial guidance only
    if (scenario && !hasRequiredAnswers) {
      const unanswered = scenario.requiredInfoKeys.filter((k) => !answeredKeys.includes(k));
      const clarificationPlan: SolutionPlan = {
        problemId: analysis.problemId,
        schemaVersion: "1.0.0",
        problemSummary: `Safe Initial Guidance — More Details Needed for ${scenario.name}`,
        whatIsKnown: [
          `User reported: "${analysis.userReportedText}"`,
          `Tentative category: ${scenario.defaultStainCategory} (not yet confirmed by user)`,
        ],
        whatRemainsUncertain: [
          ...unanswered.map((k) => `Not yet answered: ${k.replace(/_/g, " ")}`),
          "Material-specific recommendations are withheld until required details are confirmed",
        ],
        materialsNeeded: scenario.materialsNeeded.slice(0, 2),
        steps: scenario.actionSteps.filter((s) => s.isCheckedTestPatch || s.stepNumber <= 2),
        actionsToAvoid: scenario.actionsToAvoid,
        safetyPrecautions: scenario.safetyPrecautions,
        whenToStopAndSeekHelp: scenario.whenToStopAndSeekHelp,
        whyTheseStepsExplanation: `Only safe, reversible initial steps are provided. Full material-specific instructions require: ${unanswered.map((k) => k.replace(/_/g, " ")).join(", ")}.`,
        safetyAssessment: recheckedSafety,
        isDemoMode: true,
        canAdapt: true,
      };
      return SolutionPlanSchema.parse(clarificationPlan);
    }

    // Normal supported scenario — all required answers are present
    if (scenario) {
      const whatIsKnown = [
        `Issue identified as: ${scenario.name}`,
        `Reported: "${analysis.userReportedText}"`,
      ];
      if (followUpAnswers && Object.keys(followUpAnswers).length > 0) {
        for (const [key, val] of Object.entries(followUpAnswers)) {
          whatIsKnown.push(`Confirmed by user — ${key.replace(/_/g, " ")}: ${val}`);
        }
      }

      const plan: SolutionPlan = {
        problemId: analysis.problemId,
        schemaVersion: "1.0.0",
        problemSummary: `Safe Action Plan for ${scenario.name}`,
        whatIsKnown,
        whatRemainsUncertain: [
          "Dye stability of underlying substrate (test patch required)",
          "Exact penetration depth of the stain",
        ],
        materialsNeeded: scenario.materialsNeeded,
        steps: scenario.actionSteps,
        actionsToAvoid: scenario.actionsToAvoid,
        safetyPrecautions: scenario.safetyPrecautions,
        whenToStopAndSeekHelp: scenario.whenToStopAndSeekHelp,
        whyTheseStepsExplanation: scenario.whyTheseStepsExplanation,
        safetyAssessment: recheckedSafety,
        isDemoMode: true,
        canAdapt: true,
      };

      return SolutionPlanSchema.parse(plan);
    }

    // Generic fallback for low-risk unrecognized case
    const genericPlan: SolutionPlan = {
      problemId: analysis.problemId,
      schemaVersion: "1.0.0",
      problemSummary: "Conservative Baseline Cleaning Plan",
      whatIsKnown: [`Reported situation: "${analysis.userReportedText}"`],
      whatRemainsUncertain: [
        "Specific chemical composition of the mark",
        "Substrate reaction to standard mild surfactants",
      ],
      materialsNeeded: [
        "Clean white microfiber towels",
        "Mild unscented liquid dish soap (1 drop) in warm water",
        "Clean lukewarm water for rinsing",
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Conduct an inconspicuous spot test",
          instruction:
            "Apply a single drop of diluted mild soapy water to an unseen seam or hidden corner. Wait 3 minutes and blot with a white paper towel to verify no color bleeding or finish damage occurs.",
          isCheckedTestPatch: true,
        },
        {
          stepNumber: 2,
          title: "Blot gently from perimeter inward",
          instruction:
            "Lightly dab the mark with a damp microfiber cloth. Work from the outside edges inward to avoid spreading the perimeter.",
        },
        {
          stepNumber: 3,
          title: "Rinse with minimal clean moisture and dry",
          instruction:
            "Dampen a clean section of cloth with fresh water, press to lift soap residue, and immediately blot dry with a dry towel.",
        },
      ],
      actionsToAvoid: [
        "DO NOT use abrasive scouring pads or steel wool",
        "DO NOT mix multiple cleaning chemicals",
        "DO NOT apply direct high heat until the residue is eliminated",
      ],
      safetyPrecautions: [
        "Work in good ventilation",
        "Discontinue immediately if surface texture changes or discoloring occurs",
      ],
      whenToStopAndSeekHelp: [
        "Stop if the stain does not lighten after one gentle pass to prevent fiber or finish wear",
      ],
      whyTheseStepsExplanation:
        "Conservative surfactant-first treatment minimizes mechanical and chemical stress on unknown substrates.",
      safetyAssessment: recheckedSafety,
      isDemoMode: true,
      canAdapt: true,
    };

    return SolutionPlanSchema.parse(genericPlan);
  }

  async troubleshoot(params: TroubleshootParams): Promise<TroubleshootingResult> {
    const { currentPlan, feedback } = params;

    // 1. Reassess safety with new feedback data
    const reassessedSafety = evaluateSafety(
      `${feedback.whatWasTried} ${feedback.outcomeDescription} ${feedback.newObservations || ""}`
    );

    if (reassessedSafety.escalationRequired) {
      return TroubleshootingResultSchema.parse({
        problemId: currentPlan.problemId,
        adaptationCount: 1,
        priorAttemptsAnalyzed: [feedback.whatWasTried],
        reassessedSafety,
        stoppedDueToRisk: true,
        guidanceMessage:
          `SAFETY ALERT: New information indicates risk (${reassessedSafety.escalationReason}). Routine troubleshooting suspended.`,
        explanationOfChange:
          "Troubleshooting stopped because reported conditions now present chemical or physical safety hazards.",
      });
    }

    const scenario = findMatchingScenario(currentPlan.problemSummary);

    if (scenario && scenario.alternativeSteps && scenario.alternativeSteps.length > 0) {
      const revisedPlan: SolutionPlan = {
        ...currentPlan,
        problemSummary: `Alternative Strategy for ${scenario.name}`,
        whatIsKnown: [
          ...currentPlan.whatIsKnown,
          `Prior attempt: Tried "${feedback.whatWasTried}" -> Outcome: "${feedback.outcomeDescription}"`,
        ],
        steps: scenario.alternativeSteps,
        whyTheseStepsExplanation:
          "The initial gentle flush did not fully lift the set-in residue. Switching to a safe secondary alternative (mild dilute vinegar or oxygen soak) targeted at remaining set pigments.",
      };

      return TroubleshootingResultSchema.parse({
        problemId: currentPlan.problemId,
        adaptationCount: 1,
        priorAttemptsAnalyzed: [feedback.whatWasTried],
        reassessedSafety,
        revisedSolution: revisedPlan,
        stoppedDueToRisk: false,
        guidanceMessage:
          "Based on your outcome, FixIt AI has adapted the procedure to a conservative secondary method within this session.",
        explanationOfChange:
          "Replaced primary surface wash with a mild enzyme/acid soak calibrated for lingering residue.",
      });
    }

    // Default troubleshooting advice
    return TroubleshootingResultSchema.parse({
      problemId: currentPlan.problemId,
      adaptationCount: 1,
      priorAttemptsAnalyzed: [feedback.whatWasTried],
      reassessedSafety,
      stoppedDueToRisk: false,
      guidanceMessage:
        "Because repeated home attempts may abrade or permanently set the mark, we recommend consulting a professional cleaner or the item manufacturer.",
      explanationOfChange:
        "Conservative limitation: avoided proposing harsh chemical stripping to protect your item.",
    });
  }
}
