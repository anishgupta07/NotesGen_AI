import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { HeroInput } from './components/HeroInput';
import { NotesViewer } from './components/NotesViewer';
import { ChatBox } from './components/ChatBox';
import { AuthModal } from './components/AuthModal';
import { KeySettingsModal } from './components/KeySettingsModal';
import {
  fetchChats,
  fetchChatById,
  requestGenerateNotes,
  requestGenerateFromFile,
  sendChatMessage,
  deleteChatSession,
  fetchCurrentUser,
  removeToken,
  getToken,
} from './api';
import { ChatSummary, ChatDetail, ChatMessage, User } from './types';
import { getChatTitle } from './utils/chatTitle';
import {
  Loader2,
  AlertCircle,
  X,
  MessageSquare,
} from 'lucide-react';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

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
  // Sidebar state: open by default on desktop, collapsible for full screen
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Check auth and load user profile on startup
  useEffect(() => {
    initAuthAndChats();
  }, []);

  const initAuthAndChats = async () => {
    const token = getToken();
    if (!token) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      const user = await fetchCurrentUser();
      setCurrentUser(user);
      loadChatList();
    } catch {
      removeToken();
      setCurrentUser(null);
      setIsAuthModalOpen(true);
    }
  };

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

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    loadChatList();
    if (!user.has_groq_key) {
      setIsKeyModalOpen(true);
    }
  };

  const handleLogout = () => {
    removeToken();
    setCurrentUser(null);
    setChats([]);
    setActiveChatId(null);
    setActiveChat(null);
    setIsAuthModalOpen(true);
  };

  const handleKeyUpdated = async () => {
    try {
      const user = await fetchCurrentUser();
      setCurrentUser(user);
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
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
      setViewMode('notes');
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
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!currentUser.has_groq_key) {
      setIsKeyModalOpen(true);
      setErrorMessage('Please configure your free Groq API key in Settings to generate notes.');
      return;
    }

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
          user_id: result.user_id,
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
      setViewMode('notes');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error generating notes. Please check the URL or try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate new notes from direct Audio / Video file upload
  const handleGenerateFromFile = async (
    file: File,
    language: 'hinglish' | 'english',
    style: 'detailed' | 'cheatsheet'
  ) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!currentUser.has_groq_key) {
      setIsKeyModalOpen(true);
      setErrorMessage('Please configure your free Groq API key in Settings to generate notes.');
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMessage(null);
      const result = await requestGenerateFromFile(file, language, style);

      setChats((prev) => [
        {
          id: result.id,
          user_id: result.user_id,
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
      setViewMode('notes');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error generating notes from file.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Send a chat message for the active video session
  const handleSendChatMessage = async (question: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!currentUser.has_groq_key) {
      setIsKeyModalOpen(true);
      return;
    }
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
    <div className="flex h-screen w-screen overflow-hidden bg-[#FBF9F5] text-[#1C1917] font-['Plus_Jakarta_Sans',sans-serif] antialiased">
      {/* Auth & Key Management Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
      <KeySettingsModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        hasGroqKey={Boolean(currentUser?.has_groq_key)}
        hasLangsmithKey={Boolean(currentUser?.has_langsmith_key)}
        onKeyUpdated={handleKeyUpdated}
      />

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar: Private chat history per user */}
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
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden bg-[#FBF9F5]">
        {/* Top Navigation */}
        <TopNav
          isSidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          activeChat={activeChat}
          onNewChat={handleNewChat}
          viewMode={viewMode}
          onSetViewMode={setViewMode}
          user={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenKeySettings={() => setIsKeyModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mx-6 mt-3 p-3 bg-[#FEF2F2] border border-[#FCA5A5] text-red-700 rounded-xl text-xs md:text-sm flex items-center justify-between gap-3 shadow-xs shrink-0 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 text-[#B83826] shrink-0" />
              <span className="font-medium truncate">{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-[#B83826] hover:text-[#A32E1E] p-1 cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 overflow-hidden relative">
          {isGenerating ? (
            /* Loading State while generating notes */
            <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in duration-300">
              <div className="w-12 h-12 rounded-2xl bg-[#F2EFE9] text-[#B83826] border border-[#E5DDD1] flex items-center justify-center shadow-xs">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h2 className="text-xl font-serif font-bold text-[#1C1917] tracking-tight">
                  Generating study notes...
                </h2>
                <p className="text-xs md:text-sm text-[#78716C] leading-relaxed">
                  Extracting instructor's exact analogies, covering concepts topic-wise, and compiling structured notes in flowing language.
                </p>
              </div>
              <div className="text-[11px] font-semibold text-[#8C827A] bg-[#FAF8F5] border border-[#E5DDD1] px-3.5 py-1.5 rounded-full">
                Powered by Groq High-Speed Inference
              </div>
            </div>
          ) : isLoadingDetail ? (
            /* Loading State when loading an existing chat */
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#B83826]" />
            </div>
          ) : activeChat ? (
            /* Active Notes & Chat View */
            <div className="h-full flex overflow-hidden relative">
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
                <NotesViewer
                  chat={activeChat}
                  onOpenChat={() => setViewMode('split')}
                  isChatOpen={viewMode === 'split'}
                />
              </div>

              {/* Chat Pane */}
              <div
                className={`h-full overflow-hidden transition-all duration-200 ${
                  viewMode === 'split'
                    ? 'w-full lg:w-[42%] block border-l border-[#E5DDD1]'
                    : viewMode === 'chat'
                    ? 'w-full block'
                    : 'hidden'
                }`}
              >
                <ChatBox
                  chatId={activeChat.id}
                  videoTitle={getChatTitle(activeChat)}
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
                  className="absolute bottom-6 right-6 px-4 py-2.5 bg-[#B83826] hover:bg-[#A32E1E] text-white rounded-full shadow-lg font-medium text-xs flex items-center gap-2 transition hover:scale-105 active:scale-95 cursor-pointer z-10"
                  title="Open doubt assistant"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Ask Doubt ({activeChat.messages.length})</span>
                </button>
              )}
            </div>
          ) : (
            /* Home / Hero View */
            <div className="h-full overflow-y-auto">
              <HeroInput
                onGenerate={handleGenerateNotes}
                onGenerateFile={handleGenerateFromFile}
                isLoading={isGenerating}
                recentChats={chats}
                onSelectChat={handleSelectChat}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
