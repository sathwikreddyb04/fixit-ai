import React from "react";
import { ShieldCheck, RotateCcw } from "lucide-react";

interface FooterProps {
  onClearSession: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onClearSession }) => {
  return (
    <footer className="border-t border-slate-200 bg-white/60 py-8 px-4 text-xs text-slate-500 mt-16">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-600" />
          <span>
            <strong>FixIt AI</strong> • Safety-First Household Care & Stain Triage (24-Hour Hackathon MVP)
          </span>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={onClearSession}
            className="flex items-center gap-1 hover:text-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Session Cache</span>
          </button>
          <span>•</span>
          <span>Never guarantees 100% stain removal</span>
          <span>•</span>
          <span>Strictly prohibits chemical mixing</span>
        </div>
      </div>
    </footer>
  );
};
