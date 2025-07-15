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
  selectedView: ViewType = 'roster'; // Cambiato da 'results' a 'roster' come default
  showSponsors = true;
  
  mobileView = false;
  
  private routeSubscription: Subscription | null = null;
  private paramSubscription: Subscription | null = null;

  // Riordinati i tab con roster come primo
  tabs: Tab[] = [
    { label: 'Roster', value: 'roster' },
    { label: 'Risultati', value: 'results' },
    { label: 'Classifica', value: 'standings' }
  ];
  
  error: string | null = null;
  
  // Mappatura per i nomi dei campi - invariata
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

  ngOnInit() {
    // Sottoscrivi ai parametri della route
    this.paramSubscription = this.route.paramMap.subscribe(params => {
      const squadName = params.get('id');
      if (squadName) {
        this.loadSquad(squadName);
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

  loadSquad(name: string) {
    this.loading = true;
    this.error = null;
    this.selectedSquad = null; // Reset squadra precedente
    
    
    this.squadService.getSquadByName(name).subscribe({
      next: (squad) => {
        if (squad) {
          this.selectedSquad = squad;
          
          // Seleziona automaticamente il tab appropriato dopo il caricamento
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

  /**
   * Seleziona automaticamente il tab migliore disponibile
   * Priorità: roster -> results -> standings
   */
  private selectBestAvailableTab() {
    if (!this.selectedSquad) return;

    // Controlla se il roster ha dati
    if (this.selectedSquad.roster && this.selectedSquad.roster.length > 0) {
      this.selectedView = 'roster';
      return;
    }

    // Se roster è vuoto, prova con i risultati
    if (this.selectedSquad.results && this.selectedSquad.results.length > 0) {
      this.selectedView = 'results';
      return;
    }

    // Se anche i risultati sono vuoti, usa la classifica
    if (this.selectedSquad.standings && this.selectedSquad.standings.length > 0) {
      this.selectedView = 'standings';
      return;
    }

    // Se tutto è vuoto, mantieni roster come default
    this.selectedView = 'roster';
  }

  /**
   * Verifica se una sezione ha dati disponibili
   */
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

  /**
   * Ottieni i tab disponibili (solo quelli con dati)
   */
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
    
    // Personalizza l'ordine delle colonne per ogni vista
    const customOrder: { [key: string]: string[] } = {
      roster: ['numero', 'nome', 'cognome', 'posizione', 'dataNascita', 'altezza'],
      results: ['data', 'casa', 'risultato', 'trasferta', 'luogo'],
      standings: ['pos', 'squadra', 'punti', 'vittorie', 'sconfitte']
    };
    
    const defaultHeaders = Object.keys(data[0]);
    
    // Se esiste un ordine personalizzato per questa vista e tutti i campi necessari sono presenti
    if (customOrder[this.selectedView]) {
      // Filtra solo le chiavi che esistono effettivamente nei dati
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
    
    // Se è una data in formato ISO o stringa di data
    if (typeof value === 'string') {
      // Formato ISO completo (2025-06-03T00:00:00.000Z)
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
      
      // Formato data semplice (2025-06-03)
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
      
      // Prova a parsare qualsiasi altra stringa che potrebbe essere una data
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime()) && value.includes('-')) {
        return parsedDate.toLocaleDateString('it-IT', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });
      }
    }
    
    // Se è già un oggetto Date
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
    // Verifica se la sezione ha dati prima di permettere il cambio
    if (this.hasSectionData(view)) {
      this.selectedView = view;
    }
  }
}