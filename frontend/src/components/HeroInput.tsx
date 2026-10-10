import React, { useState } from 'react';
import {
  Globe,
  Sparkles,
  Clock,
  BookOpen,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Zap,
  Code2,
  Cpu,
  GraduationCap,
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

  const sampleTopics = [
    { label: 'Data Structures & Algorithms', url: 'https://www.youtube.com/watch?v=0IAPZzGSbME' },
    { label: 'System Design Explained', url: 'https://www.youtube.com/watch?v=i53Gi_K3o7I' },
    { label: 'Quantum Physics Fundamentals', url: 'https://www.youtube.com/watch?v=Da-2h2B4faU' },
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 flex flex-col items-center text-center text-[#e2e8f0]">
      {/* Top Greeting Badge matching reference screenshot */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#15161c] border border-[#232530] text-xs text-[#94a3b8] mb-4">
        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
        <span>AI Video Study Workspace</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
        YouTube to Notes,{' '}
        <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent">
          in Natural Flow
        </span>
      </h1>
      <p className="mt-3 text-sm md:text-base text-[#94a3b8] max-w-2xl font-normal leading-relaxed">
        Get timeline-wise notes in simple Hinglish, preserving the speaker's exact examples and real analogies.
      </p>

      {/* Main Form Container matching dark input box in screenshot */}
      <form onSubmit={handleSubmit} className="w-full mt-8 flex flex-col gap-3">
        <div className="w-full p-3.5 bg-[#131418] rounded-2xl border border-[#23252d] shadow-2xl shadow-black/80 flex flex-col md:flex-row items-center gap-3 transition-all focus-within:border-purple-500/70 focus-within:ring-2 focus-within:ring-purple-500/20">
          {/* YouTube Icon & Input Field */}
          <div className="flex-1 flex items-center gap-3 w-full px-2">
            <div className="w-9 h-7 bg-red-600/90 text-white rounded-lg flex items-center justify-center shrink-0 shadow-sm shadow-red-900/30">
              <div className="w-0 h-0 border-y-[4px] border-y-transparent border-l-[6.5px] border-l-white ml-0.5" />
            </div>

            <div className="flex-1 flex flex-col text-left">
              <span className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider">
                Paste YouTube educational link
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

          {/* Quick Selectors & Submit */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#1c1e24]">
            {/* Note Style: 2 Options Only */}
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as any)}
              disabled={isLoading}
              className="text-xs font-semibold text-[#cbd5e1] bg-[#1a1c22] hover:bg-[#20222a] px-3 py-2 rounded-xl border border-[#2a2d36] focus:outline-hidden cursor-pointer"
            >
              <option value="detailed">📚 Detailed Notes</option>
              <option value="cheatsheet">⚡ Cheat Sheet</option>
            </select>

            {/* Language Selector */}
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                disabled={isLoading}
                className="text-xs font-semibold text-[#cbd5e1] bg-[#1a1c22] hover:bg-[#20222a] pl-7 pr-3 py-2 rounded-xl border border-[#2a2d36] focus:outline-hidden cursor-pointer appearance-none"
              >
                <option value="hinglish">Hinglish</option>
                <option value="english">English</option>
              </select>
              <Globe className="w-3.5 h-3.5 text-[#94a3b8] absolute left-2 top-2.5 pointer-events-none" />
            </div>

            {/* Generate Button */}
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="w-full md:w-auto px-5 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-950/50 transition active:scale-[0.98] cursor-pointer whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Timeline Options Bar */}
        <div className="w-full p-2.5 bg-[#131418] rounded-xl border border-[#1f2128] flex flex-wrap items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-semibold text-[#94a3b8]">Timeline:</span>
            <div className="inline-flex rounded-lg bg-[#1a1c22] p-0.5 border border-[#262832]">
              <button
                type="button"
                onClick={() => setTimelineMode('full')}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  timelineMode === 'full'
                    ? 'bg-[#262832] text-white shadow-xs'
                    : 'text-[#64748b] hover:text-[#e2e8f0]'
                }`}
              >
                Full Video (Timeline-Wise)
              </button>
              <button
                type="button"
                onClick={() => setTimelineMode('custom')}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  timelineMode === 'custom'
                    ? 'bg-[#262832] text-white shadow-xs'
                    : 'text-[#64748b] hover:text-[#e2e8f0]'
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
                className="w-14 px-2 py-0.5 rounded-md border border-[#2a2d38] bg-[#1a1c22] font-mono text-center text-xs text-white"
              />
              <span className="text-[#64748b]">End:</span>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="05:00"
                className="w-14 px-2 py-0.5 rounded-md border border-[#2a2d38] bg-[#1a1c22] font-mono text-center text-xs text-white"
              />
            </div>
          )}
        </div>
      </form>

      {/* Suggested Quick Links / Chips matching screenshot */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
        <span className="text-[11px] text-[#64748b]">Quick samples:</span>
        {sampleTopics.map((topic, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setUrl(topic.url)}
            className="text-[11px] text-[#94a3b8] hover:text-white bg-[#15161c] hover:bg-[#1f212a] border border-[#232530] px-2.5 py-1 rounded-lg transition cursor-pointer"
          >
            {topic.label}
          </button>
        ))}
      </div>

      {/* Educational Guardrail Pill */}
      <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#13141a] border border-[#232532] text-[11px] text-[#94a3b8]">
        <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
        <span>
          Academic Guardrail: Notes are generated strictly for educational, tutorial, and lecture videos.
        </span>
      </div>

      {/* Feature Cards matching dark cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 w-full mt-10 text-left">
        <FeatureCard
          icon={<Clock className="w-4 h-4 text-purple-400" />}
          title="Timeline Headings"
          desc="Structured sections with clear topics and timestamps"
        />
        <FeatureCard
          icon={<Zap className="w-4 h-4 text-purple-400" />}
          title="Speaker's Analogies"
          desc="Preserves exact mental models and video examples"
        />
        <FeatureCard
          icon={<Globe className="w-4 h-4 text-purple-400" />}
          title="Simple Hinglish Flow"
          desc="Natural, flowing narrative easy for quick revision"
        />
        <FeatureCard
          icon={<BookOpen className="w-4 h-4 text-purple-400" />}
          title="Key Note-Down Points"
          desc="Dedicated high-yield points ready to copy"
        />
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({
  icon,
  title,
  desc,
}) => (
  <div className="p-3.5 bg-[#131418] rounded-xl border border-[#1f2128] hover:border-[#2f323e] transition">
    <div className="w-8 h-8 rounded-lg bg-[#1a1c24] flex items-center justify-center mb-2.5">
      {icon}
    </div>
    <div className="text-xs font-bold text-[#f1f5f9]">{title}</div>
    <div className="text-[11px] text-[#64748b] mt-0.5 leading-snug">{desc}</div>
  </div>
);
