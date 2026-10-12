import React, { useState } from "react";
import { Hypothesis } from "@/types/investigation";
import { FileCode, Target, FlaskConical, ShieldAlert, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

interface HypothesisCardProps {
  hypothesis: Hypothesis;
  isPrimary?: boolean;
}

export const HypothesisCard: React.FC<HypothesisCardProps> = ({ hypothesis, isPrimary }) => {
  const [expanded, setExpanded] = useState(isPrimary || false);
  const confidencePercent = Math.round(hypothesis.confidence * 100);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "supported":
        return <span className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono text-[11px] font-bold rounded flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> SUPPORTED</span>;
      case "needs_validation":
        return <span className="px-2.5 py-1 bg-amber-950/80 border border-amber-500/50 text-amber-300 font-mono text-[11px] font-bold rounded flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> NEEDS VALIDATION</span>;
      case "rejected":
        return <span className="px-2.5 py-1 bg-red-950/80 border border-red-500/50 text-red-300 font-mono text-[11px] font-bold rounded flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5 text-red-400" /> REJECTED</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-900 border border-gray-700 text-gray-400 font-mono text-[11px] font-bold rounded">○ UNTESTED</span>;
    }
  };

  const evidenceList = Array.isArray(hypothesis.evidence) ? hypothesis.evidence : [];
  const predictionsList = Array.isArray(hypothesis.predictions)
    ? hypothesis.predictions
    : typeof hypothesis.predictions === "string" && (hypothesis.predictions as string).trim()
    ? [hypothesis.predictions]
    : [];
  const testsList = Array.isArray(hypothesis.validation_tests) && hypothesis.validation_tests.length > 0
    ? hypothesis.validation_tests
    : Array.isArray(hypothesis.tests)
    ? hypothesis.tests
    : typeof hypothesis.tests === "string" && (hypothesis.tests as string).trim()
    ? [hypothesis.tests]
    : [];
  const contradictionsList = Array.isArray(hypothesis.contradictions)
    ? hypothesis.contradictions
    : typeof hypothesis.contradictions === "string" && (hypothesis.contradictions as string).trim()
    ? [hypothesis.contradictions]
    : [];

  const affectedFiles = evidenceList
    .map(e => e.file ? `${e.file}:${e.line || '?'}` : null)
    .filter(Boolean) as string[];

  return (
    <div className={`border rounded-lg p-5 transition-all ${
      isPrimary ? "bg-[#0f172a] border-blue-500/60 shadow-lg shadow-blue-950/20" : "bg-[#0c121e]/90 border-gray-800"
    }`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-mono font-bold text-xs bg-blue-900/60 text-blue-300 border border-blue-700/50 px-2 py-0.5 rounded">
            {hypothesis.id}
          </span>
          <h3 className="font-mono font-semibold text-sm text-gray-100">{hypothesis.title}</h3>
          {isPrimary && (
            <span className="text-[10px] font-mono bg-blue-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              PRIMARY HYPOTHESIS
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-xs font-mono font-bold bg-gray-900 border border-gray-800 px-2.5 py-1 rounded text-gray-300">
            Model Confidence: <span className="text-blue-400">{confidencePercent}%</span>
          </div>
          {getStatusBadge(hypothesis.status)}
        </div>
      </div>

      {/* Summary Description */}
      <p className="text-xs text-gray-300 font-sans leading-relaxed mb-4">
        {hypothesis.description}
      </p>

      {/* Affected Files Pill Strip */}
      {affectedFiles.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-4 font-mono text-[11px]">
          <span className="text-gray-500 text-[10px] uppercase font-semibold">Affected files:</span>
          {Array.from(new Set(affectedFiles)).map((fileRef, idx) => (
            <span key={idx} className="bg-gray-950 border border-gray-800 px-2 py-0.5 rounded text-blue-400">
              {fileRef}
            </span>
          ))}
        </div>
      )}

      {/* Toggle View Details Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs font-mono text-blue-400 hover:text-blue-300 font-semibold mb-2"
      >
        <span>{expanded ? "HIDE REASONING & EVIDENCE" : "VIEW EVIDENCE & PREDICTIONS"}</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Expandable Section */}
      {expanded && (
        <div className="space-y-4 pt-3 border-t border-gray-800/80 mt-2">
          {/* Supporting Evidence List with Anti-Hallucination badges */}
          {evidenceList.length > 0 && (
            <div>
              <h4 className="text-[11px] font-mono uppercase text-gray-400 mb-2 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-blue-400" /> Supporting Evidence ({evidenceList.length})
              </h4>
              <div className="space-y-2">
                {evidenceList.map((ev, idx) => (
                  <div key={idx} className={`p-3 rounded font-mono text-xs border ${
                    ev.verified === false ? "bg-red-950/30 border-red-500/50" : "bg-gray-950/80 border-gray-800"
                  }`}>
                    <div className="flex items-center justify-between text-gray-300 mb-1">
                      <span className="font-semibold text-blue-400">
                        {ev.file ? `${ev.file}:${ev.line || '?'}` : ev.source}
                      </span>
                      {ev.verified === false ? (
                        <span className="text-[10px] font-bold text-red-400 bg-red-950 px-2 py-0.5 border border-red-800 rounded flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Evidence reference could not be verified
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 border border-emerald-900 rounded">
                          ✓ Verified in Repository
                        </span>
                      )}
                    </div>
                    <div className="text-gray-300 text-[11px] mb-1">{ev.description}</div>
                    {ev.snippet && (
                      <pre className="bg-[#080d1a] border border-gray-800 p-2 rounded text-[10px] text-emerald-300 overflow-x-auto">
                        <code>{ev.snippet}</code>
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Predictions & Validation Tests Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            {predictionsList.length > 0 && (
              <div className="bg-gray-950/60 p-3 rounded border border-gray-800">
                <div className="text-[10px] uppercase text-gray-400 mb-2 flex items-center gap-1 font-bold">
                  <Target className="w-3.5 h-3.5 text-amber-400" /> Predictions
                </div>
                <ul className="list-disc list-inside space-y-1 text-gray-300 text-[11px]">
                  {predictionsList.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {testsList.length > 0 && (
              <div className="bg-gray-950/60 p-3 rounded border border-gray-800">
                <div className="text-[10px] uppercase text-gray-400 mb-2 flex items-center gap-1 font-bold">
                  <FlaskConical className="w-3.5 h-3.5 text-purple-400" /> Validation Strategy / Tests
                </div>
                <ul className="list-disc list-inside space-y-1 text-gray-300 text-[11px]">
                  {testsList.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Contradictions if any */}
          {contradictionsList.length > 0 && (
            <div className="bg-red-950/30 p-3 rounded border border-red-800 text-xs font-mono">
              <div className="text-[10px] uppercase text-red-400 mb-1 flex items-center gap-1 font-bold">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Contradicting Observations
              </div>
              <ul className="list-disc list-inside space-y-1 text-red-300 text-[11px]">
                {contradictionsList.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
