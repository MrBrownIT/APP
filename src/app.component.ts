
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavComponent } from './components/nav.component';
import { SearchComponent } from './components/search.component';
import { QuestionsComponent } from './components/questions.component';
import { SettingsComponent } from './components/settings.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, NavComponent, SearchComponent, QuestionsComponent, SettingsComponent],
  template: `
    <main class="min-h-screen max-w-md mx-auto relative pb-24 overflow-x-hidden bg-[#f2f2f7]">
      <!-- Vista Attiva -->
      @switch (activeView()) {
        @case ('search') {
          <app-search class="animate-in fade-in slide-in-from-right duration-500 block" />
        }
        @case ('questions') {
          <app-questions class="animate-in fade-in slide-in-from-right duration-500 block" />
        }
        @case ('settings') {
          <app-settings class="animate-in fade-in slide-in-from-right duration-500 block" />
        }
      }

      <app-nav (navChange)="activeView.set($event)" />
    </main>
  `
})
export class AppComponent {
  activeView = signal<'search' | 'questions' | 'settings'>('search');
}
