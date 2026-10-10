import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
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
    <div className="flex flex-col h-full bg-[#0c0d11] overflow-hidden text-[#e2e8f0]">
      {/* Chat Header */}
      <div className="p-3.5 border-b border-[#181a22] bg-[#0f1015] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#211d33] text-purple-400 flex items-center justify-center font-bold">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white leading-none">Video Q&A Assistant</h2>
            <p className="text-[10px] text-[#64748b] mt-0.5">Isolated memory for this video</p>
          </div>
        </div>

        {/* Right Header Buttons: Guardrail badge & Close / Expand buttons */}
        <div className="flex items-center gap-1.5">
          <div
            className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#181922] text-purple-300 border border-[#2a2d3d] text-[10px] font-medium"
            title="Strictly grounded in video transcripts. Off-topic questions will be politely declined."
          >
            <ShieldCheck className="w-3 h-3 text-purple-400" />
            <span>Topic Isolated</span>
          </div>

          {onMaximizeChat && (
            <button
              onClick={onMaximizeChat}
              className="p-1 rounded-md text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1a1c24] transition cursor-pointer"
              title={isMaximized ? 'Restore split view' : 'Maximize chat'}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}

          {onCloseChat && (
            <button
              onClick={onCloseChat}
              className="p-1 rounded-md text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1a1c24] transition cursor-pointer"
              title="Close chat pane (Full screen notes)"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scope banner */}
      <div className="bg-[#14121e] border-b border-[#251f38] px-4 py-1.5 text-[10px] text-purple-300 flex items-center gap-2 shrink-0">
        <span className="font-semibold uppercase tracking-wider text-[9px] bg-purple-900/60 px-1 py-0.5 rounded text-purple-200 border border-purple-700/40">
          Scope
        </span>
        <span className="truncate">Answers strictly using this video's examples & concepts.</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-11 h-11 rounded-2xl bg-[#1d192f] text-purple-400 border border-[#2e274b] flex items-center justify-center shadow-inner">
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
                <Lightbulb className="w-3 h-3 text-amber-400" />
                <span>Suggested prompts</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-left">
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSuggestedPrompt(p)}
                    className="p-2 rounded-xl border border-[#1f212a] bg-[#121319] hover:border-purple-600/50 hover:bg-[#1a1b24] text-xs text-[#cbd5e1] transition cursor-pointer text-left shadow-xs flex items-center justify-between group"
                  >
                    <span className="line-clamp-1">{p}</span>
                    <Send className="w-3 h-3 text-[#475569] group-hover:text-purple-400 transition shrink-0 ml-1" />
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
                        ? 'bg-[#2a2d3d] text-white'
                        : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xs'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs md:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-tr-xs shadow-xs'
                        : 'bg-[#14151b] text-[#cbd5e1] border border-[#22242e] rounded-tl-xs shadow-xs'
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
                              <strong className="font-semibold text-white bg-[#1e1c2c] px-1 py-0.5 rounded text-[0.95em]">
                                {children}
                              </strong>
                            ),
                            code: ({ children, className }) => {
                              const isInline = !className;
                              if (isInline) {
                                return (
                                  <code className="bg-[#1e202c] text-purple-300 px-1 py-0.5 rounded text-xs font-mono">
                                    {children}
                                  </code>
                                );
                              }
                              return (
                                <pre className="bg-[#090a0d] text-[#e2e8f0] p-2.5 rounded-lg overflow-x-auto text-xs font-mono my-2 border border-[#1f212a]">
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
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-[#14151b] border border-[#22242e] rounded-2xl rounded-tl-xs px-3.5 py-2 text-xs text-[#94a3b8] shadow-xs flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
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
        className="p-3 border-t border-[#181a22] bg-[#0f1015] flex items-center gap-2 shrink-0"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about "${videoTitle.slice(0, 30)}..."`}
          disabled={isSending}
          className="flex-1 bg-[#15161d] border border-[#252834] text-white placeholder-[#64748b] text-xs rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-purple-500 transition disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 active:scale-95 disabled:opacity-40 text-white p-2.5 rounded-xl transition shadow-md shadow-purple-950/40 cursor-pointer"
          title="Send message"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
};
