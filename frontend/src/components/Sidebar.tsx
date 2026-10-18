import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  FileText,
  Search,
  PanelLeftClose,
  MoreVertical,
  Trash2,
  Bookmark,
} from 'lucide-react';
import { ChatSummary } from '../types';
import { getChatTitle } from '../utils/chatTitle';

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
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const filteredChats = chats.filter((c) =>
    getChatTitle(c).toLowerCase().includes(searchQuery.toLowerCase())
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
    return d.toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });
  };

  return (
    <aside className="w-64 bg-[#0c0d10] border-r border-[#171820] flex flex-col h-screen shrink-0 select-none text-[#f1f3f7] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Brand Header matching red rounded icon from image */}
      <div className="p-4 border-b border-[#16171f] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#ff2442] flex items-center justify-center text-white shadow-md shadow-red-950/50">
            <Sparkles className="w-4 h-4 fill-white" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              <span>NotesGen</span>
              <span className="text-[10px] bg-[#290a10] text-[#ff4d66] border border-[#ff2442]/40 px-1 rounded font-mono font-bold">
                AI
              </span>
            </div>
            <div className="text-[10px] text-[#64748b] leading-tight">Video to Smart Notes</div>
          </div>
        </div>

        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1 rounded-md text-[#64748b] hover:text-white hover:bg-[#161720] transition cursor-pointer"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* "+ New Video Note" Solid Vibrant Red Button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full py-2.5 px-3 bg-[#ff2442] hover:bg-[#e61b36] active:scale-[0.98] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-red-950/60 transition cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Video Note</span>
        </button>
      </div>

      {/* Search Bar with Ctrl K chip */}
      <div className="px-3 pb-2">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-[#64748b] absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-12 py-1.5 bg-[#121319] border border-[#1e2029] focus:border-[#ff2442]/60 rounded-lg text-xs text-[#f1f3f7] placeholder-[#64748b] focus:outline-hidden transition"
          />
          <div className="absolute right-2 text-[10px] text-[#64748b] bg-[#171922] border border-[#232634] px-1 rounded font-mono">
            Ctrl K
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 pt-1" onClick={() => setMenuOpenId(null)}>
        {/* TODAY Section */}
        {todayChats.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-bold text-[#475569] uppercase tracking-wider">
              TODAY
            </div>
            {todayChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                subtitle={`Today, ${formatTime(chat.created_at)}`}
                isActive={activeChatId === chat.id}
                isMenuOpen={menuOpenId === chat.id}
                onToggleMenu={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === chat.id ? null : chat.id);
                }}
                onSelect={() => onSelectChat(chat.id)}
                onDelete={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                  setMenuOpenId(null);
                }}
              />
            ))}
          </div>
        )}

        {/* EARLIER Section */}
        {earlierChats.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-bold text-[#475569] uppercase tracking-wider">
              EARLIER
            </div>
            {earlierChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                subtitle={formatDate(chat.created_at)}
                isActive={activeChatId === chat.id}
                isMenuOpen={menuOpenId === chat.id}
                onToggleMenu={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === chat.id ? null : chat.id);
                }}
                onSelect={() => onSelectChat(chat.id)}
                onDelete={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                  setMenuOpenId(null);
                }}
              />
            ))}
          </div>
        )}

        {filteredChats.length === 0 && (
          <div className="px-3 py-10 text-center text-xs text-[#64748b]">
            {searchQuery ? 'No notes matching search' : 'No notes yet.\nPaste a video link to start!'}
          </div>
        )}
      </div>

      {/* Bottom Footer: Notes saved badge & Dark Mode toggle switch from image */}
      <div className="p-3 border-t border-[#16171f] flex items-center justify-between text-[11px] text-[#64748b]">
        <div className="flex items-center gap-1.5">
          <Bookmark className="w-3.5 h-3.5 text-[#ff2442]" />
          <span>{chats.length} notes saved</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#64748b]">Dark Mode</span>
          {/* Red toggle switch matching image */}
          <div className="w-8 h-4.5 bg-[#ff2442] rounded-full p-0.5 relative flex items-center cursor-default shadow-xs shadow-red-950/50">
            <div className="w-3.5 h-3.5 bg-white rounded-full shadow-xs transform translate-x-3.5" />
          </div>
        </div>
      </div>
    </aside>
  );
};

interface ChatItemProps {
  chat: ChatSummary;
  subtitle: string;
  isActive: boolean;
  isMenuOpen: boolean;
  onToggleMenu: (e: React.MouseEvent) => void;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

const ChatItem: React.FC<ChatItemProps> = ({
  chat,
  subtitle,
  isActive,
  isMenuOpen,
  onToggleMenu,
  onSelect,
  onDelete,
}) => (
  <div
    onClick={onSelect}
    className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer text-left transition-all ${
      isActive
        ? 'bg-[#15161e] text-white border border-[#222432] shadow-xs'
        : 'hover:bg-[#121319] text-[#94a3b8] hover:text-[#f1f3f7] border border-transparent'
    }`}
  >
    <div className="flex items-start gap-2.5 overflow-hidden pr-2">
      <FileText
        className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
          isActive ? 'text-[#ff2442]' : 'text-[#64748b] group-hover:text-[#94a3b8]'
        }`}
      />
      <div className="overflow-hidden">
        <div className="text-xs truncate font-medium text-white">{getChatTitle(chat)}</div>
        <div className="text-[10px] text-[#64748b]">{subtitle}</div>
      </div>
    </div>

    {/* Three vertical dots button */}
    <div className="relative shrink-0">
      <button
        onClick={onToggleMenu}
        className="p-1 text-[#64748b] hover:text-white rounded-md hover:bg-[#1b1d28] transition cursor-pointer"
        title="Note options"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute right-0 top-6 z-30 w-28 bg-[#14151c] border border-[#232532] rounded-lg shadow-xl py-1 text-xs animate-in fade-in duration-150">
          <button
            onClick={onDelete}
            className="w-full px-2.5 py-1.5 text-left text-red-400 hover:bg-[#201015] flex items-center gap-1.5 transition cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Delete Note</span>
          </button>
        </div>
      )}
    </div>
  </div>
);
