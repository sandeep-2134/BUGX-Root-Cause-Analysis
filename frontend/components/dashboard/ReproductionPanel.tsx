import React, { useState } from "react";
import { ReproductionResult } from "@/types/investigation";
import { ViewMode } from "./ModeSwitcher";
import { FlaskConical, CheckCircle2, AlertTriangle, Terminal, Cpu, ShieldAlert, ChevronDown, ChevronUp, Layers, Clock } from "lucide-react";

interface ReproductionPanelProps {
  reproduction?: ReproductionResult;
  mode: ViewMode;
}

export const ReproductionPanel: React.FC<ReproductionPanelProps> = ({ reproduction, mode }) => {
  const [showLogs, setShowLogs] = useState(false);

  if (!reproduction || reproduction.status === "NOT_STARTED") {
    return (
      <div className="bg-[#0f172a]/60 border border-dashed border-gray-800 rounded-lg p-6 font-mono text-xs text-center text-gray-500">
        🔬 Reproduction Engine is waiting for analysis to finish...
      </div>
    );
  }

  const isReproduced = reproduction.status === "REPRODUCED";
  const isUnsupported = reproduction.status === "UNSUPPORTED_PROJECT";
  const isDepFailed = reproduction.status === "DEPENDENCIES_FAILED";

  // SIMPLE MODE VIEW
  if (mode === "simple") {
    return (
      <div className="bg-[#0f172a] border border-blue-900/40 rounded-xl p-6 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2 font-sans font-bold text-sm text-blue-400">
            <FlaskConical className="w-5 h-5 text-blue-400" />
            <span>🔬 BUG REPRODUCTION</span>
          </div>

          <div>
            {isReproduced ? (
              <span className="px-3 py-1 bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-mono text-xs font-bold rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> ✓ BUG REPRODUCED
              </span>
            ) : isUnsupported ? (
              <span className="px-3 py-1 bg-amber-950 border border-amber-500/50 text-amber-300 font-mono text-xs font-bold rounded-lg flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> UNSUPPORTED PROJECT
              </span>
            ) : (
              <span className="px-3 py-1 bg-gray-900 border border-gray-700 text-gray-300 font-mono text-xs font-bold rounded-lg">
                ○ NOT REPRODUCED
              </span>
            )}
          </div>
        </div>

        {/* What BUGX Tried */}
        <div>
          <div className="text-xs font-mono uppercase text-gray-400 font-semibold mb-1">What BUGX Tried:</div>
          <p className="text-xs font-sans text-gray-200 leading-relaxed bg-gray-950 p-3 rounded-lg border border-gray-800">
            {reproduction.plan?.scenario || "BUGX created an isolated test scenario to recreate the reported problem."}
          </p>
        </div>

        {/* Reproduction Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
          <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
            <div className="text-gray-500 text-[10px] uppercase font-semibold">Attempts</div>
            <div className="text-blue-400 font-bold text-sm mt-0.5">{reproduction.attempts} runs</div>
          </div>

          <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
            <div className="text-gray-500 text-[10px] uppercase font-semibold">Failures Recorded</div>
            <div className="text-red-400 font-bold text-sm mt-0.5">{reproduction.failures} failures</div>
          </div>

          <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
            <div className="text-gray-500 text-[10px] uppercase font-semibold">Failure Rate</div>
            <div className="text-amber-400 font-bold text-sm mt-0.5">{Math.round(reproduction.success_rate * 100)}%</div>
          </div>

          <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
            <div className="text-gray-500 text-[10px] uppercase font-semibold">Execution Time</div>
            <div className="text-emerald-400 font-bold text-sm mt-0.5">{(reproduction.duration_ms / 1000).toFixed(1)}s</div>
          </div>
        </div>

        {/* Summary Statement */}
        <div className="bg-gray-950/80 p-3.5 rounded-lg border border-gray-800 font-sans text-xs text-gray-200">
          {isReproduced ? (
            <span className="text-emerald-300 font-medium">
              ✓ BUGX successfully recreated the problem {reproduction.failures} out of {reproduction.attempts} times inside an isolated sandbox environment.
            </span>
          ) : isUnsupported ? (
            <span className="text-amber-300">
              Automatic reproduction is not currently supported for this project type.
            </span>
          ) : (
            <span className="text-gray-300">
              The test command completed without triggering the reported failure condition.
            </span>
          )}
        </div>
      </div>
    );
  }

  // TECHNICAL MODE VIEW
  return (
    <div className="bg-[#0c121e] border border-blue-900/50 rounded-lg p-5 font-mono text-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-gray-100 uppercase tracking-wider">
            ISOLATED DOCKER SANDBOX &amp; REPRODUCTION ENGINE
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-gray-900 border border-gray-800 rounded text-gray-300">
            Status: <strong className="text-blue-400">{reproduction.status}</strong>
          </span>
          {isReproduced ? (
            <span className="px-2.5 py-1 bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold rounded">
              ✓ REPRODUCED ({reproduction.failures}/{reproduction.attempts})
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-amber-950 border border-amber-500/50 text-amber-300 font-bold rounded">
              ○ {reproduction.status}
            </span>
          )}
        </div>
      </div>

      {/* Environment Config */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-950 p-2.5 rounded border border-gray-800">
          <div className="text-[10px] uppercase text-gray-500">Container Environment</div>
          <div className="text-cyan-300 font-bold truncate mt-0.5">
            {reproduction.environment_info?.docker_used ? `Docker (${reproduction.environment_info?.image})` : "Subprocess Sandbox"}
          </div>
        </div>

        <div className="bg-gray-950 p-2.5 rounded border border-gray-800">
          <div className="text-[10px] uppercase text-gray-500">Test Command</div>
          <div className="text-emerald-300 font-bold truncate mt-0.5">{reproduction.plan?.test_command || "pytest"}</div>
        </div>

        <div className="bg-gray-950 p-2.5 rounded border border-gray-800">
          <div className="text-[10px] uppercase text-gray-500">Exit Code</div>
          <div className={`font-bold mt-0.5 ${reproduction.exit_code === 0 ? "text-emerald-400" : "text-red-400"}`}>
            Code {reproduction.exit_code ?? "?"}
          </div>
        </div>

        <div className="bg-gray-950 p-2.5 rounded border border-gray-800">
          <div className="text-[10px] uppercase text-gray-500">Execution Time</div>
          <div className="text-purple-300 font-bold mt-0.5">{(reproduction.duration_ms / 1000).toFixed(2)}s</div>
        </div>
      </div>

      {/* Reproduction Plan Details */}
      {reproduction.plan && (
        <div className="bg-gray-950 p-3.5 rounded border border-gray-800 space-y-2">
          <div className="text-[10px] uppercase text-gray-400 font-bold">Reproduction Scenario Plan</div>
          <div className="text-gray-200">{reproduction.plan.scenario}</div>
          <div className="text-gray-400 text-[11px]">
            <strong>Success Condition: </strong> {reproduction.plan.success_condition}
          </div>
        </div>
      )}

      {/* Terminal Output Viewer Toggle */}
      <div>
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 font-bold"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>{showLogs ? "HIDE SANDBOX STDOUT / STDERR EXECUTION LOGS" : "VIEW SANDBOX STDOUT / STDERR EXECUTION LOGS"}</span>
          {showLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showLogs && (
          <div className="mt-2 space-y-2">
            {reproduction.stdout && (
              <div>
                <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">STDOUT:</div>
                <pre className="bg-[#080d1a] border border-gray-800 p-3 rounded text-[10px] text-emerald-300 max-h-48 overflow-y-auto">
                  <code>{reproduction.stdout}</code>
                </pre>
              </div>
            )}

            {reproduction.stderr && (
              <div>
                <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">STDERR:</div>
                <pre className="bg-[#080d1a] border border-gray-800 p-3 rounded text-[10px] text-red-300 max-h-48 overflow-y-auto">
                  <code>{reproduction.stderr}</code>
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
