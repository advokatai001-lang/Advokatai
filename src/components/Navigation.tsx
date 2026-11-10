import React from 'react';
import { Sparkles, FileText, FileSearch, Mic, Shield } from 'lucide-react';
import { Language } from '../types/legal';

export type MainTab = 'live-voice' | 'ai-lawyer' | 'doc-generator' | 'doc-analyzer';

interface NavigationProps {
  currentTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  language: Language;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  language,
}) => {
  const tabs = [
    {
      id: 'live-voice' as MainTab,
      icon: Mic,
      labelUz: '🎙️ Jonli Suhbat (VoiceLab)',
      labelRu: '🎙️ Живой Голос (VoiceLab)',
      labelEn: '🎙️ Live Voice (VoiceLab)',
      badge: 'LIVE',
    },
    {
      id: 'ai-lawyer' as MainTab,
      icon: Sparkles,
      labelUz: 'AI Advokat (Barcha Qonunlar)',
      labelRu: 'AI Адвокат (Все законы)',
      labelEn: 'AI Lawyer (All Laws)',
      badge: 'IELTS',
    },
    {
      id: 'doc-generator' as MainTab,
      icon: FileText,
      labelUz: 'Hujjat Yaratish',
      labelRu: 'Создание документов',
      labelEn: 'Draft Documents',
    },
    {
      id: 'doc-analyzer' as MainTab,
      icon: FileSearch,
      labelUz: 'Hujjat Tahlili & Xavflar',
      labelRu: 'Анализ документов',
      labelEn: 'Analyze & Audit',
    },
  ];


  const getLabel = (t: typeof tabs[0]) => {
    if (language === 'ru') return t.labelRu;
    if (language === 'en') return t.labelEn;
    return t.labelUz;
  };

  return (
    <div className="bg-slate-900/80 border-b border-slate-800 sticky top-16 sm:top-20 z-40 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <nav className="flex space-x-2 py-2.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                <span>{getLabel(tab)}</span>
                {tab.badge && (
                  <span
                    className={`ml-1 text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                      isActive
                        ? 'bg-slate-950 text-amber-300'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
