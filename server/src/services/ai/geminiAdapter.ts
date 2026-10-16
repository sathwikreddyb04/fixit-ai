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
import { evaluateSafety, sanitizeProposedPlan } from "../../features/safety/safetyEngine";

export class GeminiMultimodalAdapter implements AIServiceInterface {
  readonly providerName = "google-gemini";
  readonly isDemo = false;
  private apiKey: string;
  private modelName = "gemini-1.5-flash";

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim() === "") {
      throw new Error("GEMINI_API_KEY is required to initialize GeminiMultimodalAdapter.");
    }
    this.apiKey = apiKey.trim();
  }

  private async callGemini(contents: any[], systemInstruction?: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent`;

    const body: any = {
      contents,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2, // low temperature for conservative, safety-focused consistency
      },
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    let response: globalThis.Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        signal: AbortSignal.timeout(20000), // 20s timeout
        body: JSON.stringify(body),
      });
    } catch (netErr: any) {
      if (netErr.name === "TimeoutError") {
        throw new Error("AI provider request timed out after 20 seconds. Please check your connection.");
      }
      throw new Error(`AI provider network failure: ${netErr.message || "Unable to reach service."}`);
    }

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("AI provider rate limit exceeded (HTTP 429). Please wait a moment and try again.");
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error("AI provider authentication failed (HTTP 401/403). Please verify your GEMINI_API_KEY.");
      }
      const errText = await response.text();
      // Safely trim and truncate error text to prevent secret reflection
      const safeSnippet = errText.slice(0, 200).replace(this.apiKey, "[REDACTED]");
      throw new Error(`Gemini API error (HTTP ${response.status}): ${safeSnippet}`);
    }

    const json = (await response.json()) as any;
    const textOutput = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textOutput) {
      throw new Error("Gemini returned an empty candidate response.");
    }

    return textOutput;
  }

  async analyzeProblem(params: AnalyzeParams): Promise<ProblemAnalysis> {
    const problemId = params.problemId || `prob_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = new Date().toISOString();

    // 1. First run the server safety check on the raw user input
    const initialSafety = evaluateSafety(params.text);

    // Build multimodal prompt
    const parts: any[] = [];
    if (params.imageBuffer) {
      parts.push({
        inlineData: {
          mimeType: params.imageMime || "image/jpeg",
          data: params.imageBuffer.toString("base64"),
        },
      });
    }

    const promptText = `
Analyze this household care/stain situation.
User text: "${params.text}"
Has attached image: ${!!params.imageBuffer}

CRITICAL RULES:
1. Clearly separate:
   - reportedFacts: facts stated by the user
   - visibleObservations: physical colors, marks, textures seen in the image (if no image, leave empty)
   - uncertainInferences: chemical makeup or set status that cannot be confirmed
2. Never claim an image alone confirms an unknown chemical.
3. If critical information (e.g. fabric type, fresh vs dried, prior attempts) is needed to give a safe recommendation, include 1-2 concise followUpQuestions.
4. Output MUST be valid JSON adhering strictly to this schema:
{
  "reportedFacts": string[],
  "visibleObservations": string[],
  "stainOrIssueCategory": string,
  "affectedSurfaceOrMaterial": string,
  "categoryConfidence": "high" | "moderate" | "low" | "uncertain",
  "missingInformation": string[],
  "followUpQuestions": [
    {
      "id": string,
      "question": string,
      "reason": string,
      "type": "single_choice" | "text",
      "options": string[],
      "required": boolean
    }
  ],
  "uncertaintyExplanation": string
}
`;
    parts.push({ text: promptText });

    const systemInstruction =
      "You are FixIt AI's multimodal problem analysis engine. Prioritize user safety and material preservation. Never encourage hazardous chemical mixing.";

    const rawResponse = await this.callGemini(
      [{ role: "user", parts }],
      systemInstruction
    );

    let parsed: any;
    try {
      parsed = JSON.parse(rawResponse);
    } catch {
      throw new Error("Failed to parse Gemini model response as structured JSON.");
    }

    // Server-enforce safety on model output text
    const combinedOutputText = [
      params.text,
      ...(parsed.reportedFacts || []),
      parsed.stainOrIssueCategory || "",
    ].join(" ");
    const finalSafety = evaluateSafety(
      combinedOutputText,
      undefined,
      parsed.visibleObservations
    );

    // Build evidence items
    const evidence: EvidenceItem[] = [
      {
        claim: `User stated: ${params.text.slice(0, 100)}`,
        status: "confirmed_by_user",
        sourceType: "user_input",
        explanation: "Supplied directly by user in prompt.",
        timestamp,
      },
    ];

    if (params.imageBuffer && parsed.visibleObservations?.length > 0) {
      evidence.push({
        claim: `Image visual observation: ${parsed.visibleObservations[0]}`,
        status: "observed_in_image",
        sourceType: "image_observation",
        explanation: "Extracted via Gemini Multimodal Vision inspection.",
        timestamp,
      });
    }

    evidence.push({
      claim: `Classification as ${parsed.stainOrIssueCategory || "general stain"}.`,
      status: "inferred_uncertain",
      sourceType: "model_inference",
      explanation: "Inferred from Gemini multimodal vision and language analysis; not confirmed by laboratory analysis.",
      timestamp,
    });

    evidence.push({
      claim: "Substrate dye colorfastness under wet treatment.",
      status: "not_checked",
      sourceType: "reference_material",
      explanation: "Fabric dye stability has not been checked; spot test required before proceeding.",
      timestamp,
    });

    evidence.push({
      claim: "Exact chemical purity or concentration of substance.",
      status: "unable_to_determine",
      sourceType: "reference_material",
      explanation: "Cannot determine chemical concentration or internal fabric absorption from photography alone.",
      timestamp,
    });

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
      reportedFacts: parsed.reportedFacts || [params.text],
      visibleObservations: parsed.visibleObservations || [],
      stainOrIssueCategory: parsed.stainOrIssueCategory || "General Stain",
      affectedSurfaceOrMaterial: parsed.affectedSurfaceOrMaterial || "General Surface",
      categoryConfidence: parsed.categoryConfidence || "moderate",
      missingInformation: parsed.missingInformation || [],
      safetyAssessment: finalSafety.escalationRequired ? finalSafety : initialSafety,
      evidence,
      followUpQuestions: finalSafety.escalationRequired ? [] : parsed.followUpQuestions || [],
      uncertaintyExplanation:
        parsed.uncertaintyExplanation ||
        "Analysis derived from Gemini multimodal inferences; always verify on an unseen seam.",
      isDemoMode: false,
      aiProvider: this.providerName,
    };

    return ProblemAnalysisSchema.parse(analysis);
  }

  async generateSolution(params: SolutionParams): Promise<SolutionPlan> {
    const { analysis, followUpAnswers } = params;

    const answersText = followUpAnswers
      ? Object.entries(followUpAnswers)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")
      : "None provided";

    // Server-side safety re-check
    const currentSafety = evaluateSafety(
      `${analysis.userReportedText} ${answersText}`
    );

    if (currentSafety.escalationRequired) {
      // Server-side emergency circuit breaker
      return SolutionPlanSchema.parse({
        problemId: analysis.problemId,
        schemaVersion: "1.0.0",
        problemSummary: `CRITICAL SAFETY ALERT: ${currentSafety.escalationReason}`,
        whatIsKnown: [`User reported: ${analysis.userReportedText}`],
        whatRemainsUncertain: ["Hazardous substance contamination level"],
        materialsNeeded: ["None — do not attempt routine cleaning"],
        steps: [
          {
            stepNumber: 1,
            title: "Cease action and evacuate/isolate area",
            instruction: currentSafety.userFacingMessage,
          },
        ],
        actionsToAvoid: currentSafety.prohibitedActions,
        safetyPrecautions: currentSafety.permittedActions,
        whenToStopAndSeekHelp: [
          "Contact local emergency services or Poison Control immediately.",
        ],
        whyTheseStepsExplanation:
          "Server-side safety rules intercepted hazardous conditions.",
        safetyAssessment: currentSafety,
        isDemoMode: false,
        canAdapt: false,
      });
    }

    const promptText = `
Create a conservative, ordered action plan for:
Problem: ${analysis.userReportedText}
Category: ${analysis.stainOrIssueCategory}
Surface: ${analysis.affectedSurfaceOrMaterial}
User follow-up answers: ${answersText}

SAFETY RULES:
- Never suggest mixing cleaning products (especially bleach with ammonia or acids).
- Always include a spot test step first.
- Mention when to stop and consult a professional.

Output JSON matching this schema:
{
  "problemSummary": string,
  "whatIsKnown": string[],
  "whatRemainsUncertain": string[],
  "materialsNeeded": string[],
  "steps": [
    {
      "stepNumber": number,
      "title": string,
      "instruction": string,
      "cautionNotes": string,
      "isCheckedTestPatch": boolean
    }
  ],
  "actionsToAvoid": string[],
  "safetyPrecautions": string[],
  "whenToStopAndSeekHelp": string[],
  "whyTheseStepsExplanation": string
}
`;

    const rawResponse = await this.callGemini([
      { role: "user", parts: [{ text: promptText }] },
    ]);

    const parsed = JSON.parse(rawResponse);

    // Run server-side plan sanitizer
    const stepInstructions = (parsed.steps || []).map(
      (s: any) => `${s.title} ${s.instruction}`
    );
    const sanitization = sanitizeProposedPlan(currentSafety, stepInstructions);

    if (!sanitization.isSafe) {
      throw new Error(
        `Safety engine rejected model solution: ${sanitization.violations.join("; ")}`
      );
    }

    const solution: SolutionPlan = {
      problemId: analysis.problemId,
      schemaVersion: "1.0.0",
      problemSummary: parsed.problemSummary || "Action Plan",
      whatIsKnown: parsed.whatIsKnown || [analysis.userReportedText],
      whatRemainsUncertain: parsed.whatRemainsUncertain || [],
      materialsNeeded: parsed.materialsNeeded || [],
      steps: parsed.steps || [],
      actionsToAvoid: [
        ...(parsed.actionsToAvoid || []),
        ...currentSafety.prohibitedActions,
      ],
      safetyPrecautions: [
        ...(parsed.safetyPrecautions || []),
        ...currentSafety.permittedActions,
      ],
      whenToStopAndSeekHelp: parsed.whenToStopAndSeekHelp || [],
      whyTheseStepsExplanation: parsed.whyTheseStepsExplanation || "",
      safetyAssessment: currentSafety,
      isDemoMode: false,
      canAdapt: true,
    };

    return SolutionPlanSchema.parse(solution);
  }

  async troubleshoot(params: TroubleshootParams): Promise<TroubleshootingResult> {
    const {
      currentPlan,
      feedback,
      history = [],
      attemptHistory = [],
      followUpAnswers = {},
      adaptationCount: passedAdaptationCount,
    } = params;

    const adaptationCount = passedAdaptationCount ?? (history.length + 1);

    // Build safety check text including new symptoms and products
    const safetyCheckText = [
      feedback.whatWasTried,
      feedback.outcomeDescription,
      feedback.newObservations || "",
      feedback.userComments || "",
      ...(feedback.symptoms || []),
      ...(feedback.productsUsed || []),
    ].join(" ");

    const safetyCheck = evaluateSafety(safetyCheckText);

    if (safetyCheck.escalationRequired) {
      return TroubleshootingResultSchema.parse({
        problemId: currentPlan.problemId,
        adaptationCount,
        priorAttemptsAnalyzed: [feedback.whatWasTried],
        reassessedSafety: safetyCheck,
        stoppedDueToRisk: true,
        recommendedProfessional: true,
        professionalReferralReason: `Safety hazard detected: ${safetyCheck.escalationReason}`,
        guidanceMessage: `SAFETY ALERT: ${safetyCheck.userFacingMessage} ${safetyCheck.emergencyGuidance || ""}`.trim(),
        explanationOfChange:
          "Troubleshooting stopped because reported conditions now present chemical, respiratory, or life-safety hazards.",
        attemptHistory,
      });
    }

    // Build prior attempts summary for the prompt
    const priorAttemptsAnalyzed: string[] = [];
    if (attemptHistory.length > 0) {
      for (const att of attemptHistory) {
        const prod = att.productsUsed?.join(", ") || "unspecified";
        const symp = att.symptomsReported?.join(", ") || "unresolved";
        priorAttemptsAnalyzed.push(
          `Attempt #${att.attemptNumber} (${att.planSummary}): Products [${prod}] → Outcome: [${symp}]`
        );
      }
    } else {
      priorAttemptsAnalyzed.push(
        `Attempt #1: Tried [${feedback.whatWasTried}] → Outcome: [${feedback.outcomeDescription}]`
      );
    }

    const followUpAnswersSummary = Object.keys(followUpAnswers).length > 0
      ? Object.entries(followUpAnswers).map(([k, v]) => `${k}: ${v}`).join("\n")
      : "None provided";

    const stepStatusesSummary = feedback.stepStatuses?.length
      ? feedback.stepStatuses.map((s) => `Step ${s.stepNumber} (${s.title}): ${s.status}`).join(", ")
      : "Not reported";

    const promptText = `
You are a safety-first household cleaning and repair assistant performing adaptive troubleshooting.

## Previous Attempts
${priorAttemptsAnalyzed.join("\n")}

## User's Latest Feedback
Outcome: ${feedback.outcome}
What was tried: ${feedback.whatWasTried}
What happened: ${feedback.outcomeDescription}
New observations: ${feedback.newObservations || "None"}
Symptoms noted: ${feedback.symptoms?.join(", ") || "None"}
Products used: ${feedback.productsUsed?.join(", ") || "None"}
Step statuses: ${stepStatusesSummary}
Discovered material details: ${feedback.discoveredMaterialDetails || "None"}

## Follow-Up Answers
${followUpAnswersSummary}

## Prior Plan
Summary: ${currentPlan.problemSummary}
Steps: ${currentPlan.steps.map((s) => `${s.stepNumber}. ${s.title}: ${s.instruction}`).join("; ")}

## Task
Generate an adapted troubleshooting plan that:
1. Does NOT repeat the previously failed approach: "${feedback.whatWasTried}"
2. Uses a safer, different secondary method if available
3. Includes a mandatory rinse step before any new chemical application
4. Recommends professional help if: the material is delicate (silk/wool/suede/leather), 2+ attempts failed, or surface damage is reported
5. Includes expectedOutcome and stopCondition on each step

Return JSON:
{
  "stoppedDueToRisk": boolean,
  "recommendedProfessional": boolean,
  "professionalReferralReason": string or null,
  "guidanceMessage": string,
  "explanationOfChange": string,
  "needsMoreClarification": boolean,
  "followUpQuestions": [] or array of {id, question, reason, type, options, required},
  "revisedSolution": optional SolutionPlan object with steps including expectedOutcome and stopCondition
}
`;

    const rawResponse = await this.callGemini([
      { role: "user", parts: [{ text: promptText }] },
    ]);

    const parsed = JSON.parse(rawResponse);

    return TroubleshootingResultSchema.parse({
      problemId: currentPlan.problemId,
      adaptationCount,
      priorAttemptsAnalyzed,
      reassessedSafety: safetyCheck,
      revisedSolution: parsed.revisedSolution
        ? SolutionPlanSchema.parse(parsed.revisedSolution)
        : undefined,
      stoppedDueToRisk: parsed.stoppedDueToRisk || false,
      recommendedProfessional: parsed.recommendedProfessional || false,
      professionalReferralReason: parsed.professionalReferralReason || undefined,
      guidanceMessage: parsed.guidanceMessage || "Adapted recommendation based on your feedback.",
      explanationOfChange: parsed.explanationOfChange || "Session-based adaptation applied.",
      needsMoreClarification: parsed.needsMoreClarification || false,
      followUpQuestions: parsed.followUpQuestions || [],
      attemptHistory,
    });
  }
}
