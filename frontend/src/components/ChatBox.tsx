import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Shield,
  Loader2,
  Lightbulb,
  X,
  Maximize2,
} from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatBoxProps {
  chatId: string;
  videoTitle: string;
  messages: ChatMessage[];
  onSendMessage: (question: string) => Promise<void>;
  isSending: boolean;
  onCloseChat?: () => void;
  onMaximizeChat?: () => void;
  isMaximized?: boolean;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  videoTitle,
  messages,
  onSendMessage,
  isSending,
  onCloseChat,
  onMaximizeChat,
  isMaximized,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = input.trim();
    if (!query || isSending) return;

    setInput('');
    await onSendMessage(query);
  };

  const handleSuggestedPrompt = (prompt: string) => {
    if (isSending) return;
    onSendMessage(prompt);
  };

  const suggestedPrompts = [
    'Video ke core concepts ko simple Hinglish mein samjhao',
    'Instructor ne isme kya real-life example diya tha?',
    'Give me 3 practice quiz questions with solutions',
    'Timeline 00:00 se 05:00 ka summary do',
  ];

  return (
    <div className="flex flex-col h-full bg-[#0a0b0e] overflow-hidden text-[#f1f3f7] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Chat Header */}
      <div className="p-3.5 border-b border-[#181922] bg-[#0d0e13] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#ff2442] text-white flex items-center justify-center font-bold shadow-sm shadow-red-950/50">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white leading-none">Video Q&A Assistant</h2>
            <p className="text-[10px] text-[#64748b] mt-0.5">Isolated memory for this video</p>
          </div>
        </div>

        {/* Right Header Buttons */}
        <div className="flex items-center gap-1.5">
          <div
            className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1b0d12] text-[#ff4d66] border border-[#ff2442]/30 text-[10px] font-medium"
            title="Strictly grounded in video transcripts. Off-topic questions will be politely declined."
          >
            <Shield className="w-3 h-3 text-[#ff2442]" />
            <span>Topic Isolated</span>
          </div>

          {onMaximizeChat && (
            <button
              onClick={onMaximizeChat}
              className="p-1 rounded-md text-[#64748b] hover:text-[#f1f3f7] hover:bg-[#161720] transition cursor-pointer"
              title={isMaximized ? 'Restore split view' : 'Maximize chat'}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}

          {onCloseChat && (
            <button
              onClick={onCloseChat}
              className="p-1 rounded-md text-[#64748b] hover:text-[#f1f3f7] hover:bg-[#161720] transition cursor-pointer"
              title="Close chat pane (Full screen notes)"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scope banner with subtle red badge */}
      <div className="bg-[#140b0f] border-b border-[#28131a] px-4 py-1.5 text-[10px] text-[#ff4d66] flex items-center gap-2 shrink-0">
        <span className="font-bold uppercase tracking-wider text-[9px] bg-[#ff2442]/20 px-1 py-0.5 rounded text-[#ff2442] border border-[#ff2442]/40">
          Scope
        </span>
        <span className="truncate">Answers strictly using this video's examples & concepts.</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-11 h-11 rounded-2xl bg-[#1e0e13] text-[#ff2442] border border-[#3b1721] flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="max-w-xs space-y-1">
              <h3 className="text-xs font-bold text-white">Ask questions about this video</h3>
              <p className="text-[11px] text-[#64748b] leading-relaxed">
                Need concept clarity in simple Hinglish or exam hints? Ask below.
              </p>
            </div>

            {/* Suggested quick prompts */}
            <div className="w-full max-w-sm pt-2 space-y-1.5">
              <div className="text-[10px] font-semibold text-[#64748b] flex items-center gap-1 justify-center">
                <Lightbulb className="w-3 h-3 text-[#ff2442]" />
                <span>Suggested prompts</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-left">
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSuggestedPrompt(p)}
                    className="p-2 rounded-xl border border-[#1d1f2a] bg-[#121319] hover:border-[#ff2442]/40 hover:bg-[#1a1c24] text-xs text-[#cbd5e1] transition cursor-pointer text-left shadow-xs flex items-center justify-between group"
                  >
                    <span className="line-clamp-1">{p}</span>
                    <Send className="w-3 h-3 text-[#475569] group-hover:text-[#ff2442] transition shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      isUser
                        ? 'bg-[#212330] text-white'
                        : 'bg-[#ff2442] text-white shadow-xs'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs md:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[#290c12] text-white border border-[#ff2442]/30 rounded-tr-xs shadow-xs'
                        : 'bg-[#121319] text-[#cbd5e1] border border-[#1e2029] rounded-tl-xs shadow-xs'
                    }`}
                  >
                    {isUser ? (
                      <div className="whitespace-pre-wrap select-text">{msg.content}</div>
                    ) : (
                      <div className="select-text space-y-2">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="my-1.5 leading-relaxed">{children}</p>,
                            ul: ({ children }) => (
                              <ul className="list-disc pl-4 my-1.5 space-y-1">{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal pl-4 my-1.5 space-y-1">{children}</ol>
                            ),
                            li: ({ children }) => <li>{children}</li>,
                            strong: ({ children }) => (
                              <strong className="font-semibold text-white bg-[#1d1f2b] px-1 py-0.5 rounded text-[0.95em]">
                                {children}
                              </strong>
                            ),
                            code: ({ children, className }) => {
                              const isInline = !className;
                              if (isInline) {
                                return (
                                  <code className="bg-[#1c1d28] text-[#ff4d66] px-1 py-0.5 rounded text-xs font-mono">
                                    {children}
                                  </code>
                                );
                              }
                              return (
                                <pre className="bg-[#090a0d] text-[#f1f3f7] p-2.5 rounded-lg overflow-x-auto text-xs font-mono my-2 border border-[#1c1e27]">
                                  <code>{children}</code>
                                </pre>
                              );
                            },
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Thinking / Sending indicator */}
            {isSending && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#ff2442] text-white flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-[#121319] border border-[#1e2029] rounded-2xl rounded-tl-xs px-3.5 py-2 text-xs text-[#848c9c] shadow-xs flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ff2442]" />
                  <span>Checking video knowledge & generating response...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-[#181922] bg-[#0c0d12] flex items-center gap-2 shrink-0"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about "${videoTitle.slice(0, 30)}..."`}
          disabled={isSending}
          className="flex-1 bg-[#14151c] border border-[#20222e] text-white placeholder-[#64748b] text-xs rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-[#ff2442]/60 transition disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="bg-[#ff2442] hover:bg-[#e61b36] active:scale-95 disabled:opacity-40 text-white p-2.5 rounded-xl transition shadow-md shadow-red-950/60 cursor-pointer"
          title="Send message"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
};
