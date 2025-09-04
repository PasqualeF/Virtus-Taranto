import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Squad } from 'src/app/core/models/squad.model';
import { SquadService } from 'src/app/core/service/squad.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

type ViewType = 'results' | 'standings' | 'roster';

interface Tab {
  label: string;
  value: ViewType;
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

@Component({
  selector: 'app-squad',
  templateUrl: './squad.component.html',
  styleUrls: ['./squad.component.css']
})
export class SquadComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private squadService = inject(SquadService);
  
  loading = false;
  selectedSquad: Squad | null = null;
  selectedView: ViewType = 'roster';
  showSponsors = true;
  
  mobileView = false;
  
  // Variabili per il Coming Soon
  showComingSoon = true; // Cambia a false quando vuoi tornare al componente normale
  countdownTime: CountdownTime = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  targetDate: Date;
  private countdownInterval: any;
  
  private routeSubscription: Subscription | null = null;
  private paramSubscription: Subscription | null = null;

  tabs: Tab[] = [
    { label: 'Roster', value: 'roster' },
    { label: 'Risultati', value: 'results' },
    { label: 'Classifica', value: 'standings' }
  ];
  
  error: string | null = null;
  
  headerMappings: {[key: string]: string} = {
    // Roster
    'numero': 'N°',
    'nome': 'Nome',
    'cognome': 'Cognome',
    'posizione': 'Ruolo',
    'dataNascita': 'Data di nascita',
    'altezza': 'Altezza (cm)',
    
    // Risultati
    'data': 'Data',
    'casa': 'Squadra Casa',
    'risultato': 'Risultato',
    'trasferta': 'Squadra Trasferta',
    'luogo': 'Luogo',
    
    // Classifica
    'pos': 'Pos.',
    'squadra': 'Squadra',
    'punti': 'Punti',
    'vittorie': 'V',
    'sconfitte': 'S'
  };

  constructor() {
    // Imposta la data target a 30 giorni da oggi (04/09/2025)
    this.targetDate = new Date('2025-10-04T00:00:00');
  }

