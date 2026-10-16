import React, { useState, useEffect } from "react";
import { X, Layers, Play, ToggleLeft, ToggleRight, Sparkles } from "lucide-react";
import { MissionDefinition } from "@fixit/shared";
import { api } from "../services/api";

interface MissionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MissionsDrawer: React.FC<MissionsDrawerProps> = ({ isOpen, onClose }) => {
  const [missions, setMissions] = useState<MissionDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState("wash_cold");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMissions();
    }
  }, [isOpen]);

  const loadMissions = async () => {
    try {
      setLoading(true);
      const list = await api.getMissions();
      setMissions(list);
    } catch (e) {
      console.error("Failed to fetch missions:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (missionId: string, currentEnabled: boolean) => {
    try {
      const updated = await api.toggleMission(missionId, !currentEnabled);
      setMissions((prev) =>
        prev.map((m) => (m.id === missionId ? updated : m))
      );
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleExecuteCareLabel = async () => {
    try {
      setExecuting(true);
      setTestResult(null);
      const res = await api.executeMission("care_label_symbols", {
        symbolCode: selectedSymbol,
      });
      setTestResult(res.interpretation);
    } catch (e: any) {
      setTestResult(`Error: ${e.message}`);
    } finally {
      setExecuting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="missions-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 id="missions-drawer-title" className="font-bold text-slate-900 text-base">
                Hackathon Mission Registry
              </h3>
              <p className="text-xs text-slate-500">
                Modular architecture designed for 5 unpredictable missions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close missions drawer"
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm">
          <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900">
            <p className="font-semibold mb-1">Mission Isolation Guarantee:</p>
            <p>
              Each hackathon mission plugs into the shared registry with its own contract, feature flag,
              and validation without modifying core problem workflows.
            </p>
          </div>

          {/* Missions List */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
              Registered Missions ({missions.length})
            </h4>

            {loading ? (
              <div className="p-6 text-center text-slate-400">Loading missions...</div>
            ) : (
              missions.map((m) => (
                <div
                  key={m.id}
                  className={`p-4 rounded-xl border transition-all ${
                    m.status === "implemented"
                      ? m.enabled
                        ? "bg-white border-teal-200 shadow-sm"
                        : "bg-slate-50 border-slate-200 opacity-75"
                      : "bg-slate-50/60 border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900">{m.name}</span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            m.status === "implemented"
                              ? m.enabled
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {m.status === "implemented"
                            ? m.enabled
                              ? "Active & Enabled"
                              : "Disabled"
                            : "Planned Slot"}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">v{m.version}</span>
                      </div>
                      <p className="text-xs text-slate-600">{m.description}</p>
                    </div>

                    {/* Toggle feature flag */}
                    {m.status !== "planned" && (
                      <button
                        onClick={() => handleToggle(m.id, m.enabled)}
                        className="text-slate-600 hover:text-slate-900"
                        title={m.enabled ? "Disable mission" : "Enable mission"}
                      >
                        {m.enabled ? (
                          <ToggleRight className="w-6 h-6 text-teal-600" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-slate-400" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {m.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                      >
                        #{cap}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Interactive Test: Implemented Care Label Mission */}
          <div className="p-4 rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-700" />
              <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Test Implemented Mission 1: Care Label Translation
              </h5>
            </div>
            <p className="text-xs text-slate-600">
              Verify that the isolated mission handler executes correctly through the API:
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 flex-1"
              >
                <option value="wash_cold">30°C Water Washtub (wash_cold)</option>
                <option value="wash_warm">40°C Water Washtub (wash_warm)</option>
                <option value="do_not_bleach">Triangle with X (do_not_bleach)</option>
                <option value="dry_clean_only">Circle with P (dry_clean_only)</option>
                <option value="tumble_dry_low">Square with Circle & Dot (tumble_dry_low)</option>
              </select>

              <button
                onClick={handleExecuteCareLabel}
                disabled={executing}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{executing ? "Running..." : "Test Execute"}</span>
              </button>
            </div>

            {testResult && (
              <div className="mt-2 p-3 bg-white rounded-lg border border-teal-200 text-xs text-slate-800 font-medium">
                <span className="font-semibold text-teal-800">Result: </span>
                {testResult}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
          <span>See docs/ADDING_A_MISSION.md</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
