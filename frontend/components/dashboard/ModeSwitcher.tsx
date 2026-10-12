import React from "react";
import { User, Settings } from "lucide-react";

export type ViewMode = "simple" | "technical";

interface ModeSwitcherProps {
  mode: ViewMode;
  onModeChange: (newMode: ViewMode) => void;
}

export const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ mode, onModeChange }) => {
  return (
    <div className="inline-flex items-center p-1 bg-gray-950 border border-gray-800 rounded-lg font-mono text-xs select-none shadow-inner">
      <button
        type="button"
        onClick={() => onModeChange("simple")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all duration-200 ${
          mode === "simple"
            ? "bg-blue-600 text-white shadow-md shadow-blue-950/50"
            : "text-gray-400 hover:text-gray-200 hover:bg-gray-900/60"
        }`}
      >
        <User className="w-3.5 h-3.5" />
        <span>Simple</span>
      </button>

      <button
        type="button"
        onClick={() => onModeChange("technical")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all duration-200 ${
          mode === "technical"
            ? "bg-cyan-600 text-white shadow-md shadow-cyan-950/50"
            : "text-gray-400 hover:text-gray-200 hover:bg-gray-900/60"
        }`}
      >
        <Settings className="w-3.5 h-3.5" />
        <span>Technical</span>
      </button>
    </div>
  );
};
