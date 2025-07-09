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
  selectedView: ViewType = 'results';
  showSponsors = true;
  
  mobileView = false;
  
  private routeSubscription: Subscription | null = null;
  private paramSubscription: Subscription | null = null;

  tabs: Tab[] = [
    { label: 'Risultati', value: 'results' },
    { label: 'Classifica', value: 'standings' },
    { label: 'Roster', value: 'roster' }
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
    
    console.log('Caricamento squadra:', name);
    
    this.squadService.getSquadByName(name).subscribe({
      next: (squad) => {
        if (squad) {
          this.selectedSquad = squad;
          console.log('Squadra caricata:', squad);
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
    
    // Se è una data, formattala correttamente
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const date = new Date(value);
      return date.toLocaleDateString('it-IT', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    }
    
    return value.toString();
  }

  setView(view: ViewType) {
    this.selectedView = view;
  }
}