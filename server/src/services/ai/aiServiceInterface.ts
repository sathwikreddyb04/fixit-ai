import {
  ProblemAnalysis,
  SolutionPlan,
  UserFeedback,
  TroubleshootingResult,
} from "@fixit/shared";

export interface AnalyzeParams {
  text: string;
  imageBuffer?: Buffer;
  imageMime?: string;
  fileName?: string;
  problemId?: string;
}

export interface SolutionParams {
  analysis: ProblemAnalysis;
  followUpAnswers?: Record<string, string>;
}

export interface TroubleshootParams {
  currentPlan: SolutionPlan;
  feedback: UserFeedback;
}

export interface AIServiceInterface {
  readonly providerName: string;
  readonly isDemo: boolean;

  analyzeProblem(params: AnalyzeParams): Promise<ProblemAnalysis>;
  generateSolution(params: SolutionParams): Promise<SolutionPlan>;
  troubleshoot(params: TroubleshootParams): Promise<TroubleshootingResult>;
}
