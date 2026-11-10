import React, { useState } from 'react';
import {
  FileSearch,
  AlertTriangle,
  Upload,
  Sparkles,
  ShieldAlert,
  FileCheck,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  FileText,
} from 'lucide-react';
import { Language } from '../types/legal';
import { analyzeDocument } from '../services/apiService';

interface DocumentAnalyzerViewProps {
  language: Language;
}

const SAMPLE_CONTRACT = `
MAHSULOT YETKAZIB BERISH SHARTNOMASI № 42/24

1. SHARTNOMA PREDMETI
1.1. Yetkazib beruvchi buyurtmachiga 500 tonna sement mahsulotini yetkazib berish, Buyurtmachi esa to'lovni amalga oshirish majburiyatini oladi.

2. TO'LOV VA JAVOBGARLIK SHARTLARI (XAVFLI BANDLAR)
2.1. Buyurtmachi 100% oldindan to'lovni 3 kun ichida to'laydi.
2.2. Yetkazib beruvchi tovar narxini bir tomonlama ravishda istalgan paytda oshirish huquqiga ega.
2.3. Yetkazib berish kechikkan taqdirda yetkazib beruvchi hech qanday javobgarlik yoki penya to'lamaydi, ammo Buyurtmachi to'lovni 1 kun kechiktirsa, kuniga 5% miqdorida jarima to'laydi.
2.4. Barcha nizolar faqat Yetkazib beruvchining yashirin xususiy arbitrajida ko'riladi va davlat sudlariga murojaat qilish taqiqlanadi.
2.5. Shartnoma imzolangan paytdan boshlab buyurtmachi har qanday e'tiroz bildirish huquqidan voz kechgan hisoblanadi.
`;

const SAMPLE_INDICTMENT = `
AYBLOV XULOSASI (PARCHA)
Ayblanuvchi Rustamov J.A. JK 168-moddasi 4-qismi bilan ayblanadi.
Ayblanuvchi 2024-yil 12-fevralda tergov bo'limiga taklif etilgan. Tergovchi tomonidan so'roq advokat taklif qilinmasdan o'tkazilgan bo'lib, o'z aybini bo'yniga olishi haqida bayonnoma tuzilgan. Shuningdek, tintuv jarayoni xolislar va videoyozuvsiz amalga oshirilgan.
`;

export const DocumentAnalyzerView: React.FC<DocumentAnalyzerViewProps> = ({
  language,
}) => {
  const [documentText, setDocumentText] = useState(SAMPLE_CONTRACT);
  const [documentType, setDocumentType] = useState('shartnoma');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRunAudit = async () => {
    if (!documentText.trim()) return;
    setLoading(true);
    setAnalysisResult(null);

    try {
      const data = await analyzeDocument({
        documentText,
        documentType,
        language,
      });
      setAnalysisResult(data.analysis);
    } catch (err: any) {
      setAnalysisResult(`Hujjat tahlilida xatolik: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setDocumentText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleCopy = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900 border border-rose-500/30 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>AI HUQUQIY EKSPERTIZA & XAVFLI BANDLAR AUDITI</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-slate-100">
              AI Document Analyzer: Shartnomalar va Sud Hujjatlari Tahlili
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Shartnomalardagi yashirin tuzoqlar, asossiz sanksiyalar, noqonuniy bandlar hamda ayblov xulosasidagi protsessual qoidabuzarliklarni avtomatik topuvchi advokatlik moduli.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full lg:w-auto">
            <button
              onClick={() => {
                setDocumentText(SAMPLE_CONTRACT);
                setDocumentType('shartnoma');
              }}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-rose-300 font-medium transition-all text-left cursor-pointer"
            >
              <span className="text-[10px] text-slate-400 block">Xavfli Namuna</span>
              Tuzoq Shartnoma Matni
            </button>
            <button
              onClick={() => {
                setDocumentText(SAMPLE_INDICTMENT);
                setDocumentType('ayblov_xulosasi');
              }}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-amber-300 font-medium transition-all text-left cursor-pointer"
            >
              <span className="text-[10px] text-slate-400 block">Protsessual Xato</span>
              Ayblov Xulosasi Parchasi
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Document Input & Analysis Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Text / File */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-rose-400" />
                <span>Hujjat Matni / Fayl</span>
              </label>

              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="shartnoma">Shartnoma / Bitim (FK)</option>
                <option value="ayblov_xulosasi">Ayblov xulosasi (JPK)</option>
                <option value="sud_qarori">Sud hal qiluv qarori</option>
                <option value="mehnat_shartnomasi">Mehnat shartnomasi (MK)</option>
                <option value="dalolatnoma">Tekshiruv dalolatnomasi</option>
              </select>
            </div>

            <textarea
              rows={12}
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              placeholder="Shartnoma yoki huquqiy hujjat matnini shu yerga qo'ying yoki yuklang..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs sm:text-sm text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-rose-500/60 leading-relaxed"
            />

            {/* File Upload Option */}
            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs text-slate-300 cursor-pointer transition-all">
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Fayl yuklash (.txt, .doc)</span>
                <input
                  type="file"
                  accept=".txt,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <span className="text-[11px] text-slate-500 font-mono">
                {documentText.length} belgi
              </span>
            </div>

            <button
              onClick={handleRunAudit}
              disabled={loading || !documentText.trim()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Xavfli bandlar va normalar tekshirilmoqda...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Yuridik Ekspertizadan O‘tkazish</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Analysis Report */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 sm:p-6 shadow-xl min-h-[480px] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <h3 className="font-semibold text-slate-100 text-sm sm:text-base">
                  Ekspertiza Xulosasi va Xavfli Tuzoqlar
                </h3>
              </div>

              {analysisResult && (
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1 transition-all cursor-pointer"
                  title="Nusxa olish"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{copied ? 'Nusxalandi' : 'Nusxa'}</span>
                </button>
              )}
            </div>

            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
                <div className="w-12 h-12 rounded-full border-2 border-rose-500/20 border-t-rose-500 animate-spin" />
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-slate-200">
                    Fuqarolik kodeksi, JPK normalari va asossiz bir tomonlama majburiyatlar tahlil qilinmoqda...
                  </p>
                  <p className="text-xs text-slate-500">
                    O'zbekiston Respublikasi sud amaliyotiga zid keladigan bandlar filtrlanmoqda
                  </p>
                </div>
              </div>
            )}

            {!loading && !analysisResult && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 text-slate-500">
                <FileSearch className="w-12 h-12 text-slate-700 stroke-[1.2]" />
                <p className="text-sm font-medium text-slate-400">
                  Hujjat tahlili hisoboti shu yerda chiqadi
                </p>
                <p className="text-xs max-w-sm text-slate-500">
                  Chap tarafdagi namunani tanlang yoki o‘z shartnomangizni kiriting va "Yuridik Ekspertizadan O‘tkazish" tugmasini bosing.
                </p>
              </div>
            )}

            {!loading && analysisResult && (
              <div className="flex-1 overflow-y-auto max-h-[600px] pr-2 space-y-4">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 whitespace-pre-wrap font-sans text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {analysisResult}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
