import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Copy,
  Check,
  Download,
  ExternalLink,
  Languages,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import { ChatDetail } from '../types';
import { getChatTitle } from '../utils/chatTitle';

interface NotesViewerProps {
  chat: ChatDetail;
}

export const NotesViewer: React.FC<NotesViewerProps> = ({ chat }) => {
  const [copied, setCopied] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(chat.notes);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy notes', err);
    }
  };

  const handleDownload = () => {
    const safeTitle = getChatTitle(chat).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeTitle}.md`;
    const blob = new Blob([chat.notes], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formattedDate = new Date(chat.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const styleLabelMap: Record<string, string> = {
    detailed: 'Detailed Notes',
    cheatsheet: 'Cheat Sheet',
    study_guide: 'Detailed Notes',
    cornell: 'Cornell Notes',
  };

  return (
    <div className="flex flex-col h-full bg-[#090a0c] overflow-hidden text-[#f1f3f7] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header bar */}
      <div className="p-5 md:p-6 border-b border-[#171820] bg-[#0b0c0f] flex flex-col gap-3 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight leading-snug line-clamp-2">
              {getChatTitle(chat)}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#848c9c]">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#220c11] text-[#ff4d66] font-semibold border border-[#ff2442]/30">
                <Languages className="w-3.5 h-3.5" />
                {chat.language === 'hinglish' ? 'Hinglish' : 'English'}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#13141a] text-[#cbd5e1] font-medium border border-[#232532]">
                <BookOpen className="w-3.5 h-3.5" />
                {styleLabelMap[chat.note_style] || chat.note_style}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[#64748b]">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#22242e] bg-[#121319] text-[#cbd5e1] hover:text-white hover:bg-[#1a1b24] transition cursor-pointer"
              title="Copy markdown to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#848c9c]" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#22242e] bg-[#121319] text-[#cbd5e1] hover:text-white hover:bg-[#1a1b24] transition cursor-pointer"
              title="Download notes as Markdown file"
            >
              <Download className="w-3.5 h-3.5 text-[#848c9c]" />
              <span>Download</span>
            </button>

            {chat.video_url && (
              <a
                href={chat.video_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#220c11] text-[#ff4d66] hover:text-white hover:bg-[#ff2442] transition border border-[#ff2442]/40"
                title="Open original video on YouTube"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>YouTube</span>
              </a>
            )}
          </div>
        </div>

        {/* Collapsible Transcript toggle */}
        {chat.transcript && (
          <div className="pt-2 border-t border-[#16171f]">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="text-xs font-semibold text-[#ff4d66] hover:text-[#ff2442] flex items-center gap-1 cursor-pointer transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{showTranscript ? 'Hide raw transcript' : 'View raw transcript'}</span>
              {showTranscript ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showTranscript && (
              <div className="mt-2 p-3 bg-[#0c0d11] border border-[#1d1f2a] rounded-xl text-xs text-[#94a3b8] max-h-48 overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed select-text">
                {chat.transcript}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Markdown Notes Content Area with High Readability */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 select-text">
        <article className="max-w-3xl mx-auto space-y-4 text-[#cbd5e1] leading-relaxed font-normal">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-6 mb-4 pb-2 border-b border-[#1e202a] tracking-tight">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl md:text-2xl font-bold text-white mt-8 mb-3 pb-1.5 border-b border-[#1c1d26] tracking-tight flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-[#ff2442] rounded-full inline-block" />
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base md:text-lg font-bold text-[#ff4d66] mt-5 mb-2 tracking-tight">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-sm md:text-base text-[#cbd5e1] leading-[1.8] my-3">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-5 my-3 space-y-2 text-sm md:text-base text-[#cbd5e1]">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-5 my-3 space-y-2 text-sm md:text-base text-[#cbd5e1]">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="leading-[1.7] marker:text-[#ff2442]">{children}</li>
              ),
              strong: ({ children }) => (
                <strong className="font-bold text-white bg-[#1a1b24] px-1.5 py-0.5 rounded text-[0.95em] border border-[#252735]">
                  {children}
                </strong>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-[#ff2442] pl-4 py-2 my-4 bg-[#1b0d12] rounded-r-xl text-[#f1f3f7] text-sm leading-relaxed border border-[#2d141b]">
                  {children}
                </blockquote>
              ),
              code: ({ children, className }) => {
                const isInline = !className;
                if (isInline) {
                  return (
                    <code className="bg-[#15161f] text-[#ff4d66] px-1.5 py-0.5 rounded text-xs md:text-sm font-mono border border-[#252736]">
                      {children}
                    </code>
                  );
                }
                return (
                  <pre className="bg-[#090a0d] text-[#f1f3f7] p-4 rounded-xl overflow-x-auto text-xs md:text-sm font-mono my-4 border border-[#1d1f2a] shadow-inner">
                    <code>{children}</code>
                  </pre>
                );
              },
              hr: () => <hr className="my-8 border-[#1a1b24]" />,
              table: ({ children }) => (
                <div className="overflow-x-auto my-5 border border-[#1e202a] rounded-xl bg-[#0d0e12]">
                  <table className="w-full text-left text-sm border-collapse">{children}</table>
                </div>
              ),
              th: ({ children }) => (
                <th className="bg-[#14151c] p-3 font-bold text-white border-b border-[#1e202a]">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="p-3 border-b border-[#171822] text-[#cbd5e1]">{children}</td>
              ),
            }}
          >
            {chat.notes}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
};
