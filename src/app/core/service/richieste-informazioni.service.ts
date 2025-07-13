import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environments';
import { RichiestaInformazioni, RichiestaInformazioniCreate } from '../models/richiesta-informazioni.model';

@Injectable({
  providedIn: 'root'
})
export class RichiesteInformazioniService {
  private apiUrl = environment.strapiUrl;

  constructor(private http: HttpClient) {}

  createRichiesta(richiesta: RichiestaInformazioniCreate): Observable<RichiestaInformazioni> {
    console.log('🚀 STRAPI V5 - Invio richiesta...');
    
    // ENDPOINT CORRETTO basato sui tuoi API ID
    const correctEndpoint = 'richieste-informazionis'; // Il tuo Plural API ID
    const url = `${this.apiUrl}/api/${correctEndpoint}`;
    
    // STRAPI V5 - Payload con wrapper data
    const payload = {
      data: {
        nome: richiesta.nome,
        email: richiesta.email,
        telefono: richiesta.telefono || '',
        societa: richiesta.societa,
        messaggio: richiesta.messaggio,
        elaborata: false
      }
    };


    // Headers senza autenticazione
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    return this.http.post<any>(url, payload, { headers }).pipe(
      map(response => {
        return response.data || response;
      }),
      catchError(error => {
        console.error('❌ Errore con endpoint corretto:', {
          url: url,
          status: error.status,
          statusText: error.statusText,
          message: error.error?.error?.message || error.message,
          details: error.error
        });

        // Se fallisce, prova anche con il fallback degli altri endpoint
        console.log('🔄 Provo endpoint di fallback...');
        return this.tryFallbackEndpoints(payload, headers);
      })
    );
  }

  private tryFallbackEndpoints(payload: any, headers: any): Observable<RichiestaInformazioni> {
    const fallbackEndpoints = [
      'richieste-informazioni', // Il tuo Singular API ID
      'richiesta-informazioni', 
      'richieste-informazione',
      'information-requests'
    ];

    return this.tryEndpoints(fallbackEndpoints, payload, headers, 0);
  }

  private tryEndpoints(endpoints: string[], payload: any, headers: any, index: number): Observable<RichiestaInformazioni> {
    if (index >= endpoints.length) {
      return throwError(() => new Error('Nessun endpoint funzionante trovato'));
    }

    const endpoint = endpoints[index];
    const url = `${this.apiUrl}/api/${endpoint}`;
    

    return this.http.post<any>(url, payload, { headers }).pipe(
      map(response => {
        
        // Salva l'endpoint che funziona per i prossimi usi
        localStorage.setItem('strapi_working_endpoint', endpoint);
        
        // Restituisci i dati (potrebbe essere response.data o response direttamente)
        return response.data || response;
      }),
      catchError(error => {
        console.log(`❌ Endpoint "${endpoint}" fallito:`, {
          status: error.status,
          message: error.error?.error?.message || error.message,
          details: error.error
        });

        // Prova il prossimo endpoint
        return this.tryEndpoints(endpoints, payload, headers, index + 1);
      })
    );
  }

  // Metodo semplificato per i prossimi usi
  createRichiestaFast(richiesta: RichiestaInformazioniCreate): Observable<RichiestaInformazioni> {
    // USA DIRETTAMENTE L'ENDPOINT CORRETTO
    const correctEndpoint = 'richieste-informazionis'; // Il tuo Plural API ID
    const url = `${this.apiUrl}/api/${correctEndpoint}`;
    
    const payload = {
      data: {
        nome: richiesta.nome,
        email: richiesta.email,
        telefono: richiesta.telefono || '',
        societa: richiesta.societa,
        messaggio: richiesta.messaggio,
        elaborata: false
      }
    };


    return this.http.post<any>(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }).pipe(
      map(response => {

        return response.data || response;
      }),
      catchError(error => {
        return this.createRichiesta(richiesta);
      })
    );
  }

  // Metodo per debug - mostra tutti i content types disponibili
  debugContentTypes(): Observable<any> {
    const url = `${this.apiUrl}/api`;
    return this.http.get(url).pipe(
      map(response => {
        return response;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
}