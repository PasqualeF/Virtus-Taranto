import { Injectable, inject } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent,
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, EMPTY } from 'rxjs';
import { 
  catchError, 
  switchMap, 
  filter, 
  take,
  finalize 
} from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly authService = inject(AuthService);
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    
    // ✅ NUOVO APPROCCIO: Controlla se l'endpoint RICHIEDE autenticazione
    const needsAuth = this.requiresAuthentication(req.url) || this.requiresAuthenticationAdvanced(req.url,req.method);

    
    if (!needsAuth) {
      return next.handle(req);
    }

    // Endpoint protetto: aggiungi token se disponibile
    const token = this.authService.getCurrentToken();
    
    if (token) {
      req = this.addTokenToRequest(req, token);
    } else {
      // Potresti decidere di reindirizzare al login qui
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        
        // Gestisci errori 401 solo per endpoint che richiedono autenticazione
        if (error.status === 401 && needsAuth && token) {
          return this.handle401Error(req, next);
        }
        return this.handleHttpError(error);
      })
    );
  }

  /**
   * ✅ NUOVO: Controlla se l'endpoint RICHIEDE autenticazione (approccio opt-in)
   * Lista solo gli endpoint che necessitano del token JWT
   */
  private requiresAuthentication(url: string): boolean {
    const protectedEndpoints = [
      // ===== ENDPOINTS PRENOTAZIONI =====
      '/reservations',              // Tutte le operazioni prenotazioni
      '/dashboard',                 // Dashboard utente
      
      // ===== ENDPOINTS UTENTE =====
      '/api/auth/me',              // Informazioni utente corrente
      '/api/auth/logout',          // Logout (potrebbe necessitare token per invalidazione)
      '/users/profile',            // Profilo utente
      '/users/preferences',        // Preferenze utente
      
      // ===== ENDPOINTS ADMIN (se esistenti) =====
      '/admin',                    // Qualsiasi endpoint admin
      '/management',               // Gestione
      
      // ===== ALTRI ENDPOINT PROTETTI =====
      '/api/notifications',        // Notifiche utente
      '/api/user-settings',        // Impostazioni utente
      '/api/bookings',            // Alternative booking endpoints
      '/api/calendar',            // Calendario personale
      
      // ===== LIBREBOOKING INTEGRATION =====
      '/api/librebooking',        // Integrazione LibreBooking (se tramite proxy)
    ];

    // Controlla se l'URL corrisponde a qualsiasi endpoint protetto
    return protectedEndpoints.some(endpoint => {
      // Matching esatto o che inizia con l'endpoint
      return url.includes(endpoint);
    });
  }

  /**
   * ALTERNATIVA: Se vuoi un controllo più granulare, puoi usare questa versione
   */
  private requiresAuthenticationAdvanced(url: string, method: string): boolean {
    // Endpoints che richiedono sempre autenticazione
    const alwaysProtected = [''
    ];

    // Endpoints che richiedono autenticazione solo per certi metodi
    const methodSpecificProtected = {
      '/api/accounts': ['PUT', 'PATCH', 'DELETE'], // Solo modifiche, non registrazione (POST)
      '/api/resources': ['POST', 'PUT', 'DELETE'],  // Solo CUD, non lettura (GET)
      '/api/schedules': ['POST', 'PUT', 'DELETE']
    };

    

    // Controlla method-specific protected
    for (const [endpoint, methods] of Object.entries(methodSpecificProtected)) {
      if (url.includes(endpoint) && methods.includes(method)) {
        return true;
      }
    }

    return false;
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
          
          // Riprova la richiesta originale con il nuovo token
          return next.handle(this.addTokenToRequest(request, response.accessToken));
        }),
        catchError((error) => {
          this.isRefreshing = false;
          
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
        errorMessage = 'Accesso non autorizzato. Effettua il login.';
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

  

    return throwError(() => new Error(errorMessage));
  }
}