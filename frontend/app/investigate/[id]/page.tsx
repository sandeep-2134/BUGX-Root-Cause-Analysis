"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getInvestigation } from "@/lib/api";
import { InvestigationRecord, ActivityEvent } from "@/types/investigation";
import { ModeSwitcher, ViewMode } from "@/components/dashboard/ModeSwitcher";
import { SimpleDashboard } from "@/components/dashboard/SimpleDashboard";
import { TechnicalDashboard } from "@/components/dashboard/TechnicalDashboard";
import { ArrowLeft, RefreshCw, AlertCircle, Terminal } from "lucide-react";
import Link from "next/link";

export default function InvestigationDashboardPage() {
  const params = useParams();
  const investigationId = params.id as string;

  const [viewMode, setViewMode] = useState<ViewMode>("simple");
  const [record, setRecord] = useState<InvestigationRecord | null>(null);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const data = await getInvestigation(investigationId);
      setRecord(data);
      if (data.activity_events) {
        setEvents(data.activity_events);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load investigation status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Poll status & events while pipeline runs
    const interval = setInterval(() => {
      if (!record || (record.state !== "COMPLETED" && record.state !== "FAILED")) {
        fetchStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [investigationId, record?.state]);

  if (loading && !record && !error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 font-mono text-gray-400 text-xs">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mb-3" />
        <span>Initializing BUGX Investigation Engine {investigationId}...</span>
        <span className="text-gray-600 text-[11px] mt-2">Connecting to Backend API (http://localhost:8000)...</span>
      </div>
    );
  }

  if (!record && error) {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-6">
        <div className="bg-red-950/60 border border-red-500/50 text-red-300 font-mono text-xs p-6 rounded-lg space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Backend Server Connection Error</span>
          </div>
          <p className="text-gray-300 text-xs leading-relaxed">{error || "Investigation record not found"}</p>
          
          <div className="bg-black/60 border border-red-900/60 p-3 rounded text-[11px] space-y-2">
            <div className="text-gray-400 font-bold flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              To start the Backend server, run this command in Terminal 1:
            </div>
            <code className="block bg-gray-900 text-emerald-400 p-2 rounded">
              cd &quot;C:\Users\msk20\OneDrive\Documents\BUGX Root-Cause Analysis&quot; &amp;&amp; python -m uvicorn backend.main:app --reload --port 8000
            </code>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                fetchStatus();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs rounded flex items-center gap-2 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </button>

            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-mono text-gray-400 hover:text-blue-400">
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Start Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!record) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation & Status Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-mono text-gray-400 hover:text-blue-400 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Start Page
          </Link>
          <h1 className="text-xl font-bold font-mono text-white flex items-center gap-3">
            <span>BUGX INVESTIGATION</span>
            <span className="text-xs bg-gray-900 text-gray-400 border border-gray-800 px-2.5 py-0.5 rounded">
              ID: {record.id}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Segmented Mode Switcher */}
          <ModeSwitcher mode={viewMode} onModeChange={setViewMode} />

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className={`px-3 py-1 rounded font-bold uppercase border ${
              record.state === "COMPLETED" || record.state === "ROOT_CAUSE_FOUND"
                ? "bg-emerald-950 border-emerald-500/50 text-emerald-300"
                : record.state === "FAILED"
                ? "bg-red-950 border-red-500/50 text-red-300"
                : "bg-blue-950 border-blue-500/50 text-blue-300 animate-pulse"
            }`}>
              ● {record.state}
            </span>
            <button
              onClick={fetchStatus}
              className="p-1.5 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded text-gray-400 hover:text-white"
              title="Refresh Investigation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Render Active View Mode */}
      {viewMode === "simple" ? (
        <SimpleDashboard record={record} />
      ) : (
        <TechnicalDashboard record={record} events={events} fetchStatus={fetchStatus} />
      )}
    </div>
  );
}
