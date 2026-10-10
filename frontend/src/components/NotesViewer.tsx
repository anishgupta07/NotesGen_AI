import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  FileText,
  Copy,
  Check,
  Download,
  ExternalLink,
  Languages,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
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
    <div className="flex flex-col h-full bg-white overflow-hidden border-r border-slate-200/80">
      {/* Header bar */}
      <div className="p-6 border-b border-slate-100 bg-white/90 backdrop-blur-xs flex flex-col gap-3 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-snug line-clamp-2">
              {chat.title || 'Video Notes'}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 font-semibold border border-purple-100">
                <Languages className="w-3.5 h-3.5" />
                {chat.language === 'hinglish' ? 'Hinglish' : 'English'}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                <BookOpen className="w-3.5 h-3.5" />
                {styleLabelMap[chat.note_style] || chat.note_style}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer"
              title="Copy markdown to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer"
              title="Download notes as Markdown file"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download</span>
            </button>

            {chat.video_url && (
              <a
                href={chat.video_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100/80 transition border border-purple-200/60 shadow-xs"
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
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1 cursor-pointer transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{showTranscript ? 'Hide raw transcript' : 'View raw transcript'}</span>
              {showTranscript ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showTranscript && (
              <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 max-h-48 overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed select-text">
                {chat.transcript}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Markdown Notes Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 select-text">
        <article className="max-w-3xl mx-auto space-y-4 text-slate-800 leading-relaxed font-normal">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-6 mb-3 pb-2 border-b border-slate-200/70 tracking-tight">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mt-6 mb-2.5 pb-1 border-b border-slate-100 tracking-tight flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-purple-600 rounded-full inline-block" />
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-bold text-slate-800 mt-4 mb-2 tracking-tight">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-sm md:text-base text-slate-700 leading-relaxed my-2">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-5 my-2.5 space-y-1.5 text-sm md:text-base text-slate-700">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-5 my-2.5 space-y-1.5 text-sm md:text-base text-slate-700">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed marker:text-purple-600">{children}</li>
              ),
              strong: ({ children }) => (
                <strong className="font-bold text-slate-900 bg-purple-50/80 px-1 py-0.5 rounded text-[0.95em]">
                  {children}
                </strong>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-purple-500 pl-4 py-1.5 my-3 bg-purple-50/40 rounded-r-lg text-slate-700 italic text-sm">
                  {children}
                </blockquote>
              ),
              code: ({ children, className }) => {
                const isInline = !className;
                if (isInline) {
                  return (
                    <code className="bg-slate-100 text-purple-700 px-1.5 py-0.5 rounded text-xs md:text-sm font-mono border border-slate-200/60">
                      {children}
                    </code>
                  );
                }
                return (
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto text-xs md:text-sm font-mono my-3 shadow-inner">
                    <code>{children}</code>
                  </pre>
                );
              },
              hr: () => <hr className="my-6 border-slate-200" />,
              table: ({ children }) => (
                <div className="overflow-x-auto my-4 border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-sm border-collapse">{children}</table>
                </div>
              ),
              th: ({ children }) => (
                <th className="bg-slate-50 p-2.5 font-bold text-slate-800 border-b border-slate-200">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="p-2.5 border-b border-slate-100 text-slate-700">{children}</td>
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
