import React from "react";
import { InvestigationRecord, ActivityEvent } from "@/types/investigation";
import { PipelineTracker } from "@/components/dashboard/PipelineTracker";
import { RepositoryInfoBadge } from "@/components/dashboard/RepositoryInfoBadge";
import { HypothesisCard } from "@/components/dashboard/HypothesisCard";
import { EvidenceViewer } from "@/components/dashboard/EvidenceViewer";
import { CausalGraph } from "@/components/dashboard/CausalGraph";
import { LiveActivityPanel } from "@/components/dashboard/LiveActivityPanel";
import { InvestigationSummary } from "@/components/dashboard/InvestigationSummary";
import { ReproductionPanel } from "@/components/dashboard/ReproductionPanel";
import { FileText, Settings, AlertCircle } from "lucide-react";

interface TechnicalDashboardProps {
  record: InvestigationRecord;
  events: ActivityEvent[];
  fetchStatus: () => void;
}

export const TechnicalDashboard: React.FC<TechnicalDashboardProps> = ({ record, events, fetchStatus }) => {
  const hypotheses = record.investigation_result?.hypotheses || [];
  const primaryHypothesisId = record.investigation_result?.root_cause?.primary_hypothesis_id;
  const isRunning = record.state !== "COMPLETED" && record.state !== "FAILED";

  return (
    <div className="space-y-6 transition-all duration-300">
      {/* Mode Banner Indicator */}
      <div className="bg-cyan-950/40 border border-cyan-800/40 p-3 rounded-lg flex items-center justify-between text-xs font-mono text-cyan-300">
        <span className="flex items-center gap-2 font-semibold">
          <Settings className="w-4 h-4 text-cyan-400" />
          TECHNICAL MODE — Full Developer Observability &amp; AST Analysis
        </span>
        <span className="text-gray-400 text-[11px]">Deep code inspection enabled</span>
      </div>

      {/* Target Bug Report Banner */}
      <div className="bg-[#0c121e] border border-gray-800 rounded-lg p-4 font-mono text-xs">
        <div className="text-gray-500 uppercase text-[10px] mb-1 flex items-center gap-1.5 font-bold">
          <FileText className="w-3.5 h-3.5 text-blue-400" /> Target Bug Report
        </div>
        <p className="text-gray-200 leading-relaxed font-sans">{record.bug_report}</p>
      </div>

      {/* ERROR BANNER IF FAILED */}
      {(record.state === "FAILED" || record.error_message) && (
        <div className="bg-red-950/60 border border-red-500/50 p-4 rounded-lg text-xs font-mono text-red-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-red-200">Investigation Pipeline Failed</div>
            <p className="text-gray-300 leading-relaxed font-sans">{record.error_message || "The investigation encountered an error during execution."}</p>
          </div>
        </div>
      )}

      {/* Investigation Summary Metrics Grid */}
      <InvestigationSummary record={record} />

      {/* Live Terminal Activity Stream Panel */}
      <LiveActivityPanel events={events} isLive={isRunning} />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Pipeline Tracker + Repo Info */}
        <div className="space-y-6 lg:col-span-1">
          <PipelineTracker state={record.state} stagesLog={record.stages_log} />
          <RepositoryInfoBadge url={record.repository_url} info={record.repository_info} />
        </div>

        {/* Right 2 Columns: Evidence Vault, Reproduction Panel, Root Cause Graph, WHY Engine Cards */}
        <div className="space-y-6 lg:col-span-2">
          {/* Reproduction Panel */}
          <ReproductionPanel reproduction={record.reproduction_result} mode="technical" />

          {/* Evidence Collection Vault */}
          <EvidenceViewer evidenceReport={record.evidence_report} />

          {/* Root Cause Graph */}
          {record.investigation_result?.root_cause && (
            <CausalGraph rootCause={record.investigation_result.root_cause} />
          )}

          {/* Competing Hypotheses Cards */}
          <div className="space-y-4">
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-gray-400 flex items-center justify-between">
              <span>WHY ENGINE — COMPETING HYPOTHESES ({hypotheses.length})</span>
              <span className="text-[10px] text-gray-500 font-normal">Evidence-Verified Confidence</span>
            </h2>

            {hypotheses.length === 0 ? (
              <div className="bg-[#0f172a]/60 border border-dashed border-gray-800 rounded-lg p-8 text-center text-xs font-mono text-gray-500">
                WHY Engine is processing repository context and validating evidence references...
              </div>
            ) : (
              hypotheses.map((h) => (
                <HypothesisCard
                  key={h.id}
                  hypothesis={h}
                  isPrimary={h.id === primaryHypothesisId}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
