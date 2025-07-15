// eventi.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';
import { EventiService } from 'src/app/core/service/eventi.service';
import { Evento, EventoCategoria, EventoFilters, EventoFormData } from 'src/app/core/models/eventi.interfaces';


@Component({
  selector: 'app-eventi',
  templateUrl: './eventi-speciali.component.html',
  styleUrls: ['./eventi-speciali.component.css'],
 animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate('500ms ease-out', style({ transform: 'translateX(0)', opacity: 1 })),
      ]),
    ]),
    trigger('expandCard', [
      state('collapsed', style({
        height: '400px',
        overflow: 'hidden'
      })),
      state('expanded', style({
        height: '*',
        overflow: 'visible'
      })),
      transition('collapsed <=> expanded', animate('300ms ease-in-out'))
    ])
  ]
})
export class EventiSpecialiComponent implements OnInit, OnDestroy {
   private destroy$ = new Subject<void>();
  
  // Dati
  eventi: Evento[] = [];
  categorie: EventoCategoria[] = [];
  eventiCaricati = false;
  
  // UI State
  viewMode: 'grid' | 'list' | 'calendar' = 'grid';
  expandedCardId: string | null = null;
  selectedEvento: Evento | null = null;
  showIscrizioneModal = false;
  showDettagliModal = false; // Nuovo stato per il modal dettagli
  isLoading = false;
  
  // Filtri
  filters: EventoFilters = {};
  selectedCategoria = '';
  selectedStato = '';
  showSoloConPosti = false;
  
  // Form iscrizione
  iscrizioneForm: FormGroup;
  isSubmittingIscrizione = false;
  messaggioSuccesso = '';
  messaggioErrore = '';
  enableBodyScroll: any;

