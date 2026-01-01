import { Injectable, inject } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import { StoreService } from './store.service';
import { Question } from '../models/types';
import { environment } from '../environments/environment';  // ✅ AGGIUNGI

@Injectable({ providedIn: 'root' })
export class AiService {
  private store = inject(StoreService);
  
  // ✅ USA environment invece di process.env
  private ai = new GoogleGenAI({ apiKey: environment.geminiApiKey });

  private async generateAnswer(questionText: string, kbContent: string): Promise<{ answer: string; status: Question['status'] }> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
          CONTEXTO (Base di Conoscenza Documentale):
          ${kbContent.substring(0, 45000)}

          DOMANDA DA ANALIZZARE:
          ${questionText}

          ISTRUZIONI PER L'ELABORAZIONE (STILE ACCADEMICO UNIVERSITARIO):
          1. REGISTRO LINGUISTICO: Utilizza esclusivamente un registro formale, aulico e accademico di alto livello.
          2. ARTICOLAZIONE E PROFONDITÀ: Fornisci una risposta ampia, articolata e ben strutturata. Non limitarti a brevi sintesi; sviluppa l'argomentazione in paragrafi coerenti che approfondiscano i concetti richiesti.
          3. RIGORE DOCUMENTALE: La risposta deve basarsi UNICAMENTE sulla Base di Conoscenza fornita sopra. Non utilizzare informazioni esterne o pregresse.
          4. COERENZA E CONSISTENZA: Organizza l'esposizione in modo logico (introduzione al concetto, sviluppo analitico, conclusioni tecniche).
          5. CLAUSOLA DI ASSENZA: Se le informazioni necessarie per rispondere in modo scientificamente fondato non sono presenti nella documentazione, rispondi ESATTAMENTE ed esclusivamente con il termine: "NON_TROVATO".
          6. FORMATTAZIONE: Utilizza un linguaggio preciso, curando la terminologia tecnica e la proprietà di linguaggio consona a un contesto universitario.

          L'output finale deve avere la dignità di un testo d'esame o di una voce di enciclopedia specialistica.
        `,
        config: {
           thinkingConfig: { thinkingBudget: 0 }
        }
      });

      const result = response.text.trim();
      if (result.includes('NON_TROVATO')) {
        return { 
          answer: 'L\'indagine analitica sui documenti forniti non ha permesso di riscontrare elementi probatori o informativi sufficienti per elaborare una risposta scientificamente consona e coerente con il quesito posto.', 
          status: 'not_found' 
        };
      } else {
        return { answer: result, status: 'answered' };
      }
    } catch (err) {
      console.error(err);
      return { answer: 'Si è verificata un\'anomalia sistemica durante la fase di analisi e generazione accademica della risposta.', status: 'error' };
    }
  }

  async analyzeSingleQuestion(id: string) {
    const kb = this.store.knowledgeBase();
    const questions = this.store.questions();
    const q = questions.find(item => item.id === id);

    if (!kb || !q) return;

    this.store.updateQuestion(id, { status: 'processing' });
    const result = await this.generateAnswer(q.text, kb);
    this.store.updateQuestion(id, { ...result });
  }

  async analyzeQuestions() {
    const kb = this.store.knowledgeBase();
    const questions = this.store.questions();
    
    if (!kb || questions.length === 0) return;

    this.store.setAnalyzing(true);
    this.store.setProgress(0);

    const pendingQuestions = questions.filter(q => q.status === 'pending' || q.status === 'error' || q.status === 'not_found');
    const totalToProcess = pendingQuestions.length;

    for (let i = 0; i < pendingQuestions.length; i++) {
      const q = pendingQuestions[i];
      this.store.updateQuestion(q.id, { status: 'processing' });
      const result = await this.generateAnswer(q.text, kb);
      this.store.updateQuestion(q.id, { ...result });
      this.store.setProgress(Math.round(((i + 1) / totalToProcess) * 100));
    }

    this.store.setAnalyzing(false);
  }
}
