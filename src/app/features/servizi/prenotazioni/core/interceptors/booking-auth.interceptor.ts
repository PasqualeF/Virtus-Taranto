// core/interceptors/booking-auth.interceptor.ts
import { Injectable, inject } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent,
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { 
  catchError, 
  switchMap, 
  filter, 
  take,
  finalize 
} from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class BookingAuthInterceptor implements HttpInterceptor {
  private readonly authService = inject(AuthService);
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  // URL che richiedono autenticazione per le prenotazioni
  private readonly AUTH_REQUIRED_ENDPOINTS = [
    '/api/auth/',
    '/api/accounts',
    '/reservations',
    '/api/bookings',
    '/api/prenotazioni'
  ];

  // URL che NON richiedono autenticazione (pubblici)
  private readonly PUBLIC_ENDPOINTS = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/accounts', // Solo per POST (registrazione)
    'api/palestre', // Dati pubblici palestre
    'strapi', // Tutti gli endpoint Strapi
    '/api/news',
    '/api/events',
    '/api/teams'
  ];

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    // Skip per endpoint pubblici
    if (this.isPublicEndpoint(req.url)) {
      return next.handle(req);
    }

    // Skip per richieste che non richiedono auth
    if (!this.requiresAuth(req.url)) {
      return next.handle(req);
    }

    // Aggiungi token se disponibile
    const token = this.authService.getCurrentToken();
    if (token) {
      req = this.addTokenToRequest(req, token);
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Gestisci errori 401 solo se c'è un token e non è un endpoint di auth
        if (error.status === 401 && token && !this.isAuthEndpoint(req.url)) {
          return this.handle401Error(req, next);
        }
        return this.handleHttpError(error);
      })
    );
  }

  /**
   * Aggiunge il token JWT alla richiesta HTTP
   */
  private addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Gestisce errori 401 con refresh automatico del token
   */
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((response) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(response.accessToken);
          
          console.log('✅ Token refreshed, riprovo richiesta originale');
          return next.handle(this.addTokenToRequest(request, response.accessToken));
        }),
        catchError((error) => {
          this.isRefreshing = false;
          
          console.error('❌ Refresh token fallito, effettuo logout:', error);
          // Refresh fallito, effettua logout
          this.authService.logout().subscribe();
          return throwError(() => error);
        }),
        finalize(() => {
          this.isRefreshing = false;
        })
      );
    } else {
      // Se il refresh è già in corso, aspetta che finisca
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => {
          return next.handle(this.addTokenToRequest(request, token!));
        })
      );
    }
  }

  /**
   * Controlla se l'URL è un endpoint pubblico
   */
  private isPublicEndpoint(url: string): boolean {
    return this.PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
  }

  /**
   * Controlla se l'URL richiede autenticazione
   */
  private requiresAuth(url: string): boolean {
    return this.AUTH_REQUIRED_ENDPOINTS.some(endpoint => url.includes(endpoint));
  }

  /**
   * Controlla se l'URL è un endpoint di autenticazione
   */
  private isAuthEndpoint(url: string): boolean {
    const authEndpoints = [
      '/api/auth/login',
      '/api/auth/logout',
      '/api/auth/refresh',
      '/api/auth/validate'
    ];

    return authEndpoints.some(endpoint => url.includes(endpoint));
  }

  /**
   * Gestisce altri errori HTTP
   */
  private handleHttpError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Si è verificato un errore';

    switch (error.status) {
      case 0:
        errorMessage = 'Impossibile connettersi al server. Controlla la connessione internet.';
        break;
      case 400:
        errorMessage = 'Richiesta non valida';
        if (error.error?.message) {
          errorMessage = error.error.message;
        }
        break;
      case 401:
        errorMessage = 'Accesso non autorizzato';
        break;
      case 403:
        errorMessage = 'Accesso negato. Non hai i permessi necessari.';
        break;
      case 404:
        errorMessage = 'Risorsa non trovata';
        break;
      case 409:
        errorMessage = 'Conflitto: la risorsa esiste già';
        if (error.error?.message) {
          errorMessage = error.error.message;
        }
        break;
      case 422:
        errorMessage = 'Dati non validi';
        if (error.error?.message) {
          errorMessage = error.error.message;
        }
        break;
      case 500:
        errorMessage = 'Errore interno del server. Riprova più tardi.';
        break;
      case 503:
        errorMessage = 'Servizio temporaneamente non disponibile.';
        break;
      default:
        if (error.error?.message) {
          errorMessage = error.error.message;
        }
    }

    console.error('❌ BookingAuthInterceptor - Errore HTTP:', {
      status: error.status,
      message: errorMessage,
      url: error.url,
      error: error.error
    });

    return throwError(() => new Error(errorMessage));
  }
}