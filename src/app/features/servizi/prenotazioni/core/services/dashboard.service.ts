// core/services/dashboard.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, combineLatest, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { BookingService } from './booking.service';
import { UserReservation } from '../models/user-reservation.model';

export interface DashboardStats {
  activeBookings: number;
  totalHours: number;
  gymsUsed: number;
  upcomingBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  completedBookings: number;
  thisWeekBookings: number;
  thisMonthBookings: number;
}

export interface UpcomingBooking {
  id: string;
  palestra: string;
  data: string;
  orario: string;
  tipo: string;
  stato: 'confermata' | 'in-attesa' | 'completata' | 'cancellata';
  startDateTime: string;
  endDateTime: string;
  canModify: boolean;
  canCancel: boolean;
  color?: string;
}

export interface TodaySchedule {
  hasBookings: boolean;
  nextBooking?: UpcomingBooking;
  totalBookings: number;
  completedBookings: number;
}

// Interface per l'eventuale endpoint backend dedicato
export interface BackendDashboardStats {
  success: boolean;
  message?: string;
  activeBookings: number;
  totalHours: number;
  gymsUsed: number;
  upcomingBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  completedBookings: number;
  thisWeekBookings: number;
  thisMonthBookings: number;
  topGym1?: string;
  topGym1Count?: number;
  preferredTimeSlot?: string;
  averageSessionDuration?: number;
  lastUpdated?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly bookingService = inject(BookingService);
  
  // URL del backend
  private readonly API_BASE_URL = this.backendUrl;

  /**
   * Carica tutte le statistiche della dashboard
   * OPZIONE 1: Usa le API delle prenotazioni esistenti (attualmente implementato)
   * OPZIONE 2: Usa endpoint dedicato dashboard (commenta/decommenta per scegliere)
   */
  loadDashboardData(): Observable<{
    stats: DashboardStats;
    upcomingBookings: UpcomingBooking[];
    todaySchedule: TodaySchedule;
  }> {

    // OPZIONE 1: Usa le API prenotazioni esistenti (ATTUALE)
    return combineLatest([
      this.loadUserStats(),
      this.loadUpcomingBookings(),
      this.loadTodaySchedule()
    ]).pipe(
      map(([stats, upcomingBookings, todaySchedule]) => ({
        stats,
        upcomingBookings,
        todaySchedule
      })),
      tap(data => {
       
      }),
      catchError(error => {
        return of({
          stats: this.getEmptyStats(),
          upcomingBookings: [],
          todaySchedule: { hasBookings: false, totalBookings: 0, completedBookings: 0 }
        });
      })
    );

    // OPZIONE 2: Usa endpoint dedicato dashboard (ALTERNATIVA)
    // return this.loadDashboardDataFromDedicatedEndpoint();
  }

  /**
   * OPZIONE 2: Carica dati da endpoint dashboard dedicato
   * Decommenta questo metodo e commenta loadDashboardData() sopra per usare l'endpoint dedicato
   */
   loadDashboardDataFromDedicatedEndpoint(): Observable<{
    stats: DashboardStats;
    upcomingBookings: UpcomingBooking[];
    todaySchedule: TodaySchedule;
  }> {
    return combineLatest([
      this.getDashboardStatsFromBackend('thisMonth'),
      this.loadUpcomingBookings(),
      this.loadTodaySchedule()
    ]).pipe(
      map(([backendStats, upcomingBookings, todaySchedule]) => ({
        stats: this.mapBackendStatsToFrontend(backendStats),
        upcomingBookings,
        todaySchedule
      })),
      catchError(error => {
        return of({
          stats: this.getEmptyStats(),
          upcomingBookings: [],
          todaySchedule: { hasBookings: false, totalBookings: 0, completedBookings: 0 }
        });
      })
    );
  }

