import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  PhoneCall,
  PhoneOff,
  RotateCcw,
  Shield,
  BookOpen,
  CheckCircle2,
  Radio,
  Sliders,
  Play,
  Square,
  AlertCircle,
  HelpCircle,
  Info,
} from 'lucide-react';
import { Language } from '../types/legal';
import {
  VOICE_PROFILES,
  VoiceProfile,
  speakWithVoiceLab,
  stopAllSpeech,
  playAudibleChime,
  cleanTextForSpeech,
  detectLanguage,
  getVoiceLabApiKey,
  setVoiceLabApiKey,
} from '../services/voiceLabService';
import { sendLegalQuery } from '../services/apiService';

interface LiveMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  articles?: string[];
}

interface LiveVoiceCounselViewProps {
  language: Language;
  onLanguageChange?: (lang: Language) => void;
  isGlobalSpeaking?: boolean;
  setIsGlobalSpeaking?: (val: boolean) => void;
}

export const LiveVoiceCounselView: React.FC<LiveVoiceCounselViewProps> = ({
  language,
  onLanguageChange,
}) => {
  // Voice & Interaction states
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('voicelab-jasur');
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0);
  const [isCallActive, setIsCallActive] = useState<boolean>(true);
  const [callState, setCallState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [handsFreeMode, setHandsFreeMode] = useState<boolean>(true);
  const [transcript, setTranscript] = useState<string>('');
  const [messages, setMessages] = useState<LiveMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text:
        language === 'ru'
          ? 'Здравствуйте! Я ваш голосовой адвокат HUQUQ AI. Задайте любой правовой вопрос вслух, и я предоставлю вам стратегию защиты и ссылки на статьи законов.'
          : language === 'en'
          ? 'Greetings. I am your HUQUQ AI Voice Counsel. Speak your legal matter freely, and I will deliver an authoritative legal strategy backed by statutory articles.'
          : 'Assalomu alaykum! Men HUQUQ AI — VoiceLab yuridik ovozli maslahatchisiman. Istalgan huquqiy muammo yoki savolingizni ovoz chiqarib ayting, men sizga darhol qonuniy asoslangan maslahat beraman.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [testStatus, setTestStatus] = useState<string>('');
  const [showVoiceLabModal, setShowVoiceLabModal] = useState<boolean>(false);
  const [voiceLabKeyInput, setVoiceLabKeyInput] = useState<string>(getVoiceLabApiKey());
  const [keyNotice, setKeyNotice] = useState<string>('');
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isComponentMounted = useRef<boolean>(true);

  useEffect(() => {
    isComponentMounted.current = true;
    return () => {
      isComponentMounted.current = false;
      stopAllSpeech();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, callState]);

  // Set appropriate voice when language changes
  useEffect(() => {
    if (language === 'ru') {
      setSelectedVoiceId('voicelab-ru-advokat');
    } else if (language === 'en') {
      setSelectedVoiceId('voicelab-en-counsel');
    } else {
      setSelectedVoiceId('voicelab-jasur');
    }
  }, [language]);

  // Direct Audio & Voice Test
  const handleTestVoice = async () => {
    stopAllSpeech();
    setTestStatus('🔊 Ovoz tekshirilmoqda...');
    playAudibleChime('start');

    const testText =
      language === 'ru'
        ? 'Проверка звука. Голосовой движок HUQUQ AI работает стабильно и готов к юридической консультации.'
        : language === 'en'
        ? 'Voice test. HUQUQ AI voice engine is active and ready for your legal queries.'
        : 'Assalomu alaykum! VoiceLab ovozli tizimi to‘liq ishlamoqda. Men sizning professional yuridik himoyachingizman.';

    try {
      setCallState('speaking');
      await speakWithVoiceLab(testText, {
        lang: language,
        voiceId: selectedVoiceId,
        speed: speechSpeed,
        onStart: () => {
          setCallState('speaking');
          setTestStatus('🔊 Ovoz yangramoqda...');
        },
        onEnd: () => {
          setCallState('idle');
          setTestStatus('✅ Ovoz muvaffaqiyatli yangradi!');
          setTimeout(() => setTestStatus(''), 4000);
        },
        onError: (err) => {
          setCallState('idle');
          setTestStatus(`⚠️ Xatolik: ${err.message}`);
        },
      });
    } catch (e: any) {
      setCallState('idle');
      setTestStatus(`⚠️ Xato: ${e.message}`);
    }
  };

  // Start Speech Recognition
  const startListening = () => {
    stopAllSpeech();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        language === 'ru'
          ? 'Ваш браузер не поддерживает распознавание речи. Используйте Chrome или Edge.'
          : 'Brauzeringiz ovozni aniqlashni qo‘llab-quvvatlamaydi. Iltimos Google Chrome yoki Microsoft Edge brauzeridan foydalaning.'
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      playAudibleChime('start');
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : 'uz-UZ';

      rec.onstart = () => {
        setCallState('listening');
        setTranscript('');
      };

      rec.onresult = (event: any) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
      };

      rec.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setCallState('idle');
      };

      rec.onend = () => {
        setCallState((prev) => {
          if (prev === 'listening') return 'processing';
          return prev;
        });

        // Trigger processing if user spoke something
        setTranscript((finalTranscript) => {
          if (finalTranscript.trim()) {
            handleProcessUserQuery(finalTranscript.trim());
          } else {
            setCallState('idle');
          }
          return '';
        });
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error('Could not start recognition:', err);
      setCallState('idle');
    }
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setCallState('idle');
  };

  // Process User's spoken query and speak out the answer in matching language
  const handleProcessUserQuery = async (queryText: string) => {
    setCallState('processing');

    // Auto-detect language dynamically: if user spoke Russian, reply & speak in Russian!
    const detectedLang = detectLanguage(queryText);
    if (onLanguageChange && detectedLang !== language) {
      onLanguageChange(detectedLang);
    }

    const effectiveVoiceId =
      detectedLang === 'ru'
        ? 'voicelab-ru-advokat'
        : detectedLang === 'en'
        ? 'voicelab-en-counsel'
        : selectedVoiceId.includes('dilnoza')
        ? 'voicelab-dilnoza'
        : 'voicelab-jasur';

    setSelectedVoiceId(effectiveVoiceId);

    const userMsg: LiveMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await sendLegalQuery(queryText, detectedLang, [...messages, userMsg].slice(-6));

      const aiText = response.text || (detectedLang === 'ru' ? 'Извините, произошел сбой связи.' : 'Kechirasiz, javob olishda uzilish yuz berdi.');
      const aiMsg: LiveMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        articles: response.sources?.map((s: { article: string }) => s.article) || [],
      };

      setMessages((prev) => [...prev, aiMsg]);
      setCallState('speaking');

      // Speak out loud in the matching detected language using VoiceLab!
      await speakWithVoiceLab(aiText, {
        lang: detectedLang,
        voiceId: effectiveVoiceId,
        speed: speechSpeed,
        onStart: () => {
          setCallState('speaking');
        },
        onEnd: () => {
          setCallState('idle');
          // If Hands-Free mode is enabled and call is still active, listen again!
          if (handsFreeMode && isCallActive && isComponentMounted.current) {
            setTimeout(() => {
              if (isComponentMounted.current && callState === 'idle') {
                startListening();
              }
            }, 800);
          }
        },
        onError: () => {
          setCallState('idle');
        },
      });
    } catch (err: any) {
      console.error('Error generating AI lawyer voice answer:', err);
      const errMsg: LiveMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: 'Aloqa uzildi. Iltimos qaytadan savol bering yoki yozma rejimda yuboring.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
      setCallState('idle');
    }
  };

  // Interrupt/Silence Speech
  const handleInterrupt = () => {
    stopAllSpeech();
    stopListening();
    setCallState('idle');
  };

  // Quick Voice Prompts
  const quickPrompts = [
    {
      labelUz: '👋 Salom, siz kimsiz?',
      labelRu: '👋 Привет, кто вы?',
      labelEn: '👋 Hello, who are you?',
      text: language === 'ru' ? 'Привет, кто вы и чем можете помочь?' : language === 'en' ? 'Hello, who are you and how can you help me?' : 'Salom, siz kimsiz va menga qanday yordam bera olasiz?',
    },
    {
      labelUz: '🚔 YPX sababsiz to‘xtatdi',
      labelRu: '🚔 ГИБДД остановили без причины',
      labelEn: '🚔 Police traffic stop rights',
      text: language === 'ru' ? 'Сотрудник ДПС остановил без причины, какие у меня права?' : 'YPX xodimi sababsiz mashinamni to‘xtatdi, mening qonuniy huquqlarim nima?',
    },
    {
      labelUz: '👶 Aliment undirish tartibi',
      labelRu: '👶 Взыскание алиментов',
      labelEn: '👶 Child support alimony',
      text: language === 'ru' ? 'Как взыскать алименты по закону?' : 'Sobiq turmush o‘rtog‘im aliment to‘lashdan qochyapti, qanday undiraman?',
    },
    {
      labelUz: '⚖️ JK 168 Firibgarlik himoyasi',
      labelRu: '⚖️ Защита от обвинения в мошенничестве',
      labelEn: '⚖️ Fraud defense strategy',
      text: language === 'ru' ? 'Как защититься от обвинения в мошенничестве?' : 'Fuqarolik shartnomasi bo‘yicha qarzim bor edi, lekin Jinoyat kodeksi 168-modda firibgarlik deb ayblashmoqda, qanday himoyalanaman?',
    },
    {
      labelUz: '🇷🇺 63-ФЗ Advokat so‘rovi',
      labelRu: '🇷🇺 63-ФЗ Адвокатский запрос',
      labelEn: '🇷🇺 63-FZ Attorney request',
      text: 'Федеральный закон 63-ФЗ bo‘yicha advokatlik so‘rovi yuborish tartibi qanday?',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-amber-500/30 rounded-2xl p-5 mb-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-center md:text-left">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <PhoneCall className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-100">
                  Jonli Ovozli Suhbat (VoiceLab)
                </h1>
                <span className="text-[10px] bg-red-550/30 text-red-400 border border-red-500/40 px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider animate-pulse flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span>JONLI</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                O‘zbekiston qonunchiligi va IELTS Band 9 darajasidagi advokat bilan ovozli muloqot
              </p>
            </div>
          </div>

          {/* Test Voice & Audio Diagnostics Button */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowVoiceLabModal(true)}
              className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-amber-500/40 text-amber-300 font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              title="Uzbek VoiceLab va Aisha AI sozlamalari"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>⚙️ VoiceLab Sozlamalari</span>
            </button>

            <button
              onClick={handleTestVoice}
              disabled={callState === 'speaking'}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              title="Ovozni sinab ko‘rish"
            >
              <Volume2 className="w-4 h-4" />
              <span>🔊 Ovozni tekshirish (Voice Test)</span>
            </button>

            <button
              onClick={() => setHandsFreeMode(!handsFreeMode)}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                handsFreeMode
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Hands-free: AI javob berib bo‘lgach avtomatik mikrofon yoqiladi"
            >
              <Radio className={`w-3.5 h-3.5 ${handsFreeMode ? 'text-emerald-400 animate-pulse' : ''}`} />
              <span>Avtomatik suhbat: {handsFreeMode ? 'YOQILGAN' : 'O‘CHIK'}</span>
            </button>
          </div>
        </div>

        {testStatus && (
          <div className="mt-3 text-xs bg-slate-950/80 border border-amber-500/30 rounded-lg px-3 py-2 text-amber-300 flex items-center space-x-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{testStatus}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Voice Orb & Live Controls (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden min-h-[520px]">
          {/* Background Ambient Glow */}
          <div
            className={`absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
              callState === 'speaking'
                ? 'bg-amber-500/25'
                : callState === 'listening'
                ? 'bg-emerald-500/25'
                : callState === 'processing'
                ? 'bg-blue-500/25'
                : 'bg-slate-800/20'
            }`}
          />

          {/* Status Indicator */}
          <div className="w-full flex items-center justify-between z-10">
            <div className="flex items-center space-x-2">
              <span
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  callState === 'speaking'
                    ? 'bg-amber-400 shadow-lg shadow-amber-400 animate-pulse'
                    : callState === 'listening'
                    ? 'bg-emerald-400 shadow-lg shadow-emerald-400 animate-ping'
                    : callState === 'processing'
                    ? 'bg-blue-400 animate-pulse'
                    : 'bg-slate-600'
                }`}
              />
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-slate-300">
                {callState === 'speaking' && 'AI ADVOKAT GAPIRMOQDA (VoiceLab)...'}
                {callState === 'listening' && 'SIZNI ESHITMOQDA... GAPIRING'}
                {callState === 'processing' && 'YURIDIK TAHLIL QILINMOQDA...'}
                {callState === 'idle' && 'SUHBATGA TAYYOR — MIKROFONNI BOSING'}
              </span>
            </div>

            {callState !== 'idle' && (
              <button
                onClick={handleInterrupt}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-semibold cursor-pointer transition-all"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>To‘xtatish</span>
              </button>
            )}
          </div>

          {/* Central Interactive Voice Orb */}
          <div className="my-auto py-8 flex flex-col items-center justify-center z-10">
            <div className="relative flex items-center justify-center">
              {/* Outer Pulsing Rings */}
              <div
                className={`absolute w-60 h-60 rounded-full border border-dashed transition-all duration-700 ${
                  callState === 'speaking'
                    ? 'border-amber-400/40 animate-spin scale-110'
                    : callState === 'listening'
                    ? 'border-emerald-400/40 animate-pulse scale-105'
                    : 'border-slate-700/50'
                }`}
                style={{ animationDuration: '12s' }}
              />
              <div
                className={`absolute w-48 h-48 rounded-full border transition-all duration-500 ${
                  callState === 'speaking'
                    ? 'border-amber-500/60 shadow-2xl shadow-amber-500/30 scale-105'
                    : callState === 'listening'
                    ? 'border-emerald-500/60 shadow-2xl shadow-emerald-500/30 scale-110'
                    : 'border-slate-800'
                }`}
              />

              {/* Main Interactive Button Orb */}
              <button
                onClick={() => {
                  if (callState === 'speaking') {
                    handleInterrupt();
                  } else if (callState === 'listening') {
                    stopListening();
                  } else {
                    startListening();
                  }
                }}
                className={`relative w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer group select-none ${
                  callState === 'speaking'
                    ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 scale-105'
                    : callState === 'listening'
                    ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 scale-110'
                    : callState === 'processing'
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white animate-pulse'
                    : 'bg-gradient-to-br from-slate-800 to-slate-900 text-amber-400 hover:border-amber-400/50 border border-slate-700'
                }`}
              >
                {callState === 'speaking' ? (
                  <>
                    <Volume2 className="w-12 h-12 animate-bounce" />
                    <span className="text-[11px] font-extrabold uppercase mt-1 tracking-wider">
                      To‘xtatish
                    </span>
                  </>
                ) : callState === 'listening' ? (
                  <>
                    <Mic className="w-12 h-12 animate-pulse" />
                    <span className="text-[11px] font-extrabold uppercase mt-1 tracking-wider">
                      Eshitmoqda...
                    </span>
                  </>
                ) : callState === 'processing' ? (
                  <>
                    <Sparkles className="w-12 h-12 animate-spin" />
                    <span className="text-[11px] font-extrabold uppercase mt-1 tracking-wider">
                      O‘ylamoqda...
                    </span>
                  </>
                ) : (
                  <>
                    <Mic className="w-12 h-12 group-hover:scale-110 transition-transform text-amber-400" />
                    <span className="text-[11px] font-extrabold uppercase mt-1 tracking-wider text-slate-300">
                      Gapirish
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Audio Wave Visualizer Bars */}
            <div className="flex items-center justify-center space-x-1.5 h-10 mt-8">
              {[4, 8, 14, 22, 34, 26, 18, 12, 28, 36, 20, 10, 6].map((height, i) => (
                <div
                  key={i}
                  className={`w-1.5 rounded-full transition-all duration-150 ${
                    callState === 'speaking'
                      ? 'bg-amber-400 animate-pulse'
                      : callState === 'listening'
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-slate-700/60'
                  }`}
                  style={{
                    height:
                      callState === 'speaking' || callState === 'listening'
                        ? `${Math.max(6, (height * (1 + (i % 3) * 0.4)))}px`
                        : '6px',
                    animationDelay: `${i * 70}ms`,
                  }}
                />
              ))}
            </div>

            {/* Live Transcript Bubble */}
            {transcript && (
              <div className="mt-4 max-w-md text-center bg-slate-950/80 border border-emerald-500/30 rounded-xl px-4 py-2.5 text-xs text-emerald-300 animate-fadeIn">
                <span className="font-semibold">Ovoz yozilmoqda:</span> "{transcript}"
              </div>
            )}
          </div>

          {/* Bottom Settings Bar: Voice Selector & Quick Prompts */}
          <div className="w-full z-10 border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Ovoz profili:</span>
              <select
                value={selectedVoiceId}
                onChange={(e) => setSelectedVoiceId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-medium focus:border-amber-400 focus:outline-none cursor-pointer"
              >
                {VOICE_PROFILES.map((vp) => (
                  <option key={vp.id} value={vp.id}>
                    {vp.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span>Tezlik:</span>
              <button
                onClick={() => setSpeechSpeed(0.85)}
                className={`px-2 py-0.5 rounded ${speechSpeed === 0.85 ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:text-slate-200'}`}
              >
                0.85x
              </button>
              <button
                onClick={() => setSpeechSpeed(1.0)}
                className={`px-2 py-0.5 rounded ${speechSpeed === 1.0 ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:text-slate-200'}`}
              >
                1.0x
              </button>
              <button
                onClick={() => setSpeechSpeed(1.15)}
                className={`px-2 py-0.5 rounded ${speechSpeed === 1.15 ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:text-slate-200'}`}
              >
                1.15x
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Conversation Transcript & Topics (5 cols) */}
        <div className="lg:col-span-5 flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-md h-[520px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-slate-200">Suhbat bayonnomasi (Live Transcript)</h2>
            </div>
            <button
              onClick={() => {
                setMessages([
                  {
                    id: 'new-clean',
                    sender: 'ai',
                    text: 'Suhbat yangilandi. Ixtiyoriy yuridik savolingizni bering.',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ]);
              }}
              className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Tozalash</span>
            </button>
          </div>

          {/* Quick Click Prompts */}
          <div className="mb-3">
            <p className="text-[11px] text-slate-400 mb-1.5 font-medium">Tezkor savol mavzulari:</p>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleProcessUserQuery(p.text)}
                  className="text-[11px] bg-slate-950 hover:bg-amber-500/20 hover:border-amber-500/40 border border-slate-800 text-slate-300 hover:text-amber-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer text-left"
                >
                  {p.labelUz}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Stream */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`p-3 rounded-xl border ${
                  m.sender === 'user'
                    ? 'bg-amber-500/10 border-amber-500/30 text-slate-200 ml-4'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 mr-4'
                }`}
              >
                <div className="flex items-center justify-between mb-1 text-[10px] text-slate-500 font-mono">
                  <span className="font-bold uppercase text-amber-400">
                    {m.sender === 'user' ? 'Siz (Ovozli)' : 'HUQUQ AI (Advokat)'}
                  </span>
                  <span>{m.timestamp}</span>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>

                {m.articles && m.articles.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap gap-1">
                    {m.articles.map((art, aIdx) => (
                      <span
                        key={aIdx}
                        className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono"
                      >
                        {art}
                      </span>
                    ))}
                  </div>
                )}

                {m.sender === 'ai' && (
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => {
                        stopAllSpeech();
                        speakWithVoiceLab(m.text, {
                          lang: language,
                          voiceId: selectedVoiceId,
                          speed: speechSpeed,
                        });
                      }}
                      className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center space-x-1 cursor-pointer bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>🔊 VoiceLab orqali tinglash</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* VoiceLab Settings Modal */}
      {showVoiceLabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 font-serif">
                    Uzbek VoiceLab Ovozli Tizimi
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    O‘zbekiston huquqiy nutqi va IELTS standartlari
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowVoiceLabModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Status Badge */}
              <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-3 flex items-center space-x-3">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <div className="text-xs">
                  <p className="text-emerald-300 font-semibold">VoiceLab Neyron Nutq Mexanizmi Faol</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Moddalar (51-modda, 168-modda) va qisqartmalar (JK, JPK, FK) to‘liq o‘zbek tilida yoyib o‘qiladi.
                  </p>
                </div>
              </div>

              {/* Voice Model Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Asosiy VoiceLab Ovoz Modeli:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {VOICE_PROFILES.map((vp) => (
                    <button
                      key={vp.id}
                      onClick={() => setSelectedVoiceId(vp.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedVoiceId === vp.id
                          ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-md shadow-amber-500/10'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold">{vp.name}</span>
                        {selectedVoiceId === vp.id && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block line-clamp-1">
                        {vp.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Speech Speed */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nutq Sur'ati (Tezlik):
                </label>
                <div className="flex items-center space-x-2">
                  {[0.85, 1.0, 1.15].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setSpeechSpeed(spd)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        speechSpeed === spd
                          ? 'bg-amber-500 border-amber-400 text-slate-950 shadow'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {spd}x {spd === 1.0 ? '(Standart)' : spd < 1.0 ? '(Vazmin)' : '(Tezroq)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Aisha / Uzbek VoiceLab API Key Input */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-amber-300 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Aisha / Uzbek VoiceLab X-Api-Key (Ixtiyoriy)</span>
                  </label>
                  {getVoiceLabApiKey() ? (
                    <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      FAOL (ULANGAN)
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      AVTOMATIK NEyRON REJIM
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="password"
                    value={voiceLabKeyInput}
                    onChange={(e) => setVoiceLabKeyInput(e.target.value)}
                    placeholder="aisha_api_key_..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <button
                    onClick={() => {
                      setVoiceLabApiKey(voiceLabKeyInput);
                      setKeyNotice('VoiceLab / Aisha API kaliti muvaffaqiyatli saqlandi!');
                      setTimeout(() => setKeyNotice(''), 3500);
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg cursor-pointer transition-colors"
                  >
                    Saqlash
                  </button>
                  {voiceLabKeyInput && (
                    <button
                      onClick={() => {
                        setVoiceLabKeyInput('');
                        setVoiceLabApiKey('');
                        setKeyNotice('Standart neyron rejimga qaytarildi.');
                        setTimeout(() => setKeyNotice(''), 3500);
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-slate-700 text-xs rounded-lg cursor-pointer transition-colors"
                      title="Kalitni tozalash"
                    >
                      O‘chirish
                    </button>
                  )}
                </div>

                {keyNotice && (
                  <p className="text-[11px] text-emerald-400 font-medium animate-fadeIn">
                    ✓ {keyNotice}
                  </p>
                )}

                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Aisha AI (back.aisha.group) yoki Uzbekvoice.ai kalitingiz bo‘lsa, to‘g‘ridan-to‘g‘ri server orqali studio ovozi yangraydi. Kalitsiz ham tizim O‘zbekiston qonunlariga moslashtirilgan fonetik ovozda ravon gapiradi.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={handleTestVoice}
                disabled={callState === 'speaking'}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold cursor-pointer border border-slate-700 transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>🔊 Ovozni sinash</span>
              </button>
              <button
                onClick={() => setShowVoiceLabModal(false)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer transition-colors shadow-lg shadow-amber-500/20"
              >
                Tayyor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
