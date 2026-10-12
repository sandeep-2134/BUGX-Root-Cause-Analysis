"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createInvestigation } from "@/lib/api";
import { Search, Bug, ArrowRight, ShieldCheck, Cpu, Terminal, AlertCircle, Sparkles } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [bugReport, setBugReport] = useState("");
  const [mode, setMode] = useState("WHY");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPreset = (url: string, report: string) => {
    setRepoUrl(url);
    setBugReport(report);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim() || !bugReport.trim()) {
      setError("Please provide both a valid GitHub URL and bug report.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await createInvestigation(repoUrl.trim(), bugReport.trim(), mode);
      router.push(`/investigate/${res.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to initiate investigation");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Product Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/60 text-blue-400 text-xs font-mono mb-4">
          <Cpu className="w-3.5 h-3.5" />
          <span>EVIDENCE-BASED AUTONOMOUS DEBUGGING</span>
        </div>
        <h1 className="text-4xl font-extrabold font-mono tracking-tight text-white mb-3">
          BUGX
        </h1>
        <p className="text-xl font-medium text-gray-300 max-w-xl mx-auto mb-2">
          Don&apos;t just fix the bug. Find out why it happened and prove that the fix works.
        </p>
        <p className="text-sm font-mono text-blue-400">
          &ldquo;Find the cause. Fix the bug. Prove it.&rdquo;
        </p>
      </div>

      {/* Quick 1-Click Sample Scenarios */}
      <div className="mb-6 bg-gray-950/80 border border-gray-800 rounded-xl p-4 font-mono text-xs">
        <div className="text-gray-400 font-bold uppercase text-[10px] mb-2.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Don&apos;t have a GitHub URL? Click a sample test scenario below:</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => loadPreset(
              "https://github.com/fastapi/fastapi",
              "Payment API returns HTTP 500 internal server error when user clicks retry after transaction timeout in payment_service.py"
            )}
            className="text-left p-2.5 bg-[#0c121e] hover:bg-blue-950/40 border border-gray-800 hover:border-blue-500/50 rounded transition group"
          >
            <div className="text-blue-400 font-bold text-[11px] group-hover:text-blue-300">FastAPI Payment Retry Bug</div>
            <div className="text-gray-500 text-[10px] truncate">github.com/fastapi/fastapi</div>
          </button>

          <button
            type="button"
            onClick={() => loadPreset(
              "https://github.com/pallets/flask",
              "Session state machine lock collision causes stale token validation error on concurrent request retry"
            )}
            className="text-left p-2.5 bg-[#0c121e] hover:bg-purple-950/40 border border-gray-800 hover:border-purple-500/50 rounded transition group"
          >
            <div className="text-purple-400 font-bold text-[11px] group-hover:text-purple-300">Flask Session State Bug</div>
            <div className="text-gray-500 text-[10px] truncate">github.com/pallets/flask</div>
          </button>

          <button
            type="button"
            onClick={() => loadPreset(
              "https://github.com/psf/requests",
              "Connection pool handler throws uncaught exception during automatic retry sequence"
            )}
            className="text-left p-2.5 bg-[#0c121e] hover:bg-emerald-950/40 border border-gray-800 hover:border-emerald-500/50 rounded transition group"
          >
            <div className="text-emerald-400 font-bold text-[11px] group-hover:text-emerald-300">Requests Retry Bug</div>
            <div className="text-gray-500 text-[10px] truncate">github.com/psf/requests</div>
          </button>
        </div>
      </div>

      {/* Main Start Form */}
      <form onSubmit={handleSubmit} className="bg-[#0c121e] border border-gray-800 rounded-xl p-8 shadow-2xl space-y-6">
        {error && (
          <div className="bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-mono p-3.5 rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Repository URL Input */}
        <div>
          <label className="block text-xs font-mono font-semibold uppercase text-gray-300 mb-2 flex items-center justify-between">
            <span>GitHub Repository URL</span>
            <span className="text-[10px] text-gray-500 font-normal">Public Repository</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              placeholder="https://github.com/user/repository"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#080d1a] border border-gray-800 rounded-lg text-sm font-mono text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>
        </div>

        {/* Bug Report Textarea */}
        <div>
          <label className="block text-xs font-mono font-semibold uppercase text-gray-300 mb-2 flex items-center justify-between">
            <span>Bug / Issue Description</span>
            <span className="text-[10px] text-gray-500 font-normal">Include error logs or reproduction steps</span>
          </label>
          <textarea
            required
            rows={5}
            placeholder="Describe the bug or problem (e.g. Payment API returns HTTP 500 when user clicks retry after transaction timeout)..."
            value={bugReport}
            onChange={(e) => setBugReport(e.target.value)}
            className="w-full p-4 bg-[#080d1a] border border-gray-800 rounded-lg text-sm font-mono text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition leading-relaxed"
          />
        </div>

        {/* Investigation Mode Selector */}
        <div>
          <label className="block text-xs font-mono font-semibold uppercase text-gray-300 mb-3">
            Investigation Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label
              onClick={() => setMode("WHY")}
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition ${
                mode === "WHY"
                  ? "bg-blue-950/40 border-blue-500/80 text-white"
                  : "bg-gray-950/40 border-gray-800 text-gray-400 hover:border-gray-700"
              }`}
            >
              <input
                type="radio"
                name="mode"
                checked={mode === "WHY"}
                onChange={() => setMode("WHY")}
                className="mt-1 accent-blue-500"
              />
              <div>
                <div className="font-mono font-bold text-xs text-blue-300 mb-1">
                  WHY — Find the Root Cause
                </div>
                <div className="text-[11px] text-gray-400 leading-snug">
                  Analyzes repository, extracts structured evidence, and constructs competing hypotheses with causal graph.
                </div>
              </div>
            </label>

            <label
              onClick={() => setMode("FIX")}
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition ${
                mode === "FIX"
                  ? "bg-purple-950/40 border-purple-500/80 text-white"
                  : "bg-gray-950/40 border-gray-800 text-gray-400 hover:border-gray-700"
              }`}
            >
              <input
                type="radio"
                name="mode"
                checked={mode === "FIX"}
                onChange={() => setMode("FIX")}
                className="mt-1 accent-purple-500"
              />
              <div>
                <div className="font-mono font-bold text-xs text-purple-300 mb-1">
                  FIX — Find Root Cause &amp; Generate Fix
                </div>
                <div className="text-[11px] text-gray-400 leading-snug">
                  Executes WHY engine investigation and prepares automated fix patch pipeline.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-mono font-bold text-sm tracking-wide rounded-lg flex items-center justify-center gap-2 transition shadow-lg shadow-blue-950/40"
        >
          {loading ? (
            <span>Initiating Pipeline...</span>
          ) : (
            <>
              <span>START INVESTIGATION</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
