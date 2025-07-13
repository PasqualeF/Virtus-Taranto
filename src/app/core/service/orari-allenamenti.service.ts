import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { map, catchError, switchMap, tap, retry, timeout } from 'rxjs/operators';
import { 
  AuthenticationRequest, 
  AuthenticationResponse, 
  ReservationResponse, 
  LibreBookingReservation, 
  OrarioAllenamento 
} from '../models/reservation.model';
import { 
  LibreBookingConfig, 
  LIBREBOOKING_DEV_CONFIG, 
  LIBREBOOKING_CONFIG_TOKEN 
} from '../config/librebooking.config';

@Injectable({
  providedIn: 'root'
})
export class OrariAllenamentiService {
  private config: LibreBookingConfig;
  private readonly AUTH_ENDPOINT: string;
  private readonly RESERVATIONS_ENDPOINT: string;

  private authData$ = new BehaviorSubject<AuthenticationResponse | null>(null);
  private lastAuthTime = 0;

  private orariAllenamentiFallback: OrarioAllenamento[] = [
    { gruppo: 'Under 19', giorno: 'Lunedì', orario: '18:00-20:00', palestra: 'Palestra A' },
    { gruppo: 'Under 19', giorno: 'Martedì', orario: '17:00-19:00', palestra: 'Palestra A' },
    { gruppo: 'Under 19', giorno: 'Mercoledì', orario: '18:00-20:00', palestra: 'Palestra A' },
    { gruppo: 'Under 19', giorno: 'Giovedì', orario: '17:00-19:00', palestra: 'Palestra A' },
    { gruppo: 'Under 19', giorno: 'Venerdì', orario: '17:00-19:00', palestra: 'Palestra A' },
    { gruppo: 'Under 17', giorno: 'Lunedì', orario: '14:00-15:00', palestra: 'Palestra B' },
    { gruppo: 'Under 17', giorno: 'Martedì', orario: '17:00-19:00', palestra: 'Palestra B' },
    { gruppo: 'Under 17', giorno: 'Mercoledì', orario: '14:00-15:00', palestra: 'Palestra B' },
    { gruppo: 'Under 17', giorno: 'Giovedì', orario: '14:00-15:00', palestra: 'Palestra B' },
    { gruppo: 'Under 17', giorno: 'Venerdì', orario: '14:00-15:00', palestra: 'Palestra A' },
    { gruppo: 'Minibasket', giorno: 'Lunedì', orario: '15:00-16:00', palestra: 'Palestra A' },
    { gruppo: 'Minibasket', giorno: 'Mercoledì', orario: '15:00-16:00', palestra: 'Palestra A' },
    { gruppo: 'Minibasket', giorno: 'Venerdì', orario: '15:00-16:00', palestra: 'Palestra A' }
  ];

  constructor(
    private http: HttpClient,
    @Optional() @Inject(LIBREBOOKING_CONFIG_TOKEN) config?: LibreBookingConfig
  ) {
    this.config = config || LIBREBOOKING_DEV_CONFIG;
    this.AUTH_ENDPOINT = `${this.config.baseUrl}${this.config.authEndpoint}`;
    this.RESERVATIONS_ENDPOINT = `${this.config.baseUrl}${this.config.reservationsEndpoint}`;
  }

  getOrariAllenamenti(): Observable<OrarioAllenamento[]> {
    return this.getAuthenticatedData().pipe(
      switchMap(authData => this.fetchReservations(authData)),
      map(reservations => this.mapReservationsToOrariAllenamenti(reservations)),
      timeout(30000),
      retry(2),
      catchError(() => of(this.orariAllenamentiFallback))
    );
  }

  private getAuthenticatedData(): Observable<AuthenticationResponse> {
    const now = Date.now();
    const currentAuth = this.authData$.value;
    
    if (currentAuth && 
        currentAuth.isAuthenticated && 
        (now - this.lastAuthTime) < this.config.cache.timeoutMs) {
      return of(currentAuth);
    }

    return this.authenticate().pipe(
      tap(authData => {
        this.authData$.next(authData);
        this.lastAuthTime = now;
      })
    );
  }

  private authenticate(): Observable<AuthenticationResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    const credentials: AuthenticationRequest = {
      username: this.config.credentials.username,
      password: this.config.credentials.password
    };

