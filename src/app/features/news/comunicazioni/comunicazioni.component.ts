// comunicazioni.component.ts (aggiornato)
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { trigger, state, style, transition, animate, query, stagger, keyframes } from '@angular/animations';
import { Comunicazione, ComunicazioniStrapiService } from 'src/app/core/service/comunicazione-strapi.service';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-comunicazioni',
  templateUrl: './comunicazioni.component.html',
  styleUrls: ['./comunicazioni.component.css'],
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(50px)' }),
          stagger('100ms', [
            animate('600ms cubic-bezier(0.35, 0, 0.25, 1)', 
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0',
        opacity: '0',
        overflow: 'hidden'
      })),
      state('expanded', style({
        height: '*',
        opacity: '1'
      })),
      transition('collapsed <=> expanded', [
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ])
    ]),
    trigger('pulseAnimation', [
      state('active', style({ transform: 'scale(1)' })),
      transition('* => active', [
        animate('400ms ease-in-out', keyframes([
          style({ transform: 'scale(1)', offset: 0 }),
          style({ transform: 'scale(1.1)', offset: 0.5 }),
          style({ transform: 'scale(1)', offset: 1 })
        ]))
      ])
    ])
  ]
})
export class ComunicazioniComponent implements OnInit {
  comunicazioni: Comunicazione[] = [];
  filteredComunicazioni: Comunicazione[] = [];
  selectedComunicazione: Comunicazione | null = null;
  loading = true;
  searchControl = new FormControl('');
  filterType: 'tutti' | 'urgente' | 'importante' | 'standard' = 'tutti';
  expandedId: number | null = null;
  pulseStates: { [key: number]: string } = {};

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  constructor(private comunicazioniService: ComunicazioniStrapiService) {}

  ngOnInit(): void {
    this.loadComunicazioni();
    this.setupSearch();
  }

  private setupSearch(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term || term.trim() === '') {
          // Se non c'è termine di ricerca, usa il filtro locale
          this.filterComunicazioniLocally(term || '');
          return of([]);
        } else {
          // Se c'è un termine di ricerca, cerca su Strapi
          this.loading = true;
          return this.comunicazioniService.searchComunicazioni(term);
        }
      })
    ).subscribe(results => {
      if (results.length > 0) {
        // Risultati dalla ricerca Strapi
        this.filteredComunicazioni = this.applyStatusFilter(results);
        this.loading = false;
      }
      // Se results è vuoto, significa che stiamo usando il filtro locale
    });
  }

  loadComunicazioni(): void {
    this.loading = true;
    this.comunicazioniService.getComunicazioni().subscribe({
      next: (data) => {
        this.comunicazioni = data;
        this.filteredComunicazioni = data;
        this.loading = false;
        // Inizializza gli stati delle animazioni
        this.comunicazioni.forEach(com => {
          this.pulseStates[com.id] = 'inactive';
        });
      },
      error: (error) => {
        console.error('Errore nel caricamento delle comunicazioni:', error);
        this.loading = false;
      }
    });
  }

  filterComunicazioni(searchTerm: string): void {
    // Questo metodo ora viene chiamato solo per i filtri di tipo
    if (this.filterType !== 'tutti') {
      this.loading = true;
      this.comunicazioniService.getComunicazioniByTipo(this.filterType).subscribe({
        next: (data) => {
          this.comunicazioni = data;
          this.filteredComunicazioni = this.applyStatusFilter(data);
          this.loading = false;
        },
        error: (error) => {
          console.error('Errore nel filtro per tipo:', error);
          this.loading = false;
        }
      });
    } else {
      // Se "tutti" è selezionato, ricarica tutte le comunicazioni
      this.loadComunicazioni();
    }
  }

  private filterComunicazioniLocally(searchTerm: string): void {
    this.filteredComunicazioni = this.comunicazioni.filter(com => {
      const matchesSearch = !searchTerm || 
        com.titolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        com.contenuto.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = this.filterType === 'tutti' || com.tipo === this.filterType;
      
      return matchesSearch && matchesType;
    });
  }

  private applyStatusFilter(comunicazioni: Comunicazione[]): Comunicazione[] {
    return comunicazioni;
  }

  toggleExpand(id: number): void {
    if (this.expandedId === id) {
      this.expandedId = null;
    } else {
      this.expandedId = id;
      this.pulseStates[id] = 'active';
      setTimeout(() => {
        this.pulseStates[id] = 'inactive';
      }, 400);
    }
  }

  getHeaderColor(tipo: string): string {
    switch (tipo) {
      case 'urgente': return 'from-red-500 to-red-700';
      case 'importante': return 'from-yellow-500 to-yellow-700';
      default: return 'from-blue-500 to-blue-700';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }



  downloadAttachment(url: string): void {
    // Apre il file in una nuova finestra per il download
    window.open(url, '_blank');
  }
}