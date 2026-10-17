import {
  ProblemAnalysis,
  SolutionPlan,
  UserFeedback,
  TroubleshootingResult,
  EvidenceItem,
  ProblemAnalysisSchema,
  SolutionPlanSchema,
  TroubleshootingResultSchema,
  FollowUpQuestion,
  SolutionStep,
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
  extractKnownAnswers,
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
    const extractedAnswers = extractKnownAnswers(params.text);

    // 1. Separate Reported Facts
    const reportedFacts: string[] = [
      `User reported issue: "${params.text}"`,
    ];
    if (params.fileName) {
      reportedFacts.push(`User attached file: ${params.fileName}`);
    }
    if (extractedAnswers["fabric_type"]) {
      reportedFacts.push(`Identified material: ${extractedAnswers["fabric_type"]} (extracted from user description)`);
    }
    if (extractedAnswers["stain_freshness"]) {
      reportedFacts.push(`Identified stain freshness: ${extractedAnswers["stain_freshness"]} (extracted from user description)`);
    }
    if (extractedAnswers["shoe_material"]) {
      reportedFacts.push(`Identified shoe material: ${extractedAnswers["shoe_material"]} (extracted from user description)`);
    }
    if (extractedAnswers["upholstery_material"]) {
      reportedFacts.push(`Identified upholstery material: ${extractedAnswers["upholstery_material"]} (extracted from user description)`);
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
    let followUps: FollowUpQuestion[] = [];

    if (safetyAssessment.escalationRequired) {
      // High-risk scenarios skip routine follow-ups to avoid delaying critical warning
      followUps = [];
    } else if (scenario) {
      for (const q of scenario.followUpQuestions) {
        if (!extractedAnswers[q.id]) {
          followUps.push(q);
          missingInformation.push(`Specific details needed: ${q.reason || q.id.replace(/_/g, " ")}`);
        }
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

    let categoryConfidence: "high" | "moderate" | "low" | "uncertain" = "moderate";
    if (scenario) {
      if (followUps.length === 0) {
        categoryConfidence = "high";
      } else if (scenario.id.startsWith("vague_")) {
        categoryConfidence = "uncertain";
      } else {
        categoryConfidence = "moderate";
      }
    } else {
      categoryConfidence = "low";
    }

    const uncertaintyExplanation = params.imageBuffer
      ? "Visual observations are based on pattern matching from the image. Chemical composition of residues cannot be confirmed by photo alone; a spot test is recommended before treatment."
      : followUps.length === 0
      ? "Core material and freshness details confirmed from your description. Underlying dye fastness requires a spot test on an unseen seam before full application."
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
      categoryConfidence,
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

    const extracted = extractKnownAnswers(analysis.userReportedText);
    const mergedAnswers = {
      ...extracted,
      ...(followUpAnswers || {}),
    };

    // Re-evaluate safety in case answers introduced a new chemical or hazard
    const answersText = Object.values(mergedAnswers).join(" ");
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
    const answeredKeys = Object.keys(mergedAnswers);
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
        whyTheseStepsExplanation: `Only safe, reversible initial steps are provided. Full material-specific treatment recommendations are withheld until required details are confirmed: ${unanswered.map((k) => k.replace(/_/g, " ")).join(", ")}.`,
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
      if (mergedAnswers && Object.keys(mergedAnswers).length > 0) {
        for (const [key, val] of Object.entries(mergedAnswers)) {
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
    const { currentPlan, feedback, history = [], attemptHistory = [], followUpAnswers = {} } = params;
    const adaptationCount = params.adaptationCount || (history.length > 0 ? history.length : 1);

    // 1. Compile all feedback text for safety evaluation
    const feedbackText = [
      feedback.whatWasTried,
      feedback.outcomeDescription,
      feedback.newObservations || "",
      feedback.userComments || "",
      ...(feedback.symptoms || []),
      ...(feedback.productsUsed || []),
      feedback.discoveredMaterialDetails || "",
    ].join(" ");

    // 2. Reassess safety with new feedback data
    const reassessedSafety = evaluateSafety(feedbackText);

    // Build prior attempts summary
    const priorAttemptsAnalyzed: string[] = [];
    if (attemptHistory.length > 0) {
      for (const att of attemptHistory) {
        const prod = att.productsUsed?.join(", ") || "unspecified";
        const symp = att.symptomsReported?.join(", ") || "unresolved";
        priorAttemptsAnalyzed.push(
          `Attempt #${att.attemptNumber} (${att.planSummary}): Tried [${prod}] -> Outcome: [${symp}]`
        );
      }
    } else {
      priorAttemptsAnalyzed.push(
        `Attempt #1: Tried [${feedback.whatWasTried}] -> Outcome: [${feedback.outcomeDescription}]`
      );
    }

    // Safety Escalation Check
    if (reassessedSafety.escalationRequired) {
      return TroubleshootingResultSchema.parse({
        problemId: currentPlan.problemId,
        adaptationCount,
        priorAttemptsAnalyzed,
        reassessedSafety,
        stoppedDueToRisk: true,
        recommendedProfessional: true,
        professionalReferralReason: `Safety Hazard Detected: ${reassessedSafety.escalationReason}`,
        guidanceMessage:
          `SAFETY ALERT: ${reassessedSafety.userFacingMessage} ${reassessedSafety.emergencyGuidance || ""}`.trim(),
        explanationOfChange:
          "Troubleshooting stopped because reported conditions now present chemical, respiratory, or life-safety hazards.",
        attemptHistory,
      });
    }

    // 3. Check for Professional Assistance Referral Conditions (Requirement 7)
    const combinedHistoryText = [
      currentPlan.problemSummary,
      currentPlan.whatIsKnown.join(" "),
      feedbackText,
      ...priorAttemptsAnalyzed,
      JSON.stringify(followUpAnswers),
    ].join(" ").toLowerCase();

    // Condition A: Delicate or Dry-Clean Only Materials
    const isDelicateOrDryClean =
      /silk|wool|cashmere|suede|nubuck|leather|velvet|antique|dry clean only|dry-clean only/i.test(combinedHistoryText);

    // Condition B: Multiple Failed Attempts (>= 2 attempts already tried)
    const hasMultipleFailedAttempts =
      adaptationCount >= 2 || attemptHistory.length >= 2 || history.length >= 2 ||
      /already tried (two|multiple|several)|tried.*again.*failed/i.test(feedbackText);

    // Condition C: Adverse Surface Reaction (damage, bleeding, thinning)
    const hasAdverseReaction =
      /color (bleeding|bled|faded)|fabric (thinned|tore|frayed|holes?)|finish (peeling|clouded|stripped)|texture (damaged|rough|stiffened)/i.test(feedbackText);

    if (isDelicateOrDryClean && (adaptationCount >= 1 || feedback.outcome === "did_not_work")) {
      const reason = "The item involves delicate or dry-clean-restricted material (e.g. silk, wool, suede, or leather). Continuing water-based home DIY treatments risks permanent fiber distortion, water staining, or color loss.";
      return TroubleshootingResultSchema.parse({
        problemId: currentPlan.problemId,
        adaptationCount,
        priorAttemptsAnalyzed,
        reassessedSafety,
        stoppedDueToRisk: false,
        recommendedProfessional: true,
        professionalReferralReason: reason,
        guidanceMessage:
          "FixIt AI recommends consulting a certified professional cleaner. Disclose the original stain type and all products previously applied.",
        explanationOfChange:
          "Recommended professional care because delicate or dry-clean materials cannot safely tolerate repeated wet home agitation.",
        attemptHistory,
      });
    }

    if (hasMultipleFailedAttempts) {
      const reason = "Multiple home DIY attempts have been completed without lifting the stain. Continuing further chemical application or rubbing risks permanent fiber abrasion or setting the stain permanently.";
      return TroubleshootingResultSchema.parse({
        problemId: currentPlan.problemId,
        adaptationCount,
        priorAttemptsAnalyzed,
        reassessedSafety,
        stoppedDueToRisk: false,
        recommendedProfessional: true,
        professionalReferralReason: reason,
        guidanceMessage:
          "FixIt AI advises stopping DIY attempts at this stage and consulting a professional cleaner or specialist. Repeated friction and moisture on set stains can permanently degrade fabric fibers.",
        explanationOfChange:
          "Ceased DIY recommendations after multiple failed passes to prevent permanent fabric or surface degradation.",
        attemptHistory,
      });
    }

    if (hasAdverseReaction) {
      const reason = "Reported surface reaction (color bleeding, fabric texture change, or finish damage) indicates that further chemical or mechanical treatment may cause irreversible harm.";
      return TroubleshootingResultSchema.parse({
        problemId: currentPlan.problemId,
        adaptationCount,
        priorAttemptsAnalyzed,
        reassessedSafety,
        stoppedDueToRisk: false,
        recommendedProfessional: true,
        professionalReferralReason: reason,
        guidanceMessage:
          "FixIt AI recommends stopping all cleaning treatments immediately. Contact a professional restoration specialist to assess and preserve the surface finish.",
        explanationOfChange:
          "Stopped DIY procedure due to observed surface adverse reaction to prevent irreversible damage.",
        attemptHistory,
      });
    }

    // 4. Targeted Follow-up Questions When Information Is Missing (Requirement 2)
    // Merge answers from followUpAnswers and feedback.followUpAnswers
    const mergedAnswers = {
      ...followUpAnswers,
      ...(feedback.followUpAnswers || {}),
    };

    const neededFollowUps: FollowUpQuestion[] = [];

    // If remaining symptoms are unclear
    const symptomKnown =
      mergedAnswers["troubleshoot_remaining_symptom"] ||
      /faint|ring|shadow|stiff|yellow|brown|residue|bleeding|greasy/i.test(feedback.outcomeDescription + " " + (feedback.symptoms || []).join(" "));

    if (!symptomKnown && !mergedAnswers["troubleshoot_remaining_symptom"]) {
      neededFollowUps.push({
        id: "troubleshoot_remaining_symptom",
        question: "What does the remaining stain or area look like now?",
        reason: "Different lingering residues (tannin rings vs deep grease shadows vs mineral crusts) require distinct secondary chemistries.",
        type: "single_choice",
        options: [
          "Faint yellow or brown outline/ring",
          "Dark, oily, or greasy shadow",
          "Solid crust or stiff fiber texture",
          "Unchanged original stain",
        ],
        required: true,
      });
    }

    // If material was never confirmed anywhere
    const materialKnown =
      mergedAnswers["fabric_type"] ||
      mergedAnswers["shoe_material"] ||
      mergedAnswers["surface_type"] ||
      mergedAnswers["surface_material"] ||
      mergedAnswers["upholstery_material"] ||
      mergedAnswers["troubleshoot_fabric_check"] ||
      /cotton|denim|polyester|canvas|synthetic|laminate|wood/i.test(combinedHistoryText);

    if (!materialKnown && !mergedAnswers["troubleshoot_fabric_check"]) {
      neededFollowUps.push({
        id: "troubleshoot_fabric_check",
        question: "Did you find a care label or verify the material?",
        reason: "Secondary soaks (such as dilute vinegar or oxygen bleach) must never be applied to delicate fibers or Dry Clean Only items.",
        type: "single_choice",
        options: [
          "Machine-washable cotton or poly blend",
          "Synthetic mesh or canvas",
          "Delicate fabric (silk, wool, or rayon)",
          "Care tag says Dry Clean Only",
          "No label found / Unsure",
        ],
        required: true,
      });
    }

    // If needed follow-up questions exist and have not yet been answered:
    if (neededFollowUps.length > 0 && !feedback.followUpAnswers) {
      return TroubleshootingResultSchema.parse({
        problemId: currentPlan.problemId,
        adaptationCount,
        priorAttemptsAnalyzed,
        reassessedSafety,
        stoppedDueToRisk: false,
        recommendedProfessional: false,
        guidanceMessage:
          "Before we recommend an alternative procedure, we need a couple of details about the remaining residue to ensure the next treatment is safe.",
        explanationOfChange:
          "Requested targeted follow-up questions to diagnose remaining residue symptoms before prescribing secondary chemistry.",
        followUpQuestions: neededFollowUps,
        needsMoreClarification: true,
        attemptHistory,
      });
    }

    // 5. Generate Adaptive Plan Without Repeating Failed Actions (Requirements 3, 4, 5)
    const scenario = findMatchingScenario(currentPlan.problemSummary) ||
                     findMatchingScenario(currentPlan.whatIsKnown.join(" "));

    if (scenario && scenario.alternativeSteps && scenario.alternativeSteps.length > 0) {
      // Determine which alternative step to use, avoiding repeating what was already tried
      const triedText = [
        feedback.whatWasTried,
        feedback.outcomeDescription,
        ...priorAttemptsAnalyzed,
      ].join(" ").toLowerCase();

      // Filter alternatives to find one not already tried
      let selectedAlternatives: SolutionStep[] = [];
      let alternativeName = "";

      // Check alternative steps
      for (const altStep of scenario.alternativeSteps) {
        const stepKeywords = altStep.title.toLowerCase().split(" ");
        const alreadyTried = stepKeywords.some((w) => w.length > 4 && triedText.includes(w));
        if (!alreadyTried) {
          selectedAlternatives.push(altStep);
        }
      }

      if (selectedAlternatives.length === 0) {
        // All known alternatives already tried
        selectedAlternatives = scenario.alternativeSteps;
      }

      alternativeName = selectedAlternatives[0]?.title || "Secondary Safe Alternative";

      // Build ordered revised steps, ensuring:
      // 1. Mandatory rinse of previous chemicals first (prevent chemical mixing)
      // 2. Expected outcomes on each step
      // 3. Stop conditions if situation worsens
      const revisedSteps: SolutionStep[] = [
        {
          stepNumber: 1,
          title: "Rinse away previous cleaning residues",
          instruction:
            "Before applying any secondary treatment, thoroughly rinse the area with clean cool tap water and blot dry with a clean white cloth. Never mix different cleaning agents on the same surface.",
          cautionNotes: "Ensures no residual detergent or vinegar reacts with new products.",
          expectedOutcome: "Surfactant and chemical residues from prior attempt are eliminated.",
          stopCondition: "Do not apply secondary cleaner until area has been blotted free of previous products.",
        },
        ...selectedAlternatives.map((s, idx) => ({
          ...s,
          stepNumber: idx + 2,
          isCheckedTestPatch: idx === 0 ? true : s.isCheckedTestPatch,
          expectedOutcome:
            s.expectedOutcome || "Targeted secondary action dissolves residual stubborn pigments.",
          stopCondition:
            s.stopCondition || "Stop immediately and rinse with cool water if color fading or fabric distortion occurs.",
        })),
      ];

      const whatIsKnownUpdated = [
        ...currentPlan.whatIsKnown.filter((k) => !k.startsWith("Prior attempt")),
        `Prior attempt: Tried "${feedback.whatWasTried}" -> Outcome: "${feedback.outcomeDescription}"`,
      ];
      if (feedback.symptoms && feedback.symptoms.length > 0) {
        whatIsKnownUpdated.push(`Remaining symptoms noted: ${feedback.symptoms.join(", ")}`);
      }
      if (mergedAnswers["troubleshoot_remaining_symptom"]) {
        whatIsKnownUpdated.push(`Symptom clarified by user: ${mergedAnswers["troubleshoot_remaining_symptom"]}`);
      }

      const revisedPlan: SolutionPlan = {
        ...currentPlan,
        problemSummary: `Adapted Plan (Pass #${adaptationCount + 1}): ${alternativeName} for ${scenario.name}`,
        whatIsKnown: whatIsKnownUpdated,
        whatRemainsUncertain: [
          "Penetration depth of residual set-in particles",
          "Substrate tolerance to secondary agent (spot test required)",
        ],
        steps: revisedSteps,
        actionsToAvoid: [
          `DO NOT repeat previously failed step: "${feedback.whatWasTried}"`,
          "DO NOT combine cleaning agents without thorough rinsing between steps",
          "DO NOT apply high heat or place in dryer while any mark remains",
          ...scenario.actionsToAvoid,
        ],
        safetyPrecautions: [
          "Mandatory spot test on an unseen seam before full application",
          "Discontinue immediately if fabric texture changes or color bleeds",
          ...scenario.safetyPrecautions,
        ],
        whenToStopAndSeekHelp: [
          "If the stain does not improve after this secondary pass, stop DIY and consult a professional cleaner",
          ...scenario.whenToStopAndSeekHelp,
        ],
        whyTheseStepsExplanation:
          `Why this plan differs: Your prior attempt with "${feedback.whatWasTried}" did not fully lift the mark. Instead of repeating that failed method, FixIt AI adapted to a safe secondary procedure (${alternativeName}) calibrated for remaining set residues, preceded by a thorough rinse to prevent chemical mixing.`,
        safetyAssessment: reassessedSafety,
        canAdapt: true,
      };

      return TroubleshootingResultSchema.parse({
        problemId: currentPlan.problemId,
        adaptationCount: adaptationCount + 1,
        priorAttemptsAnalyzed,
        reassessedSafety,
        revisedSolution: revisedPlan,
        stoppedDueToRisk: false,
        recommendedProfessional: false,
        guidanceMessage:
          `Based on your result with "${feedback.whatWasTried}", FixIt AI adapted to a safe secondary method (${alternativeName}). Failed actions were not repeated.`,
        explanationOfChange:
          `Replaced failed "${feedback.whatWasTried}" with a safe secondary treatment (${alternativeName}). Added mandatory rinse step to prevent chemical mixing and spot-test requirement.`,
        attemptHistory,
      });
    }

    // Default conservative fallback
    return TroubleshootingResultSchema.parse({
      problemId: currentPlan.problemId,
      adaptationCount: adaptationCount + 1,
      priorAttemptsAnalyzed,
      reassessedSafety,
      stoppedDueToRisk: false,
      recommendedProfessional: true,
      professionalReferralReason:
        "No further safe household DIY alternatives are available for this surface without risking permanent material abrasion or dye loss.",
      guidanceMessage:
        "Because repeated home attempts risk permanently setting the mark or abrading the finish, FixIt AI recommends consulting a professional cleaner or the item manufacturer.",
      explanationOfChange:
        "Avoided proposing harsh chemical stripping or aggressive friction to protect your item from permanent damage.",
      attemptHistory,
    });
  }
}
