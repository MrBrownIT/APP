
import { Component, output } from '@angular/core';

@Component({
  selector: 'app-nav',
  template: `
    <nav class="fixed bottom-0 left-0 right-0 ios-blur border-t border-gray-200 safe-bottom flex justify-around items-center py-2 z-50">
      <button (click)="navChange.emit('search')" class="flex flex-col items-center p-2 text-gray-400 focus:text-blue-600 active:scale-90 transition-all">
        <i class="fas fa-search text-xl"></i>
        <span class="text-[10px] mt-1 font-semibold">Cerca</span>
      </button>
      <button (click)="navChange.emit('questions')" class="flex flex-col items-center p-2 text-gray-400 focus:text-blue-600 active:scale-90 transition-all">
        <i class="fas fa-brain text-xl"></i>
        <span class="text-[10px] mt-1 font-semibold">Memoria</span>
      </button>
      <button (click)="navChange.emit('settings')" class="flex flex-col items-center p-2 text-gray-400 focus:text-blue-600 active:scale-90 transition-all">
        <i class="fas fa-sliders-h text-xl"></i>
        <span class="text-[10px] mt-1 font-semibold">Setup</span>
      </button>
    </nav>
  `
})
export class NavComponent {
  navChange = output<'search' | 'questions' | 'settings'>();
}
