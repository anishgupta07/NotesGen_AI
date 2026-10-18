import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Loader2,
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
    'Heap kyun use karte hain?',
    'Time complexity batao',
    'Iska simple intuition samjhao',
    'Video mein sir ne kya example diya tha?',
  ];

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] overflow-hidden text-[#1C1917] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Chat Section Header */}
      <div className="p-4 border-b border-[#E5DDD1] bg-[#FAF8F5] flex flex-col gap-0.5 shrink-0 select-none">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#8C827A]">
          ASKING ABOUT
        </div>
        <div className="text-xs md:text-sm font-semibold text-[#1C1917] truncate">
          {videoTitle ? `${videoTitle.slice(0, 40)}` : 'Video Questions & Doubts'}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="max-w-xs space-y-1">
              <h3 className="text-sm font-bold text-[#1C1917]">Ask anything about this video</h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Doubts, intuition in simple Hinglish, or formula explanations.
              </p>
            </div>

            {/* Quick Prompts */}
            <div className="w-full max-w-sm space-y-1.5 pt-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] text-left">
                SUGGESTIONS
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSuggestedPrompt(p)}
                    className="px-3 py-1.5 rounded-full bg-[#FFFFFF] border border-[#DDD6C8] hover:border-[#B83826] hover:bg-[#F2EFE9] text-xs text-[#1C1917] transition cursor-pointer text-left shadow-2xs"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              const isLastAssistantMessage =
                !isUser && index === messages.length - 1;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}
                >
                  {/* User Bubble */}
                  {isUser ? (
                    <div className="max-w-[85%] rounded-2xl rounded-tr-xs px-4 py-2.5 bg-[#1E1B18] text-[#FFFFFF] text-xs md:text-sm leading-relaxed shadow-sm whitespace-pre-wrap select-text">
                      {msg.content}
                    </div>
                  ) : (
                    /* Assistant Message: Clean natural text flowing in the pane */
                    <div className="max-w-[95%] text-xs md:text-sm text-[#1C1917] leading-relaxed select-text space-y-2">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="my-1.5 leading-relaxed">{children}</p>,
                          ul: ({ children }) => (
                            <ul className="list-disc pl-4 my-1.5 space-y-1 marker:text-[#B83826]">{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal pl-4 my-1.5 space-y-1 marker:text-[#B83826]">{children}</ol>
                          ),
                          li: ({ children }) => <li>{children}</li>,
                          strong: ({ children }) => (
                            <strong className="font-semibold text-[#1C1917]">
                              {children}
                            </strong>
                          ),
                          code: ({ children, className }) => {
                            const isInline = !className;
                            if (isInline) {
                              return (
                                <code className="bg-[#F2EFE9] text-[#B83826] px-1 py-0.5 rounded text-xs font-mono">
                                  {children}
                                </code>
                              );
                            }
                            return (
                              <pre className="bg-[#1E1B18] text-[#F5F5F4] p-3 rounded-xl overflow-x-auto text-xs font-mono my-2.5 shadow-xs">
                                <code>{children}</code>
                              </pre>
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>

                      {/* Quick Follow-up suggestion pills under the assistant message */}
                      {isLastAssistantMessage && !isSending && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {suggestedPrompts.slice(0, 2).map((promptText, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSuggestedPrompt(promptText)}
                              className="px-3 py-1 rounded-full bg-[#FFFFFF] border border-[#DDD6C8] hover:border-[#B83826] hover:bg-[#F2EFE9] text-[11px] text-[#1C1917] transition cursor-pointer shadow-2xs"
                            >
                              {promptText}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Sending indicator */}
            {isSending && (
              <div className="flex items-center gap-2 text-xs text-[#8C827A] pt-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B83826]" />
                <span>Answering based on video transcript...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input bar matching Image 1: [ Apna doubt likho ] [ Send ] */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-[#E5DDD1] bg-[#FAF8F5] flex items-center gap-2 shrink-0"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Apna doubt likho"
          disabled={isSending}
          className="flex-1 bg-[#FFFFFF] border border-[#DDD6C8] text-[#1C1917] placeholder-[#8C827A] text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#B83826] transition disabled:opacity-60 shadow-2xs"
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="bg-[#B83826] hover:bg-[#A32E1E] active:scale-95 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl font-medium text-xs transition shadow-xs cursor-pointer"
        >
          {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Send</span>}
        </button>
      </form>
    </div>
  );
};
