import React from "react";
import { Wrench, HelpCircle, Layers } from "lucide-react";

interface HeaderProps {
  isDemoMode: boolean;
  providerName: string;
  onOpenHowItWorks: () => void;
  onOpenMissions: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDemoMode,
  providerName,
  onOpenHowItWorks,
  onOpenMissions,
  onReset,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={onReset}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-teal-800 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Wrench className="w-5 h-5 text-teal-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-slate-900 group-hover:text-brand-700 transition-colors">
                FixIt AI
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold bg-brand-50 text-brand-700 border border-brand-200 px-1.5 py-0.5 rounded">
                MVP
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Understand the problem. Find the safe next step.
            </p>
          </div>
        </div>

        {/* Status & Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Honest Demo Mode Indicator */}
          <div
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
              isDemoMode
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}
            title={
              isDemoMode
                ? "Running in Honest Deterministic Demo Mode (No API key required)"
                : `Connected to ${providerName}`
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isDemoMode ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
              }`}
            />
            <span className="hidden md:inline">
              {isDemoMode ? "Honest Demo Mode" : "AI Connected"}
            </span>
          </div>

          {/* Missions Pill */}
          <button
            onClick={onOpenMissions}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <Layers className="w-4 h-4 text-brand-600" />
            <span className="hidden sm:inline">Missions</span>
            <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              5
            </span>
          </button>

          {/* How It Works Button */}
          <button
            onClick={onOpenHowItWorks}
            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">How It Works</span>
          </button>
        </div>
      </div>
    </header>
  );
};
