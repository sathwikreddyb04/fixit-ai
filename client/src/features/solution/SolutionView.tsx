import React, { useState } from "react";
import {
  CheckSquare,
  Square,
  AlertTriangle,
  Ban,
  Package,
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  PhoneOff,
} from "lucide-react";
import { SolutionPlan } from "@fixit/shared";

interface SolutionViewProps {
  plan: SolutionPlan;
  onWorked: () => void;
  onDidNotWork: () => void;
  onNeedAlternative: () => void;
  onReset: () => void;
}

export const SolutionView: React.FC<SolutionViewProps> = ({
  plan,
  onWorked,
  onDidNotWork,
  onNeedAlternative,
  onReset,
}) => {
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  const allCompleted =
    plan.steps.length > 0 && plan.steps.every((s) => completedSteps[s.stepNumber]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Solution Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Verified Action Plan
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              {plan.problemSummary}
            </h2>
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Start Fresh</span>
          </button>
        </div>

        {/* Known Facts & Uncertainties Summary Bar */}
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-semibold text-slate-700">What is confirmed:</span>
            <ul className="list-disc pl-4 text-slate-600 space-y-0.5">
              {plan.whatIsKnown.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1">
            <span className="font-semibold text-amber-900">What remains uncertain:</span>
            <ul className="list-disc pl-4 text-amber-800 space-y-0.5">
              {plan.whatRemainsUncertain.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Materials Needed */}
      {plan.materialsNeeded && plan.materialsNeeded.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
            <Package className="w-4 h-4 text-brand-700" />
            <span>Materials & Tools Needed</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-2 text-xs">
            {plan.materialsNeeded.map((mat, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-brand-600" />
                <span>{mat}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ordered Action Steps with Interactive Checkboxes */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="space-y-0.5">
            <h3 className="font-bold text-base text-slate-900">
              Ordered Step-by-Step Procedure
            </h3>
            <p className="text-xs text-slate-500">
              Check off each step as you complete it. Never skip the spot test.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {allCompleted && (
              <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                All Steps Checked!
              </span>
            )}
            <span className="text-xs font-semibold text-slate-400">
              {Object.values(completedSteps).filter(Boolean).length} of {plan.steps.length} done
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div
          role="progressbar"
          aria-valuenow={Object.values(completedSteps).filter(Boolean).length}
          aria-valuemin={0}
          aria-valuemax={plan.steps.length}
          className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"
        >
          <div
            className="bg-brand-600 h-full rounded-full transition-all duration-300"
            style={{
              width: `${
                plan.steps.length > 0
                  ? (Object.values(completedSteps).filter(Boolean).length / plan.steps.length) * 100
                  : 0
              }%`,
            }}
          />
        </div>

        <div className="space-y-3">
          {plan.steps.map((step) => {
            const isDone = !!completedSteps[step.stepNumber];
            return (
              <div
                key={step.stepNumber}
                role="checkbox"
                tabIndex={0}
                aria-checked={isDone}
                onClick={() => toggleStep(step.stepNumber)}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    toggleStep(step.stepNumber);
                  }
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                  isDone
                    ? "bg-slate-50/80 border-slate-200 opacity-75"
                    : "bg-white border-slate-200 hover:border-brand-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="pt-0.5 text-brand-700 flex-shrink-0">
                    {isDone ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400 hover:text-brand-600" />
                    )}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-500">
                        Step {step.stepNumber}
                      </span>
                      <h4
                        className={`text-sm font-bold ${
                          isDone ? "line-through text-slate-500" : "text-slate-900"
                        }`}
                      >
                        {step.title}
                      </h4>
                      {step.isCheckedTestPatch && (
                        <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                          Spot Test Required
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {step.instruction}
                    </p>
                    {step.cautionNotes && (
                      <div className="text-[11px] font-medium text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-1">
                        ⚠️ <strong>Caution:</strong> {step.cautionNotes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions to Avoid (Warning Box) */}
      {plan.actionsToAvoid && plan.actionsToAvoid.length > 0 && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
            <Ban className="w-4 h-4 text-rose-600" />
            <span>Actions to Avoid (Do Not Do This)</span>
          </div>
          <ul className="grid sm:grid-cols-2 gap-2 text-xs">
            {plan.actionsToAvoid.map((act, i) => (
              <li
                key={i}
                className="bg-white/80 p-2.5 rounded-lg border border-rose-200 text-rose-950 font-medium flex items-start gap-2"
              >
                <span className="text-rose-600 font-bold">•</span>
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Safety Precautions & When to Stop */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Safety Precautions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-800 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Safety Precautions</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
            {plan.safetyPrecautions.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>

        {/* When to Stop & Seek Help */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-800 uppercase tracking-wider">
            <PhoneOff className="w-4 h-4 text-indigo-600" />
            <span>When to Stop & Consult a Pro</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
            {plan.whenToStopAndSeekHelp.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Why These Steps Explanation */}
      {plan.whyTheseStepsExplanation && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
          <span className="font-semibold text-slate-800">
            Why FixIt AI Selected These Steps:
          </span>
          <p className="leading-relaxed">{plan.whyTheseStepsExplanation}</p>
        </div>
      )}

      {/* Session Feedback Controls */}
      <div className="bg-white rounded-2xl border-2 border-brand-200 p-6 shadow-sm space-y-4">
        <div className="space-y-0.5">
          <h4 className="font-bold text-sm text-slate-900">How did this plan work for you?</h4>
          <p className="text-xs text-slate-500">
            Feedback adapts recommendations within your current session. We never guarantee 100% removal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            onClick={onWorked}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>This worked! 🎉</span>
          </button>

          <button
            onClick={onDidNotWork}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors"
          >
            <XCircle className="w-4 h-4" />
            <span>This did not work</span>
          </button>

          <button
            onClick={onNeedAlternative}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span>I need another option</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-4 py-2.5 text-slate-500 hover:text-slate-800 text-xs font-semibold ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Start a New Problem</span>
          </button>
        </div>
      </div>
    </div>
  );
};
