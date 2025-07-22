// components/my-bookings/my-bookings.component.ts - CON MODIFICA PRENOTAZIONE
import { Component, OnInit, Input, inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { BookingService } from '../../core/services/booking.service';

interface UserBooking {
  id: number;
  palestra: string;
  palestraId: number;
  data: string;
  dataCompleta: Date;
  orarioInizio: string;
  orarioFine: string;
  tipo: string;
  stato: 'confermata' | 'in-attesa' | 'completata' | 'cancellata';
  descrizione?: string;
  canModify: boolean;
  canCancel: boolean;
}

// Interfaccia per la prenotazione da modificare
interface BookingToEdit {
  id: number;
  palestraId: number;
  palestra: string;
  data: string;
  orarioInizio: string;
  orarioFine: string;
  tipo: string;
  descrizione?: string;
}

@Component({
  selector: 'app-my-bookings',
  templateUrl: './my-bookings.component.html',
  styleUrls: ['./my-bookings.component.css'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('slideOut', [
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateX(-100%)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class MyBookingsComponent implements OnInit {
  @Input() user: any = null;

  private readonly bookingService = inject(BookingService);
  private readonly fb = inject(FormBuilder);

  // State per le operazioni
  isDeleting = false;
  deleteError = '';
  successMessage = '';
  showSuccessMessage = false;

  // State per la modifica
  showEditModal = false;
  bookingToEdit: BookingToEdit | null = null;
  isEditMode = false;

  // State
  bookings$ = new BehaviorSubject<UserBooking[]>([]);
  filteredBookings$ = new BehaviorSubject<UserBooking[]>([]);
  isLoading = true;
  selectedBooking: UserBooking | null = null;
  showConfirmDialog = false;
  actionType: 'cancel' | 'modify' | null = null;

  // Filters
  filterForm!: FormGroup;
  statusFilter = 'all';
  dateFilter = 'all';
  sortBy = 'date-desc';

  // Pagination
  currentPage = 1;
  itemsPerPage = 6;
  totalItems = 0;

  // UI State
  viewMode: 'grid' | 'list' = 'grid';

  // Stato errori
  errorMessage: string = '';
  showError: boolean = false;

  // Statistiche
  confirmedCount: number = 0;
  pendingCount: number = 0;
  upcomingCount: number = 0;

  statusOptions = [
    { value: 'all', label: 'Tutti gli stati', icon: 'event' },
    { value: 'confermata', label: 'Confermate', icon: 'event_available' },
    { value: 'in-attesa', label: 'In Attesa', icon: 'schedule' },
    { value: 'completata', label: 'Completate', icon: 'event_busy' },
    { value: 'cancellata', label: 'Cancellate', icon: 'event_busy' }
  ];

  dateOptions = [
    { value: 'all', label: 'Tutte le date' },
    { value: 'upcoming', label: 'Prossime' },
    { value: 'past', label: 'Passate' },
    { value: 'today', label: 'Oggi' },
    { value: 'this-week', label: 'Questa settimana' },
    { value: 'this-month', label: 'Questo mese' }
  ];

  sortOptions = [
    { value: 'date-desc', label: 'Data (più recente)' },
    { value: 'date-asc', label: 'Data (meno recente)' },
    { value: 'palestra-asc', label: 'Palestra (A-Z)' },
    { value: 'stato-asc', label: 'Stato' }
  ];

  ngOnInit(): void {
    this.initializeFilters();
    this.loadBookings();
    this.setupFilterSubscriptions();
  }

  private initializeFilters(): void {
    this.filterForm = this.fb.group({
      searchText: [''],
      status: [this.statusFilter],
      dateRange: [this.dateFilter],
      sortBy: [this.sortBy]
    });
  }

  private setupFilterSubscriptions(): void {
    this.filterForm.valueChanges.subscribe(values => {
      this.statusFilter = values.status;
      this.dateFilter = values.dateRange;
      this.sortBy = values.sortBy;
      this.applyFilters();
    });
  }

  /**
   * ===== MODIFICA PRENOTAZIONE =====
   */
  
  /**
   * Avvia la modifica di una prenotazione
   */
  modifyBooking(booking: UserBooking): void {    
    // Prepara i dati per la modifica
    this.bookingToEdit = {
      id: booking.id,
      palestraId: booking.palestraId,
      palestra: booking.palestra,
      data: booking.data,
      orarioInizio: booking.orarioInizio,
      orarioFine: booking.orarioFine,
      tipo: booking.tipo,
      descrizione: booking.descrizione
    };
    
    this.isEditMode = true;
    this.showEditModal = true;
    
  }

  /**
   * Gestisce il successo della modifica
   */
  onEditSuccess(updatedBooking: any): void {
    
    // Chiude il modal
    this.closeEditModal();
    
    // Mostra messaggio di successo
    this.showSuccess('Prenotazione modificata con successo!');
    
    // Ricarica le prenotazioni per mostrare i dati aggiornati
    setTimeout(() => {
      this.loadBookings();
    }, 1000);
  }

  /**
   * Gestisce l'annullamento della modifica
   */
  onEditCancelled(): void {
    this.closeEditModal();
  }

  /**
   * Chiude il modal di modifica
   */
  closeEditModal(): void {
    this.showEditModal = false;
    this.bookingToEdit = null;
    this.isEditMode = false;
  }

  /**
   * ===== CARICAMENTO PRENOTAZIONI =====
   */
  private loadBookings(): void {
    this.isLoading = true;
    this.showError = false;
    this.errorMessage = '';

    const options = this.buildOptionsFromFilters();

    this.bookingService.getUserReservations(options).pipe(
      map(response => {
        if (response.success && response.reservations) {
          this.confirmedCount = response.confirmedCount || 0;
          this.pendingCount = response.pendingCount || 0;
          this.upcomingCount = response.upcomingCount || 0;
          
          return response.reservations.map(reservation => this.mapBackendToUserBooking(reservation));
        } else {
          this.showError = true;
          this.errorMessage = response.message || 'Errore nel caricamento delle prenotazioni';
          return [];
        }
      }),
      catchError(error => {
        
        this.showError = true;
        
        if (error.message?.includes('autenticazione') || error.message?.includes('401')) {
          this.errorMessage = '🔐 Sessione scaduta. È necessario effettuare nuovamente il login.';
        } else if (error.message?.includes('403')) {
          this.errorMessage = '🚫 Non hai i permessi per visualizzare le prenotazioni.';
        } else if (error.message?.includes('500')) {
          this.errorMessage = '🔧 Errore interno del server. Riprova più tardi.';
        } else if (error.message?.includes('timeout')) {
          this.errorMessage = '⏱️ Timeout della richiesta. Controlla la connessione.';
        } else {
          this.errorMessage = '❌ Errore nel caricamento delle prenotazioni. Riprova più tardi.';
        }
        
        this.confirmedCount = 0;
        this.pendingCount = 0;
        this.upcomingCount = 0;
        
        return of([]);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe(bookings => {
      if (bookings.length > 0) {
        this.showError = false;
      } else if (!this.showError) {
      }
      
      this.bookings$.next(bookings);
      this.totalItems = bookings.length;
      this.applyFilters();
    });
  }

  /**
   * Chiude il messaggio di errore
   */
  closeError(): void {
    this.showError = false;
    this.errorMessage = '';
  }

  /**
   * Riprova il caricamento delle prenotazioni
   */
  retryLoading(): void {
    this.closeError();
    this.loadBookings();
  }

  /**
   * Ricarica le prenotazioni dal backend
   */
  refreshBookings(): void {
    this.showSuccessMessage = false;
    this.successMessage = '';
    this.loadBookings();
  }

  /**
   * ===== CANCELLAZIONE PRENOTAZIONE =====
   */
  
  /**
   * Gestisce la cancellazione di una prenotazione
   */
  cancelBooking(booking: UserBooking): void {
    this.selectedBooking = booking;
    this.actionType = 'cancel';
    this.showConfirmDialog = true;
  }

  /**
   * Conferma l'azione selezionata (cancellazione)
   */
  confirmAction(): void {
    if (!this.selectedBooking || !this.actionType) return;

    if (this.actionType === 'cancel') {
      this.performCancellation();
    }
  }

  /**
   * Esegue la cancellazione della prenotazione
   */
  private performCancellation(): void {
    if (!this.selectedBooking) return;

    
    this.isDeleting = true;
    this.deleteError = '';
    
    this.bookingService.deleteReservation(this.selectedBooking.id.toString()).subscribe({
      next: (response) => {
        if (response.success) {
          
          this.updateBookingsAfterDeletion(this.selectedBooking!.id);
          this.showSuccess('Prenotazione cancellata con successo');
          this.closeConfirmDialog();
          this.updateStatisticsAfterDeletion();
          
          setTimeout(() => {
            this.loadBookings();
          }, 500);
        } else {
          this.deleteError = response.message || 'Errore durante la cancellazione';
        }
        this.isDeleting = false;
      },
      error: (error) => {
        this.deleteError = error.message || 'Errore durante la cancellazione della prenotazione';
        this.isDeleting = false;
      }
    });
  }

  /**
   * Aggiorna la lista delle prenotazioni dopo una cancellazione
   */
  private updateBookingsAfterDeletion(bookingId: number): void {
    const currentBookings = this.bookings$.value;
    const updatedBookings = currentBookings.map(booking => 
      booking.id === bookingId 
        ? { ...booking, stato: 'cancellata' as const, canModify: false, canCancel: false }
        : booking
    );
    
    this.bookings$.next(updatedBookings);
    this.applyFilters();
    this.totalItems = this.filteredBookings$.value.length;
  }

  /**
   * Aggiorna le statistiche dopo una cancellazione
   */
  private updateStatisticsAfterDeletion(): void {
    if (this.selectedBooking) {
      if (this.selectedBooking.stato === 'confermata') {
        this.confirmedCount = Math.max(0, this.confirmedCount - 1);
      }
      
      if (this.isUpcoming(this.selectedBooking)) {
        this.upcomingCount = Math.max(0, this.upcomingCount - 1);
      }
    }
  }

  /**
   * Chiude il dialog di conferma
   */
  closeConfirmDialog(): void {
    this.showConfirmDialog = false;
    this.selectedBooking = null;
    this.actionType = null;
    this.deleteError = '';
    this.isDeleting = false;
  }

  /**
   * ===== UTILITY METHODS =====
   */

  /**
   * Mostra un messaggio di successo
   */
  private showSuccess(message: string): void {
    this.successMessage = message;
    this.showSuccessMessage = true;
    
    // Nascondi il messaggio dopo 3 secondi
    setTimeout(() => {
      this.showSuccessMessage = false;
      this.successMessage = '';
    }, 3000);
  }

  /**
   * Costruisce le opzioni per la chiamata API basate sui filtri attuali
   */
  private buildOptionsFromFilters(): string {
    switch (this.statusFilter) {
      case 'upcoming': return 'upcoming';
      case 'past': return 'past';
      case 'confermata': return 'confirmed';
      case 'in-attesa': return 'pending';
      case 'completata': return 'completed';
      case 'cancellata': return 'cancelled';
      default: return 'all';
    }
  }

  /**
   * Mappa una prenotazione dal backend al formato del componente
   */
  private mapBackendToUserBooking(backendReservation: any): UserBooking {
    return {
      id: backendReservation.referenceNumber,
      palestra: backendReservation.resourceName || 'Palestra',
      palestraId: backendReservation.resourceId || 3, // Aggiungi questo mapping
      data: backendReservation.formattedDate || this.formatDisplayDate(backendReservation.startDateTime),
      dataCompleta: new Date(backendReservation.startDateTime),
      orarioInizio: this.extractTime(backendReservation.startDateTime),
      orarioFine: this.extractTime(backendReservation.endDateTime),
      tipo: backendReservation.tipo || 'Prenotazione',
      stato: this.mapBackendStatus(backendReservation.status),
      descrizione: backendReservation.description,
      canModify: backendReservation.canModify || false,
      canCancel: backendReservation.canCancel || false
    };
  }


  /**
   * Mappa lo stato dal backend al formato del componente
   */
  private mapBackendStatus(status: string): 'confermata' | 'in-attesa' | 'completata' | 'cancellata' {
    switch (status?.toLowerCase()) {
      case 'confermata': 
      case 'confirmed': 
        return 'confermata';
      case 'in_attesa': 
        return 'in-attesa';
      case 'pending': 
        return 'in-attesa';
      case 'completata': 
      case 'completed': 
        return 'completata';
      case 'cancellata': 
      case 'cancelled': 
        return 'cancellata';
      default: 
        return 'confermata';
    }
  }

  /**
   * Formatta la data per il display
   */
  private formatDisplayDate(dateTimeString: string): string {
    if (!dateTimeString) return '';
    
    const date = new Date(dateTimeString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Oggi';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Domani';
    } else {
      return date.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short'
      });
    }
  }

  /**
   * Estrae l'orario da una stringa di data/ora
   */
  private extractTime(dateTimeString: string): string {
    if (!dateTimeString) return '';
    
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * ===== FILTRI E ORDINAMENTO =====
   */

  /**
   * Applica i filtri alle prenotazioni
   */
  private applyFilters(): void {
    const bookings = this.bookings$.value;
    let filtered = [...bookings];

    // Filtro per testo di ricerca
    const searchText = this.filterForm.value.searchText?.toLowerCase() || '';
    if (searchText) {
      filtered = filtered.filter(booking => 
        booking.palestra.toLowerCase().includes(searchText) ||
        booking.tipo.toLowerCase().includes(searchText) ||
        booking.descrizione?.toLowerCase().includes(searchText)
      );
    }

    // Filtro per stato
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.stato === this.statusFilter);
    }

    // Filtro per data
    filtered = this.applyDateFilter(filtered);

    // Ordinamento
    filtered = this.applySorting(filtered);

    this.filteredBookings$.next(filtered);
    this.totalItems = filtered.length;
    this.currentPage = 1; // Reset pagination
  }

  private applyDateFilter(bookings: UserBooking[]): UserBooking[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (this.dateFilter) {
      case 'upcoming':
        return bookings.filter(b => b.dataCompleta >= today);
      case 'past':
        return bookings.filter(b => b.dataCompleta < today);
      case 'today':
        return bookings.filter(b => 
          b.dataCompleta.toDateString() === today.toDateString()
        );
      case 'this-week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return bookings.filter(b => b.dataCompleta >= weekStart && b.dataCompleta <= weekEnd);
      case 'this-month':
        return bookings.filter(b => 
          b.dataCompleta.getMonth() === today.getMonth() &&
          b.dataCompleta.getFullYear() === today.getFullYear()
        );
      default:
        return bookings;
    }
  }

  private applySorting(bookings: UserBooking[]): UserBooking[] {
    return bookings.sort((a, b) => {
      switch (this.sortBy) {
        case 'date-asc':
          return a.dataCompleta.getTime() - b.dataCompleta.getTime();
        case 'date-desc':
          return b.dataCompleta.getTime() - a.dataCompleta.getTime();
        case 'palestra-asc':
          return a.palestra.localeCompare(b.palestra);
        case 'stato-asc':
          return a.stato.localeCompare(b.stato);
        default:
          return 0;
      }
    });
  }

  /**
   * ===== UI STATE MANAGEMENT =====
   */

  /**
   * Cambia modalità di visualizzazione
   */
  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  /**
   * ===== PAGINAZIONE =====
   */

  /**
   * Ottieni le prenotazioni per la pagina corrente
   */
  getPaginatedBookings(): UserBooking[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredBookings$.value.slice(startIndex, endIndex);
  }

  /**
   * Calcola il numero totale di pagine
   */
  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  /**
   * Cambia pagina
   */
  changePage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  /**
   * Ottieni array per la paginazione
   */
  getPaginationArray(): number[] {
    const totalPages = this.getTotalPages();
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  /**
   * ===== TEMPLATE HELPERS =====
   */

  /**
   * Ottieni colore per lo stato
   */
  getStatusColor(stato: string): string {
    switch (stato) {
      case 'confermata': return 'success';
      case 'in-attesa': return 'warning';
      case 'completata': return 'info';
      case 'cancellata': return 'error';
      default: return 'default';
    }
  }

  /**
   * Ottieni icona per lo stato
   */
  getStatusIcon(stato: string): string {
    switch (stato) {
      case 'confermata': return 'event_available';
      case 'in-attesa': return 'schedule';
      case 'completata': return 'check_circle';
      case 'cancellata': return 'cancel';
      default: return 'event';
    }
  }

  /**
   * Controlla se la prenotazione è oggi
   */
  isToday(booking: UserBooking): boolean {
    const today = new Date();
    return booking.dataCompleta.toDateString() === today.toDateString();
  }

  /**
   * Controlla se la prenotazione è nel futuro
   */
  isUpcoming(booking: UserBooking): boolean {
    return booking.dataCompleta > new Date();
  }

  /**
   * Formatta la data per la visualizzazione
   */
  formatDate(booking: UserBooking): string {
    if (this.isToday(booking)) return 'Oggi';
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (booking.dataCompleta.toDateString() === tomorrow.toDateString()) {
      return 'Domani';
    }
    
    return booking.dataCompleta.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'short'
    });
  }

  /**
   * Conta le prenotazioni confermate
   */
  getConfirmedCount(bookings: UserBooking[]): number {
    return bookings.filter(b => b.stato === 'confermata').length;
  }

  /**
   * Conta le prenotazioni prossime
   */
  getUpcomingCount(bookings: UserBooking[]): number {
    return bookings.filter(b => this.isUpcoming(b)).length;
  }

  /**
   * Track by function per ngFor
   */
  trackByBookingId(index: number, booking: UserBooking): number {
    return booking.id;
  }

  /**
   * ===== VALIDAZIONI =====
   */

  /**
   * Verifica se ci sono prenotazioni
   */
  hasBookings(): boolean {
    return this.bookings$.value.length > 0;
  }

  /**
   * Verifica se ci sono prenotazioni filtrate
   */
  hasFilteredBookings(): boolean {
    return this.filteredBookings$.value.length > 0;
  }

  /**
   * Messaggio di stato quando non ci sono prenotazioni
   */
  getEmptyMessage(): string {
    if (this.isLoading) return '';
    
    if (this.hasBookings()) {
      return 'Nessuna prenotazione corrisponde ai filtri selezionati.';
    } else {
      return 'Non hai ancora effettuato nessuna prenotazione.';
    }
  }

  /**
   * Ottieni icona per lo stato vuoto
   */
  getEmptyIcon(): string {
    if (this.hasBookings()) {
      return 'filter_list_off';
    } else {
      return 'event_busy';
    }
  }
}