import React from "react";
import { InvestigationRecord } from "@/types/investigation";
import { Cpu, FileCode, Search, Database, Layers, CheckCircle2, Circle } from "lucide-react";

interface SummaryProps {
  record: InvestigationRecord;
}

export const InvestigationSummary: React.FC<SummaryProps> = ({ record }) => {
  const repo = record.repository_info || {};
  const evidenceCount = record.evidence_report?.total_items || 0;
  const hypothesesCount = record.investigation_result?.hypotheses?.length || 0;
  const rootCauseFound = Boolean(record.investigation_result?.root_cause);

  return (
    <div className="bg-[#0f172a]/60 border border-gray-800 rounded-lg p-5">
      <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-gray-400 mb-4 flex items-center justify-between">
        <span>INVESTIGATION SUMMARY</span>
        <span className="text-[10px] text-gray-500 font-normal">Dynamic System Metrics</span>
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs mb-4">
        <div className="bg-gray-950/80 border border-gray-800 p-2.5 rounded">
          <div className="text-gray-500 text-[10px] uppercase mb-1">Repository</div>
          <div className="text-blue-300 font-bold truncate">{repo.name || "Target Repo"}</div>
        </div>

        <div className="bg-gray-950/80 border border-gray-800 p-2.5 rounded">
          <div className="text-gray-500 text-[10px] uppercase mb-1">Stack / Framework</div>
          <div className="text-emerald-300 font-bold truncate">
            {repo.language || "Scanning"} {repo.framework ? `(${repo.framework})` : ""}
          </div>
        </div>

        <div className="bg-gray-950/80 border border-gray-800 p-2.5 rounded">
          <div className="text-gray-500 text-[10px] uppercase mb-1">Files Analyzed</div>
          <div className="text-amber-300 font-bold">{repo.file_count || 0} files</div>
        </div>

        <div className="bg-gray-950/80 border border-gray-800 p-2.5 rounded">
          <div className="text-gray-500 text-[10px] uppercase mb-1">Code Hotspots</div>
          <div className="text-purple-300 font-bold">{repo.relevant_files?.length || 0} files</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
        <div className="bg-gray-950/80 border border-gray-800 p-2.5 rounded">
          <div className="text-gray-500 text-[10px] uppercase mb-1">Hypotheses</div>
          <div className="text-blue-400 font-bold">{hypothesesCount} generated</div>
        </div>

        <div className="bg-gray-950/80 border border-gray-800 p-2.5 rounded">
          <div className="text-gray-500 text-[10px] uppercase mb-1">Evidence Collected</div>
          <div className="text-emerald-400 font-bold">{evidenceCount} items</div>
        </div>

        <div className="bg-gray-950/80 border border-gray-800 p-2.5 rounded">
          <div className="text-gray-500 text-[10px] uppercase mb-1">Root Cause</div>
          <div className={`font-bold ${rootCauseFound ? "text-emerald-400" : "text-amber-400"}`}>
            {rootCauseFound ? "Identified" : "Analyzing..."}
          </div>
        </div>

        <div className="bg-gray-950/80 border border-gray-800 p-2.5 rounded">
          <div className="text-gray-500 text-[10px] uppercase mb-1">Autonomous Fix</div>
          <div className="text-gray-500 font-bold">V2 Pipeline</div>
        </div>
      </div>
    </div>
  );
};