  ngOnInit() {
    // Sottoscrivi ai parametri della route
    this.paramSubscription = this.route.paramMap.subscribe(params => {
      const squadName = params.get('id');
      if (squadName) {
        if (this.showComingSoon) {
          // Se siamo in modalità Coming Soon, simula il caricamento della squadra per il nome
          this.simulateSquadLoading(squadName);
          this.startCountdown();
        } else {
          this.loadSquad(squadName);
        }
      } else {
        this.error = 'Nessun nome squadra fornito nella route';
      }
    });

    // Sottoscrivi ai cambi di navigazione
    this.routeSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Il paramMap subscription gestirà automaticamente il reload
    });
    
    // Inizializza lo stato mobile/desktop
    this.checkScreenSize();
  }

  ngOnDestroy() {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    if (this.paramSubscription) {
      this.paramSubscription.unsubscribe();
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
  
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }
  
  isMobileView(): boolean {
    return this.mobileView;
  }
  
  checkScreenSize() {
    this.mobileView = window.innerWidth <= 768;
    this.showSponsors = window.innerWidth > 480;
  }

  // Simula il caricamento di una squadra per il Coming Soon
  simulateSquadLoading(name: string) {
    this.loading = true;
    this.error = null;
    
    // Decodifica il nome dalla URL (gestisce %20, %2013, ecc.)
    const decodedName = decodeURIComponent(name).replace(/\+/g, ' ');
    
    // Simula un breve caricamento
    setTimeout(() => {
      this.selectedSquad = {
        id: 0,
        name: decodedName,
        foto: '', // Puoi aggiungere un'immagine placeholder se necessario
        roster: [],
        results: [],
        standings: []
      };
      this.loading = false;
    }, 500);
  }

  // Avvia il countdown
  startCountdown() {
    this.updateCountdown(); // Aggiorna immediatamente
    
    this.countdownInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  // Aggiorna i valori del countdown
  updateCountdown() {
    const now = new Date().getTime();
    const target = this.targetDate.getTime();
    const difference = target - now;

    if (difference > 0) {
      this.countdownTime = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      };
    } else {
      // Il countdown è finito
      this.countdownTime = { days: 0, hours: 0, minutes: 0, seconds: 0 };
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
    }
  }

  // Metodo per passare dalla modalità Coming Soon a quella normale
  // Puoi chiamare questo metodo quando vuoi attivare il componente normale
  enableNormalMode() {
    this.showComingSoon = false;
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    
    // Ricarica la squadra in modalità normale
    const squadName = this.route.snapshot.paramMap.get('id');
    if (squadName) {
      this.loadSquad(squadName);
    }
  }

  loadSquad(name: string) {
    this.loading = true;
    this.error = null;
    this.selectedSquad = null;
    
    this.squadService.getSquadByName(name).subscribe({
      next: (squad) => {
        if (squad) {
          this.selectedSquad = squad;
          this.selectBestAvailableTab();
        } else {
          this.error = `Nessuna squadra trovata con il nome: ${name}`;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Errore nel caricamento della squadra:', err);
        this.error = 'Errore nel caricamento della squadra. Riprova più tardi.';
        this.loading = false;
      }
    });
  }

  private selectBestAvailableTab() {
    if (!this.selectedSquad) return;

    if (this.selectedSquad.roster && this.selectedSquad.roster.length > 0) {
      this.selectedView = 'roster';
      return;
    }

    if (this.selectedSquad.results && this.selectedSquad.results.length > 0) {
      this.selectedView = 'results';
      return;
    }

    if (this.selectedSquad.standings && this.selectedSquad.standings.length > 0) {
      this.selectedView = 'standings';
      return;
    }

    this.selectedView = 'roster';
  }

  hasSectionData(section: ViewType): boolean {
    if (!this.selectedSquad) return false;

    switch (section) {
      case 'roster':
        return !!(this.selectedSquad.roster && this.selectedSquad.roster.length > 0);
      case 'results':
        return !!(this.selectedSquad.results && this.selectedSquad.results.length > 0);
      case 'standings':
        return !!(this.selectedSquad.standings && this.selectedSquad.standings.length > 0);
      default:
        return false;
    }
  }

  getAvailableTabs(): Tab[] {
    return this.tabs.filter(tab => this.hasSectionData(tab.value));
  }

  getDisplayData(): any[] {
    if (!this.selectedSquad) return [];
    
    switch (this.selectedView) {
      case 'results':
        return this.selectedSquad.results || [];
      case 'standings':
        return this.selectedSquad.standings || [];
      case 'roster':
        return this.selectedSquad.roster || [];
      default:
        return [];
    }
  }

  getTableHeaders(): string[] {
    const data = this.getDisplayData();
    if (data.length === 0) return [];
    
    const customOrder: { [key: string]: string[] } = {
      roster: ['numero', 'nome', 'cognome', 'posizione', 'dataNascita', 'altezza'],
      results: ['data', 'casa', 'risultato', 'trasferta', 'luogo'],
      standings: ['pos', 'squadra', 'punti', 'vittorie', 'sconfitte']
    };
    
    const defaultHeaders = Object.keys(data[0]);
    
    if (customOrder[this.selectedView]) {
      return customOrder[this.selectedView].filter(key => defaultHeaders.includes(key));
    }
    
    return defaultHeaders;
  }

  formatHeader(header: string): string {
    return this.headerMappings[header] || header.charAt(0).toUpperCase() + header.slice(1);
  }
  
  formatCellValue(value: any): string {
    if (value === undefined || value === null) {
      return '';
    }
    
    if (typeof value === 'string') {
      if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('it-IT', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
          });
        }
      }
      
      if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('it-IT', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
          });
        }
      }
      
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime()) && value.includes('-')) {
        return parsedDate.toLocaleDateString('it-IT', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });
      }
    }
    
    if (value instanceof Date && !isNaN(value.getTime())) {
      return value.toLocaleDateString('it-IT', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    }
    
    return value.toString();
  }

  setView(view: ViewType) {
    if (this.hasSectionData(view)) {
      this.selectedView = view;
    }
  }
}