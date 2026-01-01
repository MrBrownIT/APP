
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PdfService {
  async extractText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    // @ts-ignore
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      // Uniamo gli elementi di testo con uno spazio per evitare che le parole si fondano
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  }

  parseQuestionsFromText(text: string): string[] {
    // Regex per individuare l'inizio di una domanda numerata (es: "1. ", "2) ")
    // Cerca un numero seguito da punto o parentesi a inizio riga o dopo spazio significativo
    const questionRegex = /(?:\r?\n|^)\s*(\d+)[\.\)]\s+/g;
    const questions: string[] = [];
    
    let match;
    let lastIndex = 0;
    
    while ((match = questionRegex.exec(text)) !== null) {
      // Se non è il primo match, estraiamo il testo tra il match precedente e questo
      if (lastIndex !== 0) {
        const segment = text.substring(lastIndex, match.index).trim();
        if (segment) {
          // Rimuoviamo eventuali ritorni a capo interni per pulizia e normalizziamo gli spazi
          questions.push(segment.replace(/\s+/g, ' '));
        }
      }
      lastIndex = questionRegex.lastIndex;
    }
    
    // Aggiungiamo l'ultima domanda (dal lastIndex alla fine del testo)
    const finalSegment = text.substring(lastIndex).trim();
    if (finalSegment) {
      questions.push(finalSegment.replace(/\s+/g, ' '));
    }
    
    // Se non abbiamo trovato una lista numerata (formato non standard), usiamo un fallback
    if (questions.length === 0) {
      return text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 15 && line.endsWith('?'))
        .map(line => line.replace(/\s+/g, ' '));
    }
    
    // Filtriamo segmenti troppo corti che potrebbero essere rumore del PDF
    return questions.filter(q => q.length > 8);
  }
}
