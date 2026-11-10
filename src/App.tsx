import React, { useState } from 'react';
import { Header } from './components/Header';
import { Navigation, MainTab } from './components/Navigation';
import { AiLawyerChatView } from './components/AiLawyerChatView';
import { LiveVoiceCounselView } from './components/LiveVoiceCounselView';
import { DocumentGeneratorView } from './components/DocumentGeneratorView';
import { DocumentAnalyzerView } from './components/DocumentAnalyzerView';
import { Language } from './types/legal';
import { stopSpeaking } from './services/apiService';
import { Scale, ExternalLink } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<MainTab>('live-voice');
  const [language, setLanguage] = useState<Language>('uz');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleStopSpeech = () => {
    stopSpeaking();
    setIsSpeaking(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Header */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        isSpeaking={isSpeaking}
        onStopSpeech={handleStopSpeech}
      />

      {/* Navigation Tabs */}
      <Navigation
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        language={language}
      />

      {/* Main Focus Views */}
      <main className="flex-1 pb-12">
        {currentTab === 'live-voice' && (
          <LiveVoiceCounselView
            language={language}
            onLanguageChange={setLanguage}
            isGlobalSpeaking={isSpeaking}
            setIsGlobalSpeaking={setIsSpeaking}
          />
        )}

        {currentTab === 'ai-lawyer' && (
          <AiLawyerChatView
            language={language}
            onLanguageChange={setLanguage}
            isSpeaking={isSpeaking}
            setIsSpeaking={setIsSpeaking}
          />
        )}

        {currentTab === 'doc-generator' && (
          <DocumentGeneratorView language={language} />
        )}

        {currentTab === 'doc-analyzer' && (
          <DocumentAnalyzerView language={language} />
        )}
      </main>


      {/* Sleek Minimal Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center space-x-2">
            <Scale className="w-4 h-4 text-amber-500/70" />
            <span className="font-serif font-bold text-slate-300">
              HUQUQ AI — O‘zbekiston Qonunchiligi & IELTS Darajasidagi Yuridik Intellekt
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] font-mono">
            <a
              href="https://lex.uz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-amber-300 transition-all flex items-center space-x-1"
            >
              <span>Lex.uz</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <a
              href="https://constitution.uz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-amber-300 transition-all flex items-center space-x-1"
            >
              <span>Constitution.uz</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
