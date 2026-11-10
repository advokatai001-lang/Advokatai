import React from 'react';
import { Scale, Globe, ShieldCheck, Sparkles, BookOpen, Volume2 } from 'lucide-react';
import { Language } from '../types/legal';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isSpeaking: boolean;
  onStopSpeech: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  isSpeaking,
  onStopSpeech,
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-amber-900/30 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500/20 via-amber-600/30 to-amber-900/40 border border-amber-500/40 shadow-lg shadow-amber-500/10">
              <Scale className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" title="LexUZ Real-time Audit Active" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif tracking-wide text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-200 via-amber-300 to-amber-100 bg-clip-text text-transparent">
                  HUQUQ AI
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  LEGALTECH UZ
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Intelligent Legal Assistant of Uzbekistan • LexUZ Bilimlar Bazasi
              </p>
            </div>
          </div>

          {/* Right Controls: LexUZ Badge, TTS status, Language Selector */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Audio speaking indicator */}
            {isSpeaking && (
              <button
                onClick={onStopSpeech}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-medium animate-pulse hover:bg-rose-500/30 transition-all cursor-pointer"
                title="Ovozni to'xtatish"
              >
                <Volume2 className="w-4 h-4 animate-bounce" />
                <span className="hidden md:inline">Ovoz ijro etilmoqda (To'xtatish)</span>
              </button>
            )}

            {/* Lex.uz verified badge */}
            <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-[11px]">Lex.uz 2026 • 100% Qamrov Auditi</span>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs font-medium">
              <button
                onClick={() => onLanguageChange('uz')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  language === 'uz'
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                O‘zbek
              </button>
              <button
                onClick={() => onLanguageChange('ru')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  language === 'ru'
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Русский
              </button>
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
