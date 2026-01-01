
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../services/store.service';
import { PdfService } from '../services/pdf.service';
import { AiService } from '../services/ai.service';

@Component({
  selector: 'app-settings',
  imports: [CommonModule],
  template: `
    <div class="px-5 pt-12 pb-24 space-y-8 max-w-md mx-auto">
      <header>
        <h1 class="text-4xl font-extrabold text-gray-900 tracking-tight">Setup</h1>
        <p class="text-gray-500 font-medium">Configura la tua base di conoscenza</p>
      </header>

      <!-- Stato Analisi Batch -->
      @if (store.isAnalyzing()) {
        <div class="bg-blue-600 rounded-[32px] p-7 shadow-2xl shadow-blue-500/30 text-white space-y-4 animate-in slide-in-from-top duration-500">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-3">
              <i class="fas fa-circle-notch fa-spin"></i>
              <span class="text-sm font-black uppercase tracking-widest">Analisi in corso...</span>
            </div>
            <span class="text-lg font-black">{{ store.progress() }}%</span>
          </div>
          <div class="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
            <div 
              class="h-full bg-white transition-all duration-700 ease-out"
              [style.width.%]="store.progress()"
            ></div>
          </div>
          <p class="text-[10px] text-blue-100 text-center font-bold uppercase tracking-tighter opacity-80">Motore: Gemini 2.5 Flash Academic</p>
        </div>
      }

      <!-- Documenti KB -->
      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
              <i class="fas fa-folder-open"></i>
            </div>
            <h3 class="font-bold text-gray-800 text-lg">Documentazione</h3>
          </div>
          @if (store.kbFiles().length > 0) {
            <button (click)="store.clearKnowledgeBase()" class="text-xs font-bold text-red-500 px-3 py-1 bg-red-50 rounded-full">Svuota</button>
          }
        </div>
        
        <div class="grid grid-cols-1 gap-4">
          <label class="relative group flex flex-col items-center justify-center bg-white border-2 border-dashed border-gray-100 rounded-[32px] p-8 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer active:scale-95">
            <input type="file" class="hidden" accept=".pdf" multiple (change)="uploadKb($event)">
            <i class="fas fa-cloud-upload-alt text-4xl text-gray-200 group-hover:text-blue-400 mb-3 transition-colors"></i>
            <span class="text-sm font-bold text-gray-700">Carica PDF Conoscenza</span>
            <span class="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-wide">Analisi contestuale attiva</span>
          </label>
          
          <div class="flex flex-wrap gap-2">
            @for (file of store.kbFiles(); track file) {
              <div class="bg-white px-3 py-1.5 rounded-xl flex items-center gap-2 border border-gray-50 shadow-sm">
                <i class="fas fa-file-pdf text-red-400 text-xs"></i>
                <span class="text-[11px] font-bold text-gray-600 truncate max-w-[120px]">{{ file }}</span>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Domande -->
      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
              <i class="fas fa-question-circle"></i>
            </div>
            <h3 class="font-bold text-gray-800 text-lg">Set di Domande</h3>
          </div>
          @if (store.qFiles().length > 0) {
            <button (click)="store.clearQuestions()" class="text-xs font-bold text-red-500 px-3 py-1 bg-red-50 rounded-full">Svuota</button>
          }
        </div>
        
        <div class="grid grid-cols-1 gap-4">
          <label class="relative group flex flex-col items-center justify-center bg-white border-2 border-dashed border-gray-100 rounded-[32px] p-8 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer active:scale-95">
            <input type="file" class="hidden" accept=".pdf" multiple (change)="uploadQuestions($event)">
            <i class="fas fa-file-signature text-4xl text-gray-200 group-hover:text-blue-400 mb-3 transition-colors"></i>
            <span class="text-sm font-bold text-gray-700">Importa PDF Domande</span>
            <span class="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-wide">Formato lista numerata</span>
          </label>
        </div>

        @if (store.questionCount() > 0) {
          <button 
            (click)="startAnalysis()" 
            [disabled]="store.isAnalyzing() || !store.knowledgeBase()"
            class="w-full py-5 bg-black text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl disabled:opacity-30 active:scale-95 transition-all"
          >
            <i class="fas fa-bolt mr-2 text-yellow-400"></i> Avvia Analisi Accademica
          </button>
        }
      </section>

      <!-- Gestione Backup -->
      <section class="space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm">
            <i class="fas fa-database"></i>
          </div>
          <h3 class="font-bold text-gray-800 text-lg">Backup e JSON</h3>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <button (click)="store.exportFullBackup()" class="flex flex-col items-center bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm active:bg-gray-50 active:scale-95 transition-all">
            <i class="fas fa-archive text-amber-500 text-xl mb-3"></i>
            <span class="text-[10px] font-black text-gray-700 uppercase">Esporta Tutto</span>
          </button>
          <label class="flex flex-col items-center bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm active:bg-gray-50 active:scale-95 transition-all cursor-pointer">
            <input type="file" class="hidden" accept=".json" (change)="importData($event)">
            <i class="fas fa-file-import text-blue-500 text-xl mb-3"></i>
            <span class="text-[10px] font-black text-gray-700 uppercase">Importa JSON</span>
          </label>
        </div>

        <button (click)="resetApp()" class="w-full py-4 text-red-500 text-xs font-black uppercase tracking-widest bg-red-50 rounded-2xl mt-4 active:scale-95 transition-all">
          Ripristina App
        </button>
      </section>
    </div>
  `
})
export class SettingsComponent {
  store = inject(StoreService);
  pdfService = inject(PdfService);
  aiService = inject(AiService);

  async uploadKb(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (const file of files) {
        const text = await this.pdfService.extractText(file);
        this.store.addKbContent(file.name, text);
      }
    }
  }

  async uploadQuestions(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (const file of files) {
        const text = await this.pdfService.extractText(file);
        const parsed = this.pdfService.parseQuestionsFromText(text);
        const questionObjects = parsed.map(txt => ({
          id: crypto.randomUUID(),
          text: txt,
          answer: null,
          status: 'pending' as const,
          lastUpdated: Date.now()
        }));
        this.store.addQuestions(file.name, questionObjects);
      }
    }
  }

  async importData(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => this.store.importData(e.target?.result as string);
      reader.readAsText(file);
    }
  }

  async startAnalysis() {
    await this.aiService.analyzeQuestions();
  }

  resetApp() {
    if (confirm('Vuoi davvero cancellare tutti i dati e i file caricati?')) {
      this.store.clearQuestions();
      this.store.clearKnowledgeBase();
    }
  }
}