  constructor(
    private eventiService: EventiService,
    private fb: FormBuilder
  ) {
    // Inizializza il form nel costruttore
    this.iscrizioneForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      cognome: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      eta: ['', [Validators.min(1), Validators.max(120)]],
      note: ['']
    });
  }

  ngOnInit() {
    this.loadCategorie();
    this.loadEventi();
    
    // Listener per chiudere modal con ESC
    document.addEventListener('keydown', this.handleEscapeKey.bind(this));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Rimuovi listener e ripristina scroll
    document.removeEventListener('keydown', this.handleEscapeKey.bind(this));
  }

  // Gestione chiusura con ESC
  private handleEscapeKey(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (this.showIscrizioneModal) {
        this.closeIscrizioneModal();
      } else if (this.showDettagliModal) {
        this.closeDettagliModal();
      }
    }
  }

  // Caricamento dati
  loadEventi() {
    this.isLoading = true;
    this.eventiService.getEventi(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (eventi) => {
          this.eventi = eventi;
          this.eventiCaricati = true;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Errore nel caricamento eventi:', error);
          this.isLoading = false;
        }
      });
  }

  loadCategorie() {
    this.eventiService.getCategorie()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categorie) => {
          this.categorie = categorie;
        },
        error: (error) => {
          console.error('Errore nel caricamento categorie:', error);
        }
      });
  }

  // Filtri e ricerca
  applyFilters() {
    this.filters = {
      categoria: this.selectedCategoria || undefined,
      stato: this.selectedStato || undefined,
      postiDisponibili: this.showSoloConPosti || undefined
    };
    this.loadEventi();
  }

  resetFilters() {
    this.selectedCategoria = '';
    this.selectedStato = '';
    this.showSoloConPosti = false;
    this.filters = {};
    this.loadEventi();
  }

  // Gestione vista
  setViewMode(mode: 'grid' | 'list' | 'calendar') {
    this.viewMode = mode;
  }

  toggleCardExpansion(eventoId: string) {
    this.expandedCardId = this.expandedCardId === eventoId ? null : eventoId;
  }

  // Gestione eventi
  selectEvento(evento: Evento) {
    this.selectedEvento = evento;
    this.showDettagliModal = true;
  }

  closeDettagliModal() {
    this.showDettagliModal = false;
    this.selectedEvento = null;
  }

  // Gestione iscrizioni
  initIscrizioneForm() {
    this.iscrizioneForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      cognome: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      eta: ['', [Validators.min(1), Validators.max(120)]],
      note: ['']
    });
  }

  openIscrizioneModal(evento: Evento) {
    if (this.canIscriversi(evento)) {
      this.selectedEvento = evento;
      this.showIscrizioneModal = true;
      this.resetMessages();
    }
  }

  closeIscrizioneModal() {
    this.showIscrizioneModal = false;
    this.selectedEvento = null;
    this.iscrizioneForm.reset();
    this.resetMessages();
  }

  submitIscrizione() {
    if (this.iscrizioneForm.valid && this.selectedEvento) {
      this.isSubmittingIscrizione = true;
      this.resetMessages();
      
      const formData: EventoFormData = this.iscrizioneForm.value;
      
      this.eventiService.iscriviAdEvento(this.selectedEvento.documentId, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (iscrizione) => {
            this.messaggioSuccesso = 'Iscrizione completata con successo!';
            this.isSubmittingIscrizione = false;
            
            // Aggiorna l'evento con il nuovo numero di iscritti
            this.updateEventoIscritti(this.selectedEvento!);
            
            // Chiudi il modal dopo 2 secondi
            setTimeout(() => {
              this.closeIscrizioneModal();
            }, 2000);
          },
          error: (error) => {
            console.error('Errore nell\'iscrizione:', error);
            this.messaggioErrore = 'Errore durante l\'iscrizione. Riprova più tardi.';
            this.isSubmittingIscrizione = false;
          }
        });
    }
  }

  // Utility methods
  canIscriversi(evento: Evento): boolean {
    if (!evento.richiedeIscrizione) return false;
    if (this.eventiService.isEventoPieno(evento)) return false;
    if (this.eventiService.isEventoPassato(evento)) return false;
    return true;
  }

  getImageUrl(evento: Evento): string {
    // Se l'evento ha un'immagine, usa il metodo del servizio
    if (evento.immagine) {
      const imageUrl = this.eventiService.getBestImageUrl(evento.immagine);
      if (imageUrl && imageUrl !== 'assets/images/placeholder.jpg') {
        return imageUrl;
      }
    }
    
    // Immagine placeholder predefinita per gli eventi di basket
    return 'assets/images/basketball-event-placeholder.jpg';
  }

  // Metodo per verificare se l'immagine è valida
  hasValidImage(evento: Evento): boolean {
    return true;
  }

  getPostiDisponibili(evento: Evento): number {
    return this.eventiService.getPostiDisponibili(evento);
  }

  isEventoPieno(evento: Evento): boolean {
    return this.eventiService.isEventoPieno(evento);
  }

  isEventoPassato(evento: Evento): boolean {
    return this.eventiService.isEventoPassato(evento);
  }

  isEventoOggi(evento: Evento): boolean {
    return this.eventiService.isEventoOggi(evento);
  }

  getProgressWidth(evento: Evento): number {
    if (!evento.richiedeIscrizione || !evento.postiDisponibili) return 0;
    return ((evento.postiOccupati || 0) / evento.postiDisponibili) * 100;
  }

  getStatoClass(stato: string): string {
    const classi = {
      'PROGRAMMATO': 'stato-programmato',
      'IN_CORSO': 'stato-in-corso',
      'CONCLUSO': 'stato-concluso',
      'ANNULLATO': 'stato-annullato'
    };
    return classi[stato as keyof typeof classi] || '';
  }

  getCategoriaColor(categoria: EventoCategoria): string {
    return categoria.colore || '#3b82f6';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(time: string): string {
    if (!time) return '';
    
    // Se è nel formato HH:MM:SS.sss, estraiamo solo HH:MM
    if (time.includes(':')) {
      const parts = time.split(':');
      if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}`;
      }
    }
    
    return time.substring(0, 5); // Fallback: primi 5 caratteri
  }

  formatDuration(duration: string): string {
    if (!duration) return '';
    
    // Se è nel formato HH:MM:SS.sss, convertiamo in formato leggibile
    if (duration.includes(':')) {
      const parts = duration.split(':');
      if (parts.length >= 2) {
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        
        if (hours > 0 && minutes > 0) {
          return `${hours}h ${minutes}min`;
        } else if (hours > 0) {
          return `${hours}h`;
        } else if (minutes > 0) {
          return `${minutes}min`;
        }
      }
    }
    
    return duration; // Se non è un formato orario, restituisci così com'è
  }

  private updateEventoIscritti(evento: Evento) {
    const index = this.eventi.findIndex(e => e.documentId === evento.documentId);
    if (index !== -1) {
      this.eventi[index].postiOccupati = (this.eventi[index].postiOccupati || 0) + 1;
    }
  }

  private resetMessages() {
    this.messaggioSuccesso = '';
    this.messaggioErrore = '';
  }
}