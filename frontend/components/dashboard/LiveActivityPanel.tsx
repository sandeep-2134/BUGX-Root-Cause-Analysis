import React, { useEffect, useRef } from "react";
import { ActivityEvent } from "@/types/investigation";
import { Terminal, CheckCircle2, AlertTriangle, Info, ArrowRight } from "lucide-react";

interface LiveActivityPanelProps {
  events?: ActivityEvent[];
  isLive?: boolean;
}

export const LiveActivityPanel: React.FC<LiveActivityPanelProps> = ({ events = [], isLive = false }) => {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  const formatTime = (ts: number) => {
    const d = new Date(ts * 1000);
    return d.toTimeString().split(" ")[0];
  };

  const getEventPrefix = (type: string) => {
    switch (type) {
      case "action":
        return <span className="text-blue-400 font-bold">&gt;</span>;
      case "success":
        return <span className="text-emerald-400 font-bold">&#x2713;</span>;
      case "error":
        return <span className="text-red-400 font-bold">&#x2717;</span>;
      default:
        return <span className="text-gray-500 font-bold">&gt;</span>;
    }
  };

  return (
    <div className="bg-[#080d1a] border border-gray-800 rounded-lg p-4 font-mono">
      <div className="flex items-center justify-between border-b border-gray-800 pb-2.5 mb-3 text-xs">
        <div className="flex items-center gap-2 text-gray-300 font-semibold uppercase tracking-wider">
          <Terminal className="w-4 h-4 text-blue-400" />
          <span>CURRENT ACTIVITY LOG</span>
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          {isLive && (
            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              STREAMING
            </span>
          )}
          <span className="text-gray-500">{events.length} events</span>
        </div>
      </div>

      <div className="h-44 overflow-y-auto space-y-1.5 text-xs pr-1 bg-black/40 p-3 rounded border border-gray-900 font-mono">
        {events.length === 0 ? (
          <div className="text-gray-600 text-[11px] italic">
            &gt; Waiting for backend investigation activity events...
          </div>
        ) : (
          events.map((evt, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[11px] leading-relaxed">
              <span className="text-gray-600 text-[10px] shrink-0 pt-0.5">
                [{formatTime(evt.timestamp)}]
              </span>
              <span className="shrink-0">{getEventPrefix(evt.type)}</span>
              <span className={`break-words ${
                evt.type === "success"
                  ? "text-emerald-300 font-medium"
                  : evt.type === "error"
                  ? "text-red-400 font-bold"
                  : evt.type === "action"
                  ? "text-blue-300"
                  : "text-gray-300"
              }`}>
                {evt.message}
              </span>
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};
