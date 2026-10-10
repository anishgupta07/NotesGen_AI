import React, { useState } from 'react';
import {
  Globe,
  Sparkles,
  FileText,
  Lightbulb,
  Clock,
  BookOpen,
  Languages,
  ArrowRight,
  Loader2,
  ShieldAlert,
  SlidersHorizontal,
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
    <div className="max-w-4xl mx-auto py-10 px-6 flex flex-col items-center text-center">
      {/* Hero Headline */}
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
        YouTube to Notes,{' '}
        <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 bg-clip-text text-transparent">
          Instantly
        </span>
      </h1>
      <p className="mt-3.5 text-sm md:text-base text-slate-500 max-w-2xl font-normal leading-relaxed">
        Paste a YouTube link and get timeline-wise notes preserving the instructor's exact analogies — in Hinglish or English.
      </p>

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} className="w-full mt-7 flex flex-col gap-3">
        {/* Main Input Card */}
        <div className="w-full p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center gap-3 transition-all focus-within:border-purple-400 focus-within:ring-4 focus-within:ring-purple-500/10">
          {/* YouTube Icon & Input Field */}
          <div className="flex-1 flex items-center gap-3 w-full px-2">
            <div className="w-10 h-7 bg-red-600 text-white rounded-lg flex items-center justify-center shrink-0 shadow-sm shadow-red-500/20">
              <div className="w-0 h-0 border-y-[4.5px] border-y-transparent border-l-[7.5px] border-l-white ml-0.5" />
            </div>

            <div className="flex-1 flex flex-col text-left">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Paste YouTube link here...
              </span>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
                className="w-full text-sm font-medium text-slate-800 placeholder-slate-300 focus:outline-none bg-transparent"
                required
              />
            </div>
          </div>

          {/* Quick Selectors & Submit */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
            {/* Note Style: 2 Options Only */}
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as any)}
              disabled={isLoading}
              className="text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-2.5 rounded-xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
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
                className="text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 pl-8 pr-4 py-2.5 rounded-xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer appearance-none"
              >
                <option value="hinglish">Hinglish</option>
                <option value="english">English</option>
              </select>
              <Globe className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3 pointer-events-none" />
            </div>

            {/* Generate Button */}
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Notes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Timeline Options Bar */}
        <div className="w-full p-3 bg-white/70 backdrop-blur-xs rounded-xl border border-slate-200/70 flex flex-wrap items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-slate-700">Timeline Options:</span>
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/60">
              <button
                type="button"
                onClick={() => setTimelineMode('full')}
                className={`text-xs px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                  timelineMode === 'full'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Full Video (Timeline-Wise)
              </button>
              <button
                type="button"
                onClick={() => setTimelineMode('custom')}
                className={`text-xs px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                  timelineMode === 'custom'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Custom Range
              </button>
            </div>
          </div>

          {timelineMode === 'custom' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Start:</span>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="00:00"
                className="w-16 px-2 py-1 rounded-md border border-slate-200 bg-white font-mono text-center text-xs focus:ring-1 focus:ring-purple-400"
              />
              <span className="text-slate-400 font-medium">End:</span>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="05:00"
                className="w-16 px-2 py-1 rounded-md border border-slate-200 bg-white font-mono text-center text-xs focus:ring-1 focus:ring-purple-400"
              />
            </div>
          )}
        </div>
      </form>

      {/* Educational Guardrail Pill */}
      <div className="mt-3.5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50/80 border border-purple-200/60 text-[11px] font-medium text-purple-800">
        <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
        <span>
          Academic & Tutorial Guardrail: Notes are generated strictly for educational, academic, and tutorial videos.
        </span>
      </div>

      {/* Feature Badges Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mt-10 text-left">
        <FeatureCard
          icon={<Clock className="w-5 h-5 text-purple-600" />}
          title="Timeline-Wise Structure"
          desc="0:00 - 5:00 sections with concepts, questions & intuition"
        />
        <FeatureCard
          icon={<Lightbulb className="w-5 h-5 text-purple-600" />}
          title="Speaker's Real Analogies"
          desc="Preserves exact mental models and examples from the video"
        />
        <FeatureCard
          icon={<Languages className="w-5 h-5 text-purple-600" />}
          title="Authentic Hinglish"
          desc="Roman Hindi explanation with clear English technical terms"
        />
        <FeatureCard
          icon={<BookOpen className="w-5 h-5 text-purple-600" />}
          title="Detailed or Cheat Sheet"
          desc="Choose in-depth study notes or high-yield revision sheet"
        />
      </div>

      {/* How It Works Section */}
      <div className="w-full mt-14 pt-6 border-t border-slate-200/60">
        <h2 className="text-lg font-bold text-slate-900 mb-6">How It Works?</h2>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative">
          <StepCard
            num="1"
            title="Paste Educational Link"
            desc="Add any lecture, tutorial, or academic YouTube URL"
          />
          <ArrowRight className="hidden md:block w-5 h-5 text-slate-300 shrink-0" />
          <StepCard
            num="2"
            title="Select Timeline & Style"
            desc="Pick Detailed Notes or Cheat Sheet with Hinglish or English"
          />
          <ArrowRight className="hidden md:block w-5 h-5 text-slate-300 shrink-0" />
          <StepCard
            num="3"
            title="Study with Analogies"
            desc="Review structured notes and chat with isolated video memory"
          />
        </div>
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({
  icon,
  title,
  desc,
}) => (
  <div className="p-4 bg-white rounded-xl border border-slate-200/70 shadow-xs flex items-start gap-3.5 hover:border-purple-200 transition">
    <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div>
      <div className="text-xs font-bold text-slate-800">{title}</div>
      <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{desc}</div>
    </div>
  </div>
);

const StepCard: React.FC<{ num: string; title: string; desc: string }> = ({
  num,
  title,
  desc,
}) => (
  <div className="flex flex-col items-center text-center max-w-[220px]">
    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-extrabold text-xs flex items-center justify-center mb-3">
      {num}
    </div>
    <div className="text-xs font-bold text-slate-800">{title}</div>
    <div className="text-[11px] text-slate-500 mt-1 leading-snug">{desc}</div>
  </div>
);
