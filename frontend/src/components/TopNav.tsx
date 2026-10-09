import React, { useState } from 'react';
import { Sun, Moon, ChevronDown } from 'lucide-react';

export const TopNav: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/70 backdrop-blur-md px-8 flex items-center justify-end gap-6 shrink-0 select-none">
      {/* Theme Toggle Pill */}
      <button
        onClick={() => setIsDark(!isDark)}
        className="flex items-center gap-2 p-1.5 px-2 bg-slate-100 hover:bg-slate-200/80 rounded-full border border-slate-200 transition cursor-pointer"
        title="Toggle theme"
      >
        <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-amber-500 font-bold' : 'text-slate-400'}`} />
        <div className="w-6 h-3 bg-slate-300 rounded-full relative p-0.5 flex items-center">
          <div
            className={`w-2.5 h-2.5 bg-white rounded-full shadow-xs transition-transform ${
              isDark ? 'translate-x-3' : 'translate-x-0'
            }`}
          />
        </div>
        <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-indigo-500' : 'text-slate-400'}`} />
      </button>

      {/* User Profile */}
      <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm shadow-purple-500/20">
          A
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-slate-700">Anish Gupta</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>
    </header>
  );
};
