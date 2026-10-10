import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Clock,
  FileText,
  Search,
  PanelLeftClose,
  Trash2,
  BookOpen,
} from 'lucide-react';
import { ChatSummary } from '../types';

interface SidebarProps {
  chats: ChatSummary[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onToggleSidebar?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onToggleSidebar,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter((c) =>
    (c.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const todayChats = filteredChats.filter((c) => isToday(c.created_at));
  const earlierChats = filteredChats.filter((c) => !isToday(c.created_at));

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { month: 'short', day: '2-digit' });
  };

  return (
    <aside className="w-64 bg-[#0d0e12] border-r border-[#1a1c22] flex flex-col h-screen shrink-0 select-none text-[#e2e8f0]">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#181a20] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-900/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              <span>NotesGen</span>
              <span className="text-[10px] bg-purple-950/80 text-purple-400 border border-purple-800/40 px-1 rounded font-mono">
                AI
              </span>
            </div>
            <div className="text-[10px] text-[#6b7280]">Video to Smart Notes</div>
          </div>
        </div>

        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1 rounded-md text-[#6b7280] hover:text-[#e2e8f0] hover:bg-[#181a22] transition cursor-pointer"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* New Note Button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full py-2 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-sm shadow-purple-900/40 transition active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Video Note</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="px-3 pb-2">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-[#64748b] absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#14151b] border border-[#22242c] focus:border-purple-500 rounded-lg text-xs text-[#e2e8f0] placeholder-[#64748b] focus:outline-hidden transition"
          />
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-3.5 pt-1">
        {/* Today Group */}
        {todayChats.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
              Today
            </div>
            {todayChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                subtitle={`Today, ${formatTime(chat.created_at)}`}
                isActive={activeChatId === chat.id}
                onSelect={() => onSelectChat(chat.id)}
                onDelete={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
              />
            ))}
          </div>
        )}

        {/* Earlier Group */}
        {earlierChats.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
              Earlier
            </div>
            {earlierChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                subtitle={formatDate(chat.created_at)}
                isActive={activeChatId === chat.id}
                onSelect={() => onSelectChat(chat.id)}
                onDelete={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
              />
            ))}
          </div>
        )}

        {filteredChats.length === 0 && (
          <div className="px-3 py-8 text-center text-xs text-[#64748b]">
            {searchQuery ? 'No notes matching search' : 'No notes yet.\nPaste a link to start!'}
          </div>
        )}
      </div>

      {/* Bottom Footer Info */}
      <div className="p-3 border-t border-[#181a20] text-[11px] text-[#64748b] flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-purple-400" />
          <span>{chats.length} notes saved</span>
        </span>
        <span className="text-[10px] text-[#475569]">Dark Mode</span>
      </div>
    </aside>
  );
};

interface ChatItemProps {
  chat: ChatSummary;
  subtitle: string;
  isActive: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

const ChatItem: React.FC<ChatItemProps> = ({ chat, subtitle, isActive, onSelect, onDelete }) => (
  <div
    onClick={onSelect}
    className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer text-left transition-all ${
      isActive
        ? 'bg-[#181920] text-white border border-[#2a2d3b] shadow-xs'
        : 'hover:bg-[#14151b] text-[#94a3b8] hover:text-[#e2e8f0] border border-transparent'
    }`}
  >
    <div className="flex items-start gap-2 overflow-hidden pr-2">
      <FileText
        className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
          isActive ? 'text-purple-400' : 'text-[#64748b] group-hover:text-[#94a3b8]'
        }`}
      />
      <div className="overflow-hidden">
        <div className="text-xs truncate font-medium">{chat.title}</div>
        <div className="text-[10px] text-[#64748b]">{subtitle}</div>
      </div>
    </div>
    <button
      onClick={onDelete}
      title="Delete note"
      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-[#64748b] transition cursor-pointer"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  </div>
);
