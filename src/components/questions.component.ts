
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../services/store.service';
import { AiService } from '../services/ai.service';
import { Question } from '../models/types';

@Component({
  selector: 'app-questions',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="px-5 pt-12 pb-24 space-y-6 max-w-md mx-auto">
      <header class="flex justify-between items-end">
        <div>
          <h1 class="text-4xl font-extrabold text-gray-900 tracking-tight">Memoria</h1>
          <p class="text-gray-500 font-medium">{{ store.questionCount() }} domande in memoria</p>
        </div>
        <div class="flex gap-2">
          <!-- Input file nascosto per importazione -->
          <input 
            type="file" 
            #importInput 
            class="hidden" 
            accept=".json" 
            (change)="handleFileImport($event)"
          >
          
          <button 
            (click)="importInput.click()" 
            class="bg-white text-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 active:scale-90 transition-all"
            title="Importa JSON"
          >
            <i class="fas fa-file-import text-lg"></i>
          </button>

          @if (store.questionCount() > 0) {
            <button 
              (click)="store.exportQuestionsOnly()" 
              class="bg-white text-gray-900 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 active:scale-90 transition-all"
              title="Esporta Domande"
            >
              <i class="fas fa-share-nodes text-lg"></i>
            </button>
          }

          <button 
            (click)="openAddModal()" 
            class="bg-blue-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 active:scale-90 transition-all"
            title="Aggiungi Domanda"
          >
            <i class="fas fa-plus text-xl"></i>
          </button>
        </div>
      </header>

      <div class="space-y-4">
        @for (q of store.questions(); track q.id) {
          <div (click)="openEditModal(q)" class="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 transition-all active:scale-[0.97] group relative overflow-hidden">
            <div class="flex justify-between items-start gap-3">
              <p class="text-[15px] font-bold text-gray-900 leading-snug">{{ q.text }}</p>
              <div class="flex items-center gap-2">
                @if (q.status === 'processing') {
                  <i class="fas fa-circle-notch fa-spin text-blue-500 text-xs"></i>
                } @else {
                  <span [class]="'shrink-0 h-2.5 w-2.5 rounded-full ' + getStatusDot(q.status)"></span>
                }
              </div>
            </div>
            @if (q.answer) {
              <div class="mt-3 pt-3 border-t border-gray-50">
                <p class="text-[13px] text-gray-500 line-clamp-2 leading-relaxed italic">{{ q.answer }}</p>
              </div>
            }
          </div>
        } @empty {
          <div class="text-center py-32 space-y-4">
            <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
              <i class="fas fa-inbox text-3xl text-gray-200"></i>
            </div>
            <p class="text-gray-400 font-medium">Memoria vuota. Carica un PDF o importa un JSON!</p>
          </div>
        }
      </div>

      <!-- Editor Modal -->
      @if (showEditor()) {
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-end justify-center px-0">
          <div class="bg-white w-full max-w-md rounded-t-[40px] p-8 pb-12 space-y-6 animate-in slide-in-from-bottom duration-300 shadow-2xl safe-bottom">
            <div class="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-2"></div>
            
            <div class="flex justify-between items-center">
              <h3 class="text-2xl font-bold">{{ editingQuestion() ? 'Modifica' : 'Nuova Domanda' }}</h3>
              @if (editingQuestion() && store.knowledgeBase()) {
                <button 
                  (click)="analyzeManually()" 
                  [disabled]="isAnalyzingNow()"
                  class="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest active:scale-95 disabled:opacity-50"
                >
                  <i [class]="isAnalyzingNow() ? 'fas fa-circle-notch fa-spin' : 'fas fa-magic'"></i>
                  {{ isAnalyzingNow() ? 'Analisi...' : 'AI Analizza' }}
                </button>
              }
            </div>
            
            <div class="space-y-5">
              <div class="space-y-2">
                <label class="text-xs font-black text-gray-400 uppercase ml-1">Domanda</label>
                <textarea 
                  [(ngModel)]="tempText" 
                  class="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-[15px] font-medium" 
                  rows="2"
                  placeholder="Scrivi la tua domanda qui..."
                ></textarea>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-black text-gray-400 uppercase ml-1">Risposta</label>
                <textarea 
                  [(ngModel)]="tempAnswer" 
                  class="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-[15px]" 
                  rows="5" 
                  placeholder="La risposta apparirà qui dopo l'analisi..."
                ></textarea>
              </div>
            </div>

            <div class="space-y-3 pt-2">
              <div class="flex gap-4">
                <button (click)="closeEditor()" class="flex-1 py-4 text-gray-500 font-bold active:bg-gray-50 rounded-2xl transition-all">Chiudi</button>
                <button (click)="saveQuestion()" class="flex-1 py-4 bg-black text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all">Salva</button>
              </div>
              @if (editingQuestion()) {
                <button (click)="deleteCurrent()" class="w-full py-4 text-red-500 font-bold text-xs uppercase tracking-widest active:bg-red-50 rounded-2xl transition-all">
                  Elimina dalla memoria
                </button>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class QuestionsComponent {
  store = inject(StoreService);
  aiService = inject(AiService);

  showEditor = signal(false);
  editingQuestion = signal<Question | null>(null);
  isAnalyzingNow = signal(false);
  tempText = '';
  tempAnswer = '';

  getStatusDot(status: string) {
    switch (status) {
      case 'answered': return 'bg-green-500';
      case 'not_found': return 'bg-orange-400';
      case 'processing': return 'bg-blue-500 animate-pulse';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-200';
    }
  }

  async handleFileImport(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        this.store.importData(content);
        // Reset dell'input per permettere re-importazione dello stesso file
        event.target.value = '';
      };
      reader.readAsText(file);
    }
  }

  async analyzeManually() {
    const q = this.editingQuestion();
    if (!q) return;
    
    this.isAnalyzingNow.set(true);
    await this.aiService.analyzeSingleQuestion(q.id);
    
    const updatedQ = this.store.questions().find(item => item.id === q.id);
    if (updatedQ) {
      this.tempAnswer = updatedQ.answer || '';
    }
    this.isAnalyzingNow.set(false);
  }

  openAddModal() {
    this.editingQuestion.set(null);
    this.tempText = '';
    this.tempAnswer = '';
    this.showEditor.set(true);
  }

  openEditModal(q: Question) {
    this.editingQuestion.set(q);
    this.tempText = q.text;
    this.tempAnswer = q.answer || '';
    this.showEditor.set(true);
  }

  closeEditor() {
    this.showEditor.set(false);
  }

  saveQuestion() {
    if (!this.tempText.trim()) return;

    const q = this.editingQuestion();
    if (q) {
      this.store.updateQuestion(q.id, {
        text: this.tempText,
        answer: this.tempAnswer || null,
        status: this.tempAnswer ? 'answered' : (this.tempText !== q.text ? 'pending' : q.status)
      });
    } else {
      this.store.addManualQuestion(this.tempText, this.tempAnswer || null);
    }
    this.closeEditor();
  }

  deleteCurrent() {
    const q = this.editingQuestion();
    if (q && confirm('Vuoi rimuovere questa domanda?')) {
      this.store.removeQuestion(q.id);
      this.closeEditor();
    }
  }
}
