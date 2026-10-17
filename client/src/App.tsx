import React, { useState, useEffect } from "react";
import {
  ProblemAnalysis,
  SolutionPlan,
  UserFeedback,
  TroubleshootingResult,
  FollowUpQuestion,
} from "@fixit/shared";
import { api } from "./services/api";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { HowItWorksModal } from "./components/HowItWorksModal";
import { MissionsDrawer } from "./components/MissionsDrawer";
import { SafetyAlertBanner } from "./components/SafetyAlertBanner";
import { ProblemInputForm } from "./features/problem-input/ProblemInputForm";
import { EvidenceView } from "./features/analysis/EvidenceView";
import { FollowUpModal } from "./features/follow-up/FollowUpModal";
import { SolutionView } from "./features/solution/SolutionView";
import { TroubleshootingModal } from "./features/feedback/TroubleshootingModal";
import { AlertCircle, CheckCircle2, Sparkles, AlertTriangle, RefreshCw, UserCheck } from "lucide-react";

export const App: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Core session states
  const [analysis, setAnalysis] = useState<ProblemAnalysis | null>(null);
  const [solution, setSolution] = useState<SolutionPlan | null>(null);
  const [troubleshootResult, setTroubleshootResult] = useState<TroubleshootingResult | null>(null);
  const [pendingFollowUpQuestions, setPendingFollowUpQuestions] = useState<FollowUpQuestion[]>([]);

  // Modals & Panels
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isMissionsOpen, setIsMissionsOpen] = useState(false);
  const [isTroubleshootingOpen, setIsTroubleshootingOpen] = useState(false);
  const [troubleshootingOutcome, setTroubleshootingOutcome] = useState<
    "did_not_work" | "need_alternative"
  >("did_not_work");

  const checkBackendConnection = () => {
    api
      .getHealth()
      .then(() => {
        setIsOffline(false);
      })
      .catch((err) => {
        console.warn("Backend health check failed:", err);
        setIsOffline(true);
      });
  };

  // Load health on mount
  useEffect(() => {
    checkBackendConnection();
  }, []);

  // Keyboard accessibility: ESC closes open modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsHowItWorksOpen(false);
        setIsMissionsOpen(false);
        setIsTroubleshootingOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleReset = async () => {
    if (analysis?.problemId) {
      await api.clearSession(analysis.problemId).catch(() => {});
    }
    setAnalysis(null);
    setSolution(null);
    setTroubleshootResult(null);
    setPendingFollowUpQuestions([]);
    setErrorMessage(null);
    setSuccessMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAnalyzeProblem = async (description: string, imageFile?: File) => {
    try {
      setLoading(true);
      setLoadingMessage("Analyzing description and validating safety constraints...");
      setErrorMessage(null);
      setSuccessMessage(null);
      setTroubleshootResult(null);

      const result = await api.analyzeProblem(description, imageFile);
      setAnalysis(result);

      // If critical safety escalation required, do not ask follow-ups or generate routine plan
      if (result.safetyAssessment.escalationRequired) {
        setSolution(null);
        setLoading(false);
        return;
      }

      // If no follow-up questions needed, generate direct solution
      if (!result.followUpQuestions || result.followUpQuestions.length === 0) {
        setLoadingMessage("Generating verified action plan...");
        const plan = await api.getDirectSolution(result.problemId);
        setSolution(plan);
      } else {
        // Fetch safe initial guidance plan to provide immediate safe steps while waiting for answers
        try {
          const initialPlan = await api.getDirectSolution(result.problemId);
          setSolution(initialPlan);
        } catch {
          setSolution(null);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to analyze problem. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFollowUp = async (answers: Record<string, string>) => {
    if (!analysis) return;
    try {
      setLoading(true);
      setLoadingMessage("Calibrating procedure to your specific item...");
      setErrorMessage(null);

      const res = await api.submitFollowUp(analysis.problemId, answers);
      setSolution(res.solution);
      setAnalysis((prev) => (prev ? { ...prev, followUpQuestions: [] } : null));
      window.scrollTo({ top: 400, behavior: "smooth" });
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit follow-up answers.");
    } finally {
      setLoading(false);
    }
  };

  const handleWorked = async () => {
    if (!solution) return;
    try {
      await api.submitFeedback({
        problemId: solution.problemId,
        outcome: "worked",
        whatWasTried: "Followed verified action plan steps",
        outcomeDescription: "Procedure succeeded in treating the problem.",
      });
      setSuccessMessage(
        "Awesome! Glad FixIt AI could help you resolve the problem safely. Make sure the item is fully dry before storing."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setSuccessMessage("Glad to hear it worked!");
    }
  };

  const handleOpenTroubleshoot = (outcome: "did_not_work" | "need_alternative") => {
    setTroubleshootingOutcome(outcome);
    setIsTroubleshootingOpen(true);
  };

  const handleSubmitFeedback = async (feedback: UserFeedback) => {
    try {
      setLoading(true);
      setLoadingMessage("Reassessing safety and generating adapted solution...");
      setErrorMessage(null);

      const res = await api.submitFeedback(feedback);
      const result = res as TroubleshootingResult;

      // Case 1: Needs more clarification — keep modal open, inject follow-up questions
      if (result.needsMoreClarification && result.followUpQuestions?.length) {
        setPendingFollowUpQuestions(result.followUpQuestions);
        setTroubleshootResult(result);
        // Keep modal open (don't close)
        return;
      }

      // Case 2: Professional referral / safety stop — close modal, show referral card
      setIsTroubleshootingOpen(false);
      setPendingFollowUpQuestions([]);

      if ("reassessedSafety" in result) {
        setTroubleshootResult(result);
        if (result.revisedSolution) {
          setSolution(result.revisedSolution);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to adapt solution.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <Header
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        onOpenMissions={() => setIsMissionsOpen(true)}
        onReset={handleReset}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Offline Banner */}
        {isOffline && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-in fade-in"
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Service Disconnected:</strong> Cannot connect to FixIt AI backend on port 4000. Ensure the server is running with <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">npm run dev</code>.
              </span>
            </div>
            <button
              type="button"
              onClick={checkBackendConnection}
              className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm self-end sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </button>
          </div>
        )}

        {/* Hero Banner (when no problem analyzed yet) */}
        {!analysis && (
          <div className="text-center space-y-3 py-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-800 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Safety-First Care Triage • 24-Hour Hackathon MVP</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Everyday problems. Clearer, safer solutions.
            </h1>
            <p className="max-w-xl mx-auto text-sm text-slate-600 leading-relaxed">
              Describe your spill, stain, or household care issue with an optional photo.
              FixIt AI checks safety rules, identifies material uncertainties, and guides you with
              ordered action steps.
            </p>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Notice: </span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Global Success Banner */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Success! </span>
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {/* Primary Input Form (visible when no analysis or when resetting) */}
        {!analysis && (
          <ProblemInputForm onSubmit={handleAnalyzeProblem} isLoading={loading} />
        )}

        {/* Loading Spinner State */}
        {loading && (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm text-center space-y-3">
            <div className="w-8 h-8 mx-auto border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-700">{loadingMessage}</p>
          </div>
        )}

        {/* Active Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            {/* 1. Safety Escalation Alert (if critical or high risk) */}
            {analysis.safetyAssessment.escalationRequired && (
              <SafetyAlertBanner
                safety={analysis.safetyAssessment}
                onReset={handleReset}
              />
            )}

            {/* 2. Evidence Breakdown (Separation of Facts, Observations, Inferences) */}
            <EvidenceView analysis={analysis} />

            {/* 3. Follow-Up Questions (if questions exist and solution not yet generated) */}
            {!analysis.safetyAssessment.escalationRequired &&
              !solution &&
              analysis.followUpQuestions.length > 0 && (
                <FollowUpModal
                  questions={analysis.followUpQuestions}
                  onSubmitAnswers={handleSubmitFollowUp}
                  isLoading={loading}
                />
              )}

            {/* 4. Troubleshooting Result Banner (if session adaptation happened) */}
            {troubleshootResult && (
              <>
                {/* Professional Referral Card */}
                {troubleshootResult.recommendedProfessional && (
                  <div className="p-4 rounded-2xl border bg-amber-50 border-amber-300 text-amber-950 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-800">
                      <UserCheck className="w-4 h-4" />
                      <span>Professional Assistance Recommended</span>
                    </div>
                    <p className="text-xs font-medium leading-relaxed">
                      {troubleshootResult.guidanceMessage}
                    </p>
                    {troubleshootResult.professionalReferralReason && (
                      <p className="text-[11px] opacity-80">
                        <strong>Reason:</strong> {troubleshootResult.professionalReferralReason}
                      </p>
                    )}
                    <p className="text-[11px] opacity-70">
                      Disclose the original stain type and all products previously applied when contacting a specialist.
                    </p>
                  </div>
                )}

                {/* Standard Adaptation Banner (only if not stopped or professional referral) */}
                {!troubleshootResult.stoppedDueToRisk && !troubleshootResult.recommendedProfessional && (
                  <div
                    className="p-4 rounded-2xl border bg-indigo-50 border-indigo-200 text-indigo-950 space-y-1"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                      <span>Session Adaptation Applied</span>
                      <span className="bg-indigo-200/60 px-2 py-0.5 rounded text-[10px]">
                        Pass #{troubleshootResult.adaptationCount}
                      </span>
                    </div>
                    <p className="text-xs font-medium leading-relaxed">
                      {troubleshootResult.guidanceMessage}
                    </p>
                    <p className="text-[11px] opacity-80">
                      <strong>Why changed:</strong> {troubleshootResult.explanationOfChange}
                    </p>
                  </div>
                )}

                {/* Safety Stop Banner */}
                {troubleshootResult.stoppedDueToRisk && !troubleshootResult.recommendedProfessional && (
                  <div className="p-4 rounded-2xl border bg-rose-50 border-rose-300 text-rose-900 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Troubleshooting Stopped — Safety Hazard</span>
                    </div>
                    <p className="text-xs font-medium leading-relaxed">
                      {troubleshootResult.guidanceMessage}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* 5. Verified Solution Plan */}
            {solution && !analysis.safetyAssessment.escalationRequired && (
              <SolutionView
                plan={solution}
                onWorked={handleWorked}
                onDidNotWork={() => handleOpenTroubleshoot("did_not_work")}
                onNeedAlternative={() => handleOpenTroubleshoot("need_alternative")}
                onReset={handleReset}
              />
            )}
          </div>
        )}
      </main>

      {/* Troubleshooting Adaptation Modal */}
      {analysis && (
        <TroubleshootingModal
          isOpen={isTroubleshootingOpen}
          onClose={() => {
            setIsTroubleshootingOpen(false);
            setPendingFollowUpQuestions([]);
          }}
          problemId={analysis.problemId}
          defaultOutcome={troubleshootingOutcome}
          currentPlan={solution}
          pendingFollowUpQuestions={pendingFollowUpQuestions.length > 0 ? pendingFollowUpQuestions : undefined}
          onSubmitFeedback={handleSubmitFeedback}
          isLoading={loading}
        />
      )}

      {/* Educational & Principles Modal */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />

      {/* Hackathon Missions Drawer */}
      <MissionsDrawer
        isOpen={isMissionsOpen}
        onClose={() => setIsMissionsOpen(false)}
      />

      {/* Footer */}
      <Footer onClearSession={handleReset} />
    </div>
  );
};

export default App;
