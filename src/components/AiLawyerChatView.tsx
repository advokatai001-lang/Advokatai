import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  Square,
  Send,
  Scale,
  Shield,
  BookOpen,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Layers,
  FileCheck2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Language } from '../types/legal';
import { analyzeLegalQuery, speakLegalText, stopSpeaking } from '../services/apiService';
import { OFFICIAL_LAW_SOURCES } from '../services/legalKnowledgeBase';
import { detectLanguage } from '../services/voiceLabService';

interface AiLawyerChatViewProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isSpeaking: boolean;
  setIsSpeaking: (speaking: boolean) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AiLawyerChatView: React.FC<AiLawyerChatViewProps> = ({
  language,
  onLanguageChange,
  isSpeaking,
  setIsSpeaking,
}) => {
  const [jurisdiction, setJurisdiction] = useState<'uz' | 'rf' | 'comparative'>('uz');
  const [showSourcesList, setShowSourcesList] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-initial',
      sender: 'ai',
      text:
        language === 'ru'
          ? `Здравствуйте! Я HUQUQ AI — профессиональный юридический советник высшей квалификации.

В мою базу интегрированы официальные правовые источники:
• **Республика Узбекистан**: Гражданский кодекс (lex.uz/acts/-97664), Конституция (constitution.uz), Уголовный кодекс (lex.uz/docs/-111453), УПК и постановления Пленума ВС РУз.
• **Российская Федерация (КонсультантПлюс)**: УПК РФ (cons_doc_LAW_28399), ФЗ № 63-ФЗ «Об адвокатуре», № 2202-1 «О прокуратуре», № 403-ФЗ «О СК РФ», № 3-ФЗ «О полиции», № 144-ФЗ «Об ОРД», № 229-ФЗ «Об исполнительном производстве» и другие 14 федеральных законов.

Задайте вопрос текстом или голосом — я сформулирую безупречную позицию защиты.`
          : language === 'en'
          ? `Welcome to HUQUQ AI — advanced LegalTech assistant with IELTS Band 9 reasoning.

Supported official databases:
• **Uzbekistan**: Civil Code (lex.uz/acts/-97664), Constitution (constitution.uz), Criminal Code (lex.uz/docs/-111453), Criminal Procedure Code, and Supreme Court Plenum precedents.
• **Russian Federation (ConsultantPlus)**: CPC RF (cons_doc_LAW_28399), Federal Law No. 63-FZ (Advocacy), No. 2202-1 (Prosecution), No. 144-FZ (Operational Activities), No. 3-FZ (Police), No. 229-FZ (Enforcement Proceedings), and related statutes.

Ask your query via text or voice microphone.`
          : `Assalomu alaykum! Men HUQUQ AI — O‘zbekiston va Rossiya Federatsiyasi qonunchiligi bo‘yicha professional yuridik maslahatchingizman.

Tizimga to‘liq yuklangan rasmiy manbalar:
• **O‘zbekiston**: Fuqarolik kodeksi (lex.uz/acts/-97664), Konstitutsiya (constitution.uz), Jinoyat kodeksi (lex.uz/docs/-111453), JPK 95-modda va Oliy sud Plenumi.
• **Rossiya Federatsiyasi (КонсультантПлюс)**: УПК РФ, 63-ФЗ «Advokatura», 2202-1 «Prokuratura», 403-ФЗ «Tergov qo‘mitasi», 3-ФЗ «Politsiya», 144-ФЗ «Tezkor-qidiruv faoliyati (ОРД)», 229-ФЗ «Ijro ishi» va barcha 14 ta federal qonun.

Savolingizni yozing yoki mikrofonda ovoz orqali bering:`,
      timestamp: 'Hozir',
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoVoiceOn, setAutoVoiceOn] = useState(false); // user toggle
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = true;

      rec.onresult = (e: any) => {
        let text = '';
        for (let i = e.resultIndex; i < e.length; ++i) {
          text += e.results[i][0].transcript;
        }
        setInputQuery(text);
      };

      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);

      recognitionRef.current = rec;
    }
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Brauzeringizda mikrofondan ovoz yozish qo'llab-quvvatlanmadi. Iltimos, matn shaklida yozing.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      stopSpeaking();
      setIsSpeaking(false);
      recognitionRef.current.lang =
        language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : 'uz-UZ';
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputQuery;
    if (!textToSend.trim() || loading) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    // Auto-detect language dynamically from user input
    const detectedLang = detectLanguage(textToSend);
    if (onLanguageChange && detectedLang !== language) {
      onLanguageChange(detectedLang);
    }

    try {
      const res = await analyzeLegalQuery({
        query: textToSend,
        language: detectedLang,
        mode: 'defense',
        jurisdiction,
        caseContext: `Yurisdiksiya: ${jurisdiction.toUpperCase()}. Rasmiy manbalar: Lex.uz, Constitution.uz, Consultant.ru, RF 14 Federal Qonunlari.`,
        messages: [...messages, userMsg].slice(-6),
      });

      const aiText = res.result;
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);

      if (autoVoiceOn) {
        speakLegalText(
          aiText,
          detectedLang,
          detectedLang === 'ru' ? 'voicelab-ru-advokat' : detectedLang === 'en' ? 'voicelab-en-counsel' : 'voicelab-jasur',
          () => setIsSpeaking(true),
          () => setIsSpeaking(false)
        );
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: `Xatolik yuz berdi: ${err.message}`,
          timestamp: 'Xato',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (msg: ChatMessage) => {
    navigator.clipboard.writeText(msg.text);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeakMessage = (text: string) => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      const detected = detectLanguage(text);
      speakLegalText(
        text,
        detected,
        detected === 'ru' ? 'voicelab-ru-advokat' : detected === 'en' ? 'voicelab-en-counsel' : 'voicelab-jasur',
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Active Top Header Card */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/25 to-slate-900 border border-amber-500/30 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>LEX.UZ • CONSTITUTION.UZ • КОНСУЛЬТАНТПЛЮС • 14 ФЗ РФ</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-100">
              AI Advokat: O‘zbekiston va Rossiya Qonunlari Bo‘yicha Intellekt
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              FK (lex.uz/-97664), JK (lex.uz/-111453), Konstitutsiya, УПК РФ hamda Rossiya Federatsiyasining 14 ta federal qonuni (63-ФЗ, 2202-1, 144-ФЗ, 229-ФЗ) asosida to‘g‘ri javob beradi.
            </p>
          </div>

          {/* Right Controls: Auto Voice & Sources Modal Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowSourcesList(!showSourcesList)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-amber-300 border border-slate-700 transition-all cursor-pointer font-medium"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Manbalar ({OFFICIAL_LAW_SOURCES.length})</span>
              {showSourcesList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => {
                if (isSpeaking) {
                  stopSpeaking();
                  setIsSpeaking(false);
                }
                setAutoVoiceOn(!autoVoiceOn);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                autoVoiceOn
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>Ovozli javob: {autoVoiceOn ? 'Yoniq' : "O'chiq"}</span>
            </button>
          </div>
        </div>

        {/* Jurisdiction Selector Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1 py-1">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Yurisdiksiya:</span>
          </span>

          <button
            onClick={() => setJurisdiction('uz')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              jurisdiction === 'uz'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🇺🇿 O‘zbekiston (Lex.uz & Konstitutsiya)
          </button>

          <button
            onClick={() => setJurisdiction('rf')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              jurisdiction === 'rf'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🇷🇺 Rossiya Federatsiyasi (УПК РФ & 14 ta ФЗ)
          </button>

          <button
            onClick={() => setJurisdiction('comparative')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              jurisdiction === 'comparative'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🌐 Qiyosiy Tahlil (O‘zbekiston / RF)
          </button>
        </div>

        {/* Collapsible Official Sources Accordion */}
        {showSourcesList && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-amber-400">
                Rasmiy Qonun Havolalari va Federal Qonunlar Bazasi
              </span>
              <span className="text-[10px] text-slate-400">Bevosita manbalar</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {OFFICIAL_LAW_SOURCES.map((src, i) => (
                <a
                  key={i}
                  href={src.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 flex items-start justify-between text-xs transition-all group"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-200 group-hover:text-amber-300 flex items-center space-x-1.5">
                      <span>{src.name}</span>
                      {src.lawNumber && (
                        <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/15 text-amber-300 font-mono">
                          {src.lawNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{src.description}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 shrink-0 ml-1.5 mt-0.5" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Quick Questions Chips */}
        <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1 py-1">
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span>Tezkor savollar:</span>
          </span>

          <button
            onClick={() => handleSend("Salom!")}
            className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-xs text-amber-300 font-semibold transition-all cursor-pointer"
          >
            👋 Salom!
          </button>

          <button
            onClick={() => handleSend("Sen kimsan va menga qanday yordam bera olasan?")}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs text-slate-200 font-medium transition-all cursor-pointer"
          >
            🤖 Sen kimsan?
          </button>

          {jurisdiction === 'rf' || jurisdiction === 'comparative' ? (
            <>
              <button
                onClick={() =>
                  handleSend(
                    "Федеральный закон № 63-ФЗ «Об адвокатской деятельности»: какие гарантии независимости адвоката установлены законом и можно ли допрашивать адвоката по обстоятельствам дела доверителя?"
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs text-amber-300 font-medium transition-all cursor-pointer"
              >
                63-ФЗ: Адвокатский статус и тайна
              </button>

              <button
                onClick={() =>
                  handleSend(
                    "Федеральный закон № 144-ФЗ «Об ОРД» и ст. 75 УПК РФ: как доказать провокацию взятки и признать результаты ОРМ недопустимыми доказательствами?"
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs text-amber-300 font-medium transition-all cursor-pointer"
              >
                144-ФЗ: ОРД и запрет провокации
              </button>

              <button
                onClick={() =>
                  handleSend(
                    "Федеральный закон № 229-ФЗ «Об исполнительном производстве» и 118-ФЗ: на какие доходы пристав не имеет права налагать арест и как сохранить прожиточный минимум?"
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs text-amber-300 font-medium transition-all cursor-pointer"
              >
                229-ФЗ: Исполнительное производство
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() =>
                  handleSend(
                    "O'zbekiston Respublikasi JK 168-moddasi (https://lex.uz/docs/-111453) va FK (https://lex.uz/acts/-97664): avans olinib ish kechikkan holatda nega bu firibgarlik emas, balki fuqarolik nizosi hisoblanadi?"
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs text-amber-300 font-medium transition-all cursor-pointer"
              >
                JK 168: Firibgarlik vs FK shartnoma
              </button>

              <button
                onClick={() => handleSend("51-modda nima va u qanday huquqlarni beradi?")}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-xs text-amber-200 font-semibold border border-amber-500/40 transition-all cursor-pointer"
              >
                ⚖️ 51-modda (Konstitutsiya, JPK 51, JK 51)
              </button>

              <button
                onClick={() =>
                  handleSend(
                    "O'zbekiston Respublikasi Konstitutsiyasi 27, 28, 29-moddalari (https://constitution.uz/uploads/constitution_oz.pdf) va JPK 95-moddasi: advokatsiz so'roq va videoyozuvsiz tintuv dalillarini nomaqbul deb topish tartibi."
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs text-amber-300 font-medium transition-all cursor-pointer"
              >
                Konstitutsiya & JPK 95: Nomaqbul dalillar
              </button>

              <button
                onClick={() =>
                  handleSend("YPX xodimi to'xtatganda haydovchining qanday huquqlari bor?")
                }
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs text-amber-300 font-medium transition-all cursor-pointer"
              >
                👮‍♂️ YPX va Haydovchi huquqlari
              </button>

              <button
                onClick={() =>
                  handleSend("Aliment miqdori qancha va uni qanday undirish mumkin?")
                }
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs text-amber-300 font-medium transition-all cursor-pointer"
              >
                👶 Aliment va Oila kodeksi
              </button>

              <button
                onClick={() =>
                  handleSend("Uy-joy snos bo'lsa qanday kompensatsiya talab qilish mumkin va propiskadan chiqarish tartibi qanday?")
                }
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs text-amber-300 font-medium transition-all cursor-pointer"
              >
                🏠 Uy-joy, Snos va Propiska (UJK)
              </button>

              <button
                onClick={() =>
                  handleSend("Soliq organlari kameral tekshiruv o'tkazganda tadbirkorning qanday huquqlari bor?")
                }
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs text-amber-300 font-medium transition-all cursor-pointer"
              >
                💰 Soliq kodeksi va Kameral tekshiruv
              </button>

              <button
                onClick={() =>
                  handleSend("Do'kondan olingan sifatsiz tovarni cheksiz qaytarish mumkinmi? Iste'molchi huquqlari.")
                }
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs text-amber-300 font-medium transition-all cursor-pointer"
              >
                🛡️ Iste'molchi huquqi: Tovarni qaytarish
              </button>

              <button
                onClick={() =>
                  handleSend("Bojxona to'lovlari asossiz hisoblanganda va JK 182-modda bo'yicha qanday himoyalanish kerak?")
                }
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs text-amber-300 font-medium transition-all cursor-pointer"
              >
                📦 Bojxona kodeksi va JK 182
              </button>

              <button
                onClick={() =>
                  handleSend("Merosni qabul qilish muddati qancha va majburiy ulush nima?")
                }
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs text-amber-300 font-medium transition-all cursor-pointer"
              >
                📜 Meros huquqi (FK 1142)
              </button>

              <button
                onClick={() =>
                  handleSend("Kredit foizlari va asossiz penyalarni sudda kamaytirish tartibi (FK 326-modda).")
                }
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs text-amber-300 font-medium transition-all cursor-pointer"
              >
                🏦 Kredit va Penya (FK 326)
              </button>
            </>
          )}
        </div>
      </div>

      {/* Chat Messages Stream */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-xl flex flex-col min-h-[480px] max-h-[650px] overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center space-x-2 text-[11px] text-slate-500 mb-1 px-1">
                <span className="font-semibold text-slate-400">
                  {msg.sender === 'user' ? 'Siz' : 'HUQUQ AI (Oliy Toifali Advokat)'}
                </span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              <div
                className={`p-4 sm:p-5 rounded-2xl max-w-[95%] sm:max-w-[88%] text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.sender === 'user'
                    ? 'bg-amber-500/20 text-amber-100 border border-amber-500/35 shadow-sm'
                    : 'bg-slate-950 text-slate-200 border border-slate-800 shadow-md font-sans'
                }`}
              >
                {msg.text}

                {/* AI Message Action Buttons */}
                {msg.sender === 'ai' && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center space-x-1">
                      <Scale className="w-3 h-3" />
                      <span>Lex.uz • Constitution.uz • КонсультантПлюс</span>
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSpeakMessage(msg.text)}
                        className={`px-2.5 py-1 rounded-lg text-xs flex items-center space-x-1 transition-all cursor-pointer ${
                          isSpeaking
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                        }`}
                        title="Ovozda tinglash"
                      >
                        {isSpeaking ? (
                          <>
                            <Square className="w-3.5 h-3.5" />
                            <span>To'xtatish</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Ovozda eshitish</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleCopyMessage(msg)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1 transition-all cursor-pointer"
                        title="Nusxalash"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Nusxalandi</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Nusxa</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-3 p-4 rounded-xl bg-slate-950 border border-slate-800 max-w-md">
              <div className="w-5 h-5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-200">
                  Qonunlar va federal me'yorlar tahlil qilinmoqda...
                </p>
                <p className="text-[11px] text-slate-500">
                  Lex.uz, Constitution.uz va Consultant.ru bazasiga asosan
                </p>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Bottom Input Area */}
        <div className="pt-3 border-t border-slate-800 mt-2 space-y-2">
          <div className="flex items-center space-x-2">
            {/* Mic Button */}
            <button
              onClick={toggleListening}
              className={`p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
                  : 'bg-slate-800 hover:bg-slate-750 text-amber-400 border border-slate-700'
              }`}
              title={isListening ? "Tinglashni to'xtatish" : "Ovozda savol berish (Mikrofon)"}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Input field */}
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={
                isListening
                  ? "Sizni tinglamoqdaman... Gapiring"
                  : jurisdiction === 'rf'
                  ? "Задайте вопрос по праву РФ (63-ФЗ, 144-ФЗ, 229-ФЗ, УПК РФ, полиция, прокуратура)..."
                  : "Huquqiy savolingizni yozing (FK 353, JK 168, JPK 95, 63-ФЗ, 229-ФЗ)..."
              }
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
            />

            {/* Send Button */}
            <button
              onClick={() => handleSend()}
              disabled={loading || !inputQuery.trim()}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-1.5 shadow-md shadow-amber-500/20"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <>
                  <Send className="w-4 h-4 text-slate-950" />
                  <span className="hidden sm:inline">Yuborish</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>
              {isListening ? "Mikrofon faol: Ovozdan matnga aylantirilmoqda..." : "Savol bering — AI barcha qonunlarga to‘g‘ri va asosli javob beradi."}
            </span>
            <span className="font-mono text-[10px]">Lex.uz • Consultant.ru</span>
          </div>
        </div>
      </div>
    </div>
  );
};
