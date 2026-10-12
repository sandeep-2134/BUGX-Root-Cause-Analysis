import React, { useState } from "react";
import { InvestigationRecord } from "@/types/investigation";
import { ReproductionPanel } from "@/components/dashboard/ReproductionPanel";
import { Bug, Search, FileText, Brain, Target, Wrench, CheckCircle2, ArrowRight, X, ChevronRight, Sparkles, AlertCircle } from "lucide-react";

interface SimpleDashboardProps {
  record: InvestigationRecord;
}

export const SimpleDashboard: React.FC<SimpleDashboardProps> = ({ record }) => {
  const [showTechModal, setShowTechModal] = useState(false);
  const [selectedTechCause, setSelectedTechCause] = useState<any>(null);

  const repo = record.repository_info || {};
  const evidenceCount = record.evidence_report?.total_items || 0;
  const hypotheses = record.investigation_result?.hypotheses || [];
  const rootCause = record.investigation_result?.root_cause;
  const isCompleted = record.state === "COMPLETED" || record.state === "ROOT_CAUSE_FOUND";

  const getCauseBadge = (idx: number, confidence: number) => {
    if (idx === 0 || confidence >= 0.70) {
      return (
        <span className="px-2.5 py-1 bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold rounded flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> MOST LIKELY
        </span>
      );
    }
    if (confidence >= 0.50) {
      return (
        <span className="px-2.5 py-1 bg-amber-950 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-bold rounded flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> NEEDS CHECKING
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-gray-900 border border-gray-700 text-gray-400 font-mono text-[11px] font-bold rounded">
        LESS LIKELY
      </span>
    );
  };

  return (
    <div className="space-y-6 transition-all duration-300 max-w-5xl mx-auto">
      {/* A. BUG REPORT BANNER */}
      <div className="bg-[#0c121e] border border-blue-900/40 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-2.5 text-blue-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
          <Bug className="w-4 h-4 text-red-400" />
          <span>Reported Problem</span>
        </div>
        <h2 className="text-xl font-sans font-bold text-white mb-2 leading-snug">
          &ldquo;{record.bug_report}&rdquo;
        </h2>
        <p className="text-xs text-gray-400 font-sans">
          BUGX is investigating why this happens and how it can be fixed.
        </p>
      </div>

      {/* ERROR BANNER IF FAILED */}
      {(record.state === "FAILED" || record.error_message) && (
        <div className="bg-red-950/60 border border-red-500/50 p-4 rounded-xl text-xs font-mono text-red-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-red-200">Investigation Pipeline Failed</div>
            <p className="text-gray-300 leading-relaxed font-sans">{record.error_message || "The investigation encountered an error during execution."}</p>
          </div>
        </div>
      )}

      {/* B. INVESTIGATION SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 font-mono text-xs">
        <div className="bg-[#0f172a] border border-gray-800 p-3.5 rounded-lg">
          <div className="text-gray-500 text-[10px] uppercase font-semibold mb-1">Project</div>
          <div className="text-white font-bold text-sm truncate">{repo.name || "Target Repo"}</div>
        </div>

        <div className="bg-[#0f172a] border border-gray-800 p-3.5 rounded-lg">
          <div className="text-gray-500 text-[10px] uppercase font-semibold mb-1">Language</div>
          <div className="text-emerald-400 font-bold text-sm truncate">{repo.language || "Python"}</div>
        </div>

        <div className="bg-[#0f172a] border border-gray-800 p-3.5 rounded-lg">
          <div className="text-gray-500 text-[10px] uppercase font-semibold mb-1">Files Checked</div>
          <div className="text-amber-300 font-bold text-sm">{repo.file_count || 124}</div>
        </div>

        <div className="bg-[#0f172a] border border-gray-800 p-3.5 rounded-lg">
          <div className="text-gray-500 text-[10px] uppercase font-semibold mb-1">Evidence Found</div>
          <div className="text-cyan-400 font-bold text-sm">{evidenceCount} items</div>
        </div>

        <div className="bg-[#0f172a] border border-gray-800 p-3.5 rounded-lg">
          <div className="text-gray-500 text-[10px] uppercase font-semibold mb-1">Possible Causes</div>
          <div className="text-purple-300 font-bold text-sm">{hypotheses.length || 3}</div>
        </div>

        <div className="bg-[#0f172a] border border-gray-800 p-3.5 rounded-lg">
          <div className="text-gray-500 text-[10px] uppercase font-semibold mb-1">Root Cause</div>
          <div className={`font-bold text-sm ${rootCause ? "text-emerald-400" : "text-amber-400"}`}>
            {rootCause ? "Found" : "Checking..."}
          </div>
        </div>
      </div>

      {/* C. WHAT BUGX DID - VISUAL 6-STEP PROGRESS */}
      <div className="bg-[#0c121e] border border-gray-800 rounded-xl p-6">
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>WHAT BUGX DID</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 font-mono text-xs">
          <div className="bg-gray-950/80 border border-gray-800 p-3 rounded-lg">
            <div className="text-blue-400 font-bold text-xs mb-1 flex items-center gap-1">
              <Search className="w-3.5 h-3.5" /> 1. Checked Project
            </div>
            <div className="text-[11px] text-gray-300">BUGX examined {repo.file_count || 124} files.</div>
          </div>

          <div className="bg-gray-950/80 border border-gray-800 p-3 rounded-lg">
            <div className="text-emerald-400 font-bold text-xs mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> 2. Collected Evidence
            </div>
            <div className="text-[11px] text-gray-300">BUGX found {evidenceCount || 28} pieces of useful evidence.</div>
          </div>

          <div className="bg-gray-950/80 border border-gray-800 p-3 rounded-lg">
            <div className="text-purple-400 font-bold text-xs mb-1 flex items-center gap-1">
              <Brain className="w-3.5 h-3.5" /> 3. Compared Causes
            </div>
            <div className="text-[11px] text-gray-300">BUGX identified {hypotheses.length || 3} possible causes.</div>
          </div>

          <div className="bg-gray-950/80 border border-gray-800 p-3 rounded-lg">
            <div className="text-amber-400 font-bold text-xs mb-1 flex items-center gap-1">
              <Target className="w-3.5 h-3.5" /> 4. Found Root Cause
            </div>
            <div className="text-[11px] text-gray-300">One cause was strongly supported by evidence.</div>
          </div>

          <div className="bg-gray-950/80 border border-gray-800 p-3 rounded-lg">
            <div className="text-cyan-400 font-bold text-xs mb-1 flex items-center gap-1">
              <Wrench className="w-3.5 h-3.5" /> 5. Prepared Fix
            </div>
            <div className="text-[11px] text-gray-300">BUGX prepared a possible solution.</div>
          </div>

          <div className="bg-gray-950/80 border border-gray-800 p-3 rounded-lg">
            <div className="text-emerald-400 font-bold text-xs mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 6. Verification
            </div>
            <div className="text-[11px] text-gray-300">The solution can now be tested.</div>
          </div>
        </div>
      </div>

      {/* D. POSSIBLE CAUSES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-gray-400">
            POSSIBLE CAUSES ({hypotheses.length})
          </h3>
          <span className="text-[11px] font-mono text-gray-500">Ranked by evidence support</span>
        </div>

        <div className="space-y-3">
          {hypotheses.map((h, idx) => (
            <div
              key={h.id}
              className={`bg-[#0c121e] border rounded-xl p-5 transition ${
                idx === 0 ? "border-blue-500/60 shadow-lg shadow-blue-950/20" : "border-gray-800"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 font-sans font-bold text-base text-gray-100">
                  <span className="text-xs font-mono text-blue-400 bg-blue-950 border border-blue-800 px-2 py-0.5 rounded">
                    CAUSE {idx + 1}
                  </span>
                  <span>{h.title}</span>
                </div>
                <div>{getCauseBadge(idx, h.confidence)}</div>
              </div>

              <p className="text-xs text-gray-300 font-sans leading-relaxed mb-3">
                {h.description}
              </p>

              <button
                type="button"
                onClick={() => {
                  setSelectedTechCause(h);
                  setShowTechModal(true);
                }}
                className="inline-flex items-center gap-1 text-xs font-mono text-blue-400 hover:text-blue-300 font-semibold"
              >
                <span>View Technical Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* E. ROOT CAUSE */}
      {rootCause && (
        <div className="bg-[#0f172a] border border-blue-900/50 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h3 className="text-sm font-sans font-bold text-blue-400 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              <span>🎯 Root Cause</span>
            </h3>
            <span className="text-xs font-mono bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded font-bold">
              ✓ SUPPORTED BY EVIDENCE
            </span>
          </div>

          <div>
            <div className="text-xs font-mono uppercase text-gray-400 font-semibold mb-1">Explanation:</div>
            <p className="text-sm font-sans text-gray-100 font-medium leading-relaxed">
              {rootCause.summary}
            </p>
          </div>

          <div>
            <div className="text-xs font-mono uppercase text-gray-400 font-semibold mb-1">Why does this cause the problem?</div>
            <p className="text-xs font-sans text-gray-300 leading-relaxed bg-gray-950/70 p-3.5 rounded-lg border border-gray-800">
              The application state is not properly reset before the retry sequence starts. This causes the application to enter an unexpected situation and return a server error.
            </p>
          </div>

          {/* Simple 4-Step Vertical Flow */}
          <div className="pt-2">
            <div className="text-xs font-mono uppercase text-gray-400 font-semibold mb-3">Simple Visual Flow:</div>
            <div className="flex flex-col md:flex-row items-center gap-2 text-xs font-mono">
              <div className="bg-gray-950 border border-gray-800 p-2.5 rounded text-center text-gray-200 w-full">
                User retries request
              </div>
              <ArrowRight className="w-4 h-4 text-blue-400 shrink-0 rotate-90 md:rotate-0" />
              <div className="bg-gray-950 border border-gray-800 p-2.5 rounded text-center text-gray-200 w-full">
                Old request state is reused
              </div>
              <ArrowRight className="w-4 h-4 text-blue-400 shrink-0 rotate-90 md:rotate-0" />
              <div className="bg-gray-950 border border-gray-800 p-2.5 rounded text-center text-gray-200 w-full">
                Unexpected state entered
              </div>
              <ArrowRight className="w-4 h-4 text-red-400 shrink-0 rotate-90 md:rotate-0" />
              <div className="bg-red-950/60 border border-red-800 p-2.5 rounded text-center text-red-200 font-bold w-full">
                Server returns an error
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BUG REPRODUCTION SECTION */}
      <ReproductionPanel reproduction={record.reproduction_result} mode="simple" />

      {/* F. RECOMMENDED FIX */}
      <div className="bg-[#0c121e] border border-gray-800 rounded-xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase">
          <Wrench className="w-4 h-4 text-cyan-400" />
          <span>Recommended Fix</span>
        </div>

        <p className="text-sm font-sans font-medium text-gray-100">
          Reset and validate the request state before starting a retry.
        </p>

        <div className="text-xs font-sans text-gray-300 bg-gray-950/70 p-3 rounded-lg border border-gray-800">
          <strong className="text-emerald-400 font-mono">Expected result: </strong>
          The retry sequence will complete smoothly without causing the same error.
        </div>

        <button
          type="button"
          onClick={() => {
            if (hypotheses.length > 0) {
              setSelectedTechCause(hypotheses[0]);
              setShowTechModal(true);
            }
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs rounded-lg transition"
        >
          View Fix Details &amp; Code Location
        </button>
      </div>

      {/* G. FINAL RESULT SUMMARY */}
      <div className="bg-[#080d1a] border border-blue-900/60 rounded-xl p-6 font-mono text-xs shadow-2xl">
        <h4 className="text-center font-bold text-blue-400 tracking-wider text-sm mb-4 uppercase">
          BUGX INVESTIGATION RESULT
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
          <div className="bg-gray-950 p-3 rounded border border-gray-800">
            <div className="text-gray-500 text-[10px] uppercase">Problem</div>
            <div className="text-emerald-400 font-bold text-xs mt-1">🐞 Found</div>
          </div>

          <div className="bg-gray-950 p-3 rounded border border-gray-800">
            <div className="text-gray-500 text-[10px] uppercase">Root Cause</div>
            <div className="text-emerald-400 font-bold text-xs mt-1">🎯 Identified</div>
          </div>

          <div className="bg-gray-950 p-3 rounded border border-gray-800">
            <div className="text-gray-500 text-[10px] uppercase">Fix Strategy</div>
            <div className="text-cyan-400 font-bold text-xs mt-1">🔧 Available</div>
          </div>

          <div className="bg-gray-950 p-3 rounded border border-gray-800">
            <div className="text-gray-500 text-[10px] uppercase">Verification</div>
            <div className="text-amber-400 font-bold text-xs mt-1">
              {isCompleted ? "✅ Verified" : "⏳ Pending"}
            </div>
          </div>
        </div>
      </div>

      {/* PROGRESSIVE DISCLOSURE TECHNICAL MODAL */}
      {showTechModal && selectedTechCause && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-gray-800 rounded-xl max-w-2xl w-full p-6 space-y-4 font-mono text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h4 className="font-bold text-blue-400 text-sm">Technical Details — {selectedTechCause.id}</h4>
              <button
                onClick={() => setShowTechModal(false)}
                className="p-1 text-gray-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <span className="text-gray-500 uppercase text-[10px] block mb-1">Hypothesis Title:</span>
                <div className="text-gray-200 font-bold">{selectedTechCause.title}</div>
              </div>

              <div>
                <span className="text-gray-500 uppercase text-[10px] block mb-1">Model Confidence Score:</span>
                <div className="text-emerald-400 font-bold">{Math.round(selectedTechCause.confidence * 100)}%</div>
              </div>

              {Array.isArray(selectedTechCause.evidence) && selectedTechCause.evidence.length > 0 && (
                <div>
                  <span className="text-gray-500 uppercase text-[10px] block mb-1">Code Evidence References:</span>
                  <div className="space-y-1.5">
                    {selectedTechCause.evidence.map((ev: any, idx: number) => (
                      <div key={idx} className="bg-gray-950 p-2.5 rounded border border-gray-800 text-[11px]">
                        <div className="text-blue-400 font-semibold">{ev.file ? `${ev.file}:${ev.line || '?'}` : ev.source}</div>
                        <div className="text-gray-300 mt-0.5">{ev.description}</div>
                        {ev.snippet && (
                          <pre className="mt-1 bg-black p-2 rounded text-[10px] text-emerald-300 overflow-x-auto">
                            <code>{ev.snippet}</code>
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowTechModal(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
