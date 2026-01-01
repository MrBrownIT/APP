
export interface Question {
  id: string;
  text: string;
  answer: string | null;
  status: 'pending' | 'processing' | 'answered' | 'not_found' | 'error';
  lastUpdated: number;
}

export interface AppState {
  knowledgeBaseFiles: string[];
  knowledgeBaseText: string;
  questionFiles: string[];
  questions: Question[];
  isAnalyzing: boolean;
  progress: number;
}
