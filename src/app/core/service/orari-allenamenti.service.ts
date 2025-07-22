import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, retry, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environments';
import { OrarioAllenamento } from '../models/reservation.model';

// Interfaccia per la risposta del backend
interface BackendResponse {
  success: boolean;
  message: string | null;
  data: OrarioAllenamento[];
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrariAllenamentiService {
  private readonly API_ENDPOINT = `${environment.backendUrl}/orari-allenamenti`;
  
  // Dati di fallback per quando il backend non è disponibile
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

  private lastFetchTime = 0;
  private cachedData: OrarioAllenamento[] = [];
  private readonly CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minuti

  constructor(private http: HttpClient) {}

  getOrariAllenamenti(): Observable<OrarioAllenamento[]> {
    const now = Date.now();
    if (this.cachedData.length > 0 && (now - this.lastFetchTime) < this.CACHE_TIMEOUT) {
      return of(this.cachedData);
    }

    return this.http.get<BackendResponse>(this.API_ENDPOINT).pipe(
      timeout(15000),
      retry(2),
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Errore dal backend');
        }
        
        this.cachedData = response.data;
        this.lastFetchTime = now;
        
        return response.data;
      }),
      catchError(error => {
        if (this.cachedData.length > 0) {
          return of(this.cachedData);
        }
        
        return of(this.orariAllenamentiFallback);
      })
    );
  }

  refreshData(): Observable<OrarioAllenamento[]> {
    this.cachedData = [];
    this.lastFetchTime = 0;
    return this.getOrariAllenamenti();
  }

  getFallbackData(): Observable<OrarioAllenamento[]> {
    return of(this.orariAllenamentiFallback);
  }

  isAuthenticated(): boolean {
    const now = Date.now();
    return this.cachedData.length > 0 && (now - this.lastFetchTime) < this.CACHE_TIMEOUT;
  }

  logout(): void {
    this.cachedData = [];
    this.lastFetchTime = 0;
  }

  getServiceStatus(): {
    isAuthenticated: boolean;
    lastFetchTime: number;
    cacheTimeoutMs: number;
    cachedItemsCount: number;
    config: {
      baseUrl: string;
      cacheTimeout: number;
    };
  } {
    return {
      isAuthenticated: this.isAuthenticated(),
      lastFetchTime: this.lastFetchTime,
      cacheTimeoutMs: this.CACHE_TIMEOUT,
      cachedItemsCount: this.cachedData.length,
      config: {
        baseUrl: this.API_ENDPOINT,
        cacheTimeout: this.CACHE_TIMEOUT
      }
    };
  }
}