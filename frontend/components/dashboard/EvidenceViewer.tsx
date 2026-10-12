import React, { useState } from "react";
import { EvidenceItem } from "@/types/investigation";
import { Database, FileCode, CheckCircle2, AlertCircle, Filter } from "lucide-react";

interface EvidenceViewerProps {
  evidenceReport: {
    total_items?: number;
    evidence_by_type?: Record<string, number>;
    items?: EvidenceItem[];
  };
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({ evidenceReport }) => {
  const items = evidenceReport.items || [];
  const byType = evidenceReport.evidence_by_type || {};
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const filteredItems = selectedType
    ? items.filter((item) => item.type === selectedType)
    : items;

  return (
    <div className="bg-[#0f172a]/60 border border-gray-800 rounded-lg p-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 border-b border-gray-800 pb-3">
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>EVIDENCE VAULT ({evidenceReport.total_items || 0} REPOSITORY EVIDENCE ITEMS)</span>
        </h3>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
          <button
            onClick={() => setSelectedType(null)}
            className={`px-2 py-0.5 rounded border transition ${
              selectedType === null
                ? "bg-blue-600 text-white border-blue-500 font-bold"
                : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            ALL ({items.length})
          </button>

          {Object.entries(byType).map(([type, count]) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-2 py-0.5 rounded border uppercase transition ${
                selectedType === type
                  ? "bg-blue-600 text-white border-blue-500 font-bold"
                  : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {type}: <strong className="text-emerald-400">{count}</strong>
            </button>
          ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-8 text-xs font-mono text-gray-500 border border-dashed border-gray-800 rounded">
          No evidence items collected for selected filter.
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {filteredItems.map((item, idx) => (
            <div key={idx} className={`p-3 rounded font-mono text-xs border ${
              item.verified === false ? "bg-red-950/20 border-red-500/40" : "bg-gray-950/80 border-gray-800"
            }`}>
              <div className="flex items-center justify-between text-gray-400 text-[11px] mb-1.5 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs bg-blue-950 border border-blue-800 text-blue-300 px-1.5 py-0.2 rounded">
                    {item.id || `E${idx + 1}`}
                  </span>
                  <span className="font-semibold text-blue-400 flex items-center gap-1">
                    <FileCode className="w-3.5 h-3.5" />
                    {item.file ? `${item.file}:${item.line || '?'}` : item.source}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="uppercase text-[9px] px-1.5 py-0.5 bg-gray-900 border border-gray-800 text-emerald-400 rounded">
                    {item.type}
                  </span>
                  {item.verified === false ? (
                    <span className="text-[9px] text-red-400 bg-red-950 px-1.5 py-0.5 border border-red-800 rounded flex items-center gap-1 font-bold">
                      <AlertCircle className="w-3 h-3" /> Unverified Reference
                    </span>
                  ) : (
                    <span className="text-[9px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 border border-emerald-900 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified Source
                    </span>
                  )}
                </div>
              </div>

              <p className="text-gray-300 text-[11px] mb-1.5">{item.description}</p>

              {item.unverified_reason && (
                <div className="text-[10px] text-red-400 mb-1.5 font-sans bg-red-950/50 p-1.5 rounded border border-red-900">
                  ⚠️ {item.unverified_reason}
                </div>
              )}

              {item.snippet && (
                <pre className="bg-[#080d1a] border border-gray-800/80 p-2 rounded text-[10px] text-emerald-300 overflow-x-auto">
                  <code>{item.snippet}</code>
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
