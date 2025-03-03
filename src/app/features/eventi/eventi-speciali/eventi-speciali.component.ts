// eventi-speciali.component.ts
import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate, state } from '@angular/animations';

interface EventoSpeciale {
  id: number;
  titolo: string;
  tipo: 'MOTIVAZIONALE' | 'FAMIGLIA' | 'OPEN_DAY' | 'SOCIALE' | 'FORMAZIONE';
  stato: 'PROGRAMMATO' | 'IN_CORSO' | 'CONCLUSO';
  data: string;
  orario: string;
  location: string;
  descrizione: string;
  immagineCopertina: string;
  relatori?: string[];
  etaTarget?: string;
  maxPartecipanti?: number;
  iscritti?: number;
  highlights?: string[];
  programma?: ProgrammaEvento[];
  galleryFoto?: string[];
  feedback?: Feedback[];
}

interface ProgrammaEvento {
  orario: string;
  attivita: string;
  descrizione: string;
  durata: string;
}

interface Feedback {
  autore: string;
  ruolo: string;
  commento: string;
  rating: number;
  data: string;
}

interface Societa {
  id: number;
  nome: string;
  logo: string;
  eventiSpeciali: EventoSpeciale[];
}

@Component({
  selector: 'app-eventi-speciali',
  templateUrl: './eventi-speciali.component.html',
  styleUrls: ['./eventi-speciali.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('600ms', style({ opacity: 1 })),
      ]),
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(50px)', opacity: 0 }),
        animate('600ms ease-out', style({ transform: 'translateY(0)', opacity: 1 })),
      ]),
    ]),
    trigger('expandCard', [
      state('collapsed', style({
        height: '400px',
        'overflow-y': 'hidden'
      })),
      state('expanded', style({
        height: '*'
      })),
      transition('collapsed <=> expanded', animate('300ms ease-in-out'))
    ])
  ]
})
export class EventiSpecialiComponent implements OnInit {
  selectedSocieta: Societa | null = null;
  selectedEvento: EventoSpeciale | null = null;
  filterTipo: string = 'TUTTI';
  filterStato: string = 'TUTTI';
  viewMode: 'grid' | 'timeline' = 'grid';
  expandedCardId: number | null = null;

  societa: Societa[] = [
    {
      id: 1,
      nome: 'Virtus Taranto',
      logo: 'assets/virtusLogo.png',
      eventiSpeciali: [
        {
          id: 1,
          titolo: 'Leadership nel Sport',
          tipo: 'MOTIVAZIONALE',
          stato: 'PROGRAMMATO',
          data: '2024-11-15',
          orario: '18:00',
          location: 'Sala Conferenze PalaMazzola',
          descrizione: 'Una serata con atleti professionisti che condivideranno le loro esperienze di leadership nel basket...',
          immagineCopertina: 'assets/eventi/leadership.jpg',
          relatori: ['Marco Belinelli', 'Gianmarco Pozzecco'],
          maxPartecipanti: 100,
          iscritti: 45,
          highlights: [
            'Testimonianze di campioni',
            'Workshop interattivo',
            'Sessione Q&A',
            'Networking finale'
          ],
          programma: [
            {
              orario: '18:00',
              attivita: 'Registrazione partecipanti',
              descrizione: 'Check-in e welcome kit',
              durata: '30min'
            },
            {
              orario: '18:30',
              attivita: 'Introduzione',
              descrizione: 'Apertura evento e presentazione ospiti',
              durata: '15min'
            }
          ]
        },
        // ... altri eventi
      ]
    }
  ];

  constructor() {}

  ngOnInit() {
    if (this.societa.length > 0) {
      this.selectSocieta(this.societa[0]);
    }
  }

  selectSocieta(societa: Societa) {
    this.selectedSocieta = societa;
    this.selectedEvento = null;
  }

  selectEvento(evento: EventoSpeciale) {
    this.selectedEvento = evento;
  }

  toggleCardExpansion(eventoId: number) {
    this.expandedCardId = this.expandedCardId === eventoId ? null : eventoId;
  }

  getEventiFiltrati(): EventoSpeciale[] {
    if (!this.selectedSocieta) return [];
    
    return this.selectedSocieta.eventiSpeciali.filter(evento => {
      if (this.filterTipo !== 'TUTTI' && evento.tipo !== this.filterTipo) return false;
      if (this.filterStato !== 'TUTTI' && evento.stato !== this.filterStato) return false;
      return true;
    });
  }

  getTipoEvento(tipo: 'MOTIVAZIONALE' | 'FAMIGLIA' | 'OPEN_DAY' | 'SOCIALE' | 'FORMAZIONE'): string {
    const tipi: Record<string, string> = {
      'MOTIVAZIONALE': 'Incontro Motivazionale',
      'FAMIGLIA': 'Evento Famiglia',
      'OPEN_DAY': 'Open Day',
      'SOCIALE': 'Iniziativa Sociale',
      'FORMAZIONE': 'Formazione'
    };
    return tipi[tipo] || tipo;
  }

  getStatoClass(stato: 'PROGRAMMATO' | 'IN_CORSO' | 'CONCLUSO'): string {
    const stati: Record<string, string> = {
      'PROGRAMMATO': 'stato-programmato',
      'IN_CORSO': 'stato-in-corso',
      'CONCLUSO': 'stato-concluso'
    };
    return stati[stato] || '';
  }

  isEventoCompleto(evento: EventoSpeciale): boolean {
    if (!evento.maxPartecipanti || !evento.iscritti) return false;
    return evento.iscritti >= evento.maxPartecipanti;
  }

  getPostiDisponibili(evento: EventoSpeciale): number {
    if (!evento.maxPartecipanti || !evento.iscritti) return 0;
    return evento.maxPartecipanti - evento.iscritti;
  }

  getProgressWidth(evento: EventoSpeciale): number {
    if (!evento.maxPartecipanti || !evento.iscritti) return 0;
    return (evento.iscritti / evento.maxPartecipanti) * 100;
  }

  iscrivitiEvento(evento: EventoSpeciale, event: Event): void {
    event.stopPropagation();
    // Implementa la logica di iscrizione qui
    console.log('Iscrizione a:', evento.titolo);
  }
}