  /**
   * Chiama l'endpoint backend dedicato per le statistiche dashboard
   */
  private getDashboardStatsFromBackend(period: string = 'thisMonth'): Observable<BackendDashboardStats> {
    const url = `${this.API_BASE_URL}/dashboard/stats?period=${period}`;
    
    return this.http.get<BackendDashboardStats>(url).pipe(
      tap(response => {
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Mappa le statistiche del backend al formato frontend
   */
  private mapBackendStatsToFrontend(backendStats: BackendDashboardStats): DashboardStats {
    return {
      activeBookings: backendStats.activeBookings || 0,
      totalHours: backendStats.totalHours || 0,
      gymsUsed: backendStats.gymsUsed || 0,
      upcomingBookings: backendStats.upcomingBookings || 0,
      confirmedBookings: backendStats.confirmedBookings || 0,
      pendingBookings: backendStats.pendingBookings || 0,
      completedBookings: backendStats.completedBookings || 0,
      thisWeekBookings: backendStats.thisWeekBookings || 0,
      thisMonthBookings: backendStats.thisMonthBookings || 0
    };
  }

  /**
   * Carica le statistiche dell'utente dalle prenotazioni
   */
  private loadUserStats(): Observable<DashboardStats> {

    return this.bookingService.getUserReservations('all').pipe(
      map(response => {
        if (!response.success || !response.reservations) {
          return this.getEmptyStats();
        }

        const reservations = response.reservations;
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Calcola statistiche
        const activeBookings = reservations.filter(r => 
          r.status === 'confermata' && new Date(r.startDateTime) > now
        ).length;

        const totalHours = reservations
          .filter(r => r.status === 'confermata' || r.status === 'completata')
          .reduce((total, r) => {
            const start = new Date(r.startDateTime);
            const end = new Date(r.endDateTime);
            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            return total + hours;
          }, 0);

        const gymsUsed = new Set(
          reservations
            .filter(r => r.status === 'confermata' || r.status === 'completata')
            .map(r => r.resourceName)
        ).size;

        const upcomingBookings = reservations.filter(r => 
          new Date(r.startDateTime) > now
        ).length;

        const confirmedBookings = reservations.filter(r => 
          r.status === 'confermata'
        ).length;

        const pendingBookings = reservations.filter(r => 
          r.status === 'in-attesa'
        ).length;

        const completedBookings = reservations.filter(r => 
          r.status === 'completata'
        ).length;

        const thisWeekBookings = reservations.filter(r => 
          new Date(r.startDateTime) > oneWeekAgo
        ).length;

        const thisMonthBookings = reservations.filter(r => 
          new Date(r.startDateTime) > oneMonthAgo
        ).length;

        return {
          activeBookings,
          totalHours: Math.round(totalHours * 10) / 10, // Arrotonda a 1 decimale
          gymsUsed,
          upcomingBookings,
          confirmedBookings,
          pendingBookings,
          completedBookings,
          thisWeekBookings,
          thisMonthBookings
        };
      }),
      catchError(error => {
        return of(this.getEmptyStats());
      })
    );
  }

  /**
   * Carica le prossime prenotazioni (max 5)
   */
  private loadUpcomingBookings(): Observable<UpcomingBooking[]> {

    return this.bookingService.getUserReservations('upcoming').pipe(
      map(response => {
        if (!response.success || !response.reservations) {
          return [];
        }

        return response.reservations
          .filter(r => new Date(r.startDateTime) > new Date())
          .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
          .slice(0, 5) // Prendi solo le prime 5
          .map(r => this.mapToUpcomingBooking(r));
      }),
      catchError(error => {
        return of([]);
      })
    );
  }

  /**
   * Carica il programma di oggi
   */
  private loadTodaySchedule(): Observable<TodaySchedule> {

    return this.bookingService.getUserReservations('today').pipe(
      map(response => {
        if (!response.success || !response.reservations) {
          return { hasBookings: false, totalBookings: 0, completedBookings: 0 };
        }

        const todayBookings = response.reservations.filter(r => {
          const bookingDate = new Date(r.startDateTime);
          const today = new Date();
          return bookingDate.toDateString() === today.toDateString();
        });

        const now = new Date();
        const nextBooking = todayBookings
          .filter(r => new Date(r.startDateTime) > now)
          .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())[0];

        const completedBookings = todayBookings.filter(r => 
          new Date(r.endDateTime) < now
        ).length;

        return {
          hasBookings: todayBookings.length > 0,
          nextBooking: nextBooking ? this.mapToUpcomingBooking(nextBooking) : undefined,
          totalBookings: todayBookings.length,
          completedBookings
        };
      }),
      catchError(error => {
        return of({ hasBookings: false, totalBookings: 0, completedBookings: 0 });
      })
    );
  }

  /**
   * Mappa una prenotazione utente a UpcomingBooking
   */
  private mapToUpcomingBooking(reservation: UserReservation): UpcomingBooking {
    return {
      id: reservation.referenceNumber,
      palestra: reservation.resourceName,
      data: reservation.formattedDate,
      orario: reservation.formattedTimeRange,
      tipo: reservation.tipo,
      stato: reservation.status,
      startDateTime: reservation.startDateTime,
      endDateTime: reservation.endDateTime,
      canModify: reservation.canModify,
      canCancel: reservation.canCancel,
      color: reservation.color
    };
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
   * Formatta la data per il display
   */
  formatDisplayDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Oggi';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Domani';
    } else {
      return date.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'short'
      });
    }
  }

  /**
   * Formatta l'orario per il display
   */
  formatTimeRange(startDateTime: string, endDateTime: string): string {
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    
    const timeFormatter = new Intl.DateTimeFormat('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `${timeFormatter.format(start)} - ${timeFormatter.format(end)}`;
  }

  /**
   * Metodi di utilità per gestione errori e retry
   */
  
  /**
   * Ricarica tutti i dati della dashboard
   */
  refreshDashboard(): Observable<{
    stats: DashboardStats;
    upcomingBookings: UpcomingBooking[];
    todaySchedule: TodaySchedule;
  }> {
    return this.loadDashboardData();
  }

  /**
   * Carica solo le statistiche
   */
  refreshStats(): Observable<DashboardStats> {
    return this.loadUserStats();
  }

  /**
   * Carica solo le prossime prenotazioni
   */
  refreshUpcomingBookings(): Observable<UpcomingBooking[]> {
    return this.loadUpcomingBookings();
  }
}