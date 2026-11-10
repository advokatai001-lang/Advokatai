import { Language } from '../types/legal';
import {
  generateExpertLegalAnalysis,
  generateLegalDocumentTemplate,
  generateContractRiskAudit,
} from './legalKnowledgeBase';

export interface AnalyzeRequest {
  query: string;
  language?: Language;
  mode?: 'standard' | 'defense' | 'adversarial' | 'constitution';
  caseContext?: string;
  jurisdiction?: 'uz' | 'rf' | 'comparative';
  messages?: Array<{ sender?: string; role?: string; text?: string; content?: string }>;
}

export interface DocumentAnalyzeRequest {
  documentText: string;
  documentType: string;
  language?: Language;
}

export interface DocumentGenerateRequest {
  docCategory: string;
  courtOrOrg: string;
  parties: {
    claimant: string;
    defendant: string;
  };
  facts: string;
  claims: string;
  language?: Language;
  jurisdiction?: 'uz' | 'rf';
}

// 1. Analyze Legal Query (High-IQ AI Yurist - Uzbek, Russian, IELTS English)
export async function analyzeLegalQuery(req: AnalyzeRequest) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const res = await fetch('/api/legal/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.result) return data;
    }
  } catch (err) {
    console.warn('Server analyze fallback activated:', err);
  }

  // Instant accurate statutory reasoning fallback
  const result = generateExpertLegalAnalysis(req.query, req.language, req.mode, req.jurisdiction || 'uz');
  return {
    success: true,
    result,
    source: 'legal-brain-engine',
    timestamp: new Date().toISOString(),
  };
}

export async function sendLegalQuery(query: string, language: Language = 'uz', messages?: any[]) {
  const res = await analyzeLegalQuery({ query, language, messages });
  return {
    text: res.result,
    sources: [] as { article: string }[],
  };
}


// 2. Analyze Document / Contract / Indictment
export async function analyzeDocument(req: DocumentAnalyzeRequest) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const res = await fetch('/api/legal/analyze-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.analysis) return data;
    }
  } catch (err) {
    console.warn('Server doc analysis fallback activated:', err);
  }

  const analysis = generateContractRiskAudit(req.documentText, req.language);
  return {
    success: true,
    analysis,
    timestamp: new Date().toISOString(),
  };
}

// 3. Generate Legal Procedural Document
export async function generateLegalDocument(req: DocumentGenerateRequest) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const res = await fetch('/api/legal/generate-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.documentContent) return data;
    }
  } catch (err) {
    console.warn('Server doc generation fallback activated:', err);
  }

  const documentContent = generateLegalDocumentTemplate(
    req.docCategory,
    req.courtOrOrg,
    req.parties.claimant,
    req.parties.defendant,
    req.facts,
    req.claims,
    req.jurisdiction || 'uz'
  );
  return {
    success: true,
    documentContent,
    timestamp: new Date().toISOString(),
  };
}

// 4. Voice Speech Engine (VoiceLab & Guaranteed Resilient Speech Engine)
import { speakWithVoiceLab, stopAllSpeech } from './voiceLabService';

export function stopSpeaking() {
  stopAllSpeech();
}

export async function speakLegalText(
  text: string,
  language: Language = 'uz',
  voice = 'voicelab-jasur',
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  return speakWithVoiceLab(text, {
    lang: language,
    voiceId: voice,
    onStart,
    onEnd,
  });
}

