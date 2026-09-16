export type RiskLevel = 1 | 2 | 3 | 4 | 5 | null;
export type AnalysisMode = 'decision' | 'translation' | 'calculation' | 'post_review' | 'message_gen';

export interface AnalysisResult {
  analysisMode: AnalysisMode;
  riskLevel?: RiskLevel;
  riskLabel?: string;
  confidence: number;
  summary: string;
  financialImpact?: {
    totalCost: number;
    description: string;
  };
  signals: {
    quote?: string;
    explanation: string;
  }[];
  technique?: {
    name: string;
    description: string;
  };
  actions: {
    label: string;
    type: 'copy' | 'link' | 'info';
    content: string;
  }[];
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  input: string;
  result: AnalysisResult;
}
