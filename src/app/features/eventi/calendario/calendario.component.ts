// calendario.component.ts - VERSIONE COMPLETA
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
  
  // MODIFICATO: Logo default basketball per "Tutte le Squadre"
  societa: Societa[] = [
    {
      id: 1,
      nome: 'Tutte le Squadre',
      logo: 'assets/basketball.svg',
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
    this.createDefaultBasketballIcon();
    this.selectSocieta(this.societa[0]);
    this.loadAllMatches();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.fullcalendar) {
        this.fullcalendar.getApi().render();
      }
    }, 100);
  }

  /**
   * Crea un'icona basketball di default usando SVG se non esiste il file
   */
  private createDefaultBasketballIcon(): void {
    // Se il logo default non esiste, usa un data URL SVG
    if (!this.societa[0].logo || this.societa[0].logo === 'assets/basketball-default.png') {
      const basketballSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="#FF6B35" stroke="#000" stroke-width="2"/>
          <path d="M50 5 Q30 25 30 50 T50 95" stroke="#000" stroke-width="2" fill="none"/>
          <path d="M50 5 Q70 25 70 50 T50 95" stroke="#000" stroke-width="2" fill="none"/>
          <path d="M5 50 H95" stroke="#000" stroke-width="2"/>
          <path d="M15 30 Q50 20 85 30" stroke="#000" stroke-width="2" fill="none"/>
          <path d="M15 70 Q50 80 85 70" stroke="#000" stroke-width="2" fill="none"/>
        </svg>
      `;
      
      const blob = new Blob([basketballSvg], { type: 'image/svg+xml' });
      this.societa[0].logo = URL.createObjectURL(blob);
    }
  }

  loadAllMatches(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.matchService.getCalendarMatches(200).subscribe({
      next: (matches) => {
        const isComplete = this.matchService.isCalendarDataComplete(matches);
        
        if (!isComplete && matches.length < 10) {
          this.loadMatchesAlternativeMethod();
          return;
        }

        this.allMatches = matches;
        this.updateCalendarEvents();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Errore nel caricamento delle partite del calendario';
        this.isLoading = false;
        this.loadMatchesAlternativeMethod();
      }
    });
  }

  private loadMatchesAlternativeMethod(): void {    
    const currentYear = new Date().getFullYear();
    
    this.matchService.getMatchesForCalendarByYears(currentYear - 1, currentYear + 1, 150).subscribe({
      next: (matches) => {
        this.allMatches = matches;
        this.updateCalendarEvents();
        this.isLoading = false;
      },
      error: (error) => {        
        this.loadUpcomingMatchesFallback();
      }
    });
  }

  private loadUpcomingMatchesFallback(): void {    
    this.matchService.getUpcomingMatches(50).subscribe({
      next: (matches) => {
        this.allMatches = matches;
        this.updateCalendarEvents();
        this.isLoading = false;
        
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

  selectSocieta(societa: Societa): void {
    this.selectedSocieta = societa;
    this.updateCalendarEvents();
  }

  private updateCalendarEvents(): void {
    if (!this.selectedSocieta || this.allMatches.length === 0) {
      this.calendarOptions = {
        ...this.calendarOptions,
        events: []
      };
      return;
    }

    let filteredMatches = this.allMatches;

    if (this.selectedSocieta.nome !== 'Tutte le Squadre') {
      filteredMatches = this.allMatches.filter(match => 
        match.squadName?.toLowerCase().includes(this.selectedSocieta!.nome.toLowerCase()) ||
        match.homeTeam.toLowerCase().includes(this.selectedSocieta!.nome.toLowerCase()) ||
        match.awayTeam.toLowerCase().includes(this.selectedSocieta!.nome.toLowerCase())
      );
    }

    const calendarEvents: CalendarEvent[] = filteredMatches.map(match => 
      this.convertMatchToCalendarEvent(match)
    );
    
    this.calendarOptions = {
      ...this.calendarOptions,
      events: calendarEvents
    };

    setTimeout(() => {
      if (this.fullcalendar) {
        this.fullcalendar.getApi().render();
      }
    }, 50);
  }

  private convertMatchToCalendarEvent(match: Match): CalendarEvent {
    const now = new Date();
    const matchDateTime = new Date(match.date);
    
    if (isNaN(matchDateTime.getTime())) {
      matchDateTime.setTime(now.getTime());
    }
    
    let tipo: 'PARTITA_FUTURA' | 'PARTITA_PASSATA' | 'PARTITA_IN_CORSO';
    let backgroundColor: string;
    let borderColor: string;
    
    if (this.matchService.isMatchInProgress(match)) {
      tipo = 'PARTITA_IN_CORSO';
      backgroundColor = '#ef4444';
      borderColor = '#dc2626';
    } else if (this.matchService.isMatchUpcoming(match)) {
      tipo = 'PARTITA_FUTURA';
      backgroundColor = this.selectedSocieta?.coloreEventi || '#3b82f6';
      borderColor = backgroundColor;
    } else {
      tipo = 'PARTITA_PASSATA';
      backgroundColor = '#6b7280';
      borderColor = '#4b5563';
    }

    const homeTeam = match.homeTeam || 'Casa';
    const awayTeam = match.awayTeam || 'Trasferta';
    const title = `${homeTeam} vs ${awayTeam}`;
    
    const icon = tipo === 'PARTITA_IN_CORSO' ? '🔴 ' : 
                 tipo === 'PARTITA_FUTURA' ? '🏀 ' : '✅ ';

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
   * MODIFICATO: Gestione migliorata per dispositivi mobile
   */
  handleEventClick(arg: EventClickArg): void {
    const evento = arg.event;
    const matchData = evento.extendedProps as CalendarEvent['extendedProps'];
    const match = matchData.match;
    
    // Rileva se siamo su dispositivo mobile
    const isMobile = this.isMobileDevice();
    const isIOS = this.isIOSDevice();
    const isAndroid = this.isAndroidDevice();
    
    const matchDate = new Date(match.date);
    const dateStr = matchDate.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const statusText = matchData.tipo === 'PARTITA_IN_CORSO' ? 'IN CORSO' :
                      matchData.tipo === 'PARTITA_FUTURA' ? 'PROSSIMA' : 'CONCLUSA';
    
    const message = `
🏀 ${match.homeTeam} vs ${match.awayTeam}
📅 ${dateStr}
🕐 ${match.time}
📍 ${match.venue}
🏆 ${match.league}
⚡ Status: ${statusText}
    `.trim();

    // Messaggio personalizzato per dispositivo
    const confirmMessage = isIOS ? 
      `${message}\n\n📱 Vuoi aggiungere questo evento al tuo calendario?` :
      isAndroid ?
      `${message}\n\n📱 Vuoi aggiungere questo evento al tuo calendario?` :
      `${message}\n\n📅 Vuoi aggiungere questo evento al tuo calendario?`;

    if (confirm(confirmMessage)) {
      if (isMobile) {
        this.addToMobileCalendar(match, isIOS, isAndroid);
      } else {
        this.addToDesktopCalendar(match);
      }
    }
  }

  /**
   * NUOVO: Rileva se siamo su dispositivo mobile
   */
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * NUOVO: Rileva se siamo su iOS
   */
  private isIOSDevice(): boolean {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  /**
   * NUOVO: Rileva se siamo su Android
   */
  private isAndroidDevice(): boolean {
    return /Android/i.test(navigator.userAgent);
  }

  /**
   * NUOVO: Gestione calendario per dispositivi mobile
   */
  private addToMobileCalendar(match: Match, isIOS: boolean, isAndroid: boolean): void {
    const startDate = new Date(match.date);
    const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000));
    
    if (isIOS) {
      // Per iOS, crea direttamente il file .ics
      this.createAndDownloadIcs(match, startDate, endDate);
    } else if (isAndroid) {
      // Per Android, prova prima con intent, poi fallback a .ics
      this.tryAndroidCalendarIntent(match, startDate, endDate);
    } else {
      // Altri dispositivi mobile
      this.createAndDownloadIcs(match, startDate, endDate);
    }
  }

  /**
   * NUOVO: Prova ad aprire il calendario Android con intent
   */
  private tryAndroidCalendarIntent(match: Match, startDate: Date, endDate: Date): void {
    // Prova con deep link per calendario Android
    const title = `${match.homeTeam} vs ${match.awayTeam}`;
    const description = `Partita di ${match.league}`;
    
    // Formato data per Android intent
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    
    // Crea URL per intent Android
    const intentUrl = `intent://add-event?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&beginTime=${startTime}&endTime=${endTime}&location=${encodeURIComponent(match.venue)}#Intent;scheme=content;package=com.google.android.calendar;end`;
    
    // Prova ad aprire l'intent
    window.location.href = intentUrl;
    
    // Fallback dopo 2 secondi se l'intent non funziona
    setTimeout(() => {
      if (confirm('Se il calendario non si è aperto, vuoi scaricare il file evento?')) {
        this.createAndDownloadIcs(match, startDate, endDate);
      }
    }, 2000);
  }

  /**
   * NUOVO: Gestione calendario per desktop
   */
  private addToDesktopCalendar(match: Match): void {
    const startDate = new Date(match.date);
    const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000));
    
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

    // URL per Google Calendar
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateStr}/${endDateStr}&details=${details}&location=${location}`;
    
    // Apri in nuova finestra
    window.open(googleCalendarUrl, '_blank');
  }

  /**
   * MODIFICATO: Crea e scarica direttamente il file .ics
   */
  private createAndDownloadIcs(match: Match, startDate: Date, endDate: Date): void {
    const startDateStr = this.formatDateForIcs(startDate);
    const endDateStr = this.formatDateForIcs(endDate);
    const now = this.formatDateForIcs(new Date());
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Virtus Taranto//Calendario Partite//IT
METHOD:PUBLISH
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

    // Crea il blob
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    
    // Per iOS, usa un nome file più descrittivo
    const fileName = `partita-${match.homeTeam.replace(/\s+/g, '-')}-vs-${match.awayTeam.replace(/\s+/g, '-')}.ics`;
    
    // Crea il link di download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    
    // Per iOS, imposta l'attributo per aprire direttamente
    if (this.isIOSDevice()) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 100);
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
   * Ricarica i dati
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