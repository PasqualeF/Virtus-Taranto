// calendario.component.ts
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CalendarOptions, EventSourceInput, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import itLocale from '@fullcalendar/core/locales/it';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { MatchService, Match } from 'src/app/core/service/match.service';
import { forkJoin, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

interface Societa {
  id: number;
  nome: string;
  logo: string;
  coloreEventi: string;
  eventi: any[];
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    tipo: 'PARTITA_FUTURA' | 'PARTITA_PASSATA' | 'PARTITA_IN_CORSO';
    match: Match;
    homeTeam: string;
    awayTeam: string;
    venue: string;
    isHome: boolean;
    league: string;
  };
}

@Component({
  selector: 'app-calendario',
  templateUrl: './calendario.component.html',
  styleUrls: ['./calendario.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(50px)', opacity: 0 }),
        animate('600ms ease-out', style({ transform: 'translateY(0)', opacity: 1 })),
      ]),
    ])
  ]
})
export class CalendarioComponent implements OnInit, AfterViewInit {
  @ViewChild('fullcalendar') fullcalendar!: FullCalendarComponent;
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    initialView: 'dayGridMonth',
    locale: itLocale,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,listWeek'
    },
    weekends: true,
    editable: false,
    selectable: false,
    selectMirror: false,
    dayMaxEvents: 3,
    events: [],
    eventClick: this.handleEventClick.bind(this),
    height: 'auto',
    eventDisplay: 'block',
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }
  };

  selectedSocieta: Societa | null = null;
  allMatches: Match[] = [];
  isLoading = false;
  errorMessage = '';
  
   societa: Societa[] = [
    {
      id: 1,
      nome: 'Tutte le Squadre',
      logo: '',
      coloreEventi: '#3b82f6',
      eventi: []
    },
    {
      id: 2,
      nome: 'Virtus Taranto',
      logo: 'assets/logo-virtus-taranto.png',
      coloreEventi: '#3b82f6',
      eventi: []
    },
    {
      id: 3,
      nome: 'Support_o',
      logo: 'assets/support_o2022 (1).png',
      coloreEventi: '#10b981',
      eventi: []
    },
    {
      id: 4,
      nome: 'Polisportiva 74020',
      logo: 'assets/poliLogo.png',
      coloreEventi: '#f59e0b',
      eventi: []
    }
  ];
  constructor(private matchService: MatchService) {}

  ngOnInit(): void {
    this.selectSocieta(this.societa[0]);
    this.loadAllMatches();
  }

  ngAfterViewInit(): void {
    // Forza il refresh del calendario dopo l'inizializzazione
    setTimeout(() => {
      if (this.fullcalendar) {
        this.fullcalendar.getApi().render();
      }
    }, 100);
  }

  /**
   * Carica tutte le partite usando il nuovo metodo ottimizzato per il calendario
   */
  loadAllMatches(): void {
    this.isLoading = true;
    this.errorMessage = '';


    // Usa il nuovo metodo ottimizzato con fallback automatico
    this.matchService.getCalendarMatches(200).subscribe({
      next: (matches) => {
        
        // Verifica la completezza dei dati
        const isComplete = this.matchService.isCalendarDataComplete(matches);
        
        if (!isComplete && matches.length < 10) {
          this.loadMatchesAlternativeMethod();
          return;
        }

        this.allMatches = matches;
        this.updateCalendarEvents();
        this.isLoading = false;

        // Log statistiche finali
        const stats = this.matchStats;
      },
      error: (error) => {
        this.errorMessage = 'Errore nel caricamento delle partite del calendario';
        this.isLoading = false;
        
        // Prova metodo alternativo
        this.loadMatchesAlternativeMethod();
      }
    });
  }

  /**
   * Metodo alternativo per caricare le partite se il principale fallisce
   */
  private loadMatchesAlternativeMethod(): void {    
    const currentYear = new Date().getFullYear();
    
    // Prova con range di anni specifico
    this.matchService.getMatchesForCalendarByYears(currentYear - 1, currentYear + 1, 150).subscribe({
      next: (matches) => {
        this.allMatches = matches;
        this.updateCalendarEvents();
        this.isLoading = false;
      },
      error: (error) => {        
        // Ultimo fallback: solo partite future
        this.loadUpcomingMatchesFallback();
      }
    });
  }

  /**
   * Ultimo fallback: carica solo le partite future
   */
  private loadUpcomingMatchesFallback(): void {    
    this.matchService.getUpcomingMatches(50).subscribe({
      next: (matches) => {
        this.allMatches = matches;
        this.updateCalendarEvents();
        this.isLoading = false;
        
        // Mostra un warning all'utente
        if (matches.length > 0) {
          this.errorMessage = 'Visualizzate solo le partite future. Ricarica per tentare di recuperare tutte le partite.';
        }
      },
      error: (error) => {
        this.errorMessage = 'Impossibile caricare le partite. Controlla la connessione.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Seleziona una società e filtra gli eventi
   */
  selectSocieta(societa: Societa): void {
    this.selectedSocieta = societa;
    this.updateCalendarEvents();
  }

  /**
   * Aggiorna gli eventi del calendario in base alla società selezionata
   * IMPORTANTE: FullCalendar Angular richiede di ricreare l'oggetto calendarOptions
   */
  private updateCalendarEvents(): void {
    if (!this.selectedSocieta || this.allMatches.length === 0) {
      // Ricrea l'oggetto calendarOptions anche per array vuoto
      this.calendarOptions = {
        ...this.calendarOptions,
        events: []
      };
      return;
    }

    let filteredMatches = this.allMatches;

    // Filtra per squadra se non è "Tutte le Squadre"
    if (this.selectedSocieta.nome !== 'Tutte le Squadre') {
      filteredMatches = this.allMatches.filter(match => 
        match.squadName?.toLowerCase().includes(this.selectedSocieta!.nome.toLowerCase()) ||
        match.homeTeam.toLowerCase().includes(this.selectedSocieta!.nome.toLowerCase()) ||
        match.awayTeam.toLowerCase().includes(this.selectedSocieta!.nome.toLowerCase())
      );
    }

    // Converti le partite in eventi del calendario
    const calendarEvents: CalendarEvent[] = filteredMatches.map(match => 
      this.convertMatchToCalendarEvent(match)
    );
    
    // SOLUZIONE: Ricrea completamente l'oggetto calendarOptions per triggare la reattività
    this.calendarOptions = {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
      initialView: 'dayGridMonth',
      locale: itLocale,
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,listWeek'
      },
      weekends: true,
      editable: false,
      selectable: false,
      selectMirror: false,
      dayMaxEvents: 3,
      events: calendarEvents, // Nuovi eventi
      eventClick: this.handleEventClick.bind(this),
      height: 'auto',
      eventDisplay: 'block',
      eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      },
      slotLabelFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      },
    };

    // Forza il refresh del calendario se disponibile
    setTimeout(() => {
      if (this.fullcalendar) {
        this.fullcalendar.getApi().render();
      }
    }, 50);
  }

  /**
   * Converte una partita in evento del calendario con validazione extra
   */
  private convertMatchToCalendarEvent(match: Match): CalendarEvent {
    const now = new Date();
    const matchDateTime = new Date(match.date);
    
    // Validazione data
    if (isNaN(matchDateTime.getTime())) {
      // Usa una data di fallback
      matchDateTime.setTime(now.getTime());
    }
    
    // Determina il tipo di partita
    let tipo: 'PARTITA_FUTURA' | 'PARTITA_PASSATA' | 'PARTITA_IN_CORSO';
    let backgroundColor: string;
    let borderColor: string;
    
    if (this.matchService.isMatchInProgress(match)) {
      tipo = 'PARTITA_IN_CORSO';
      backgroundColor = '#ef4444'; // Rosso per partite in corso
      borderColor = '#dc2626';
    } else if (this.matchService.isMatchUpcoming(match)) {
      tipo = 'PARTITA_FUTURA';
      backgroundColor = this.selectedSocieta?.coloreEventi || '#3b82f6';
      borderColor = backgroundColor;
    } else {
      tipo = 'PARTITA_PASSATA';
      backgroundColor = '#6b7280'; // Grigio per partite passate
      borderColor = '#4b5563';
    }

    // Titolo dell'evento con validazione
    const homeTeam = match.homeTeam || 'Casa';
    const awayTeam = match.awayTeam || 'Trasferta';
    const title = `${homeTeam} vs ${awayTeam}`;
    
    // Icona basata sullo stato
    const icon = tipo === 'PARTITA_IN_CORSO' ? '🔴 ' : 
                 tipo === 'PARTITA_FUTURA' ? '🏀 ' : '✅ ';

    // Crea l'evento
    const event: CalendarEvent = {
      id: `match-${homeTeam}-${awayTeam}-${matchDateTime.getTime()}`,
      title: `${icon}${title}`,
      start: matchDateTime.toISOString(),
      backgroundColor,
      borderColor,
      textColor: '#ffffff',
      extendedProps: {
        tipo,
        match,
        homeTeam,
        awayTeam,
        venue: match.venue || 'Da definire',
        isHome: match.isHome,
        league: match.league || 'Campionato'
      }
    };

    return event;
  }

  /**
   * Gestisce il click su un evento del calendario
   */
  handleEventClick(arg: EventClickArg): void {
    const evento = arg.event;
    const matchData = evento.extendedProps as CalendarEvent['extendedProps'];
        
    // Crea il dettaglio della partita
    const match = matchData.match;
    const matchDate = new Date(match.date);
    const dateStr = matchDate.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = match.time;
    
    const isVirtusMatch = match.homeTeam.toLowerCase().includes('virtus') || 
                         match.awayTeam.toLowerCase().includes('virtus');
    
    const statusText = matchData.tipo === 'PARTITA_IN_CORSO' ? 'IN CORSO' :
                      matchData.tipo === 'PARTITA_FUTURA' ? 'PROSSIMA' : 'CONCLUSA';
    
    const message = `
🏀 ${match.homeTeam} vs ${match.awayTeam}
📅 ${dateStr}
🕒 ${timeStr}
📍 ${match.venue}
🏆 ${match.league}
⚡ Status: ${statusText}
${isVirtusMatch ? '🔥 Partita Virtus Taranto' : ''}
    `.trim();

    // Mostra il popup nativo
    if (confirm(`${message}\n\n📱 Vuoi aggiungere questo evento al tuo calendario?`)) {
      this.addToDeviceCalendar(match);
    }
  }

  /**
   * Aggiunge l'evento al calendario del dispositivo
   */
  addToDeviceCalendar(match: Match): void {
    try {
      const startDate = new Date(match.date);
      const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)); // +2 ore

      // Formato per Google Calendar / iCal
      const startDateStr = this.formatDateForCalendar(startDate);
      const endDateStr = this.formatDateForCalendar(endDate);
      
      const title = encodeURIComponent(`${match.homeTeam} vs ${match.awayTeam}`);
      const details = encodeURIComponent(
        `Partita di ${match.league}\n` +
        `Luogo: ${match.venue}\n` +
        `Casa: ${match.homeTeam}\n` +
        `Trasferta: ${match.awayTeam}`
      );
      const location = encodeURIComponent(match.venue);

      // Prova prima con Google Calendar (web)
      const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateStr}/${endDateStr}&details=${details}&location=${location}`;
      
      // Apri in una nuova finestra/tab
      const newWindow = window.open(googleCalendarUrl, '_blank');
      
      if (!newWindow) {
        // Se il popup è bloccato, prova con il file .ics
        this.downloadIcsFile(match, startDate, endDate);
      } else {        
        // Dopo 3 secondi, offri anche il download del file .ics
        setTimeout(() => {
          if (confirm('📱 Vuoi anche scaricare il file .ics per aggiungerlo direttamente al tuo calendario mobile?')) {
            this.downloadIcsFile(match, startDate, endDate);
          }
        }, 3000);
      }

    } catch (error) {
      console.error('❌ Errore nell\'aggiunta al calendario:', error);
      alert('❌ Errore nell\'aggiunta al calendario. Riprova.');
    }
  }

  /**
   * Genera e scarica un file .ics per il calendario
   */
  private downloadIcsFile(match: Match, startDate: Date, endDate: Date): void {
    const startDateStr = this.formatDateForIcs(startDate);
    const endDateStr = this.formatDateForIcs(endDate);
    const now = this.formatDateForIcs(new Date());
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Virtus Taranto//Calendario Partite//IT
BEGIN:VEVENT
UID:match-${match.homeTeam}-${match.awayTeam}-${startDate.getTime()}@virtus-taranto.it
DTSTAMP:${now}
DTSTART:${startDateStr}
DTEND:${endDateStr}
SUMMARY:${match.homeTeam} vs ${match.awayTeam}
DESCRIPTION:Partita di ${match.league}\\nCasa: ${match.homeTeam}\\nTrasferta: ${match.awayTeam}
LOCATION:${match.venue}
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;

    // Crea il blob e scarica
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `partita-${match.homeTeam}-vs-${match.awayTeam}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Formatta la data per Google Calendar (YYYYMMDDTHHMMSSZ)
   */
  private formatDateForCalendar(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  /**
   * Formatta la data per file .ics (YYYYMMDDTHHMMSSZ)
   */
  private formatDateForIcs(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  /**
   * Ricarica i dati con opzioni avanzate
   */
  refreshData(): void {
    this.loadAllMatches();
  }

  /**
   * Ricarica i dati per una squadra specifica
   */
  refreshDataForSquad(squadName: string): void {
    if (squadName === 'Tutte le Squadre') {
      this.refreshData();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.matchService.getSquadMatchesForCalendar(squadName, true, 100).subscribe({
      next: (matches) => {        
        // Aggiorna solo le partite di questa squadra nell'array totale
        this.allMatches = this.allMatches.filter(m => 
          !m.squadName?.toLowerCase().includes(squadName.toLowerCase()) &&
          !m.homeTeam.toLowerCase().includes(squadName.toLowerCase()) &&
          !m.awayTeam.toLowerCase().includes(squadName.toLowerCase())
        );
        
        this.allMatches = [...this.allMatches, ...matches];
        this.allMatches.sort((a, b) => a.date.getTime() - b.date.getTime());
        
        this.updateCalendarEvents();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = `Errore nel refresh dati per ${squadName}`;
        this.isLoading = false;
      }
    });
  }

  /**
   * Getter per verificare se ci sono eventi
   */
  get hasEvents(): boolean {
    return this.allMatches.length > 0;
  }

  /**
   * Getter per ottenere le statistiche
   */
  get matchStats(): { total: number; upcoming: number; past: number; ongoing: number } {
    const categorized = this.matchService.categorizeMatchesByStatus(this.allMatches);
    return {
      total: this.allMatches.length,
      upcoming: categorized.upcoming.length,
      past: categorized.finished.length,
      ongoing: categorized.ongoing.length
    };
  }

  /**
   * TrackBy function per ottimizzare il rendering delle società
   */
  trackBySocieta(index: number, societa: Societa): number {
    return societa.id;
  }

  

  /**
   * Forza il refresh del calendario
   */
  forceCalendarRefresh(): void {
    if (this.fullcalendar) {
      const api = this.fullcalendar.getApi();
      api.render();
      api.refetchEvents();
    }
  }
}