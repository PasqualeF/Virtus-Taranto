// organigramma.component.ts - VERSIONE FINALE STRAPI V5
import { Component, OnInit, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate, query, stagger } from '@angular/animations';
import { OrganigrammaStrapiService, Societa } from 'src/app/core/service/organigramma-strapi.service';
import { OrganigrammaData, StaffMember } from 'src/app/core/models/person.model';

@Component({
  selector: 'app-organigramma',
  templateUrl: './organigramma.component.html',
  styleUrls: ['./organigramma.component.css'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ transform: 'translateY(30px)', opacity: 0 }),
        animate('600ms cubic-bezier(0.35, 0, 0.25, 1)',
          style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('societaSelect', [
      transition(':enter', [
        query('.societa-card', [
          style({ opacity: 0, transform: 'translateY(50px)' }),
          stagger(100, [
            animate('500ms cubic-bezier(0.35, 0, 0.25, 1)',
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('staffCards', [
      transition(':enter', [
        query('.staff-card', [
          style({ opacity: 0, transform: 'translateY(50px)' }),
          stagger(50, [
            animate('400ms cubic-bezier(0.35, 0, 0.25, 1)',
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('memberHover', [
      state('inactive', style({
        transform: 'scale(1)'
      })),
      state('active', style({
        transform: 'scale(1.05)'
      })),
      transition('inactive <=> active', [
        animate('200ms ease-out')
      ])
    ])
  ]
})
export class OrganigrammaComponent implements OnInit {
  societa: Societa[] = [];
  organigramm: OrganigrammaData[] = [];
  selectedSocieta: string = 'Virtus Taranto';
  staffMembers: StaffMember[] = [];
  loading = false;
  hoverStates: { [key: number]: boolean } = {};
  view: 'cards' | 'tree' = 'cards';
  isMobile: boolean = false;
  presidentCountClass: string = '';
  
  // Nuove proprietà per gestione errori e stato
  error: string | null = null;
  loadingStaff = false;
  loadingSocieta = false;

  constructor(private organigrammaService: OrganigrammaStrapiService) {}

  ngOnInit() {
    this.checkScreenSize();
    this.initializeSocieta();
    this.loadInitialData();
  }

  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  /**
   * Inizializza le società predefinite con loghi
   */
  private initializeSocieta() {
    this.societa = this.organigrammaService.getSocieta();
  }

  /**
   * Carica i dati iniziali
   */
  private loadInitialData() {
    this.loadAvailableSocieta();
    this.loadStaff(this.selectedSocieta);
  }

  /**
   * Carica le società disponibili da Strapi
   */
  loadAvailableSocieta() {
    this.loadingSocieta = true;
    this.error = null;
    
    this.organigrammaService.getAllSocieta().subscribe({
      next: (societas) => {
        this.loadingSocieta = false;
        
        // Aggiorna le società con quelle disponibili su Strapi
        if (societas.length > 0) {
          // Mantieni le società predefinite ma verifica quali sono disponibili
          this.societa = this.societa.filter(s => societas.includes(s.nome));
          
          // Se la società selezionata non è disponibile, prendi la prima disponibile
          if (!societas.includes(this.selectedSocieta) && societas.length > 0) {
            this.selectedSocieta = societas[0];
          }
        }
      },
      error: (error) => {
        console.error('Errore nel caricamento delle società:', error);
        this.error = 'Errore nel caricamento delle società. Utilizzo società predefinite.';
        this.loadingSocieta = false;
        // In caso di errore, mantieni le società predefinite
      }
    });
  }

  /**
   * Carica tutto lo staff di una società specifica
   */
  loadStaff(societa: string) {
    if (!societa) {
      console.warn('Società non specificata');
      return;
    }

    this.loadingStaff = true;
    this.loading = true;
    this.selectedSocieta = societa;
    this.error = null;
    
    this.organigrammaService.getStaff(societa).subscribe({
      next: (staff) => {
        this.staffMembers = staff;
        this.loadingStaff = false;
        this.loading = false;
        
        // Inizializza stati hover
        this.staffMembers.forEach(member => {
          this.hoverStates[member.id] = false;
        });
        
        // Determina la classe CSS per il centraggio della presidenza
        const presidentCount = this.getStaffByLevel(1).length;
        this.presidentCountClass = presidentCount === 2 ? 'two-cards' : '';
      },
      error: (error) => {
        console.error('Errore nel caricamento dello staff:', error);
        this.error = `Errore nel caricamento dello staff per ${societa}`;
        this.loadingStaff = false;
        this.loading = false;
        this.staffMembers = [];
      }
    });
  }

  /**
   * Filtra lo staff per livello
   */
  getStaffByLevel(level: number): StaffMember[] {
    return this.staffMembers.filter(member => member.livello === level);
  }

  /**
   * Ottiene il titolo per ogni livello
   */
  getLevelTitle(level: number): string {
    switch (level) {
      case 1:
        return 'Presidenza';
      case 2:
        return 'Staff Tecnico';
      case 3:
        return 'Dirigenza';
      case 4:
        return 'Staff Medico';
      default:
        return `Livello ${level}`;
    }
  }

  /**
   * Gestisce l'hover dei membri
   */
  toggleMemberHover(memberId: number) {
    this.hoverStates[memberId] = !this.hoverStates[memberId];
  }

  /**
   * Cambia la vista tra cards e tree
   */
  toggleView() {
    this.view = this.view === 'cards' ? 'tree' : 'cards';
    console.log(`Vista cambiata a: ${this.view}`);
  }

  /**
   * Ottiene l'URL dell'immagine per un membro (compatibilità)
   */
  getImageUrl(person: StaffMember): string {
    if (person.imageBase64) {
      return person.imageBase64;
    }
    
    if (person.image) {
      return this.organigrammaService.getImageUrls(person.image, 'medium');
    }
    
    return person.foto || 'assets/default-profile.png';
  }

  /**
   * Ricarica i dati
   */
  reloadData() {
    console.log('Ricaricamento dati...');
    this.loadInitialData();
  }

  /**
   * Cerca membri dello staff
   */
  searchStaff(query: string) {
    if (!query.trim()) {
      this.loadStaff(this.selectedSocieta);
      return;
    }

    this.organigrammaService.searchStaff(query, this.selectedSocieta).subscribe({
      next: (results) => {
        this.staffMembers = results;
        console.log(`Risultati ricerca per "${query}":`, results);
      },
      error: (error) => {
        console.error('Errore nella ricerca:', error);
        this.error = 'Errore durante la ricerca';
      }
    });
  }

  /**
   * Verifica se ci sono dati disponibili
   */
  hasData(): boolean {
    return this.staffMembers.length > 0;
  }

  /**
   * Verifica se ci sono dati per un livello specifico
   */
  hasDataForLevel(level: number): boolean {
    return this.getStaffByLevel(level).length > 0;
  }

  /**
   * Ottiene i livelli disponibili
   */
  getAvailableLevels(): number[] {
    const levels = [...new Set(this.staffMembers.map(member => member.livello))];
    return levels.sort((a, b) => a - b);
  }

  /**
   * Gestisce il click su una società
   */
  onSocietaClick(societa: Societa) {
    if (this.selectedSocieta !== societa.nome) {
      this.loadStaff(societa.nome);
    }
  }

  /**
   * Pulisce i messaggi di errore
   */
  clearError() {
    this.error = null;
  }

  /**
   * Verifica se il componente è in stato di caricamento
   */
  isLoading(): boolean {
    return this.loading || this.loadingStaff || this.loadingSocieta;
  }
}