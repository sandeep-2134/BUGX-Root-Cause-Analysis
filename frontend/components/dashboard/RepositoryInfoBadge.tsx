import React from "react";
import { FolderGit2, Code2, Layers, FileCode } from "lucide-react";

interface RepositoryInfoProps {
  url: string;
  info: {
    name?: string;
    language?: string;
    framework?: string;
    file_count?: number;
    relevant_files?: { path: string; reason: string }[];
    dependencies?: string[];
  };
}

export const RepositoryInfoBadge: React.FC<RepositoryInfoProps> = ({ url, info }) => {
  return (
    <div className="bg-[#0f172a]/60 border border-gray-800 rounded-lg p-5">
      <div className="flex items-center gap-2 text-xs font-mono text-gray-400 mb-3">
        <FolderGit2 className="w-4 h-4 text-blue-400" />
        <span className="font-semibold text-gray-200 truncate">{url}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 text-xs font-mono">
        <div className="bg-gray-900/80 border border-gray-800 p-2.5 rounded">
          <div className="text-gray-500 text-[10px] uppercase mb-1 flex items-center gap-1">
            <Code2 className="w-3 h-3 text-emerald-400" /> Language
          </div>
          <div className="text-emerald-300 font-bold">{info.language || "Scanning..."}</div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 p-2.5 rounded">
          <div className="text-gray-500 text-[10px] uppercase mb-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-purple-400" /> Framework
          </div>
          <div className="text-purple-300 font-bold">{info.framework || "Scanning..."}</div>
        </div>

        <div className="bg-gray-900/80 border border-gray-800 p-2.5 rounded">
          <div className="text-gray-500 text-[10px] uppercase mb-1 flex items-center gap-1">
            <FileCode className="w-3 h-3 text-amber-400" /> Inspected Files
          </div>
          <div className="text-amber-300 font-bold">{info.file_count || 0} files</div>
        </div>
      </div>

      {info.relevant_files && info.relevant_files.length > 0 && (
        <div>
          <h4 className="text-[11px] font-mono uppercase text-gray-400 mb-2">Relevant Code Hotspots:</h4>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {info.relevant_files.map((rf, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-mono bg-gray-950/70 border border-gray-800/70 px-2.5 py-1.5 rounded">
                <span className="text-blue-400 truncate">{rf.path}</span>
                <span className="text-[10px] text-gray-500 shrink-0 ml-2">{rf.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
