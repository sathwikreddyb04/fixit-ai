import { z } from "zod";

// --- Safety Schema ---
export const RiskLevelEnum = z.enum(["low", "moderate", "high", "critical"]);
export type RiskLevel = z.infer<typeof RiskLevelEnum>;

export const SafetyAssessmentSchema = z.object({
  riskLevel: RiskLevelEnum,
  riskCategories: z.array(z.string()),
  userFacingMessage: z.string(),
  permittedActions: z.array(z.string()),
  prohibitedActions: z.array(z.string()),
  escalationRequired: z.boolean(),
  escalationReason: z.string().nullable(),
  emergencyGuidance: z.string().optional(),
});
export type SafetyAssessment = z.infer<typeof SafetyAssessmentSchema>;

// --- Evidence & Uncertainty Schema ---
export const EvidenceStatusEnum = z.enum([
  "confirmed_by_user",
  "observed_in_image",
  "inferred_uncertain",
  "not_detected",
  "not_listed",
  "unable_to_determine",
  "not_checked",
]);
export type EvidenceStatus = z.infer<typeof EvidenceStatusEnum>;

export const EvidenceSourceTypeEnum = z.enum([
  "user_input",
  "image_observation",
  "model_inference",
  "reference_material",
  "external_data",
]);
export type EvidenceSourceType = z.infer<typeof EvidenceSourceTypeEnum>;

export const EvidenceItemSchema = z.object({
  claim: z.string(),
  status: EvidenceStatusEnum,
  sourceType: EvidenceSourceTypeEnum,
  explanation: z.string(),
  sourceReference: z.string().optional(),
  timestamp: z.string(),
});
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;

// --- Follow-Up Questions Schema ---
export const FollowUpQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  reason: z.string(), // Why this matters materially
  type: z.enum(["single_choice", "text"]),
  options: z.array(z.string()).optional(),
  required: z.boolean(),
  placeholder: z.string().optional(),
});
export type FollowUpQuestion = z.infer<typeof FollowUpQuestionSchema>;

// --- Problem Analysis Schema ---
export const ProblemAnalysisSchema = z.object({
  problemId: z.string(),
  schemaVersion: z.literal("1.0.0"),
  timestamp: z.string(),
  userReportedText: z.string(),
  hasImage: z.boolean(),
  imageMetadata: z
    .object({
      fileName: z.string().optional(),
      mimeType: z.string().optional(),
      sizeBytes: z.number().optional(),
    })
    .optional(),
  reportedFacts: z.array(z.string()),
  visibleObservations: z.array(z.string()),
  stainOrIssueCategory: z.string(),
  affectedSurfaceOrMaterial: z.string(),
  categoryConfidence: z.enum(["high", "moderate", "low", "uncertain"]),
  missingInformation: z.array(z.string()),
  safetyAssessment: SafetyAssessmentSchema,
  evidence: z.array(EvidenceItemSchema),
  followUpQuestions: z.array(FollowUpQuestionSchema),
  uncertaintyExplanation: z.string(),
  isDemoMode: z.boolean(),
  aiProvider: z.string(),
});
export type ProblemAnalysis = z.infer<typeof ProblemAnalysisSchema>;

// --- Solution Steps and Plan Schema ---
export const SolutionStepSchema = z.object({
  stepNumber: z.number(),
  title: z.string(),
  instruction: z.string(),
  cautionNotes: z.string().optional(),
  isCheckedTestPatch: z.boolean().optional(),
  expectedOutcome: z.string().optional(),
  stopCondition: z.string().optional(),
});
export type SolutionStep = z.infer<typeof SolutionStepSchema>;

