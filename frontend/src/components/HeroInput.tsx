import React, { useState } from 'react';
import {
  Globe,
  Sparkles,
  FileText,
  Lightbulb,
  Code2,
  Languages,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface HeroInputProps {
  onGenerate: (url: string, language: 'hinglish' | 'english', style: 'study_guide' | 'cornell' | 'cheatsheet') => void;
  isLoading: boolean;
}

export const HeroInput: React.FC<HeroInputProps> = ({ onGenerate, isLoading }) => {
  const [url, setUrl] = useState('');
  const [language, setLanguage] = useState<'hinglish' | 'english'>('hinglish');
  const [style, setStyle] = useState<'study_guide' | 'cornell' | 'cheatsheet'>('study_guide');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      onGenerate(url.trim(), language, style);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 flex flex-col items-center text-center">
      {/* Hero Headline */}
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
        YouTube to Notes,{' '}
        <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 bg-clip-text text-transparent">
          Instantly
        </span>
      </h1>
      <p className="mt-3.5 text-sm md:text-base text-slate-500 max-w-2xl font-normal leading-relaxed">
        Paste a YouTube link and get clear, structured notes with key concepts, explanations and examples — in Hinglish or English.
      </p>

      {/* Main Input Card */}
      <form
        onSubmit={handleSubmit}
        className="w-full mt-8 p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center gap-3 transition-all focus-within:border-purple-400 focus-within:ring-4 focus-within:ring-purple-500/10"
      >
        {/* YouTube Icon & Input Field */}
        <div className="flex-1 flex items-center gap-3 w-full px-2">
          {/* YouTube Red Badge */}
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

        {/* Format & Language Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          {/* Style Selector */}
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value as any)}
            disabled={isLoading}
            className="text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-2.5 rounded-xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
          >
            <option value="study_guide">📖 Study Guide</option>
            <option value="cornell">📓 Cornell Notes</option>
            <option value="cheatsheet">⚡ Cheatsheet</option>
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
                <span>Analyzing Video...</span>
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
      </form>

      {/* Feature Badges Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mt-12 text-left">
        <FeatureCard
          icon={<FileText className="w-5 h-5 text-purple-600" />}
          title="Structured Notes"
          desc="Well organized and easy to read"
        />
        <FeatureCard
          icon={<Lightbulb className="w-5 h-5 text-purple-600" />}
          title="Key Concepts"
          desc="Important ideas and explanations"
        />
        <FeatureCard
          icon={<Code2 className="w-5 h-5 text-purple-600" />}
          title="Examples"
          desc="Real examples for better understanding"
        />
        <FeatureCard
          icon={<Languages className="w-5 h-5 text-purple-600" />}
          title="Hinglish / English"
          desc="Choose your preferred language"
        />
      </div>

      {/* How It Works Section */}
      <div className="w-full mt-16 pt-8 border-t border-slate-200/60">
        <h2 className="text-lg font-bold text-slate-900 mb-8">How It Works?</h2>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative">
          <StepCard
            num="1"
            title="Paste Link"
            desc="Add any YouTube video URL"
          />
          <ArrowRight className="hidden md:block w-5 h-5 text-slate-300 shrink-0" />
          <StepCard
            num="2"
            title="AI Analyzes"
            desc="Extracts key concepts and explains in your chosen language"
          />
          <ArrowRight className="hidden md:block w-5 h-5 text-slate-300 shrink-0" />
          <StepCard
            num="3"
            title="Get Smart Notes"
            desc="Clean, structured notes with examples and key takeaways"
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
