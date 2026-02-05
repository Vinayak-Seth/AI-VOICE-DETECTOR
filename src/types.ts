export enum Classification {
  AI_GENERATED = 'AI_GENERATED',
  HUMAN = 'HUMAN',
}

export interface AnalysisResult {
  classification: Classification;
  confidence: number;
  explanation: string;
}

export enum SupportedLanguage {
  TAMIL = 'Tamil',
  ENGLISH = 'English',
  HINDI = 'Hindi',
  MALAYALAM = 'Malayalam',
  TELUGU = 'Telugu',
}

export interface AudioData {
  base64: string;
  mimeType: string;
  blob?: Blob;
}
