import React from "react";
import { Shield, ExternalLink, ArrowUp, Github } from "lucide-react";

export function LandingFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="py-12 border-t border-zinc-800/80 bg-black text-zinc-400 text-xs font-mono relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md border border-zinc-700 bg-zinc-900 text-white">
            <Shield size={16} className="text-indigo-400" />
          </div>
          <div>
            <div className="font-bold text-white font-sans text-sm tracking-tight">HalluciCheck</div>
            <div className="text-[11px] text-zinc-400 font-sans">
              Major Project 2026 : Department of Computer Science &amp; Engineering
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <a
            href="https://github.com/Niranchan67/aihallucicheck"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors inline-flex items-center gap-1.5"
          >
            <Github size={14} />
            <span>GitHub Repository</span>
            <ExternalLink size={11} />
          </a>

          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              scrollToTop();
            }}
            className="hover:text-white transition-colors inline-flex items-center gap-1"
          >
            <span>Back to Top</span>
            <ArrowUp size={12} />
          </a>
        </div>
      </div>
    </footer>
  );
}
