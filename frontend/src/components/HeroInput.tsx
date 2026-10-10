import React, { useState } from 'react';
import {
  Globe,
  Sparkles,
  Clock,
  FileText,
  ArrowRight,
  Loader2,
  ChevronDown,
} from 'lucide-react';

interface HeroInputProps {
  onGenerate: (
    url: string,
    language: 'hinglish' | 'english',
    style: 'detailed' | 'cheatsheet',
    timelineMode: 'full' | 'custom',
    startTime?: string,
    endTime?: string
  ) => void;
  isLoading: boolean;
}

export const HeroInput: React.FC<HeroInputProps> = ({ onGenerate, isLoading }) => {
  const [url, setUrl] = useState('');
  const [language, setLanguage] = useState<'hinglish' | 'english'>('hinglish');
  const [style, setStyle] = useState<'detailed' | 'cheatsheet'>('detailed');
  const [timelineMode, setTimelineMode] = useState<'full' | 'custom'>('full');
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('05:00');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      onGenerate(
        url.trim(),
        language,
        style,
        timelineMode,
        timelineMode === 'custom' ? startTime : undefined,
        timelineMode === 'custom' ? endTime : undefined
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-16 px-6 flex flex-col items-center text-center text-[#f1f3f7] font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Quotation Mark Accent Line matching image */}
      <div className="flex items-center justify-center gap-4 w-full max-w-sm mb-4">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#ff2442]/60" />
        <div className="text-3xl font-serif text-[#ff2442] leading-none select-none tracking-tight">
          ❝
        </div>
        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#ff2442]/60" />
      </div>

      {/* Main Headline matching image */}
      <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
        Turn videos into <span className="text-[#ff2442]">knowledge</span>,
      </h1>
      <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mt-1 leading-tight">
        one note at a time.
      </h2>

      {/* Main Form Container matching screenshot */}
      <form onSubmit={handleSubmit} className="w-full mt-10 flex flex-col gap-3">
        {/* Input Card */}
        <div className="w-full p-3 md:p-3.5 bg-[#111217] rounded-2xl border border-[#1e202a] shadow-2xl shadow-black/80 flex flex-col md:flex-row items-center gap-3 transition-all focus-within:border-[#ff2442]/50 focus-within:ring-2 focus-within:ring-[#ff2442]/10">
          {/* YouTube Red Icon & Input Field */}
          <div className="flex-1 flex items-center gap-3 w-full px-2">
            <div className="w-9 h-7 bg-[#ff0000] text-white rounded-lg flex items-center justify-center shrink-0 shadow-sm shadow-red-900/40">
              <div className="w-0 h-0 border-y-[4px] border-y-transparent border-l-[6.5px] border-l-white ml-0.5" />
            </div>

            <div className="flex-1 flex flex-col text-left">
              <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
                PASTE YOUTUBE EDUCATIONAL LINK
              </span>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
                className="w-full text-sm font-medium text-white placeholder-[#475569] focus:outline-hidden bg-transparent"
                required
              />
            </div>
          </div>

          {/* Selectors & Generate Button */}
          <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#1a1c24]">
            {/* Note Style: 2 Options Only */}
            <div className="relative">
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as any)}
                disabled={isLoading}
                className="text-xs font-semibold text-[#cbd5e1] bg-[#16171e] hover:bg-[#1d1f28] pl-8 pr-7 py-2.5 rounded-xl border border-[#232532] focus:outline-hidden cursor-pointer appearance-none"
              >
                <option value="detailed">Detailed Notes</option>
                <option value="cheatsheet">Cheat Sheet</option>
              </select>
              <FileText className="w-3.5 h-3.5 text-[#ff2442] absolute left-2.5 top-3 pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 text-[#64748b] absolute right-2 top-3 pointer-events-none" />
            </div>

            {/* Language Selector */}
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                disabled={isLoading}
                className="text-xs font-semibold text-[#cbd5e1] bg-[#16171e] hover:bg-[#1d1f28] pl-8 pr-7 py-2.5 rounded-xl border border-[#232532] focus:outline-hidden cursor-pointer appearance-none"
              >
                <option value="hinglish">Hinglish</option>
                <option value="english">English</option>
              </select>
              <Globe className="w-3.5 h-3.5 text-[#848c9c] absolute left-2.5 top-3 pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 text-[#64748b] absolute right-2 top-3 pointer-events-none" />
            </div>

            {/* Solid Vibrant Red Generate Button matching image */}
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="w-full md:w-auto px-5 py-2.5 bg-[#ff2442] hover:bg-[#e61b36] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 transition cursor-pointer whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Timeline Options Card matching image */}
        <div className="w-full p-2.5 bg-[#111217] rounded-xl border border-[#1e202a] flex flex-wrap items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#f1f3f7]">
              <Clock className="w-4 h-4 text-[#ff2442]" />
              <span>Timeline:</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTimelineMode('full')}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  timelineMode === 'full'
                    ? 'border border-[#ff2442] text-white bg-[#220c11]'
                    : 'text-[#64748b] hover:text-[#cbd5e1]'
                }`}
              >
                Full Video (Timeline-Wise)
              </button>

              <button
                type="button"
                onClick={() => setTimelineMode('custom')}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  timelineMode === 'custom'
                    ? 'border border-[#ff2442] text-white bg-[#220c11]'
                    : 'text-[#64748b] hover:text-[#cbd5e1]'
                }`}
              >
                Custom Range
              </button>
            </div>
          </div>

          {timelineMode === 'custom' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#64748b]">Start:</span>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="00:00"
                className="w-14 px-2 py-1 rounded-md border border-[#262835] bg-[#16171f] font-mono text-center text-xs text-white focus:border-[#ff2442]"
              />
              <span className="text-[#64748b]">End:</span>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="05:00"
                className="w-14 px-2 py-1 rounded-md border border-[#262835] bg-[#16171f] font-mono text-center text-xs text-white focus:border-[#ff2442]"
              />
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
