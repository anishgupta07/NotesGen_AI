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
    const safeTitle = (chat.title || 'video_notes').replace(/[^a-zA-Z0-9_-]/g, '_');
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
    <div className="flex flex-col h-full bg-[#0b0c0f] overflow-hidden text-[#e2e8f0]">
      {/* Header bar */}
      <div className="p-5 md:p-6 border-b border-[#181a20] bg-[#0d0e12]/95 backdrop-blur-md flex flex-col gap-3 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight leading-snug line-clamp-2">
              {chat.title || 'Video Notes'}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#94a3b8]">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#191629] text-purple-300 font-medium border border-[#302352]">
                <Languages className="w-3.5 h-3.5" />
                {chat.language === 'hinglish' ? 'Hinglish' : 'English'}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#131b2c] text-indigo-300 font-medium border border-[#23355b]">
                <BookOpen className="w-3.5 h-3.5" />
                {styleLabelMap[chat.note_style] || chat.note_style}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[#64748b]">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
            </div>
          </div>

          {/* Action buttons matching dark theme */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#232530] bg-[#14151b] text-[#cbd5e1] hover:text-white hover:bg-[#1a1c24] transition cursor-pointer"
              title="Copy markdown to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#94a3b8]" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#232530] bg-[#14151b] text-[#cbd5e1] hover:text-white hover:bg-[#1a1c24] transition cursor-pointer"
              title="Download notes as Markdown file"
            >
              <Download className="w-3.5 h-3.5 text-[#94a3b8]" />
              <span>Download</span>
            </button>

            {chat.video_url && (
              <a
                href={chat.video_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1a1528] text-purple-300 hover:text-white hover:bg-[#251d3b] transition border border-[#352554]"
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
          <div className="pt-2 border-t border-[#181a20]">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="text-xs font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{showTranscript ? 'Hide raw transcript' : 'View raw transcript'}</span>
              {showTranscript ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showTranscript && (
              <div className="mt-2 p-3 bg-[#0a0b0d] border border-[#1f2129] rounded-xl text-xs text-[#94a3b8] max-h-48 overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed select-text">
                {chat.transcript}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Markdown Notes Content Area with High Readability in Poppins */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 select-text">
        <article className="max-w-3xl mx-auto space-y-4 text-[#cbd5e1] leading-relaxed font-normal">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-6 mb-4 pb-2 border-b border-[#22242e] tracking-tight">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl md:text-2xl font-bold text-white mt-8 mb-3 pb-1.5 border-b border-[#1c1e27] tracking-tight flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full inline-block" />
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base md:text-lg font-semibold text-purple-300 mt-5 mb-2 tracking-tight">
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
                <li className="leading-[1.7] marker:text-purple-400">{children}</li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-white bg-[#191a24] px-1.5 py-0.5 rounded text-[0.95em] border border-[#2a2c3a]/50">
                  {children}
                </strong>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-purple-500 pl-4 py-2 my-4 bg-[#14151e] rounded-r-xl text-[#e2e8f0] text-sm leading-relaxed border border-[#232536]">
                  {children}
                </blockquote>
              ),
              code: ({ children, className }) => {
                const isInline = !className;
                if (isInline) {
                  return (
                    <code className="bg-[#161720] text-purple-300 px-1.5 py-0.5 rounded text-xs md:text-sm font-mono border border-[#282a3c]">
                      {children}
                    </code>
                  );
                }
                return (
                  <pre className="bg-[#08090c] text-[#e2e8f0] p-4 rounded-xl overflow-x-auto text-xs md:text-sm font-mono my-4 border border-[#1f212a] shadow-inner">
                    <code>{children}</code>
                  </pre>
                );
              },
              hr: () => <hr className="my-8 border-[#1f2129]" />,
              table: ({ children }) => (
                <div className="overflow-x-auto my-5 border border-[#22242e] rounded-xl bg-[#0e0f14]">
                  <table className="w-full text-left text-sm border-collapse">{children}</table>
                </div>
              ),
              th: ({ children }) => (
                <th className="bg-[#161720] p-3 font-semibold text-white border-b border-[#22242e]">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="p-3 border-b border-[#181922] text-[#cbd5e1]">{children}</td>
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
