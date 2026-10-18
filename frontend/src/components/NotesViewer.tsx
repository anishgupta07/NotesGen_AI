import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  FileText,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { ChatDetail } from '../types';
import { getChatTitle } from '../utils/chatTitle';

interface NotesViewerProps {
  chat: ChatDetail;
  onOpenChat?: () => void;
  isChatOpen?: boolean;
}

interface Chapter {
  timestamp: string;
  title: string;
  id: string;
}

export const NotesViewer: React.FC<NotesViewerProps> = ({
  chat,
  onOpenChat,
  isChatOpen = false,
}) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);

  // Extract chapters from markdown headings (e.g., "## ⏱️ [00:00 - 05:00] Title" or "## [00:00] Title")
  const chapters = useMemo<Chapter[]>(() => {
    const list: Chapter[] = [];
    const lines = chat.notes.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const match = line.match(/^##\s*(?:⏱️\s*)?(?:\[?([\d:]+(?:\s*-\s*[\d:]+)?)\]?)?\s*(.*)/);
      if (match && match[2]) {
        const timestamp = match[1] ? match[1].replace(/[\[\]]/g, '').trim() : `0${list.length + 1}:00`;
        const title = match[2].trim().replace(/^\[|\]$/g, '');
        list.push({
          timestamp: timestamp.split('-')[0].trim(),
          title: title.slice(0, 35),
          id: `chapter-${list.length}`,
        });
      }
    }

    if (list.length === 0) {
      list.push(
        { timestamp: '00:00', title: 'Problem statement', id: 'chap-1' },
        { timestamp: '01:00', title: 'Core intuition', id: 'chap-2' },
        { timestamp: '03:30', title: 'Algorithm & implementation', id: 'chap-3' }
      );
    }
    return list;
  }, [chat.notes]);

  // Estimate read time
  const readTimeMinutes = useMemo(() => {
    const words = chat.notes.split(/\s+/).length;
    return Math.max(3, Math.ceil(words / 150));
  }, [chat.notes]);

  return (
    <div className="flex h-full bg-[#FBF9F5] overflow-hidden text-[#1C1917] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Left Chapter Index & Progress (Visible when Chat is closed or on wide screens) */}
      {!isChatOpen && (
        <aside className="hidden lg:flex w-56 flex-col border-r border-[#E5DDD1] bg-[#FAF8F5] p-5 shrink-0 select-none">
          {/* Metadata pill */}
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C827A] mb-4">
            {readTimeMinutes} MIN READ · {chapters.length} CHAPTERS
          </div>

          {/* Chapters list */}
          <div className="space-y-1.5 flex-1 overflow-y-auto">
            {chapters.map((chap, idx) => {
              const isActive = activeChapterIndex === idx;
              return (
                <button
                  key={chap.id}
                  onClick={() => setActiveChapterIndex(idx)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition cursor-pointer flex flex-col gap-0.5 ${
                    isActive
                      ? 'bg-[#EDE7DE] text-[#1C1917] font-semibold border border-[#D5CDC0] shadow-2xs'
                      : 'text-[#78716C] hover:bg-[#F2EFE9] hover:text-[#1C1917]'
                  }`}
                >
                  <span className="text-[11px] font-mono text-[#B83826] font-semibold">
                    {chap.timestamp}
                  </span>
                  <span className="truncate leading-tight">{chap.title}</span>
                </button>
              );
            })}
          </div>

          {/* Reading progress indicator */}
          <div className="pt-4 border-t border-[#E5DDD1] mt-auto">
            <div className="flex items-center justify-between text-[11px] text-[#8C827A] mb-1.5 font-medium">
              <span>{Math.round(((activeChapterIndex + 1) / chapters.length) * 100)}% read</span>
            </div>
            <div className="w-full h-1 bg-[#E5DDD1] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#B83826] rounded-full transition-all duration-300"
                style={{
                  width: `${((activeChapterIndex + 1) / chapters.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </aside>
      )}

      {/* Center: Main Scrollable Notes Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 select-text">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header Badges */}
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase text-[#B83826]">
            <span>{chat.note_style === 'cheatsheet' ? 'CHEAT SHEET' : 'DETAILED NOTES'}</span>
            <span>·</span>
            <span>{chat.language === 'hinglish' ? 'HINGLISH' : 'ENGLISH'}</span>
          </div>

          {/* Note Title */}
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1C1917] tracking-tight leading-tight">
            {getChatTitle(chat)}
          </h1>

          {/* Subtitle / summary line */}
          <p className="text-base font-serif italic text-[#78716C] leading-relaxed">
            {chat.language === 'hinglish'
              ? 'Complete concept breakdown with instructor’s analogies and crux points to note down.'
              : 'Complete educational breakdown with core analogies, concept crux, and key points.'}
          </p>

          {/* Raw Transcript Collapsible Bar */}
          {chat.transcript && (
            <div className="pt-2 pb-2 border-b border-[#E5DDD1]">
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="text-xs font-semibold text-[#B83826] hover:text-[#A32E1E] flex items-center gap-1.5 cursor-pointer transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{showTranscript ? 'Hide raw transcript' : 'View raw transcript'}</span>
                {showTranscript ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showTranscript && (
                <div className="mt-3 p-3.5 bg-[#FAF8F5] border border-[#E5DDD1] rounded-xl text-xs text-[#57534E] max-h-48 overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed select-text">
                  {chat.transcript}
                </div>
              )}
            </div>
          )}

          {/* Rendered Markdown Article */}
          <article className="space-y-5 text-[#292524] leading-relaxed">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#1C1917] mt-8 mb-3 tracking-tight">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-[#1C1917] mt-8 mb-3 tracking-tight flex items-baseline gap-2">
                    <span className="text-[#B83826] font-mono text-sm md:text-base font-semibold">
                      ⏱️
                    </span>
                    <span>{children}</span>
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base md:text-lg font-serif font-bold text-[#1C1917] mt-5 mb-2">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-sm md:text-base text-[#292524] leading-[1.8] my-3">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-5 my-3 space-y-2 text-sm md:text-base text-[#292524]">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-5 my-3 space-y-2 text-sm md:text-base text-[#292524]">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-[1.7] marker:text-[#B83826]">{children}</li>
                ),
                strong: ({ children }) => {
                  const str = String(children);
                  // Highlight key terms with amber pill like in screenshots
                  return (
                    <strong className="font-semibold text-[#78350F] bg-[#FEE7B8] px-1 py-0.2 rounded">
                      {str}
                    </strong>
                  );
                },
                blockquote: ({ children }) => (
                  <div className="my-5 p-4 bg-[#FFFFFF] border border-[#E5DDD1] rounded-2xl shadow-2xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#B83826] mb-1.5">
                      YAAD RAKHO / KEY TAKEAWAY
                    </div>
                    <div className="text-sm text-[#1C1917] font-serif italic leading-relaxed">
                      {children}
                    </div>
                  </div>
                ),
                code: ({ children, className }) => {
                  const isInline = !className;
                  if (isInline) {
                    return (
                      <code className="bg-[#F2EFE9] text-[#B83826] px-1.5 py-0.5 rounded text-xs font-mono border border-[#E5DDD1]">
                        {children}
                      </code>
                    );
                  }
                  return (
                    <pre className="bg-[#1E1B18] text-[#F5F5F4] p-4 rounded-2xl overflow-x-auto text-xs md:text-sm font-mono my-4 shadow-sm">
                      <code>{children}</code>
                    </pre>
                  );
                },
                hr: () => <hr className="my-8 border-[#E5DDD1]" />,
                table: ({ children }) => (
                  <div className="overflow-x-auto my-5 border border-[#E5DDD1] rounded-xl bg-[#FFFFFF]">
                    <table className="w-full text-left text-sm border-collapse">{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="bg-[#FAF8F5] p-3 font-semibold text-[#1C1917] border-b border-[#E5DDD1]">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="p-3 border-b border-[#F2EFE9] text-[#292524]">{children}</td>
                ),
              }}
            >
              {chat.notes}
            </ReactMarkdown>
          </article>
        </div>
      </div>

      {/* Right Column: Quick Check & Section Doubt Trigger (Shown in full notes view) */}
      {!isChatOpen && onOpenChat && (
        <aside className="hidden xl:flex w-72 flex-col p-6 border-l border-[#E5DDD1] bg-[#FAF8F5] shrink-0 space-y-4 select-none">
          {/* Quick Check Card */}
          <div className="bg-[#FFFFFF] border border-[#E5DDD1] rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8C827A]">
              <HelpCircle className="w-3.5 h-3.5 text-[#B83826]" />
              <span>QUICK CHECK</span>
            </div>
            <p className="text-xs font-semibold text-[#1C1917] leading-snug">
              Distance compare karte waqt sqrt kyun skip kar sakte hain?
            </p>

            <div className="space-y-1.5 pt-1">
              {[
                'sqrt order change nahi karta',
                'sqrt slow hota hai bas',
              ].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSelectedQuizOption(opt)}
                  className={`w-full p-2 rounded-xl text-left text-xs transition cursor-pointer border flex items-center justify-between ${
                    selectedQuizOption === opt
                      ? 'bg-[#FAF8F5] border-[#B83826] text-[#B83826] font-semibold'
                      : 'bg-[#FAF8F5] border-[#E5DDD1] text-[#57534E] hover:border-[#D5CDC0]'
                  }`}
                >
                  <span>{opt}</span>
                  {selectedQuizOption === opt && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#B83826]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Primary CTA: Ask a doubt about this section */}
          <button
            onClick={onOpenChat}
            className="w-full py-3 px-4 bg-[#B83826] hover:bg-[#A32E1E] text-white rounded-xl font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask a doubt about this section</span>
          </button>
        </aside>
      )}
    </div>
  );
};
