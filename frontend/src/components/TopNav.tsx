import React from 'react';
import {
  PanelLeftClose,
  PanelLeft,
  Share2,
  ChevronDown,
  Shield,
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
    <header className="h-14 border-b border-[#181920] bg-[#090a0c] px-4 md:px-6 flex items-center justify-between gap-4 shrink-0 select-none">
      {/* Left: Sidebar Toggle & Context Workspace */}
      <div className="flex items-center gap-3.5 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="w-8 h-8 rounded-lg bg-[#121319] hover:bg-[#181a22] border border-[#1e2029] flex items-center justify-center text-[#848c9c] hover:text-white transition cursor-pointer"
          title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeft className="w-4 h-4 text-[#ff2442]" />
          )}
        </button>

        <div className="flex items-center gap-2 truncate">
          <div className="w-2 h-2 rounded-full bg-[#10b981] shadow-xs shadow-emerald-500/50" />
          <span className="text-xs font-semibold text-[#f1f3f7] truncate">
            {activeTitle || 'NotesGen Workspace'}
          </span>
        </div>
      </div>

      {/* Right: Academic Guardrail, Share, User Profile */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Academic Guardrail pill with subtle red badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151014] border border-[#2d1820] text-xs text-[#cbd5e1] font-medium">
          <Shield className="w-3.5 h-3.5 text-[#ff2442]" />
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#13141a] hover:bg-[#1a1c24] border border-[#1e2029] text-xs text-[#cbd5e1] font-medium transition cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-[#848c9c]" />
          <span>Share</span>
        </button>

        {/* User Profile matching red avatar from image */}
        <div className="flex items-center gap-2 pl-1 cursor-pointer group">
          <div className="w-7 h-7 rounded-full bg-[#ff2442] text-white font-bold text-xs flex items-center justify-center shadow-xs">
            A
          </div>
          <span className="text-xs font-semibold text-[#f1f3f7] hidden sm:inline group-hover:text-white">
            Anish Gupta
          </span>
          <ChevronDown className="w-3 h-3 text-[#64748b] group-hover:text-[#cbd5e1]" />
        </div>
      </div>
    </header>
  );
};
