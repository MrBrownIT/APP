
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../services/store.service';
import { AiService } from '../services/ai.service';
import { Question } from '../models/types';

@Component({
  selector: 'app-search',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="px-5 pt-12 pb-24 space-y-6 max-w-md mx-auto">
      <header>
        <h1 class="text-4xl font-extrabold text-gray-900 tracking-tight">Cerca</h1>
        <p class="text-gray-500 font-medium">Trova risposte nei tuoi documenti</p>
      </header>
      
      <div class="relative">
        <div class="relative bg-white rounded-2xl shadow-sm border border-gray-100 p-1 flex items-center transition-all focus-within:ring-4 focus-within:ring-blue-500/10">
          <i class="fas fa-search ml-4 text-gray-300"></i>
          <input 
            type="text" 
            [(ngModel)]="query" 
            (input)="showSuggestions.set(true)"
            placeholder="Cerca nella memoria..." 
            class="w-full bg-transparent border-none focus:ring-0 py-4 px-3 text-lg outline-none placeholder:text-gray-300"
          >
          @if (query()) {
            <button (click)="query.set(''); showSuggestions.set(false)" class="p-2 mr-2 text-gray-300">
              <i class="fas fa-times-circle"></i>
            </button>
          }
        </div>

        @if (showSuggestions() && filteredQuestions().length > 0) {
          <div class="absolute w-full mt-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 z-10 overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div class="px-4 py-2 bg-gray-50/50 border-b border-gray-100">
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Suggerimenti</span>
            </div>
            @for (q of filteredQuestions(); track q.id) {
              <button 
                (click)="selectQuestion(q)"
                class="w-full text-left px-4 py-4 hover:bg-blue-50/50 border-b border-gray-50 last:border-0 flex items-center justify-between group active:bg-blue-100"
              >
                <div class="flex-1 truncate pr-4">
                  <p class="text-[15px] font-semibold text-gray-800 truncate">{{ q.text }}</p>
                  <p class="text-xs text-gray-400 truncate">{{ q.answer || 'Senza risposta...' }}</p>
                </div>
                <i class="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-blue-500"></i>
              </button>
            }
          </div>
        }
      </div>

      @if (selectedQuestion()) {
        <div class="bg-white rounded-[32px] p-7 shadow-xl shadow-blue-900/5 border border-gray-50 space-y-5 animate-in zoom-in-95 duration-300 relative">
          <div class="flex justify-between items-start">
            <h2 class="text-xl font-bold text-gray-900 leading-tight">{{ selectedQuestion()?.text }}</h2>
            <span [class]="'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ' + getStatusClass(selectedQuestion()?.status)">
              {{ getStatusLabel(selectedQuestion()?.status) }}
            </span>
          </div>
          
          <div class="bg-gray-50 rounded-2xl p-4">
            @if (selectedQuestion()?.status === 'processing') {
              <div class="py-10 flex flex-col items-center justify-center space-y-3">
                <i class="fas fa-circle-notch fa-spin text-blue-500 text-3xl"></i>
                <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">AI sta analizzando...</p>
              </div>
            } @else {
              <p class="text-gray-700 leading-relaxed text-[15px] whitespace-pre-wrap">
                {{ selectedQuestion()?.answer || 'Nessuna risposta presente.' }}
              </p>
              
              @if (!selectedQuestion()?.answer && store.knowledgeBase()) {
                <button 
                  (click)="analyzeNow()" 
                  class="mt-4 w-full py-3 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                  <i class="fas fa-magic mr-2"></i> Chiedi all'AI ora
                </button>
              }
            }
          </div>

          <div class="pt-2 flex gap-3">
            <button (click)="editSelected()" class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-2xl transition-all active:scale-95">
              Modifica
            </button>
            <button (click)="selectedQuestion.set(null)" class="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
              Chiudi
            </button>
          </div>
        </div>
      }

      @if (isEditing()) {
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end justify-center">
          <div class="bg-white w-full rounded-t-[40px] p-8 pb-12 space-y-6 animate-in slide-in-from-bottom duration-300 shadow-2xl">
            <div class="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-2"></div>
            <h3 class="text-2xl font-bold text-center">Modifica Rapida</h3>
            
            <div class="space-y-5">
              <div class="space-y-2">
                <label class="text-xs font-black text-gray-400 uppercase ml-1">Domanda</label>
                <textarea [(ngModel)]="editText" class="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-[15px] font-medium" rows="2"></textarea>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-black text-gray-400 uppercase ml-1">Risposta</label>
                <textarea [(ngModel)]="editAnswer" class="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-[15px]" rows="6" placeholder="Risposta..."></textarea>
              </div>
            </div>

            <div class="flex gap-4 pt-2">
              <button (click)="cancelEdit()" class="flex-1 py-4 text-gray-500 font-bold active:bg-gray-50 rounded-2xl">Annulla</button>
              <button (click)="saveEdit()" class="flex-1 py-4 bg-black text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all">Salva</button>
            </div>
          </div>
        </div>
      }

      @if (!selectedQuestion() && !query()) {
        <div class="flex flex-col items-center justify-center py-20 text-gray-300">
          <div class="w-24 h-24 bg-gray-50 rounded-[40px] flex items-center justify-center mb-6">
            <i class="fas fa-search-plus text-4xl text-gray-200"></i>
          </div>
          <p class="text-sm font-semibold">Cerca tra {{ store.questionCount() }} elementi</p>
        </div>
      }
    </div>
  `
})
export class SearchComponent {
  store = inject(StoreService);
  aiService = inject(AiService);

  query = signal('');
  showSuggestions = signal(false);
  selectedQuestion = signal<Question | null>(null);

  isEditing = signal(false);
  editText = '';
  editAnswer = '';

  filteredQuestions = computed(() => {
    const q = this.query().toLowerCase();
    if (!q || q.length < 2) return [];
    return this.store.questions().filter(item => 
      item.text.toLowerCase().includes(q) || (item.answer?.toLowerCase().includes(q))
    ).slice(0, 5);
  });

  selectQuestion(q: Question) {
    this.selectedQuestion.set(q);
    this.query.set('');
    this.showSuggestions.set(false);
  }

  async analyzeNow() {
    const q = this.selectedQuestion();
    if (q) {
      await this.aiService.analyzeSingleQuestion(q.id);
      const updated = this.store.questions().find(item => item.id === q.id);
      if (updated) this.selectedQuestion.set(updated);
    }
  }

  editSelected() {
    const q = this.selectedQuestion();
    if (q) {
      this.editText = q.text;
      this.editAnswer = q.answer || '';
      this.isEditing.set(true);
    }
  }

  cancelEdit() {
    this.isEditing.set(false);
  }

  saveEdit() {
    const q = this.selectedQuestion();
    if (q) {
      this.store.updateQuestion(q.id, {
        text: this.editText,
        answer: this.editAnswer,
        status: this.editAnswer ? 'answered' : q.status
      });
      this.selectedQuestion.set({ ...q, text: this.editText, answer: this.editAnswer });
      this.isEditing.set(false);
    }
  }

  getStatusClass(status?: string) {
    switch (status) {
      case 'answered': return 'bg-green-100 text-green-700';
      case 'not_found': return 'bg-orange-100 text-orange-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'error': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  }

  getStatusLabel(status?: string) {
    switch (status) {
      case 'answered': return 'Trovata';
      case 'not_found': return 'Mancante';
      case 'processing': return 'Analisi...';
      case 'error': return 'Errore';
      default: return 'In attesa';
    }
  }
}
