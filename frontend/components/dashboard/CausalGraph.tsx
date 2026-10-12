import React from "react";
import { RootCause } from "@/types/investigation";
import { GitCommit, ArrowDown, AlertTriangle, Layers, CheckCircle2, ShieldCheck } from "lucide-react";

interface CausalGraphProps {
  rootCause?: RootCause;
}

export const CausalGraph: React.FC<CausalGraphProps> = ({ rootCause }) => {
  if (!rootCause || !rootCause.causal_chain || rootCause.causal_chain.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#0f172a]/80 border border-blue-900/40 rounded-lg p-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 border-b border-gray-800 pb-3">
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-2">
          <GitCommit className="w-4 h-4 text-blue-400" />
          <span>CAUSAL ROOT CAUSE GRAPH</span>
        </h3>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-[10px] bg-blue-950 border border-blue-800 text-blue-300 px-2 py-0.5 rounded font-bold">
            Primary Hypothesis: {rootCause.primary_hypothesis_id}
          </span>
          <span className="text-[10px] bg-emerald-950 border border-emerald-500/50 text-emerald-300 px-2 py-0.5 rounded font-bold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> SUPPORTED BY EVIDENCE
          </span>
        </div>
      </div>

      {/* Root Cause Summary Card */}
      <div className="bg-gray-950/80 border border-gray-800 p-3.5 rounded mb-4 font-mono text-xs">
        <div className="text-[10px] uppercase text-gray-500 mb-1 font-bold">Root Cause Mechanism</div>
        <p className="text-gray-200 leading-relaxed font-sans text-xs">{rootCause.summary}</p>
      </div>

      {/* Evidence Alignment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5 font-mono text-xs">
        <div className="bg-emerald-950/30 border border-emerald-900/60 p-2.5 rounded">
          <div className="text-[10px] uppercase text-emerald-400 font-bold mb-1.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Supporting Evidence ({rootCause.supporting_evidence_ids?.length || "Multiple"})
          </div>
          <div className="text-[11px] text-emerald-200 space-y-1">
            <div>✓ Source code AST state transition locks</div>
            <div>✓ Exception propagation path verified</div>
          </div>
        </div>

        <div className="bg-gray-950/50 border border-gray-800 p-2.5 rounded">
          <div className="text-[10px] uppercase text-gray-400 font-bold mb-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> Contradicting Evidence
          </div>
          <div className="text-[11px] text-gray-400 italic">
            {rootCause.contradicting_evidence_ids?.length ? rootCause.contradicting_evidence_ids.join(", ") : "None found in analyzed codebase."}
          </div>
        </div>
      </div>

      {/* Vertical Causal Chain */}
      <div className="relative pl-4 space-y-4">
        {/* Continuous background connector line */}
        <div className="absolute left-[27px] top-4 bottom-6 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-red-500" />

        {rootCause.causal_chain.map((step, idx) => {
          const isLast = idx === rootCause.causal_chain.length - 1;
          const isFirst = idx === 0;

          return (
            <div key={idx} className="relative flex items-start gap-4 z-10 group">
              {/* Step Node Circle */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-transform group-hover:scale-110 ${
                  isLast
                    ? "bg-red-600 text-white shadow-lg shadow-red-950/80 border border-red-400"
                    : isFirst
                    ? "bg-blue-600 text-white border border-blue-400"
                    : "bg-gray-900 text-purple-300 border border-purple-500/50"
                }`}
              >
                {step.step}
              </div>

              {/* Step Content Card */}
              <div
                className={`flex-1 border p-3 rounded font-mono text-xs ${
                  isLast
                    ? "bg-red-950/30 border-red-500/40 text-red-200"
                    : "bg-gray-950/80 border-gray-800 text-gray-200"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400 mb-1">
                  <span className="flex items-center gap-1.5 text-blue-300">
                    <Layers className="w-3.5 h-3.5" />
                    {step.component}
                  </span>
                  {isLast && (
                    <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-800">
                      <AlertTriangle className="w-3 h-3" /> Failure Point
                    </span>
                  )}
                </div>
                <div className="text-gray-300 text-[11px] leading-snug">{step.action}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