export const SolutionPlanSchema = z.object({
  problemId: z.string(),
  schemaVersion: z.literal("1.0.0"),
  problemSummary: z.string(),
  whatIsKnown: z.array(z.string()),
  whatRemainsUncertain: z.array(z.string()),
  materialsNeeded: z.array(z.string()),
  steps: z.array(SolutionStepSchema),
  actionsToAvoid: z.array(z.string()),
  safetyPrecautions: z.array(z.string()),
  whenToStopAndSeekHelp: z.array(z.string()),
  whyTheseStepsExplanation: z.string(),
  safetyAssessment: SafetyAssessmentSchema,
  isDemoMode: z.boolean(),
  canAdapt: z.boolean(),
});
export type SolutionPlan = z.infer<typeof SolutionPlanSchema>;

// --- Feedback & Troubleshooting Schemas ---
export const StepStatusEnum = z.enum(["succeeded", "failed", "skipped", "untried"]);
export type StepStatus = z.infer<typeof StepStatusEnum>;

export const StepAttemptSchema = z.object({
  stepNumber: z.number(),
  title: z.string(),
  status: StepStatusEnum,
});
export type StepAttempt = z.infer<typeof StepAttemptSchema>;

export const AttemptRecordSchema = z.object({
  attemptNumber: z.number(),
  timestamp: z.string(),
  planSummary: z.string(),
  stepsAttempted: z.array(StepAttemptSchema).optional(),
  productsUsed: z.array(z.string()).optional(),
  symptomsReported: z.array(z.string()).optional(),
  outcome: z.enum(["worked", "did_not_work", "need_alternative", "abandoned"]),
  userNotes: z.string().optional(),
});
export type AttemptRecord = z.infer<typeof AttemptRecordSchema>;

export const UserFeedbackSchema = z.object({
  problemId: z.string(),
  outcome: z.enum(["worked", "did_not_work", "need_alternative", "abandoned"]),
  whatWasTried: z.string(),
  outcomeDescription: z.string(),
  newObservations: z.string().optional(),
  userComments: z.string().optional(),
  stepStatuses: z.array(StepAttemptSchema).optional(),
  productsUsed: z.array(z.string()).optional(),
  symptoms: z.array(z.string()).optional(),
  discoveredMaterialDetails: z.string().optional(),
  followUpAnswers: z.record(z.string()).optional(),
});
export type UserFeedback = z.infer<typeof UserFeedbackSchema>;

export const TroubleshootingResultSchema = z.object({
  problemId: z.string(),
  adaptationCount: z.number(),
  priorAttemptsAnalyzed: z.array(z.string()),
  reassessedSafety: SafetyAssessmentSchema,
  revisedSolution: SolutionPlanSchema.optional(),
  stoppedDueToRisk: z.boolean(),
  recommendedProfessional: z.boolean().optional(),
  professionalReferralReason: z.string().optional(),
  guidanceMessage: z.string(),
  explanationOfChange: z.string(),
  followUpQuestions: z.array(FollowUpQuestionSchema).optional(),
  needsMoreClarification: z.boolean().optional(),
  attemptHistory: z.array(AttemptRecordSchema).optional(),
});
export type TroubleshootingResult = z.infer<typeof TroubleshootingResultSchema>;

// --- Mission Registry & Contract Schema ---
export const MissionDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  dependencies: z.array(z.string()),
  enabled: z.boolean(),
  capabilities: z.array(z.string()),
  status: z.enum(["implemented", "planned", "disabled"]),
  routePrefix: z.string().optional(),
  authorNotes: z.string().optional(),
});
export type MissionDefinition = z.infer<typeof MissionDefinitionSchema>;

// --- API Request/Response Schemas ---
export const AnalyzeProblemRequestSchema = z.object({
  description: z.string().min(3, "Problem description must be at least 3 characters").max(2000),
  problemId: z.string().optional(),
  surfaceHint: z.string().optional(),
});
export type AnalyzeProblemRequest = z.infer<typeof AnalyzeProblemRequestSchema>;

export const SubmitFollowUpAnswersRequestSchema = z.object({
  answers: z.record(z.string()), // questionId -> answer text
});
export type SubmitFollowUpAnswersRequest = z.infer<typeof SubmitFollowUpAnswersRequestSchema>;
