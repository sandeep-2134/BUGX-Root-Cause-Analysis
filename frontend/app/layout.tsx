import "./globals.css";
import React from "react";

export const metadata = {
  title: "BUGX — Evidence-Based Autonomous Debugging",
  description: "Find the cause. Fix the bug. Prove it.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-gray-100 flex flex-col">
        <header className="border-b border-gray-800 bg-[#0c121e]/80 backdrop-blur sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 font-mono font-bold text-lg text-blue-400 tracking-tight hover:opacity-90">
              <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-xs">BUGX</span>
              <span>Root-Cause Engine</span>
            </a>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              V1 Active Pipeline
            </span>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto p-6">
          {children}
        </main>

        <footer className="border-t border-gray-800/80 px-6 py-4 text-center text-xs font-mono text-gray-500">
          BUGX Evidence-First System &bull; Find the cause. Fix the bug. Prove it.
        </footer>
      </body>
    </html>
  );
}
