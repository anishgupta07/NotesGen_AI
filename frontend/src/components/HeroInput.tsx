import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Loader2,
  ChevronDown,
  Upload,
  Video,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { ChatSummary } from '../types';
import { getChatTitle } from '../utils/chatTitle';

interface HeroInputProps {
  onGenerate: (
    url: string,
    language: 'hinglish' | 'english',
    style: 'detailed' | 'cheatsheet',
    timelineMode: 'full' | 'custom',
    startTime?: string,
    endTime?: string
  ) => void;
  onGenerateFile?: (
    file: File,
    language: 'hinglish' | 'english',
    style: 'detailed' | 'cheatsheet'
  ) => void;
  isLoading: boolean;
  recentChats?: ChatSummary[];
  onSelectChat?: (id: string) => void;
}

export const HeroInput: React.FC<HeroInputProps> = ({
  onGenerate,
  onGenerateFile,
  isLoading,
  recentChats = [],
  onSelectChat,
}) => {
  const [inputMode, setInputMode] = useState<'url' | 'file'>('url');
  const [url, setUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<'hinglish' | 'english'>('hinglish');
  const [style, setStyle] = useState<'detailed' | 'cheatsheet'>('detailed');
  const [timelineMode, setTimelineMode] = useState<'full' | 'custom'>('full');
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('05:00');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (inputMode === 'url') {
      if (url.trim()) {
        onGenerate(
          url.trim(),
          language,
          style,
          timelineMode,
          timelineMode === 'custom' ? startTime : undefined,
          timelineMode === 'custom' ? endTime : undefined
        );
      }
    } else {
      if (selectedFile && onGenerateFile) {
        onGenerateFile(selectedFile, language, style);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const formatChatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return isToday ? `Today, ${time}` : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="max-w-4xl mx-auto py-12 md:py-16 px-6 flex flex-col items-center text-center font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Tag */}
      <div className="text-[11px] font-bold tracking-widest uppercase text-[#B83826] mb-3">
        ANY EDUCATIONAL VIDEO, ONE SET OF NOTES
      </div>

      {/* Main Serif Headline */}
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-[#1C1917] tracking-tight leading-[1.12]">
        Paste a lecture. Get notes<br />
        you will actually finish.
      </h1>

      {/* Subtitle */}
      <p className="text-base md:text-lg font-serif italic text-[#78716C] max-w-xl leading-relaxed mt-4">
        Lectures, tutorials, explainers, any subject. Chapters, key ideas and a quick check after every section, in Hinglish or English.
      </p>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="w-full mt-10 max-w-3xl flex flex-col gap-3">
        {/* Main Input Box Card */}
        <div className="w-full bg-[#FFFFFF] rounded-2xl border border-[#E5DDD1] shadow-sm p-2 md:p-2.5 flex flex-col md:flex-row items-center gap-2.5 transition-all focus-within:border-[#B83826]/60 focus-within:ring-2 focus-within:ring-[#B83826]/10">
          {inputMode === 'url' ? (
            <div className="flex-1 flex items-center w-full px-3">
              <input
                type="url"
                placeholder="Paste an educational YouTube link (captions required)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
                className="w-full text-xs md:text-sm text-[#1C1917] placeholder-[#8C827A] focus:outline-none bg-transparent"
                required
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-2 w-full px-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="audio/*,video/*,.mp3,.wav,.m4a,.mp4,.webm"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 bg-[#F2EFE9] hover:bg-[#E5DDD1] text-[#B83826] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Browse</span>
              </button>
              <span
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-[#1C1917] truncate cursor-pointer flex-1 text-left"
              >
                {selectedFile ? (
                  <span className="font-semibold text-[#B83826]">{selectedFile.name}</span>
                ) : (
                  <span className="text-[#8C827A]">Choose audio / video file (.mp3, .mp4, .m4a)</span>
                )}
              </span>
            </div>
          )}

          {/* Selectors & Generate Button */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-[#F2EFE9]">
            {/* Style Selector */}
            <div className="relative">
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as any)}
                disabled={isLoading}
                className="text-xs font-medium text-[#1C1917] bg-[#FAF8F5] hover:bg-[#F2EFE9] pl-3 pr-7 py-2 rounded-xl border border-[#E5DDD1] focus:outline-none cursor-pointer appearance-none transition"
              >
                <option value="detailed">Detailed notes</option>
                <option value="cheatsheet">Cheat sheet</option>
              </select>
              <ChevronDown className="w-3 h-3 text-[#8C827A] absolute right-2.5 top-3 pointer-events-none" />
            </div>

            {/* Language Selector */}
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                disabled={isLoading}
                className="text-xs font-medium text-[#1C1917] bg-[#FAF8F5] hover:bg-[#F2EFE9] pl-3 pr-7 py-2 rounded-xl border border-[#E5DDD1] focus:outline-none cursor-pointer appearance-none transition"
              >
                <option value="hinglish">Hinglish</option>
                <option value="english">English</option>
              </select>
              <ChevronDown className="w-3 h-3 text-[#8C827A] absolute right-2.5 top-3 pointer-events-none" />
            </div>

            {/* Generate Button (Solid Terracotta Red) */}
            <button
              type="submit"
              disabled={isLoading || (inputMode === 'url' ? !url.trim() : !selectedFile)}
              className="px-5 py-2.5 bg-[#B83826] hover:bg-[#A32E1E] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-medium text-xs md:text-sm flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Generate</span>
              )}
            </button>
          </div>
        </div>

        {/* Sub-bar: Timeline options and file fallback link */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-[#8C827A] px-2 gap-2 mt-1">
          {/* Timeline toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setInputMode('url');
                setTimelineMode('full');
              }}
              className={`font-medium transition cursor-pointer ${
                inputMode === 'url' && timelineMode === 'full'
                  ? 'text-[#1C1917] font-semibold underline decoration-[#B83826] underline-offset-4'
                  : 'text-[#8C827A] hover:text-[#1C1917]'
              }`}
            >
              Full video
            </button>
            <button
              type="button"
              onClick={() => {
                setInputMode('url');
                setTimelineMode('custom');
              }}
              className={`font-medium transition cursor-pointer ${
                inputMode === 'url' && timelineMode === 'custom'
                  ? 'text-[#1C1917] font-semibold underline decoration-[#B83826] underline-offset-4'
                  : 'text-[#8C827A] hover:text-[#1C1917]'
              }`}
            >
              Custom range
            </button>

            {timelineMode === 'custom' && inputMode === 'url' && (
              <div className="flex items-center gap-1.5 ml-2 animate-in fade-in duration-150">
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="00:00"
                  className="w-12 px-1.5 py-0.5 text-center bg-[#FAF8F5] text-[#1C1917] border border-[#E5DDD1] rounded font-mono text-[11px] focus:outline-none focus:border-[#B83826]"
                />
                <span>-</span>
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="05:00"
                  className="w-12 px-1.5 py-0.5 text-center bg-[#FAF8F5] text-[#1C1917] border border-[#E5DDD1] rounded font-mono text-[11px] focus:outline-none focus:border-[#B83826]"
                />
              </div>
            )}
          </div>

          {/* Fallback upload link */}
          <div className="text-[11px]">
            {inputMode === 'url' ? (
              <span>
                The video needs captions turned on. No captions?{' '}
                <button
                  type="button"
                  onClick={() => setInputMode('file')}
                  className="underline text-[#B83826] font-medium hover:text-[#A32E1E] cursor-pointer"
                >
                  Upload its audio or video instead.
                </button>
              </span>
            ) : (
              <span>
                Want to paste a YouTube link instead?{' '}
                <button
                  type="button"
                  onClick={() => setInputMode('url')}
                  className="underline text-[#B83826] font-medium hover:text-[#A32E1E] cursor-pointer"
                >
                  Switch to YouTube link.
                </button>
              </span>
            )}
          </div>
        </div>
      </form>

      {/* Pick up where you left off Section */}
      {recentChats.length > 0 && (
        <div className="w-full max-w-3xl mt-16 text-left">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-serif font-bold text-[#1C1917]">
              Pick up where you left off
            </h2>
            <span className="text-xs text-[#8C827A]">
              All {recentChats.length} notes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {recentChats.slice(0, 3).map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat && onSelectChat(chat.id)}
                className="bg-[#FFFFFF] border border-[#E5DDD1] rounded-2xl p-4.5 hover:border-[#B83826]/50 hover:shadow-md transition cursor-pointer flex flex-col justify-between min-h-[120px] group"
              >
                <div className="font-semibold text-sm text-[#1C1917] line-clamp-2 group-hover:text-[#B83826] transition">
                  {getChatTitle(chat)}
                </div>
                <div className="text-[11px] text-[#8C827A] mt-4 flex items-center justify-between">
                  <span>{chat.language === 'hinglish' ? 'Hinglish' : 'English'}</span>
                  <span>{formatChatTime(chat.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
