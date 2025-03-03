// comunicazioni.component.ts
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { trigger, state, style, transition, animate, query, stagger, keyframes } from '@angular/animations';
import { Comunicazione, ComunicazioniService } from 'src/app/core/service/comunicazioni.service';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
  filterStatus: 'tutti' | 'nuovo' | 'letto' | 'archiviato' = 'tutti';
  expandedId: number | null = null;
  pulseStates: { [key: number]: string } = {};

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  constructor(private comunicazioniService: ComunicazioniService) {}

  ngOnInit(): void {
    this.loadComunicazioni();
    this.setupSearch();
  }

  private setupSearch(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.filterComunicazioni(term || '');
    });
  }

  loadComunicazioni(): void {
    this.comunicazioniService.getComunicazioni().subscribe(data => {
      this.comunicazioni = data;
      this.filteredComunicazioni = data;
      this.loading = false;
      // Inizializza gli stati delle animazioni
      this.comunicazioni.forEach(com => {
        this.pulseStates[com.id] = 'inactive';
      });
    });
  }

  filterComunicazioni(searchTerm: string): void {
    this.filteredComunicazioni = this.comunicazioni.filter(com => {
      const matchesSearch = !searchTerm || 
        com.titolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        com.contenuto.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = this.filterType === 'tutti' || com.tipo === this.filterType;
      const matchesStatus = this.filterStatus === 'tutti' || com.stato === this.filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
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

  markAsRead(comunicazione: Comunicazione): void {
    if (comunicazione.stato === 'nuovo') {
      comunicazione.stato = 'letto';
      // Qui potresti aggiungere una chiamata al backend per aggiornare lo stato
    }
  }

  archiveCommunication(comunicazione: Comunicazione): void {
    comunicazione.stato = 'archiviato';
    // Qui potresti aggiungere una chiamata al backend per archiviare
  }

  downloadAttachment(url: string): void {
    // Implementa la logica di download
    console.log('Downloading:', url);
  }
}