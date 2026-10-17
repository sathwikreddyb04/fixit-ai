import React, { useState } from "react";
import { X, RefreshCw, ArrowRight, Loader2, Info, AlertCircle } from "lucide-react";
import { UserFeedback, SolutionPlan, FollowUpQuestion } from "@fixit/shared";

type StepStatus = "succeeded" | "failed" | "skipped" | "untried";

interface TroubleshootingModalProps {
  isOpen: boolean;
  onClose: () => void;
  problemId: string;
  defaultOutcome: "did_not_work" | "need_alternative";
  currentPlan?: SolutionPlan | null;
  /** If needsMoreClarification was returned, pass those questions here to show in-modal */
  pendingFollowUpQuestions?: FollowUpQuestion[];
  onSubmitFeedback: (feedback: UserFeedback) => void;
  isLoading: boolean;
}

export const TroubleshootingModal: React.FC<TroubleshootingModalProps> = ({
  isOpen,
  onClose,
  problemId,
  defaultOutcome,
  currentPlan,
  pendingFollowUpQuestions,
  onSubmitFeedback,
  isLoading,
}) => {
  const [outcome] = useState<"did_not_work" | "need_alternative">(defaultOutcome);
  const [whatWasTried, setWhatWasTried] = useState("");
  const [outcomeDescription, setOutcomeDescription] = useState("");
  const [newObservations, setNewObservations] = useState("");
  const [productsInput, setProductsInput] = useState("");
  const [symptomsInput, setSymptomsInput] = useState("");
  const [discoveredMaterial, setDiscoveredMaterial] = useState("");
  const [stepStatuses, setStepStatuses] = useState<Record<number, StepStatus>>({});
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleStepStatusChange = (stepNumber: number, status: StepStatus) => {
    setStepStatuses((prev) => ({ ...prev, [stepNumber]: status }));
  };

  const handleFollowUpAnswer = (id: string, value: string) => {
    setFollowUpAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatWasTried.trim() || !outcomeDescription.trim()) return;

    const parsedProducts = productsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedSymptoms = symptomsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const stepStatusArray = currentPlan?.steps
      .filter((s) => stepStatuses[s.stepNumber])
      .map((s) => ({
        stepNumber: s.stepNumber,
        title: s.title,
        status: stepStatuses[s.stepNumber],
      }));

    const feedback: UserFeedback = {
      problemId,
      outcome,
      whatWasTried: whatWasTried.trim(),
      outcomeDescription: outcomeDescription.trim(),
      newObservations: newObservations.trim() || undefined,
      productsUsed: parsedProducts.length > 0 ? parsedProducts : undefined,
      symptoms: parsedSymptoms.length > 0 ? parsedSymptoms : undefined,
      discoveredMaterialDetails: discoveredMaterial.trim() || undefined,
      stepStatuses: stepStatusArray && stepStatusArray.length > 0 ? stepStatusArray : undefined,
      followUpAnswers: Object.keys(followUpAnswers).length > 0 ? followUpAnswers : undefined,
    };

    onSubmitFeedback(feedback);
  };

  const statusColors: Record<StepStatus, string> = {
    succeeded: "bg-emerald-100 text-emerald-800 border-emerald-300",
    failed: "bg-rose-100 text-rose-800 border-rose-300",
    skipped: "bg-slate-100 text-slate-600 border-slate-300",
    untried: "bg-white text-slate-500 border-slate-200",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="troubleshoot-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 id="troubleshoot-title" className="font-bold text-base text-slate-900">
                Troubleshoot &amp; Adapt Solution
              </h3>
              <p className="text-xs text-slate-500">
                Session-based adaptation — safety reassessed before every change
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close troubleshooting dialog"
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* Info notice */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Info className="w-3.5 h-3.5 text-brand-700" />
              <span>Session-Based Troubleshooting:</span>
            </div>
            <p>
              FixIt AI will reassess safety with your latest observations and provide a conservative
              secondary option if available. Previously failed steps will not be repeated.
            </p>
          </div>

          {/* Step-status checkboxes (shown when currentPlan has steps) */}
          {currentPlan && currentPlan.steps.length > 0 && (
            <div className="space-y-2">
              <label className="block font-semibold text-slate-800">
                Which steps did you attempt? (Optional — helps avoid repeats)
              </label>
              <div className="space-y-1.5">
                {currentPlan.steps.map((step) => {
                  const current = stepStatuses[step.stepNumber] || "untried";
                  const statuses: StepStatus[] = ["succeeded", "failed", "skipped", "untried"];
                  return (
                    <div key={step.stepNumber} className="flex items-center gap-2 flex-wrap">
                      <span className="w-24 shrink-0 font-medium text-slate-600 truncate">
                        Step {step.stepNumber}: {step.title.slice(0, 18)}…
                      </span>
                      <div className="flex gap-1.5 flex-wrap">
                        {statuses.map((s) => (
                          <button
                            key={s}
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleStepStatusChange(step.stepNumber, s)}
                            className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold capitalize transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                              current === s
                                ? statusColors[s] + " ring-1 ring-offset-1 ring-current"
                                : "bg-white text-slate-400 border-slate-200 hover:border-slate-400"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* What was tried */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-800">
              What step or cleaning agent did you actually try? *
            </label>
            <input
              type="text"
              required
              disabled={isLoading}
              value={whatWasTried}
              onChange={(e) => setWhatWasTried(e.target.value)}
              placeholder="e.g. Blotted with cold water and dish soap for 5 minutes"
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
            />
          </div>

          {/* Outcome description */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-800">
              What happened afterward? *
            </label>
            <textarea
              required
              rows={3}
              disabled={isLoading}
              value={outcomeDescription}
              onChange={(e) => setOutcomeDescription(e.target.value)}
              placeholder="e.g. A yellowish ring remains; or the stain lightened slightly but is still visible..."
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 resize-none"
            />
          </div>

          {/* Products used */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-800">
              Products or chemicals used (comma-separated, Optional)
            </label>
            <input
              type="text"
              disabled={isLoading}
              value={productsInput}
              onChange={(e) => setProductsInput(e.target.value)}
              placeholder="e.g. dish soap, white vinegar, OxiClean"
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
            />
          </div>

          {/* Symptoms */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-800">
              Any symptoms or surface changes? (comma-separated, Optional)
            </label>
            <input
              type="text"
              disabled={isLoading}
              value={symptomsInput}
              onChange={(e) => setSymptomsInput(e.target.value)}
              placeholder="e.g. faint ring, stiff texture, slight fading"
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
            />
          </div>

          {/* New observations */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-800">
              Any new observations about the surface or material? (Optional)
            </label>
            <input
              type="text"
              disabled={isLoading}
              value={newObservations}
              onChange={(e) => setNewObservations(e.target.value)}
              placeholder="e.g. No color fading noticed; or fabric feels slightly stiff"
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
            />
          </div>

          {/* Discovered material details */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-800">
              Did you find a care label or discover the material? (Optional)
            </label>
            <input
              type="text"
              disabled={isLoading}
              value={discoveredMaterial}
              onChange={(e) => setDiscoveredMaterial(e.target.value)}
              placeholder="e.g. Care label says 100% cotton, machine washable"
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
            />
          </div>

          {/* Targeted follow-up questions (if the previous troubleshoot returned needsMoreClarification) */}
          {pendingFollowUpQuestions && pendingFollowUpQuestions.length > 0 && (
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-1.5 font-semibold text-indigo-800">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>A few details needed before we can adapt the plan:</span>
              </div>
              {pendingFollowUpQuestions.map((q) => (
                <div key={q.id} className="space-y-1.5">
                  <label className="block font-semibold text-slate-800">
                    {q.question}
                    {q.required && <span className="text-rose-600 ml-0.5">*</span>}
                  </label>
                  <p className="text-slate-500 italic">{q.reason}</p>
                  {q.type === "single_choice" && q.options ? (
                    <div className="flex flex-wrap gap-2">
                      {q.options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleFollowUpAnswer(q.id, opt)}
                          className={`px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                            followUpAnswers[q.id] === opt
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-white text-slate-700 border-slate-300 hover:border-indigo-400"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      disabled={isLoading}
                      value={followUpAnswers[q.id] || ""}
                      onChange={(e) => handleFollowUpAnswer(q.id, e.target.value)}
                      placeholder={q.placeholder || "Your answer..."}
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 font-medium"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!whatWasTried.trim() || !outcomeDescription.trim() || isLoading}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold shadow disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Reassessing Safety &amp; Adapting...</span>
                </>
              ) : (
                <>
                  <span>Submit &amp; Adapt Plan</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
