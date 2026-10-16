import React, { useState } from "react";
import { X, RefreshCw, ArrowRight, Loader2, Info } from "lucide-react";
import { UserFeedback } from "@fixit/shared";

interface TroubleshootingModalProps {
  isOpen: boolean;
  onClose: () => void;
  problemId: string;
  defaultOutcome: "did_not_work" | "need_alternative";
  onSubmitFeedback: (feedback: UserFeedback) => void;
  isLoading: boolean;
}

export const TroubleshootingModal: React.FC<TroubleshootingModalProps> = ({
  isOpen,
  onClose,
  problemId,
  defaultOutcome,
  onSubmitFeedback,
  isLoading,
}) => {
  const [outcome] = useState<"did_not_work" | "need_alternative">(defaultOutcome);
  const [whatWasTried, setWhatWasTried] = useState("");
  const [outcomeDescription, setOutcomeDescription] = useState("");
  const [newObservations, setNewObservations] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatWasTried.trim() || !outcomeDescription.trim()) return;

    onSubmitFeedback({
      problemId,
      outcome,
      whatWasTried: whatWasTried.trim(),
      outcomeDescription: outcomeDescription.trim(),
      newObservations: newObservations.trim() || undefined,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="troubleshoot-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 id="troubleshoot-title" className="font-bold text-base text-slate-900">
                Troubleshoot & Adapt Solution
              </h3>
              <p className="text-xs text-slate-500">
                Session-based adaptation to safe secondary methods
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Info className="w-3.5 h-3.5 text-brand-700" />
              <span>Session-Based Troubleshooting:</span>
            </div>
            <p>
              FixIt AI does not claim permanent model learning. We reassess safety with your latest
              observations and provide a conservative secondary option if safe.
            </p>
          </div>

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
              placeholder="e.g. A yellowish ring remains on the shirt; or the stain lightened slightly but is still visible..."
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-800">
              Any new observations or surface changes? (Optional)
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
                  <span>Reassessing Safety & Adapting...</span>
                </>
              ) : (
                <>
                  <span>Submit & Adapt Plan</span>
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
