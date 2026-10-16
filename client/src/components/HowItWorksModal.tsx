import React from "react";
import { X, ShieldAlert, CheckCircle2, SplitSquareVertical, RefreshCw } from "lucide-react";

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-it-works-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
              ?
            </div>
            <h3 id="how-it-works-title" className="font-bold text-lg text-slate-900">
              How FixIt AI Works
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-sm text-slate-600">
          <div>
            <h4 className="font-semibold text-slate-900 text-base mb-2">
              Everyday problems. Clearer, safer solutions.
            </h4>
            <p>
              When spills, stains, and household accidents happen, common internet advice often
              recommends dangerous combinations (like mixing bleach) or abrasive scrubs that permanently
              ruin delicate surfaces. FixIt AI is built on rigorous safety controls, clear evidence separation,
              and structured procedures.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>1. Safety Before Convenience</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Server-enforced safety rules run before any advice is returned. High-risk situations
                (chemical mixing, electrical hazards, gas leaks) immediately trigger emergency
                redirects.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <SplitSquareVertical className="w-4 h-4 text-brand-600" />
                <span>2. Evidence Integrity</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                We strictly distinguish:
                <br />• <strong>Reported Facts</strong> (stated by user)
                <br />• <strong>Image Observations</strong> (visible marks)
                <br />• <strong>Inferred Uncertainty</strong> (unknown chemical compositions)
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>3. Material-Specific Steps</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Step-by-step checklists with safety precautions, what NOT to do, and a spot-test
                requirement to preserve your clothes, shoes, and furniture.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <RefreshCw className="w-4 h-4 text-indigo-600" />
                <span>4. Session-Based Adaptation</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                If an initial gentle step does not work, report what happened. FixIt AI reassesses safety
                and suggests a secondary alternative.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Got it, take me back
          </button>
        </div>
      </div>
    </div>
  );
};
