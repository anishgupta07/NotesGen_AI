import React, { useState, useRef, useEffect } from 'react';
import {
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  Key,
  LogOut,
  AlertTriangle,
  LogIn,
  Download,
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
  onDownloadNotes?: () => void;
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
  onDownloadNotes,
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

  const handleDownload = () => {
    if (onDownloadNotes) {
      onDownloadNotes();
      return;
    }
    if (!activeChat) return;
    const safeTitle = getChatTitle(activeChat).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeTitle}.md`;
    const blob = new Blob([activeChat.notes], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <header className="h-14 border-b border-[#E5DDD1] bg-[#FBF9F5] px-4 md:px-6 flex items-center justify-between gap-3 shrink-0 select-none z-20 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Left: Sidebar toggle + Clean Breadcrumbs / Logo */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="w-8 h-8 rounded-lg text-[#8C827A] hover:text-[#1C1917] hover:bg-[#F2EFE9] flex items-center justify-center transition cursor-pointer shrink-0"
          title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeft className="w-4 h-4 text-[#B83826]" />
          )}
        </button>

        {activeChat ? (
          <div className="flex items-center gap-1.5 text-xs text-[#8C827A] truncate">
            {/* NotesGen clickable logo */}
            <button
              onClick={onNewChat}
              className="font-serif font-bold text-sm md:text-base text-[#1C1917] hover:text-[#B83826] transition cursor-pointer"
            >
              NotesGen
            </button>
            <span>/</span>
            {viewMode === 'notes' && (
              <>
                <span className="text-[#8C827A]">Notes</span>
                <span>/</span>
              </>
            )}
            <span className="font-semibold text-[#1C1917] truncate max-w-[150px] md:max-w-[320px]">
              {getChatTitle(activeChat)}
            </span>
          </div>
        ) : (
          <button
            onClick={onNewChat}
            className="font-serif font-bold text-lg md:text-xl text-[#1C1917] hover:opacity-90 transition text-left cursor-pointer"
          >
            NotesGen
          </button>
        )}
      </div>

      {/* Right Controls: Mode Toggle, Download, Key Settings, Profile */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* If chat is open, show "Back to notes" pill button (matching Image 1) */}
        {activeChat && (viewMode === 'split' || viewMode === 'chat') && (
          <button
            onClick={() => onSetViewMode('notes')}
            className="px-3.5 py-1.5 rounded-full bg-[#FAF8F5] border border-[#DDD6C8] hover:bg-[#F2EFE9] text-xs font-medium text-[#1C1917] transition cursor-pointer shadow-2xs"
          >
            Back to notes
          </button>
        )}

        {/* If in notes view, show "Download PDF" dark pill button (matching Image 2) */}
        {activeChat && viewMode === 'notes' && (
          <button
            onClick={handleDownload}
            className="px-4 py-1.5 rounded-full bg-[#1C1917] hover:bg-black text-white text-xs font-medium transition cursor-pointer shadow-xs flex items-center gap-1.5"
            title="Download notes file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        )}

        {/* Groq Key Status badge (if not configured) */}
        {user && !user.has_groq_key && (
          <button
            onClick={onOpenKeySettings}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF3C7] border border-[#F59E0B]/40 text-[#92400E] text-xs font-semibold hover:bg-[#FDE68A] transition cursor-pointer animate-pulse"
            title="Configure personal Groq API Key"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
            <span className="hidden sm:inline">Set Groq Key</span>
          </button>
        )}

        {/* User Avatar Circle */}
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-8 h-8 rounded-full bg-[#1C1917] text-white font-serif font-bold text-xs flex items-center justify-center hover:opacity-90 transition cursor-pointer shadow-xs"
              title={user.name}
            >
              {user.name.charAt(0).toUpperCase()}
            </button>

            {/* Profile Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#FFFFFF] border border-[#E5DDD1] rounded-2xl shadow-xl py-1.5 z-30 animate-in fade-in duration-150">
                <div className="px-3.5 py-2 border-b border-[#F2EFE9]">
                  <p className="text-xs font-bold text-[#1C1917] truncate">{user.name}</p>
                  <p className="text-[11px] text-[#8C827A] truncate">{user.email}</p>
                </div>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenKeySettings();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-[#1C1917] hover:bg-[#FAF8F5] flex items-center gap-2 transition cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-[#B83826]" />
                  <span>API Key Settings</span>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-[#FDF2F2] flex items-center gap-2 transition cursor-pointer border-t border-[#F2EFE9]"
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#B83826] hover:bg-[#A32E1E] text-white text-xs font-medium transition cursor-pointer shadow-sm"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
