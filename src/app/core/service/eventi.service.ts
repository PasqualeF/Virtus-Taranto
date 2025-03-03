// src/app/core/service/eventi.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { EventInput } from '@fullcalendar/core';

export interface Evento {
  id: number;
  titolo: string;
  descrizione: string;
  dataInizio: string;
  dataFine?: string;
  luogo: string;
  tipo: 'PARTITA' | 'ALLENAMENTO' | 'EVENTO_SPECIALE';
  societaId: number;
  squadra?: string;
  categoria?: string;
  allDay?: boolean;
}

export interface FiltriEventi {
  tipo?: string[];
  squadra?: string;
  categoria?: string;
  dataInizio?: Date;
  dataFine?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class EventiService {
  // Dati mock
  private mockEventi: Evento[] = [
    {
      id: 1,
      titolo: 'Partita vs Brindisi',
      descrizione: 'Partita di campionato contro Brindisi',
      dataInizio: '2024-10-25',
      luogo: 'PalaMazzola',
      tipo: 'PARTITA',
      societaId: 1,
      squadra: 'Prima Squadra',
      categoria: 'Serie C'
    },
    {
      id: 2,
      titolo: 'Camp Giovanile',
      descrizione: 'Camp estivo per il settore giovanile',
      dataInizio: '2024-10-28',
      dataFine: '2024-10-30',
      luogo: 'PalaFiom',
      tipo: 'EVENTO_SPECIALE',
      societaId: 1,
      squadra: 'Settore Giovanile',
      categoria: 'Under 15',
      allDay: true
    },
    {
      id: 3,
      titolo: 'Allenamento Prima Squadra',
      descrizione: 'Allenamento settimanale',
      dataInizio: '2024-10-26T18:00:00',
      dataFine: '2024-10-26T20:00:00',
      luogo: 'PalaMazzola',
      tipo: 'ALLENAMENTO',
      societaId: 1,
      squadra: 'Prima Squadra',
      categoria: 'Serie C'
    },
    {
      id: 4,
      titolo: 'Torneo Inclusivo',
      descrizione: 'Torneo di basket inclusivo',
      dataInizio: '2024-10-26',
      luogo: 'PalaFiom',
      tipo: 'EVENTO_SPECIALE',
      societaId: 2,
      allDay: true
    },
    {
      id: 5,
      titolo: 'Open Day',
      descrizione: 'Giornata di prove gratuite',
      dataInizio: '2024-10-27',
      luogo: 'PalaMazzola',
      tipo: 'EVENTO_SPECIALE',
      societaId: 3,
      allDay: true
    }
  ];

  getEventiSocieta(societaId: number, filtri?: FiltriEventi): Observable<EventInput[]> {
    // Filtra gli eventi per società
    let eventi = this.mockEventi.filter(e => e.societaId === societaId);
    
    // Applica i filtri se presenti
    if (filtri) {
      if (filtri.tipo?.length) {
        eventi = eventi.filter(e => filtri.tipo?.includes(e.tipo));
      }
      if (filtri.squadra) {
        eventi = eventi.filter(e => e.squadra === filtri.squadra);
      }
      if (filtri.categoria) {
        eventi = eventi.filter(e => e.categoria === filtri.categoria);
      }
      if (filtri.dataInizio) {
        eventi = eventi.filter(e => new Date(e.dataInizio) >= filtri.dataInizio!);
      }
      if (filtri.dataFine) {
        eventi = eventi.filter(e => new Date(e.dataInizio) <= filtri.dataFine!);
      }
    }

    return of(this.convertToFullCalendarEvents(eventi));
  }

  getEventoById(id: number): Observable<Evento> {
    const evento = this.mockEventi.find(e => e.id === id);
    if (!evento) {
      throw new Error('Evento non trovato');
    }
    return of(evento);
  }

  createEvento(evento: Evento): Observable<Evento> {
    const newEvento = {
      ...evento,
      id: Math.max(...this.mockEventi.map(e => e.id)) + 1
    };
    this.mockEventi.push(newEvento);
    return of(newEvento);
  }

  updateEvento(id: number, evento: Evento): Observable<Evento> {
    const index = this.mockEventi.findIndex(e => e.id === id);
    if (index === -1) {
      throw new Error('Evento non trovato');
    }
    this.mockEventi[index] = { ...evento, id };
    return of(this.mockEventi[index]);
  }

  deleteEvento(id: number): Observable<void> {
    const index = this.mockEventi.findIndex(e => e.id === id);
    if (index === -1) {
      throw new Error('Evento non trovato');
    }
    this.mockEventi.splice(index, 1);
    return of(void 0);
  }

  private convertToFullCalendarEvents(eventi: Evento[]): EventInput[] {
    return eventi.map(evento => ({
      id: evento.id.toString(),
      title: evento.titolo,
      start: evento.dataInizio,
      end: evento.dataFine,
      allDay: evento.allDay ?? false,
      ...this.getEventColors(evento.tipo),
      extendedProps: {
        descrizione: evento.descrizione,
        luogo: evento.luogo,
        tipo: evento.tipo,
        squadra: evento.squadra,
        categoria: evento.categoria
      }
    }));
  }

  private getEventColors(tipo: string) {
    switch(tipo) {
      case 'PARTITA':
        return {
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
          textColor: '#ffffff'
        };
      case 'ALLENAMENTO':
        return {
          backgroundColor: '#10b981',
          borderColor: '#059669',
          textColor: '#ffffff'
        };
      case 'EVENTO_SPECIALE':
        return {
          backgroundColor: '#f59e0b',
          borderColor: '#d97706',
          textColor: '#ffffff'
        };
      default:
        return {
          backgroundColor: '#6b7280',
          borderColor: '#4b5563',
          textColor: '#ffffff'
        };
    }
  }
}