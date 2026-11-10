export type Language = 'uz' | 'ru' | 'en';

export type LegalField =
  | 'all'
  | 'constitution'
  | 'criminal'
  | 'criminal_proc'
  | 'civil'
  | 'civil_proc'
  | 'admin'
  | 'admin_court'
  | 'labor'
  | 'family'
  | 'tax'
  | 'economic'
  | 'land'
  | 'intellectual'
  | 'plenum';

export interface LegalArticle {
  id: string;
  codeName: string;
  codeShort: string;
  articleNumber: string;
  title: string;
  category: LegalField;
  summary: string;
  fullText: string;
  lexUrl: string;
  effectiveDate: string;
  isCurrent: boolean;
  historyNote?: string;
  plenumReferences?: string[];
  keywords: string[];
}

export interface LegalCase {
  id: string;
  caseNumber: string;
  clientName: string;
  caseType: 'criminal' | 'civil' | 'economic' | 'admin' | 'labor' | 'tax';
  title: string;
  description: string;
  status: 'active' | 'investigation' | 'court' | 'appeal' | 'closed';
  courtName: string;
  judgeName?: string;
  prosecutorName?: string;
  opponentParty?: string;
  defenseGoal: string;
  statutoryArticles: string[];
  deadlines: {
    title: string;
    date: string;
    type: 'appeal' | 'detention' | 'response' | 'hearing';
    urgent: boolean;
  }[];
  evidenceList: {
    id: string;
    title: string;
    type: 'document' | 'testimony' | 'audio_video' | 'expert_opinion';
    admissibility: 'admissible' | 'challenged' | 'inadmissible';
    notes: string;
  }[];
  notes?: string;
}

export interface CourtSimMessage {
  id: string;
  role: 'judge' | 'prosecutor' | 'defense' | 'user' | 'system';
  speaker: string;
  text: string;
  timestamp: string;
  phase: 'ochilish' | 'dalillar' | 'muzokara' | 'hukm';
}

export interface LegalAnalysisResult {
  conclusion: string;
  statutoryBasis: string;
  analysis: string;
  legalRisks: string;
  defenseOptions: string;
  actionSteps: string[];
  officialSources: string[];
  rawText: string;
}