    return this.http.post<AuthenticationResponse>(
      this.AUTH_ENDPOINT, 
      credentials,
      { headers }
    ).pipe(
      timeout(10000),
      map(response => {
        if (!response.sessionToken || !response.userId) {
          throw new Error('Autenticazione fallita: dati sessione mancanti');
        }
        return {
          ...response,
          isAuthenticated: true
        };
      }),
      catchError(error => this.handleAuthError(error))
    );
  }

  private handleAuthError(error: any): Observable<never> {
    let errorMessage = 'Impossibile autenticarsi con LibreBooking';
    
    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 401:
          errorMessage = 'Credenziali non valide';
          break;
        case 404:
          errorMessage = 'Endpoint di autenticazione non trovato';
          break;
        case 0:
          errorMessage = 'Impossibile raggiungere il server LibreBooking';
          break;
        default:
          errorMessage = `Errore HTTP ${error.status}: ${error.statusText}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

  private fetchReservations(authData: AuthenticationResponse): Observable<LibreBookingReservation[]> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Booked-SessionToken': authData.sessionToken,
      'X-Booked-UserId': authData.userId
    });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + this.config.dateRange.defaultDaysAhead);

    const params = {
      startDateTime: startDate.toISOString(),
      endDateTime: endDate.toISOString()
    };

    return this.http.get<ReservationResponse>(this.RESERVATIONS_ENDPOINT, { 
      headers, 
      params 
    }).pipe(
      timeout(20000),
      map(response => response.reservations || []),
      catchError(error => this.handleReservationsError(error))
    );
  }

  private handleReservationsError(error: any): Observable<never> {
    let errorMessage = 'Errore nel recupero delle prenotazioni';
    
    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 401:
          errorMessage = 'Sessione scaduta, richiesta nuova autenticazione';
          this.authData$.next(null);
          this.lastAuthTime = 0;
          break;
        case 403:
          errorMessage = 'Accesso negato alle prenotazioni';
          break;
        case 404:
          errorMessage = 'Endpoint delle prenotazioni non trovato';
          break;
        case 0:
          errorMessage = 'Connessione persa con il server';
          break;
        default:
          errorMessage = `Errore HTTP ${error.status}: ${error.statusText}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

  private mapReservationsToOrariAllenamenti(reservations: LibreBookingReservation[]): OrarioAllenamento[] {
    const orariAllenamenti: OrarioAllenamento[] = [];
    
    reservations.forEach(reservation => {
      try {
        const orario = this.mapSingleReservation(reservation);
        if (orario) {
          orariAllenamenti.push(orario);
        }
      } catch (error) {
        // Ignora silenziosamente gli errori di mapping
      }
    });
    
    return orariAllenamenti;
  }

  private mapSingleReservation(reservation: LibreBookingReservation): OrarioAllenamento | null {
    try {
      const gruppo = `${reservation.firstName} ${reservation.lastName}`.trim();
      const startDate = new Date(reservation.startDate);
      const giorno = this.getGiornoSettimana(startDate);
      const orario = this.formatOrario(reservation.startDate, reservation.endDate);
      const palestra = reservation.resourceName;

      if (!gruppo || !giorno || !orario || !palestra) {
        return null;
      }

      return {
        gruppo,
        giorno,
        orario,
        palestra,
        referenceNumber: reservation.referenceNumber,
        title: reservation.title,
        description: reservation.description,
        startDate: reservation.startDate,
        endDate: reservation.endDate,
        isRecurring: reservation.isRecurring
      };
    } catch (error) {
      return null;
    }
  }

  private getGiornoSettimana(date: Date): string {
    const giorni = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    return giorni[date.getDay()];
  }

  private formatOrario(startDateStr: string, endDateStr: string): string {
    try {
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      
      const formatTime = (date: Date): string => {
        return date.toLocaleTimeString('it-IT', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      };
      
      return `${formatTime(startDate)}-${formatTime(endDate)}`;
    } catch (error) {
      return 'Orario non disponibile';
    }
  }

  refreshData(): Observable<OrarioAllenamento[]> {
    this.authData$.next(null);
    this.lastAuthTime = 0;
    return this.getOrariAllenamenti();
  }

  getFallbackData(): Observable<OrarioAllenamento[]> {
    return of(this.orariAllenamentiFallback);
  }

  isAuthenticated(): boolean {
    const currentAuth = this.authData$.value;
    const now = Date.now();
    return !!(currentAuth && 
             currentAuth.isAuthenticated && 
             (now - this.lastAuthTime) < this.config.cache.timeoutMs);
  }

  logout(): void {
    this.authData$.next(null);
    this.lastAuthTime = 0;
  }

  getServiceStatus(): {
    isAuthenticated: boolean;
    lastAuthTime: number;
    cacheTimeoutMs: number;
    config: Partial<LibreBookingConfig>;
  } {
    return {
      isAuthenticated: this.isAuthenticated(),
      lastAuthTime: this.lastAuthTime,
      cacheTimeoutMs: this.config.cache.timeoutMs,
      config: {
        baseUrl: this.config.baseUrl,
        dateRange: this.config.dateRange
      }
    };
  }

  testConnection(): Observable<boolean> {
    return this.authenticate().pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}