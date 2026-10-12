import React from "react";
import { CheckCircle2, Circle, Loader2, AlertCircle } from "lucide-react";
import { StageStatus } from "@/types/investigation";

interface PipelineTrackerProps {
  state: string;
  stagesLog: Record<string, StageStatus>;
}

const STAGES = [
  { id: "Repository Analysis", name: "Repository Scan", v2: true },
  { id: "Evidence Collection", name: "Evidence Collection", v2: true },
  { id: "WHY Engine", name: "Cause Analysis", v2: true },
  { id: "Root Cause", name: "Root Cause", v2: true },
  { id: "Reproduction", name: "Bug Reproduction", v2: true },
  { id: "Fix Generation", name: "Fix Generation", v2: false },
  { id: "Verification", name: "Verification", v2: false },
  { id: "Regression Testing", name: "Regression Testing", v2: false },
  { id: "Security Check", name: "Security Check", v2: false },
  { id: "Evidence Report", name: "Final Report", v2: true },
  { id: "Pull Request", name: "Pull Request", v2: false },
];

export const PipelineTracker: React.FC<PipelineTrackerProps> = ({ state, stagesLog }) => {
  const getStageStatus = (stageId: string, isV2: boolean): StageStatus => {
    if (!isV2) return { status: "pending", detail: "Coming in next stage" };
    
    const logged = stagesLog[stageId] || stagesLog[stageId.replace("Scan", "Analysis")];
    if (logged) return logged;

    if (state === "COMPLETED" || state === "ROOT_CAUSE_FOUND") {
      return { status: "completed", detail: "Completed" };
    }
    return { status: "pending", detail: "Not yet executed" };
  };

  return (
    <div className="bg-[#0f172a]/60 border border-gray-800 rounded-lg p-5 font-mono text-xs">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4 flex items-center justify-between">
        <span>INVESTIGATION PIPELINE</span>
        <span className="text-[10px] text-gray-500 font-normal">State: <strong className="text-blue-400">{state}</strong></span>
      </h3>

      <div className="space-y-2.5">
        {STAGES.map((s) => {
          const info = getStageStatus(s.id, s.v2);
          const isDone = info.status === "completed";
          const isRunning = info.status === "running";
          const isFailed = info.status === "failed";
          const isFuture = !s.v2;

          return (
            <div
              key={s.name}
              className={`flex items-center justify-between px-3 py-2 rounded border transition-colors ${
                isRunning
                  ? "bg-blue-950/40 border-blue-500/50 text-blue-200"
                  : isDone
                  ? "bg-gray-900/60 border-gray-800 text-gray-300"
                  : isFailed
                  ? "bg-red-950/40 border-red-500/50 text-red-300"
                  : "bg-gray-950/30 border-gray-900 text-gray-500"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                {isRunning && <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />}
                {isFailed && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
                {!isDone && !isRunning && !isFailed && (
                  <Circle className="w-4 h-4 text-gray-600 shrink-0" />
                )}
                
                <span className={`font-medium truncate ${isFuture ? "text-gray-600" : ""}`}>
                  {s.name}
                </span>

                {isFuture && (
                  <span className="text-[9px] px-1.5 py-0.2 bg-gray-900 border border-gray-800 text-gray-500 rounded font-mono">
                    V3
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0 text-[11px] text-gray-400">
                {info.detail && (
                  <span className="truncate max-w-[200px] text-gray-400">{info.detail}</span>
                )}
                {info.duration !== undefined && info.duration > 0 && (
                  <span className="text-gray-500">{info.duration}s</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
