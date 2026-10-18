import React, { useState } from 'react';
import {
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Bookmark,
  PanelLeftClose,
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
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <aside className="w-64 bg-[#F2EFE9] border-r border-[#E5DDD1] flex flex-col h-screen shrink-0 select-none text-[#1C1917]">
      {/* Top action: + New video note */}
      <div className="p-3.5 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onNewChat}
            className="flex-1 py-2.5 px-3.5 bg-[#B83826] hover:bg-[#A32E1E] active:scale-[0.98] text-white rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ New video note</span>
          </button>

          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg text-[#8C827A] hover:text-[#1C1917] hover:bg-[#E5DDD1] transition md:hidden cursor-pointer"
              title="Close sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="px-3.5 py-1.5">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-[#8C827A] absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search notes"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-[#FAF8F5] border border-[#DDD6C8] focus:border-[#B83826] rounded-xl text-xs text-[#1C1917] placeholder-[#8C827A] focus:outline-none transition shadow-2xs"
          />
        </div>
      </div>

      {/* History List */}
      <div
        className="flex-1 overflow-y-auto px-2.5 py-2 space-y-4"
        onClick={() => setMenuOpenId(null)}
      >
        {/* TODAY Section */}
        {todayChats.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-semibold text-[#8C827A] uppercase tracking-wider">
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
            <div className="px-2 text-[10px] font-semibold text-[#8C827A] uppercase tracking-wider">
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
          <div className="px-3 py-10 text-center text-xs text-[#8C827A] leading-relaxed">
            {searchQuery ? 'No notes matching search' : 'No notes yet.\nPaste a video link to start!'}
          </div>
        )}
      </div>

      {/* Bottom Footer: Notes saved count */}
      <div className="p-3.5 border-t border-[#E5DDD1] flex items-center justify-between text-[11px] text-[#8C827A]">
        <div className="flex items-center gap-1.5">
          <Bookmark className="w-3.5 h-3.5 text-[#B83826]" />
          <span>{chats.length} notes saved</span>
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
    className={`group relative flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-left transition-all ${
      isActive
        ? 'bg-[#FAF8F5] text-[#1C1917] border border-[#3B82F6]/70 shadow-xs ring-1 ring-[#3B82F6]/30'
        : 'hover:bg-[#EAE5DB] text-[#44403C] hover:text-[#1C1917] border border-transparent'
    }`}
  >
    <div className="overflow-hidden pr-2">
      <div className="text-xs truncate font-semibold text-[#1C1917]">
        {getChatTitle(chat)}
      </div>
      <div className="text-[10px] text-[#8C827A] mt-0.5">{subtitle}</div>
    </div>

    {/* Options button */}
    <div className="relative shrink-0">
      <button
        onClick={onToggleMenu}
        className="p-1 text-[#8C827A] hover:text-[#1C1917] rounded-md hover:bg-[#DDD6C8] transition cursor-pointer"
        title="Note options"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute right-0 top-6 z-30 w-28 bg-[#FFFFFF] border border-[#E5DDD1] rounded-xl shadow-lg py-1 text-xs animate-in fade-in duration-150">
          <button
            onClick={onDelete}
            className="w-full px-3 py-1.5 text-left text-red-600 hover:bg-[#FDF2F2] flex items-center gap-1.5 transition cursor-pointer font-medium"
          >
            <Trash2 className="w-3 h-3" />
            <span>Delete Note</span>
          </button>
        </div>
      )}
    </div>
  </div>
);
