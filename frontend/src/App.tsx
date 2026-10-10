import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { HeroInput } from './components/HeroInput';
import { NotesViewer } from './components/NotesViewer';
import { ChatBox } from './components/ChatBox';
import {
  fetchChats,
  fetchChatById,
  requestGenerateNotes,
  sendChatMessage,
  deleteChatSession,
} from './api';
import { ChatSummary, ChatDetail, ChatMessage } from './types';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  X,
  Columns2,
  FileText,
  MessageSquare,
  ArrowLeft,
  Maximize2,
  PanelLeft,
} from 'lucide-react';

export const App: React.FC = () => {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<ChatDetail | null>(null);

  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // View mode when a chat is open: 'split' | 'notes' | 'chat'
  const [viewMode, setViewMode] = useState<'split' | 'notes' | 'chat'>('split');
  // Sidebar state: open by default on desktop, collapsible for 100% full screen
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load chat history on initial mount
  useEffect(() => {
    loadChatList();
  }, []);

  const loadChatList = async () => {
    try {
      setIsLoadingChats(true);
      const list = await fetchChats();
      setChats(list);
    } catch (err: any) {
      console.error('Failed to fetch chats:', err);
    } finally {
      setIsLoadingChats(false);
    }
  };

  // Select an existing chat session
  const handleSelectChat = async (id: string) => {
    try {
      setActiveChatId(id);
      setIsLoadingDetail(true);
      setErrorMessage(null);
      const detail = await fetchChatById(id);
      setActiveChat(detail);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load note');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Start a new chat (return to Hero view)
  const handleNewChat = () => {
    setActiveChatId(null);
    setActiveChat(null);
    setErrorMessage(null);
  };

  // Delete chat session
  const handleDeleteChat = async (id: string) => {
    try {
      await deleteChatSession(id);
      setChats((prev) => prev.filter((c) => c.id !== id));
      if (activeChatId === id) {
        handleNewChat();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete note');
    }
  };

  // Generate new notes from YouTube URL
  const handleGenerateNotes = async (
    url: string,
    language: 'hinglish' | 'english',
    style: 'detailed' | 'cheatsheet',
    timelineMode: 'full' | 'custom' = 'full',
    startTime?: string,
    endTime?: string
  ) => {
    try {
      setIsGenerating(true);
      setErrorMessage(null);
      const result = await requestGenerateNotes({
        url,
        language,
        style,
        timeline_mode: timelineMode,
        start_time: startTime,
        end_time: endTime,
      });

      // Update state with newly created chat
      setChats((prev) => [
        {
          id: result.id,
          title: result.title,
          video_url: result.video_url,
          language: result.language,
          note_style: result.note_style,
          created_at: result.created_at,
        },
        ...prev.filter((c) => c.id !== result.id),
      ]);
      setActiveChatId(result.id);
      setActiveChat(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error generating notes. Please check the URL or try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Send a chat message for the active video session
  const handleSendChatMessage = async (question: string) => {
    if (!activeChat) return;

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      chat_id: activeChat.id,
      role: 'user',
      content: question,
      created_at: new Date().toISOString(),
    };

    setActiveChat((prev) => (prev ? { ...prev, messages: [...prev.messages, tempUserMsg] } : null));

    try {
      setIsSendingChat(true);
      const res = await sendChatMessage(activeChat.id, question);
      // Replace with confirmed messages from backend
      setActiveChat((prev) => {
        if (!prev) return null;
        const filtered = prev.messages.filter((m) => m.id !== tempUserMsg.id);
        return {
          ...prev,
          messages: [...filtered, res.user_message, res.assistant_message],
        };
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send question');
      setActiveChat((prev) =>
        prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== tempUserMsg.id) } : null
      );
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0c0e] text-[#e2e8f0] font-sans antialiased">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar: Smooth transition for collapsible full-screen reading */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform md:relative md:translate-x-0 transition-all duration-300 ease-in-out shrink-0 ${
          sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 overflow-hidden'
        }`}
      >
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          onToggleSidebar={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden bg-[#0b0c0e]">
        {/* Top Navigation */}
        <TopNav
          isSidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          activeTitle={activeChat?.title}
        />

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mx-6 mt-3 p-3 bg-[#201015] border border-[#481c25] text-rose-300 rounded-xl text-xs md:text-sm flex items-center justify-between gap-3 shadow-lg shrink-0 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-medium truncate">{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-200 p-1 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 overflow-hidden relative">
          {isGenerating ? (
            /* Loading State while generating notes */
            <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-5 animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-2xl bg-[#191629] text-purple-400 border border-[#312550] flex items-center justify-center shadow-2xl shadow-purple-950/60">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Generating Study Notes...
                </h2>
                <p className="text-xs md:text-sm text-[#94a3b8] leading-relaxed">
                  Checking educational guardrail, structuring timeline flow, extracting instructor's real analogies, and compiling key points to note down.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-300 bg-[#171424] border border-[#2d214a] px-3.5 py-1.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-purple-400" />
                <span>Powered by Groq High-Speed Inference</span>
              </div>
            </div>
          ) : isLoadingDetail ? (
            /* Loading State when loading an existing chat */
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-purple-400" />
            </div>
          ) : activeChat ? (
            /* Active Chat View (Split View / Full-Screen Notes / Full-Screen Chat) */
            <div className="h-full flex flex-col">
              {/* Sub-header view switcher bar matching dark aesthetic */}
              <div className="px-5 py-2 border-b border-[#181a20] bg-[#0d0e12] flex items-center justify-between text-xs shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleNewChat}
                    className="flex items-center gap-1.5 text-[#94a3b8] hover:text-white font-medium transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>New Video</span>
                  </button>

                  {!sidebarOpen && (
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="hidden md:flex items-center gap-1 text-[11px] text-[#64748b] hover:text-white bg-[#15161d] border border-[#232532] px-2 py-0.5 rounded-md transition cursor-pointer"
                    >
                      <PanelLeft className="w-3 h-3 text-purple-400" />
                      <span>Show Sidebar</span>
                    </button>
                  )}
                </div>

                {/* Mode toggle pills */}
                <div className="flex items-center bg-[#13141a] p-0.5 rounded-lg border border-[#22242c]">
                  <button
                    onClick={() => setViewMode('split')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium text-xs transition cursor-pointer ${
                      viewMode === 'split'
                        ? 'bg-[#222532] text-white shadow-xs'
                        : 'text-[#64748b] hover:text-[#cbd5e1]'
                    }`}
                  >
                    <Columns2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Split View</span>
                  </button>

                  <button
                    onClick={() => setViewMode('notes')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium text-xs transition cursor-pointer ${
                      viewMode === 'notes'
                        ? 'bg-[#222532] text-white shadow-xs'
                        : 'text-[#64748b] hover:text-[#cbd5e1]'
                    }`}
                    title="Full screen notes access"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Full Screen Notes</span>
                  </button>

                  <button
                    onClick={() => setViewMode('chat')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium text-xs transition cursor-pointer ${
                      viewMode === 'chat'
                        ? 'bg-[#222532] text-white shadow-xs'
                        : 'text-[#64748b] hover:text-[#cbd5e1]'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat ({activeChat.messages.length})</span>
                  </button>
                </div>
              </div>

              {/* Panes Container with Full Screen flexibility */}
              <div className="flex-1 flex overflow-hidden relative">
                {/* Notes Pane */}
                <div
                  className={`h-full overflow-hidden transition-all duration-200 ${
                    viewMode === 'split'
                      ? 'w-full lg:w-[60%] block'
                      : viewMode === 'notes'
                      ? 'w-full block'
                      : 'hidden'
                  }`}
                >
                  <NotesViewer chat={activeChat} />
                </div>

                {/* Chat Pane */}
                <div
                  className={`h-full overflow-hidden transition-all duration-200 ${
                    viewMode === 'split'
                      ? 'w-full lg:w-[40%] block border-l border-[#181a22]'
                      : viewMode === 'chat'
                      ? 'w-full block'
                      : 'hidden'
                  }`}
                >
                  <ChatBox
                    chatId={activeChat.id}
                    videoTitle={activeChat.title}
                    messages={activeChat.messages}
                    onSendMessage={handleSendChatMessage}
                    isSending={isSendingChat}
                    onCloseChat={() => setViewMode('notes')}
                    onMaximizeChat={() => setViewMode(viewMode === 'chat' ? 'split' : 'chat')}
                    isMaximized={viewMode === 'chat'}
                  />
                </div>

                {/* Floating Open Chat button when Notes are in Full Screen mode */}
                {viewMode === 'notes' && (
                  <button
                    onClick={() => setViewMode('split')}
                    className="absolute bottom-6 right-6 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white rounded-xl shadow-xl shadow-purple-950/70 font-semibold text-xs flex items-center gap-2 border border-purple-500/30 transition hover:scale-105 active:scale-95 cursor-pointer z-10"
                    title="Open side chat assistant"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Open Chat ({activeChat.messages.length})</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Home / Hero View */
            <div className="h-full overflow-y-auto">
              <HeroInput onGenerate={handleGenerateNotes} isLoading={isGenerating} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
