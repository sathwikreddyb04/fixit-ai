import React from "react";
import { User, Eye, HelpCircle, Info } from "lucide-react";
import { ProblemAnalysis } from "@fixit/shared";

interface EvidenceViewProps {
  analysis: ProblemAnalysis;
}

export const EvidenceView: React.FC<EvidenceViewProps> = ({ analysis }) => {
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
