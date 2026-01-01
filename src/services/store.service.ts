
import { Injectable, signal, computed, effect } from '@angular/core';
import { Question, AppState } from '../models/types';

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly STORAGE_KEY = 'docubrain_persistent_state';

  private state = signal<AppState>({
    knowledgeBaseFiles: [],
    knowledgeBaseText: '',
    questionFiles: [],
    questions: [],
    isAnalyzing: false,
    progress: 0
  });

  constructor() {
    // Caricamento iniziale dallo storage
    const savedState = localStorage.getItem(this.STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Ripristiniamo solo i dati permanenti, resettando quelli di processo
        this.state.set({
          ...parsed,
          isAnalyzing: false,
          progress: 0
        });
      } catch (e) {
        console.error('Errore nel ripristino della sessione precedente:', e);
      }
    }

    // Effetto per il salvataggio automatico ad ogni cambiamento del segnale
    effect(() => {
      const currentState = this.state();
      // Non persistiamo lo stato di analisi in corso per evitare loop al refresh
      const { isAnalyzing, progress, ...persistentData } = currentState;
      
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(persistentData));
      } catch (e) {
        console.warn('Limite di archiviazione locale raggiunto. Alcuni dati potrebbero non essere persistenti.', e);
      }
    });
  }

  // Selectors
  knowledgeBase = computed(() => this.state().knowledgeBaseText);
  kbFiles = computed(() => this.state().knowledgeBaseFiles);
  qFiles = computed(() => this.state().questionFiles);
  questions = computed(() => this.state().questions);
  isAnalyzing = computed(() => this.state().isAnalyzing);
  progress = computed(() => this.state().progress);
  questionCount = computed(() => this.state().questions.length);
  answeredCount = computed(() => this.state().questions.filter(q => q.status === 'answered' || q.status === 'not_found').length);

  addKbContent(filename: string, text: string) {
    this.state.update(s => ({
      ...s,
      knowledgeBaseFiles: [...s.knowledgeBaseFiles, filename],
      knowledgeBaseText: s.knowledgeBaseText + '\n' + text
    }));
  }

  addQuestions(filename: string, newQuestions: Question[]) {
    this.state.update(s => ({
      ...s,
      questionFiles: [...s.questionFiles, filename],
      questions: [...s.questions, ...newQuestions]
    }));
  }

  addManualQuestion(text: string, answer: string | null = null) {
    const newQ: Question = {
      id: crypto.randomUUID(),
      text,
      answer,
      status: answer ? 'answered' : 'pending',
      lastUpdated: Date.now()
    };
    this.state.update(s => ({
      ...s,
      questions: [newQ, ...s.questions]
    }));
  }

  removeQuestion(id: string) {
    this.state.update(s => ({
      ...s,
      questions: s.questions.filter(q => q.id !== id)
    }));
  }

  updateQuestion(id: string, updates: Partial<Question>) {
    this.state.update(s => ({
      ...s,
      questions: s.questions.map(q => q.id === id ? { ...q, ...updates, lastUpdated: Date.now() } : q)
    }));
  }

  setAnalyzing(status: boolean) {
    this.state.update(s => ({ ...s, isAnalyzing: status }));
  }

  setProgress(progress: number) {
    this.state.update(s => ({ ...s, progress }));
  }

  clearKnowledgeBase() {
    this.state.update(s => ({ ...s, knowledgeBaseFiles: [], knowledgeBaseText: '' }));
  }

  clearQuestions() {
    this.state.update(s => ({ ...s, questionFiles: [], questions: [] }));
  }

  exportQuestionsOnly() {
    const questions = this.state().questions;
    if (questions.length === 0) return;
    
    const data = JSON.stringify(questions, null, 2);
    this.downloadJson(data, `docubrain-domande-${new Date().toISOString().split('T')[0]}.json`);
  }

  exportFullBackup() {
    const data = JSON.stringify({
      questions: this.state().questions,
      kbFiles: this.state().knowledgeBaseFiles,
      kbText: this.state().knowledgeBaseText,
      qFiles: this.state().questionFiles
    }, null, 2);
    this.downloadJson(data, `docubrain-backup-completo-${new Date().toISOString().split('T')[0]}.json`);
  }

  private downloadJson(content: string, filename: string) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  importData(jsonString: string) {
    try {
      const parsed = JSON.parse(jsonString);
      
      // Se è un backup completo
      if (parsed.questions && parsed.kbFiles) {
        this.state.update(s => ({ 
          ...s, 
          questions: parsed.questions,
          knowledgeBaseFiles: parsed.kbFiles || [],
          knowledgeBaseText: parsed.kbText || '',
          questionFiles: parsed.qFiles || []
        }));
      } 
      // Se è solo un array di domande
      else if (Array.isArray(parsed)) {
        this.state.update(s => ({ 
          ...s, 
          questions: [...parsed, ...s.questions].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
        }));
      }
    } catch (e) {
      console.error('Importazione fallita: formato JSON non valido', e);
    }
  }
}
