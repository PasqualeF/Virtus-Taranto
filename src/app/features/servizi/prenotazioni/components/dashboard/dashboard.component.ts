// components/dashboard/dashboard.component.ts - AGGIORNATO CON BACKEND
import { Component, OnInit, Input, inject, TrackByFunction, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, EMPTY } from 'rxjs';
import { map, catchError, finalize, tap } from 'rxjs/operators';
import { trigger, transition, style, animate } from '@angular/animations';
import { BookingService } from '../../core/services/booking.service';
import { AuthService } from '../../core/services/auth.service';
import { NavigationService } from 'src/app/core/service/navigation.service';
import { 
  DashboardService, 
  DashboardStats, 
  UpcomingBooking, 
  TodaySchedule 
} from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('400ms 200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class DashboardComponent implements OnInit {
  @Input() user: any = null;
  @Output() sectionChange = new EventEmitter<string>();

  private readonly bookingService = inject(BookingService);
  private readonly dashboardService = inject(DashboardService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly navigationService = inject(NavigationService);

  // State - Usando BehaviorSubject per un controllo migliore
  stats$ = new BehaviorSubject<DashboardStats | null>(null);
  upcomingBookings$ = new BehaviorSubject<UpcomingBooking[]>([]);
  todaySchedule$ = new BehaviorSubject<TodaySchedule | null>(null);
  
  isLoading = true;
  hasError = false;
  errorMessage = '';
  currentTime = new Date();

  showDeleteConfirm = false;
selectedBookingForDelete: UpcomingBooking | null = null;
isDeleting = false;
deleteError = '';
successMessage = '';
showSuccessMessage = false;

  // Track by functions
  trackByBookingId: TrackByFunction<UpcomingBooking> = (index, item) => item.id;

  ngOnInit(): void {

  this.successMessage = '';
  this.showDeleteConfirm = false;
  this.deleteError = '';
    this.navigationService.setBookingArea(true);
    this.loadDashboardData();
    this.setupTimeUpdate();
  }

  /**
   * Carica tutti i dati del dashboard dal backend
   */
  private loadDashboardData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    this.dashboardService.loadDashboardDataFromDedicatedEndpoint().pipe(
      tap(data => {
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (data) => {
        // Aggiorna tutti i BehaviorSubject
        this.stats$.next(data.stats);
        this.upcomingBookings$.next(data.upcomingBookings);
        this.todaySchedule$.next(data.todaySchedule);
        
      },
      error: (error) => {
        this.hasError = true;
        
        if (error.message?.includes('401') || error.message?.includes('autenticazione')) {
          this.errorMessage = '🔐 Sessione scaduta. Effettua nuovamente il login.';
          // TODO: Reindirizza al login se necessario
        } else if (error.message?.includes('403')) {
          this.errorMessage = '🚫 Non hai i permessi per visualizzare la dashboard.';
        } else {
          this.errorMessage = '❌ Errore nel caricamento dei dati. Riprova più tardi.';
        }
        
        // Imposta valori di fallback
        this.stats$.next(this.getEmptyStats());
        this.upcomingBookings$.next([]);
        this.todaySchedule$.next({ hasBookings: false, totalBookings: 0, completedBookings: 0 });
      }
    });
  }

  /**
   * Setup aggiornamento ora corrente
   */
  private setupTimeUpdate(): void {
    setInterval(() => {
      this.currentTime = new Date();
    }, 60000); // Aggiorna ogni minuto
  }

  /**
   * Naviga alla sezione nuova prenotazione
   */
  createNewBooking(): void {
    this.sectionChange.emit('nuova-prenotazione');
  }

  /**
   * Naviga alle prenotazioni dell'utente
   */
  viewMyBookings(): void {
    this.sectionChange.emit('mie-prenotazioni');
  }

  /**
   * Ricarica dati dashboard
   */
  refreshData(): void {
    this.loadDashboardData();
  }

  /**
   * Chiude il messaggio di errore
   */
  closeError(): void {
    this.hasError = false;
    this.errorMessage = '';
  }

  /**
   * Riprova il caricamento
   */
  retryLoading(): void {
    this.closeError();
    this.loadDashboardData();
  }

  /**
   * Ottieni saluto basato sull'ora
   */
  getGreeting(): string {
    const hour = this.currentTime.getHours();
    
    if (hour < 12) {
      return 'Buongiorno';
    } else if (hour < 18) {
      return 'Buon pomeriggio';
    } else {
      return 'Buonasera';
    }
  }

  /**
   * Ottieni nome utente
   */
  getUserName(): string {
    if (!this.user) return 'Utente';
    return this.user.firstName || this.user.username || 'Utente';
  }

  /**
   * Ottieni colore stato prenotazione
   */
  getStatusColor(stato: string): string {
    switch (stato) {
      case 'confermata': return 'success';
      case 'in-attesa': return 'warning';
      case 'completata': return 'info';
      case 'cancellata': return 'default';
      default: return 'default';
    }
  }

  /**
   * Ottieni etichetta stato prenotazione
   */
  getStatusLabel(stato: string): string {
    switch (stato?.toLowerCase()) {
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
   * Formatta ora corrente
   */
  getCurrentTimeFormatted(): string {
    return this.currentTime.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formatta data corrente
   */
  getCurrentDateFormatted(): string {
    return this.currentTime.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Controlla se ci sono prenotazioni oggi
   */
  hasBookingsToday(): boolean {
    const todaySchedule = this.todaySchedule$.value;
    return todaySchedule?.hasBookings || false;
  }

  /**
   * Ottieni prossima prenotazione di oggi
   */
  getNextTodayBooking(): UpcomingBooking | null {
    const todaySchedule = this.todaySchedule$.value;
    return todaySchedule?.nextBooking || null;
  }

  /**
   * Gestisce il click su una prenotazione
   */
  onBookingClick(booking: UpcomingBooking): void {
    console.log('📅 Click su prenotazione:', booking.id);
    // TODO: Apri dettagli prenotazione o modale
  }

  /**
   * Modifica una prenotazione
   */
  modifyBooking(booking: UpcomingBooking): void {
    if (!booking.canModify) {
      console.warn('⚠️ Prenotazione non modificabile:', booking.id);
      return;
    }
    
    console.log('✏️ Modifica prenotazione:', booking.id);
    // TODO: Implementa modifica prenotazione
  }


  /**
   * Calcola la tendenza per le statistiche
   */
  getTrendForStat(statType: string): { type: 'up' | 'down' | 'neutral', text: string } {
    const stats = this.stats$.value;
    if (!stats) return { type: 'neutral', text: 'Nessun dato' };

    // Logica semplificata per mostrare trend
    switch (statType) {
      case 'active':
        return stats.activeBookings > 0 
          ? { type: 'up', text: `+${stats.thisWeekBookings} questa settimana` }
          : { type: 'neutral', text: 'Nessuna prenotazione attiva' };
      
      case 'hours':
        return stats.totalHours > 10 
          ? { type: 'up', text: `+${Math.round(stats.totalHours * 0.1)}h questo mese` }
          : { type: 'neutral', text: 'Prime ore prenotate' };
      
      case 'gyms':
        return stats.gymsUsed > 1 
          ? { type: 'up', text: 'Buona varietà' }
          : { type: 'neutral', text: 'Una palestra principale' };
      
      case 'upcoming':
        return stats.upcomingBookings > 2 
          ? { type: 'up', text: 'Programma ricco' }
          : { type: 'down', text: 'Poche prenotazioni future' };
      
      default:
        return { type: 'neutral', text: '' };
    }
  }

  /**
   * Restituisce statistiche vuote
   */
  private getEmptyStats(): DashboardStats {
    return {
      activeBookings: 0,
      totalHours: 0,
      gymsUsed: 0,
      upcomingBookings: 0,
      confirmedBookings: 0,
      pendingBookings: 0,
      completedBookings: 0,
      thisWeekBookings: 0,
      thisMonthBookings: 0
    };
  }


/**
 * Avvia il processo di cancellazione di una prenotazione
 */
cancelBooking(booking: UpcomingBooking): void {
  if (!booking.canCancel) {
    return;
  }
  
  this.selectedBookingForDelete = booking;
  this.showDeleteConfirm = true;
  this.deleteError = '';
}

/**
 * Conferma la cancellazione della prenotazione
 */
confirmCancellation(): void {
  if (!this.selectedBookingForDelete) return;
  
  this.isDeleting = true;
  this.deleteError = '';
  
  this.bookingService.deleteReservation(this.selectedBookingForDelete.id).subscribe({
    next: (response) => {
      if (response.success) {
        
        // Rimuovi la prenotazione dalla lista locale
        const currentBookings = this.upcomingBookings$.value;
        const updatedBookings = currentBookings.filter(
          b => b.id !== this.selectedBookingForDelete!.id
        );
        this.upcomingBookings$.next(updatedBookings);
        
        // Aggiorna anche le statistiche
        this.updateStatsAfterDeletion();
        
        // Chiudi il dialog
        this.closeDeleteConfirm();
        
        // Mostra messaggio di successo (opzionale)
        this.showSuccess('Prenotazione cancellata con successo');
        
        // Ricarica tutti i dati della dashboard per essere sicuri che tutto sia aggiornato
        setTimeout(() => {
          this.loadDashboardData();
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
private showSuccess(message: string): void {
  this.successMessage = message;
  this.showSuccessMessage = true;
  // Nascondi il messaggio dopo 3 secondi
  setTimeout(() => {
    this.successMessage = '';
    this.showSuccessMessage = false;
  }, 3000);
}
/**
 * Chiude il dialog di conferma cancellazione
 */
closeDeleteConfirm(): void {
  this.showDeleteConfirm = false;
  this.selectedBookingForDelete = null;
  this.deleteError = '';
  this.isDeleting = false;
}

/**
 * Aggiorna le statistiche dopo una cancellazione
 */
private updateStatsAfterDeletion(): void {
  const currentStats = this.stats$.value;
  if (currentStats) {
    // Decrementa i contatori appropriati
    currentStats.activeBookings = Math.max(0, currentStats.activeBookings - 1);
    currentStats.upcomingBookings = Math.max(0, currentStats.upcomingBookings - 1);
    
    // Se la prenotazione era confermata, decrementa anche quello
    if (this.selectedBookingForDelete?.stato === 'confermata') {
      currentStats.confirmedBookings = Math.max(0, currentStats.confirmedBookings - 1);
    }
    
    this.stats$.next(currentStats);
  }
  
  // Se era una prenotazione di oggi, aggiorna anche il programma giornaliero
  if (this.selectedBookingForDelete && this.isBookingToday(this.selectedBookingForDelete)) {
    this.updateTodayScheduleAfterDeletion();
  }
}


/**
 * Verifica se una prenotazione è per oggi
 */
private isBookingToday(booking: UpcomingBooking): boolean {
  const bookingDate = new Date(booking.startDateTime);
  const today = new Date();
  return bookingDate.toDateString() === today.toDateString();
}

/**
 * Aggiorna il programma di oggi dopo una cancellazione
 */
private updateTodayScheduleAfterDeletion(): void {
  const currentSchedule = this.todaySchedule$.value;
  if (currentSchedule && currentSchedule.totalBookings > 0) {
    currentSchedule.totalBookings--;
    
    // Se era la prossima prenotazione, trova la successiva
    if (currentSchedule.nextBooking?.id === this.selectedBookingForDelete?.id) {
      const remainingTodayBookings = this.upcomingBookings$.value.filter(
        b => this.isBookingToday(b) && b.id !== this.selectedBookingForDelete?.id
      );
      
      currentSchedule.nextBooking = remainingTodayBookings[0] || undefined;
      currentSchedule.hasBookings = remainingTodayBookings.length > 0;
    }
    
    this.todaySchedule$.next(currentSchedule);
  }
}

 navigateTo(path: string) {
    this.router.navigate([path]);
  }

  /**
   * Formatta numero con unità
   */
  formatNumber(value: number, suffix: string = ''): string {
    if (value === 0) return `0${suffix}`;
    return `${value}${suffix}`;
  }
}