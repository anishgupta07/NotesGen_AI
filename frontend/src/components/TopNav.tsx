import React, { useState, useRef, useEffect } from 'react';
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
  Key,
  LogOut,
  User as UserIcon,
  AlertTriangle,
  LogIn,
} from 'lucide-react';
import { ChatDetail, User } from '../types';
import { getChatTitle } from '../utils/chatTitle';

interface TopNavProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  activeChat: ChatDetail | null;
  onNewChat: () => void;
  viewMode: 'split' | 'notes' | 'chat';
  onSetViewMode: (mode: 'split' | 'notes' | 'chat') => void;
  user: User | null;
  onOpenAuth: () => void;
  onOpenKeySettings: () => void;
  onLogout: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  isSidebarOpen,
  onToggleSidebar,
  activeChat,
  onNewChat,
  viewMode,
  onSetViewMode,
  user,
  onOpenAuth,
  onOpenKeySettings,
  onLogout,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
                {getChatTitle(activeChat)}
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

      {/* Right: Groq Key Status, Academic Guardrail, User Dropdown */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Groq BYOK Key Status Badge */}
        {user && (
          <button
            onClick={onOpenKeySettings}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer ${
              user.has_groq_key
                ? 'bg-[#0f1f17] border-[#1a442c] text-emerald-300 hover:bg-[#14291f]'
                : 'bg-[#291a0c] border-[#533414] text-amber-300 hover:bg-[#382310] animate-pulse'
            }`}
            title="Configure personal Groq API Key (BYOK)"
          >
            {user.has_groq_key ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="hidden sm:inline">Groq Active</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Set Groq Key</span>
              </>
            )}
          </button>
        )}

        {/* Academic Guardrail pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#151014] border border-[#2d1820] text-xs text-[#cbd5e1] font-medium">
          <Shield className="w-3.5 h-3.5 text-[#ff2442]" />
          <span>Guardrail</span>
        </div>

        {/* User Profile / Auth Area */}
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 pl-1 cursor-pointer group rounded-lg py-1 px-1.5 hover:bg-[#13141b] transition"
            >
              <div className="w-7 h-7 rounded-full bg-[#ff2442] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-[#f1f3f7] hidden xl:inline group-hover:text-white">
                {user.name}
              </span>
              <ChevronDown className="w-3 h-3 text-[#64748b] group-hover:text-[#cbd5e1] hidden sm:inline" />
            </button>

            {/* Profile Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#12131b] border border-[#232534] rounded-xl shadow-2xl py-1 z-30 animate-in fade-in duration-150">
                <div className="px-3 py-2 border-b border-[#1c1e2b]">
                  <p className="text-xs font-bold text-white truncate">{user.name}</p>
                  <p className="text-[11px] text-[#788195] truncate">{user.email}</p>
                </div>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenKeySettings();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-[#cbd5e1] hover:text-white hover:bg-[#1a1c26] flex items-center gap-2 transition cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-[#ff2442]" />
                  <span>Groq API Key</span>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-[#200e12] flex items-center gap-2 transition cursor-pointer border-t border-[#1c1e2b]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ff2442] hover:bg-[#e61b36] text-white text-xs font-bold transition cursor-pointer shadow-md shadow-red-950/40"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
