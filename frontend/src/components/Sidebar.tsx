import React from 'react';
import { Sparkles, Plus, Clock, FileText, Settings, Trash2 } from 'lucide-react';
import { ChatSummary } from '../types';

interface SidebarProps {
  chats: ChatSummary[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
}) => {
  // Group chats by date (Today vs Earlier)
  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const todayChats = chats.filter((c) => isToday(c.created_at));
  const earlierChats = chats.filter((c) => !isToday(c.created_at));

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });
  };

  return (
    <aside className="w-72 bg-white border-r border-slate-200/80 flex flex-col h-screen shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-600 shadow-sm shadow-purple-500/5">
          <Sparkles className="w-5 h-5 fill-purple-600/20" />
        </div>
        <div>
          <div className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent">
            NotesGen
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Turn videos into smart notes</div>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>

      {/* History Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        <div className="flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>History</span>
        </div>

        {/* Today Group */}
        {todayChats.length > 0 && (
          <div className="space-y-1">
            <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
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

        {/* Earlier / This Week Group */}
        {earlierChats.length > 0 && (
          <div className="space-y-1">
            <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
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

        {chats.length === 0 && (
          <div className="px-3 py-8 text-center text-xs text-slate-400">
            No past video notes yet.<br />Generate your first note!
          </div>
        )}
      </div>

      {/* Bottom Settings Link */}
      <div className="p-3 border-t border-slate-100">
        <button className="w-full px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-lg flex items-center gap-2.5 transition">
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Settings</span>
        </button>
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
    className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-left transition-all ${
      isActive
        ? 'bg-purple-50 text-purple-900 font-medium border border-purple-200/60 shadow-xs'
        : 'hover:bg-slate-50 text-slate-700'
    }`}
  >
    <div className="flex items-start gap-2.5 overflow-hidden pr-2">
      <FileText className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-purple-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
      <div className="overflow-hidden">
        <div className="text-xs truncate font-medium">{chat.title}</div>
        <div className="text-[10px] text-slate-400">{subtitle}</div>
      </div>
    </div>
    <button
      onClick={onDelete}
      title="Delete chat"
      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 text-slate-400 transition"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  </div>
);
