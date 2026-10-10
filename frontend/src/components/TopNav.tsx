import React from 'react';
import {
  PanelLeftClose,
  PanelLeft,
  Sparkles,
  Share2,
  Settings,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';

interface TopNavProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  activeTitle?: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  isSidebarOpen,
  onToggleSidebar,
  activeTitle,
}) => {
  return (
    <header className="h-14 border-b border-[#1f2127] bg-[#0c0d10]/90 backdrop-blur-md px-4 md:px-6 flex items-center justify-between gap-4 shrink-0 select-none">
      {/* Left: Sidebar Toggle & Context */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-[#858d9d] hover:text-[#f1f5f9] hover:bg-[#1a1b22] border border-transparent hover:border-[#2a2d37] transition cursor-pointer"
          title={isSidebarOpen ? 'Close sidebar (Ctrl+B)' : 'Open sidebar (Ctrl+B)'}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeft className="w-4 h-4 text-purple-400" />
          )}
        </button>

        <div className="flex items-center gap-2 truncate">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
          <span className="text-xs font-semibold text-[#f1f5f9] truncate">
            {activeTitle || 'NotesGen Workspace'}
          </span>
        </div>
      </div>

      {/* Right: Actions & User Profile matching screenshot */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Guardrail status pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#16171d] border border-[#252832] text-[11px] text-[#94a3b8] font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          <span>Academic Guardrail</span>
        </div>

        {/* Share Button */}
        <button
          onClick={() => {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(window.location.href);
              alert('Link copied to clipboard!');
            }
          }}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#16171d] hover:bg-[#1f212a] border border-[#262832] text-xs text-[#cbd5e1] font-medium transition cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-[#94a3b8]" />
          <span>Share</span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-[#16171d] border border-transparent hover:border-[#262832] cursor-pointer transition">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            A
          </div>
          <span className="text-xs font-semibold text-[#e2e8f0] hidden sm:inline">
            Anish Gupta
          </span>
          <ChevronDown className="w-3 h-3 text-[#64748b]" />
        </div>
      </div>
    </header>
  );
};
