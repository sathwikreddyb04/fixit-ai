import React from "react";
import { Coffee, Footprints, Flame, AlertOctagon, Tag } from "lucide-react";

export interface SampleScenarioItem {
  id: string;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
}

export const SAMPLE_SCENARIOS: SampleScenarioItem[] = [
  {
    id: "coffee",
    title: "Coffee on Cotton Shirt",
    description: "I spilled hot black coffee on my white cotton shirt about 15 minutes ago. It's still damp.",
    badge: "Washable Fabric",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    icon: <Coffee className="w-4 h-4 text-amber-700" />,
  },
  {
    id: "mud",
    title: "Muddy Canvas Sneakers",
    description: "My running sneakers got caked in thick wet mud from the college field.",
    badge: "Footwear / Mesh",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: <Footprints className="w-4 h-4 text-emerald-700" />,
  },
  {
    id: "wax",
    title: "Candle Wax on Wood Table",
    description: "Hardened red candle wax dripped onto my finished oak dining table.",
    badge: "Hard Surface",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
    icon: <Flame className="w-4 h-4 text-indigo-700" />,
  },
  {
    id: "bleach_hazard",
    title: "Bleach & Ammonia Mix",
    description: "Can I mix chlorine bleach with ammonia or vinegar to sanitize faster?",
    badge: "Safety Intercept Test",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
    icon: <AlertOctagon className="w-4 h-4 text-rose-700" />,
  },
  {
    id: "care_label",
    title: "Garment Care Label Check",
    description: "What does the wash tub symbol with 30°C and a crossed-out triangle mean on my sweater tag?",
    badge: "Label Interpretation",
    badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
    icon: <Tag className="w-4 h-4 text-teal-700" />,
  },
];

interface SampleScenariosProps {
  onSelectScenario: (text: string) => void;
}

export const SampleScenarios: React.FC<SampleScenariosProps> = ({ onSelectScenario }) => {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Or Try A Sample Scenario
        </span>
        <span className="text-[11px] text-slate-400">Click to populate</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {SAMPLE_SCENARIOS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectScenario(item.description)}
            className="text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/40 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900 group-hover:text-brand-800">
                {item.icon}
                <span>{item.title}</span>
              </div>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${item.badgeColor}`}
              >
                {item.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
              "{item.description}"
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
