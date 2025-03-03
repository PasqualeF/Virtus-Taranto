// comunicazioni.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Comunicazione {
  id: number;
  titolo: string;
  contenuto: string;
  data: string;
  tipo: 'urgente' | 'importante' | 'standard';
  autore: string;
  ruoloAutore: string;
  avatar: string;
  allegati?: {
    nome: string;
    tipo: string;
    dimensione: string;
    url: string;
  }[];
  stato: 'nuovo' | 'letto' | 'archiviato';
  destinatari: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ComunicazioniService {
  private comunicazioni: Comunicazione[] = [
    {
      id: 1,
      titolo: 'Cambio Orario Allenamenti Prima Squadra',
      contenuto: 'A partire dal prossimo lunedì, gli allenamenti della prima squadra si terranno dalle 18:00 alle 20:00...',
      data: '2024-03-15T18:30:00',
      tipo: 'importante',
      autore: 'Marco Rossi',
      ruoloAutore: 'Head Coach',
      avatar: 'assets/avatars/coach.jpg',
      stato: 'nuovo',
      destinatari: ['Prima Squadra', 'Staff Tecnico'],
      allegati: [
        {
          nome: 'nuovo_calendario.pdf',
          tipo: 'pdf',
          dimensione: '245 KB',
          url: '/assets/docs/calendario.pdf'
        }
      ]
    },
    {
      id: 2,
      titolo: 'Cambio Orario Allenamenti Prima Squadra',
      contenuto: 'A partire dal prossimo lunedì, gli allenamenti della prima squadra si terranno dalle 18:00 alle 20:00...',
      data: '2024-03-15T18:30:00',
      tipo: 'standard',
      autore: 'Marco Rossi',
      ruoloAutore: 'Head Coach',
      avatar: 'assets/avatars/coach.jpg',
      stato: 'nuovo',
      destinatari: ['Prima Squadra', 'Staff Tecnico'],
      allegati: [
      ]
    },
    {
      id: 3,
      titolo: 'Cambio Orario Allenamenti Prima Squadra',
      contenuto: 'A partire dal prossimo lunedì, gli allenamenti della prima squadra si terranno dalle 18:00 alle 20:00...',
      data: '2024-03-15T18:30:00',
      tipo: 'urgente',
      autore: 'Marco Rossi',
      ruoloAutore: 'Head Coach',
      avatar: 'assets/avatars/coach.jpg',
      stato: 'nuovo',
      destinatari: ['Prima Squadra', 'Staff Tecnico'],
      allegati: [
        {
          nome: 'nuovo_calendario.pdf',
          tipo: 'pdf',
          dimensione: '245 KB',
          url: '/assets/docs/calendario.pdf'
        }
      ]
    },
    // Aggiungi altre comunicazioni di esempio...
  ];

  getComunicazioni(): Observable<Comunicazione[]> {
    return of(this.comunicazioni).pipe(delay(800));
  }
}