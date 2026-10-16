import React, { useState } from "react";
import { User, Eye, HelpCircle, Info, ChevronDown, ChevronUp, FileCheck } from "lucide-react";
import { ProblemAnalysis, EvidenceStatus } from "@fixit/shared";

interface EvidenceViewProps {
  analysis: ProblemAnalysis;
}

const STATUS_CONFIG: Record<
  EvidenceStatus,
  { label: string; bg: string; text: string; border: string; desc: string }
> = {
  confirmed_by_user: {
    label: "Confirmed by User",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    desc: "Provided directly by user in prompt",
  },
  observed_in_image: {
    label: "Observed in Image",
    bg: "bg-teal-50",
    text: "text-teal-800",
    border: "border-teal-200",
    desc: "Visible visual trait extracted from photo",
  },
  inferred_uncertain: {
    label: "Inferred (Uncertain)",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    desc: "Probabilistic inference, not verified",
  },
  not_checked: {
    label: "Not Checked",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-300",
    desc: "Test patch or inspection not yet performed",
  },
  unable_to_determine: {
    label: "Unable to Determine",
    bg: "bg-orange-50",
    text: "text-orange-800",
    border: "border-orange-200",
    desc: "Insufficient optical or reported data",
  },
  not_detected: {
    label: "Not Detected",
    bg: "bg-zinc-100",
    text: "text-zinc-700",
    border: "border-zinc-300",
    desc: "Absence not guaranteed, but trait not seen",
  },
  not_listed: {
    label: "Not Listed",
    bg: "bg-stone-100",
    text: "text-stone-700",
    border: "border-stone-300",
    desc: "Not present on provided care label/specs",
  },
};

export const EvidenceView: React.FC<EvidenceViewProps> = ({ analysis }) => {
  const [showLedger, setShowLedger] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
      {/* Title & Classification Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
            Problem Analysis & Evidence Breakdown
          </span>
          <h3 className="text-lg font-bold text-slate-900 mt-0.5">
            {analysis.stainOrIssueCategory}
          </h3>
          <p className="text-xs text-slate-500">
            Surface / Material: <strong className="text-slate-700">{analysis.affectedSurfaceOrMaterial}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Confidence:</span>
          <span
            className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${
              analysis.categoryConfidence === "high"
                ? "bg-emerald-100 text-emerald-800"
                : analysis.categoryConfidence === "moderate"
                ? "bg-blue-100 text-blue-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {analysis.categoryConfidence}
          </span>
        </div>
      </div>

      {/* Tripartite Evidence Separation Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* 1. User-Reported Facts */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-xs text-slate-900 uppercase tracking-wider">
            <User className="w-4 h-4 text-blue-600" />
            <span>1. User-Reported Facts</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
            {analysis.reportedFacts.map((fact, idx) => (
              <li key={idx} className="leading-relaxed">
                {fact}
              </li>
            ))}
          </ul>
        </div>

        {/* 2. Visible Observations */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-xs text-slate-900 uppercase tracking-wider">
            <Eye className="w-4 h-4 text-teal-600" />
            <span>2. Visible Observations</span>
          </div>
          {analysis.hasImage && analysis.visibleObservations.length > 0 ? (
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
              {analysis.visibleObservations.map((obs, idx) => (
                <li key={idx} className="leading-relaxed">
                  {obs}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">
              No photo attached. Visual features not analyzed.
            </p>
          )}
        </div>

        {/* 3. Inferred Uncertainties */}
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-xs text-amber-900 uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>3. Uncertain Inferences</span>
          </div>
          <ul className="text-xs text-amber-900 space-y-1.5 list-disc pl-4">
            {analysis.missingInformation.length > 0 ? (
              analysis.missingInformation.map((info, idx) => (
                <li key={idx} className="leading-relaxed">
                  {info}
                </li>
              ))
            ) : (
              <li className="leading-relaxed">
                Chemical concentration and fabric dye stability remain unproven.
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Structured Evidence Ledger (7 Distinct Statuses) */}
      {analysis.evidence && analysis.evidence.length > 0 && (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowLedger(!showLedger)}
            aria-expanded={showLedger}
            className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-brand-600" />
              <span>Evidence Ledger ({analysis.evidence.length} claims verified / categorized)</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <span className="text-[11px] font-normal">{showLedger ? "Hide" : "Inspect claims"}</span>
              {showLedger ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showLedger && (
            <div className="p-4 bg-white border-t border-slate-200 space-y-2.5">
              <p className="text-[11px] text-slate-500 mb-2">
                FixIt AI separates verifiable facts from observations, unverified conditions, and limits:
              </p>
              <div className="grid gap-2">
                {analysis.evidence.map((item, idx) => {
                  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.not_checked;
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                          >
                            {cfg.label}
                          </span>
                          <span className="font-semibold text-slate-800">{item.claim}</span>
                        </div>
                        <p className="text-[11px] text-slate-600">{item.explanation}</p>
                      </div>
                      <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-500 self-start sm:self-auto">
                        source: {item.sourceType}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Uncertainty Notice Box */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
        <Info className="w-4 h-4 text-brand-700 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800">Uncertainty Note: </span>
          <span>{analysis.uncertaintyExplanation}</span>
        </div>
      </div>
    </div>
  );
};
