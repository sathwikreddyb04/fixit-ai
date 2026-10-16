import React, { useState } from "react";
import { HelpCircle, ArrowRight, Loader2, Info } from "lucide-react";
import { FollowUpQuestion } from "@fixit/shared";

interface FollowUpModalProps {
  questions: FollowUpQuestion[];
  onSubmitAnswers: (answers: Record<string, string>) => void;
  isLoading: boolean;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  questions,
  onSubmitAnswers,
  isLoading,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleTextChange = (questionId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: text }));
  };

  const canSubmit = questions.every((q) => !q.required || !!answers[q.id]?.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      onSubmitAnswers(answers);
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-brand-300 p-6 shadow-md space-y-6 animate-in slide-in-from-bottom-3 duration-300">
      {/* Header */}
      <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
        <div className="p-2.5 rounded-xl bg-brand-50 text-brand-700">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">
            A Few Quick Details Before We Provide a Safe Plan
          </h3>
          <p className="text-xs text-slate-500">
            FixIt AI only asks questions that materially alter safety or chemical suitability.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q, idx) => (
          <div key={q.id} className="space-y-2.5">
            <div className="flex items-baseline justify-between">
              <label className="text-sm font-semibold text-slate-800">
                {idx + 1}. {q.question}
                {q.required && <span className="text-rose-500 ml-1">*</span>}
              </label>
            </div>

            {/* Why This Matters Callout */}
            <div className="flex items-start gap-1.5 text-[11px] text-brand-900 bg-brand-50/60 p-2.5 rounded-lg border border-brand-100">
              <Info className="w-3.5 h-3.5 text-brand-700 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Why this matters:</strong> {q.reason}
              </span>
            </div>

            {/* Single Choice Options */}
            {q.type === "single_choice" && q.options && (
              <div className="grid sm:grid-cols-2 gap-2 pt-1">
                {q.options.map((opt) => {
                  const isSelected = answers[q.id] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSelectOption(q.id, opt)}
                      disabled={isLoading}
                      className={`text-left p-3 rounded-xl border text-xs font-medium transition-all ${
                        isSelected
                          ? "border-brand-600 bg-brand-50 text-brand-900 ring-2 ring-brand-500/20 font-semibold"
                          : "border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Text input */}
            {q.type === "text" && (
              <input
                type="text"
                placeholder={q.placeholder || "Enter details..."}
                value={answers[q.id] || ""}
                onChange={(e) => handleTextChange(q.id, e.target.value)}
                disabled={isLoading}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              />
            )}
          </div>
        ))}

        {/* Submit */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={!canSubmit || isLoading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold shadow disabled:opacity-50 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Customized Safe Plan...</span>
              </>
            ) : (
              <>
                <span>Generate Safe Action Plan</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
