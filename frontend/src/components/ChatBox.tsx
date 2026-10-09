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
} from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatBoxProps {
  chatId: string;
  videoTitle: string;
  messages: ChatMessage[];
  onSendMessage: (question: string) => Promise<void>;
  isSending: boolean;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  videoTitle,
  messages,
  onSendMessage,
  isSending,
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
    'Summarize the core takeaways in 3 bullets',
    'What are the key concepts explained in this video?',
    'Give me 3 practice quiz questions with answers',
    'Can you explain this in simpler terms with an example?',
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50/70 overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-200 bg-white/90 backdrop-blur-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-600/10 text-purple-600 flex items-center justify-center font-bold">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 leading-none">Video Q&A Assistant</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Isolated memory for this video</p>
          </div>
        </div>

        {/* Guardrail badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60 text-[11px] font-semibold"
          title="Strictly grounded in video transcripts. Off-topic questions will be politely rejected."
        >
          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
          <span className="hidden sm:inline">Topic Guardrail Active</span>
        </div>
      </div>

      {/* Guardrail notice banner */}
      <div className="bg-amber-50/70 border-b border-amber-200/50 px-4 py-2 text-[11px] text-amber-800 flex items-center gap-2 shrink-0">
        <span className="font-semibold uppercase tracking-wider text-[10px] bg-amber-200/80 px-1.5 py-0.5 rounded text-amber-900">
          Strict Scope
        </span>
        <span>Questions are answered only using this video's content. Off-topic topics are declined.</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100/70 text-purple-600 flex items-center justify-center shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="max-w-xs space-y-1">
              <h3 className="text-sm font-bold text-slate-800">Ask questions about this video</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Need clarification, extra examples, or exam flashcards? Ask below.
              </p>
            </div>

            {/* Suggested quick prompts */}
            <div className="w-full max-w-sm pt-2 space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 justify-center">
                <Lightbulb className="w-3 h-3 text-amber-500" />
                <span>Suggested prompts</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-left">
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSuggestedPrompt(p)}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/40 text-xs text-slate-700 transition cursor-pointer text-left shadow-xs flex items-center justify-between group"
                  >
                    <span className="line-clamp-1">{p}</span>
                    <Send className="w-3 h-3 text-slate-300 group-hover:text-purple-600 transition shrink-0 ml-1" />
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
                        ? 'bg-slate-800 text-white'
                        : 'bg-purple-600 text-white shadow-xs shadow-purple-500/20'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs md:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-xs shadow-xs'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs shadow-xs'
                    }`}
                  >
                    {isUser ? (
                      <div className="whitespace-pre-wrap select-text">{msg.content}</div>
                    ) : (
                      <div className="select-text space-y-2">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="my-1.5">{children}</p>,
                            ul: ({ children }) => (
                              <ul className="list-disc pl-4 my-1.5 space-y-1">{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal pl-4 my-1.5 space-y-1">{children}</ol>
                            ),
                            li: ({ children }) => <li>{children}</li>,
                            strong: ({ children }) => (
                              <strong className="font-bold text-slate-900">{children}</strong>
                            ),
                            code: ({ children, className }) => {
                              const isInline = !className;
                              if (isInline) {
                                return (
                                  <code className="bg-slate-100 text-purple-700 px-1 py-0.5 rounded text-xs font-mono">
                                    {children}
                                  </code>
                                );
                              }
                              return (
                                <pre className="bg-slate-900 text-slate-100 p-2.5 rounded-lg overflow-x-auto text-xs font-mono my-2">
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
                <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-slate-500 shadow-xs flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
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
        className="p-3 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about "${videoTitle.slice(0, 35)}..."`}
          disabled={isSending}
          className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs md:text-sm rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-500/10 transition disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="bg-purple-600 hover:bg-purple-700 active:scale-95 disabled:opacity-40 disabled:hover:bg-purple-600 disabled:active:scale-100 text-white p-2.5 rounded-xl transition shadow-sm shadow-purple-600/20 cursor-pointer"
          title="Send message"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
};
