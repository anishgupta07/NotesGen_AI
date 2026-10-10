import React from 'react';
import {
  PanelLeftClose,
  PanelLeft,
  Share2,
  ChevronDown,
  Shield,
  ArrowLeft,
  Columns2,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { ChatDetail } from '../types';

interface TopNavProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  activeChat: ChatDetail | null;
  onNewChat: () => void;
  viewMode: 'split' | 'notes' | 'chat';
  onSetViewMode: (mode: 'split' | 'notes' | 'chat') => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  isSidebarOpen,
  onToggleSidebar,
  activeChat,
  onNewChat,
  viewMode,
  onSetViewMode,
}) => {
  return (
    <header className="h-14 border-b border-[#181920] bg-[#090a0c] px-3 md:px-5 flex items-center justify-between gap-3 shrink-0 select-none z-20">
      {/* Left: Sidebar Toggle, New Video & Context */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="w-8 h-8 rounded-lg bg-[#121319] hover:bg-[#181a22] border border-[#1e2029] flex items-center justify-center text-[#848c9c] hover:text-white transition cursor-pointer shrink-0"
          title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeft className="w-4 h-4 text-[#ff2442]" />
          )}
        </button>

        {activeChat ? (
          <>
            {/* New Video button shifted to TopNav */}
            <button
              onClick={onNewChat}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#121319] hover:bg-[#1a1c25] border border-[#1e2029] text-xs font-semibold text-[#cbd5e1] hover:text-white transition cursor-pointer shrink-0"
              title="Return to home / generate new note"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#ff2442]" />
              <span className="hidden sm:inline">New Video</span>
            </button>

            <div className="h-4 w-[1px] bg-[#1e2029] hidden sm:block shrink-0" />

            {/* Video Title */}
            <div className="flex items-center gap-2 truncate">
              <div className="w-2 h-2 rounded-full bg-[#10b981] shadow-xs shadow-emerald-500/50 shrink-0" />
              <span className="text-xs font-semibold text-[#f1f3f7] truncate max-w-[140px] md:max-w-[220px]">
                {activeChat.title}
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 truncate">
            <div className="w-2 h-2 rounded-full bg-[#10b981] shadow-xs shadow-emerald-500/50 shrink-0" />
            <span className="text-xs font-semibold text-[#f1f3f7] truncate">
              NotesGen Workspace
            </span>
          </div>
        )}
      </div>

      {/* Center: Shifted View Switcher Controls (Split View, Full Screen Notes, Chat) */}
      {activeChat && (
        <div className="flex items-center bg-[#121319] p-0.5 rounded-lg border border-[#1f212b] shrink-0">
          <button
            onClick={() => onSetViewMode('split')}
            className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1 rounded-md font-semibold text-xs transition cursor-pointer ${
              viewMode === 'split'
                ? 'border border-[#ff2442] text-white bg-[#220c11]'
                : 'text-[#64748b] hover:text-[#cbd5e1]'
            }`}
            title="Split view: Notes and Chat side-by-side"
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Split View</span>
          </button>

          <button
            onClick={() => onSetViewMode('notes')}
            className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1 rounded-md font-semibold text-xs transition cursor-pointer ${
              viewMode === 'notes'
                ? 'border border-[#ff2442] text-white bg-[#220c11]'
                : 'text-[#64748b] hover:text-[#cbd5e1]'
            }`}
            title="Full screen notes access"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Full Screen Notes</span>
          </button>

          <button
            onClick={() => onSetViewMode('chat')}
            className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1 rounded-md font-semibold text-xs transition cursor-pointer ${
              viewMode === 'chat'
                ? 'border border-[#ff2442] text-white bg-[#220c11]'
                : 'text-[#64748b] hover:text-[#cbd5e1]'
            }`}
            title="Full screen chat assistant"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat ({activeChat.messages.length})</span>
          </button>
        </div>
      )}

      {/* Right: Academic Guardrail, Share, User Profile */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Academic Guardrail pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#151014] border border-[#2d1820] text-xs text-[#cbd5e1] font-medium">
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
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#13141a] hover:bg-[#1a1c24] border border-[#1e2029] text-xs text-[#cbd5e1] font-medium transition cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-[#848c9c]" />
          <span>Share</span>
        </button>

        {/* User Profile matching red avatar */}
        <div className="flex items-center gap-2 pl-1 cursor-pointer group">
          <div className="w-7 h-7 rounded-full bg-[#ff2442] text-white font-bold text-xs flex items-center justify-center shadow-xs">
            A
          </div>
          <span className="text-xs font-semibold text-[#f1f3f7] hidden xl:inline group-hover:text-white">
            Anish Gupta
          </span>
          <ChevronDown className="w-3 h-3 text-[#64748b] group-hover:text-[#cbd5e1] hidden sm:inline" />
        </div>
      </div>
    </header>
  );
};
