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
  Menu,
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      // We don't block the UI if server is just starting
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
      setSidebarOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load chat');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Start a new chat (return to Hero view)
  const handleNewChat = () => {
    setActiveChatId(null);
    setActiveChat(null);
    setErrorMessage(null);
    setSidebarOpen(false);
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
      setErrorMessage(err.message || 'Failed to delete chat');
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
      // Remove optimistic message on failure
      setActiveChat((prev) =>
        prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== tempUserMsg.id) } : null
      );
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8f9fc] text-slate-900 font-sans antialiased">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Desktop + Drawer on mobile) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform md:relative md:translate-x-0 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Top Navigation */}
        <div className="relative">
          <TopNav />
          {/* Mobile hamburger button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden cursor-pointer"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs md:text-sm flex items-center justify-between gap-3 shadow-xs shrink-0 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium truncate">{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer shrink-0"
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
              <div className="w-16 h-16 rounded-2xl bg-purple-600/10 text-purple-600 border border-purple-500/20 flex items-center justify-center shadow-lg shadow-purple-500/10">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Synthesizing Video Notes...
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Verifying educational content, analyzing timeline chapters, extracting the instructor's analogies, and formatting structured notes.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-3.5 py-1.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>Powered by Groq High-Speed LLM</span>
              </div>
            </div>
          ) : isLoadingDetail ? (
            /* Loading State when loading an existing chat */
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : activeChat ? (
            /* Active Chat View (Split View / Tabs) */
            <div className="h-full flex flex-col">
              {/* Sub-header view switcher bar */}
              <div className="px-6 py-2 border-b border-slate-200/80 bg-white/60 backdrop-blur-xs flex items-center justify-between text-xs shrink-0">
                <button
                  onClick={handleNewChat}
                  className="flex items-center gap-1.5 text-slate-600 hover:text-purple-700 font-semibold transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Generate Another Note</span>
                </button>

                {/* Mode toggle */}
                <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/70">
                  <button
                    onClick={() => setViewMode('split')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                      viewMode === 'split'
                        ? 'bg-white text-purple-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Columns2 className="w-3.5 h-3.5" />
                    <span>Split View</span>
                  </button>
                  <button
                    onClick={() => setViewMode('notes')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                      viewMode === 'notes'
                        ? 'bg-white text-purple-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Notes</span>
                  </button>
                  <button
                    onClick={() => setViewMode('chat')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                      viewMode === 'chat'
                        ? 'bg-white text-purple-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat ({activeChat.messages.length})</span>
                  </button>
                </div>
              </div>

              {/* Panes Container */}
              <div className="flex-1 flex overflow-hidden">
                {/* Notes Pane */}
                <div
                  className={`h-full overflow-hidden transition-all duration-200 ${
                    viewMode === 'split'
                      ? 'w-full lg:w-[58%] block'
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
                      ? 'w-full lg:w-[42%] block border-l border-slate-200/80'
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
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Home / Hero View (Mockup matching) */
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
