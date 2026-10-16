import React from "react";
import { AlertOctagon, AlertTriangle, XCircle, CheckCircle, PhoneCall, RefreshCw } from "lucide-react";
import { SafetyAssessment } from "@fixit/shared";

interface SafetyAlertBannerProps {
  safety: SafetyAssessment;
  onReset: () => void;
}

export const SafetyAlertBanner: React.FC<SafetyAlertBannerProps> = ({ safety, onReset }) => {
  const isCritical = safety.riskLevel === "critical";

  return (
    <div
      className={`rounded-2xl border-2 p-6 shadow-lg space-y-5 animate-in slide-in-from-top-4 duration-300 ${
        isCritical
          ? "bg-rose-50 border-rose-500 text-rose-950"
          : "bg-amber-50 border-amber-500 text-amber-950"
      }`}
    >
      {/* Alert Header */}
      <div className="flex items-start gap-4">
        <div
          className={`p-3 rounded-xl flex-shrink-0 ${
            isCritical ? "bg-rose-600 text-white" : "bg-amber-600 text-white"
          }`}
        >
          {isCritical ? (
            <AlertOctagon className="w-8 h-8 animate-pulse" />
          ) : (
            <AlertTriangle className="w-8 h-8" />
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs uppercase font-extrabold px-2.5 py-0.5 rounded-full ${
                isCritical
                  ? "bg-rose-200 text-rose-900"
                  : "bg-amber-200 text-amber-900"
              }`}
            >
              {safety.riskLevel} Risk Detected
            </span>
            <span className="text-xs font-semibold text-slate-600">
              Categories: {safety.riskCategories.join(", ")}
            </span>
          </div>
          <h3 className="text-xl font-bold tracking-tight">
            {safety.escalationReason || "Safety Escalation Triggered"}
          </h3>
          <p className="text-sm font-medium leading-relaxed opacity-90">
            {safety.userFacingMessage}
          </p>
        </div>
      </div>

      {/* Emergency Guidance */}
      {safety.emergencyGuidance && (
        <div className="p-4 rounded-xl bg-white/80 border border-rose-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
            <PhoneCall className="w-4 h-4 text-rose-600" />
            <span>Recommended Emergency / Qualified Assistance:</span>
          </div>
          <p className="text-xs text-rose-800 leading-relaxed font-medium">
            {safety.emergencyGuidance}
          </p>
        </div>
      )}

      {/* Prohibited Actions */}
      {safety.prohibitedActions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs uppercase font-bold tracking-wider text-rose-900 flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Strictly Prohibited Actions (Do Not Do This):</span>
          </h4>
          <ul className="grid sm:grid-cols-2 gap-2 text-xs">
            {safety.prohibitedActions.map((action, idx) => (
              <li
                key={idx}
                className="bg-white/70 p-2.5 rounded-lg border border-rose-200 font-medium flex items-start gap-2"
              >
                <span className="text-rose-600 font-bold">•</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Permitted Immediate Precautions */}
      {safety.permittedActions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs uppercase font-bold tracking-wider text-slate-800 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Permitted Immediate Precautions:</span>
          </h4>
          <ul className="grid sm:grid-cols-2 gap-2 text-xs">
            {safety.permittedActions.map((action, idx) => (
              <li
                key={idx}
                className="bg-white/70 p-2.5 rounded-lg border border-slate-200 font-medium flex items-start gap-2"
              >
                <span className="text-emerald-600 font-bold">✓</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Reset Action */}
      <div className="pt-2 flex justify-end">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors shadow"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Start a New Problem Search</span>
        </button>
      </div>
    </div>
  );
};
