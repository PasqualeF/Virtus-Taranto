// eventi.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { StrapiBaseService, StrapiResponse } from './strapi-base.service';
import { Evento, EventoCategoria, EventoIscrizione, EventoFormData, EventoFilters } from 'src/app/core/models/eventi.interfaces';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class EventiService extends StrapiBaseService {

  // Endpoint corretti per Strapi v5
  private readonly EVENTI_ENDPOINT = '/api/eventi';
  private readonly CATEGORIE_ENDPOINT = '/api/categoria-eventos';
  private readonly ISCRIZIONI_ENDPOINT = '/api/iscrizione-eventos';

  // Ottieni tutti gli eventi con filtri
  getEventi(filters?: EventoFilters): Observable<Evento[]> {
    const strapiFilters = this.buildEventFilters(filters);
    
    // Parametri semplificati per Strapi v5
    let httpParams = new HttpParams();
    
    // Populate
    httpParams = httpParams.set('populate[categoria]', 'true');
    httpParams = httpParams.set('populate[immagine]', 'true');
    httpParams = httpParams.set('populate[programma]', 'true');
    httpParams = httpParams.set('populate[iscrizioni]', 'true');
    
    // Sort
    httpParams = httpParams.set('sort[0]', 'dataInizio:asc');
    
    // Filters (solo se presenti)
    if (Object.keys(strapiFilters).length > 0) {
      Object.keys(strapiFilters).forEach(key => {
        const filterValue = strapiFilters[key];
        if (typeof filterValue === 'object') {
          Object.keys(filterValue).forEach(operator => {
            httpParams = httpParams.set(`filters[${key}][${operator}]`, filterValue[operator]);
          });
        } else {
          httpParams = httpParams.set(`filters[${key}]`, filterValue);
        }
      });
    }

    return this.http.get<StrapiResponse<Evento[]>>(
      `${this.apiUrl}${this.EVENTI_ENDPOINT}`,
      {
        headers: this.getHeaders(),
        params: httpParams
      }
    ).pipe(
      map(response => response.data.map(evento => this.transformEvento(evento))),
      catchError(this.handleError)
    );
  }

  // Ottieni evento singolo per ID
  getEvento(documentId: string): Observable<Evento> {
    let httpParams = new HttpParams();
    
    // Populate per singolo evento
    httpParams = httpParams.set('populate[categoria]', 'true');
    httpParams = httpParams.set('populate[immagine]', 'true');
    httpParams = httpParams.set('populate[programma]', 'true');
    httpParams = httpParams.set('populate[iscrizioneEventos]', 'true');

    return this.http.get<StrapiResponse<Evento>>(
      `${this.apiUrl}${this.EVENTI_ENDPOINT}/${documentId}`,
      {
        headers: this.getHeaders(),
        params: httpParams
      }
    ).pipe(
      map(response => this.transformEvento(response.data)),
      catchError(this.handleError)
    );
  }

  // Ottieni tutte le categorie
  getCategorie(): Observable<EventoCategoria[]> {
    let httpParams = new HttpParams();
    httpParams = httpParams.set('sort[0]', 'nome:asc');

    return this.http.get<StrapiResponse<EventoCategoria[]>>(
      `${this.apiUrl}${this.CATEGORIE_ENDPOINT}`,
      {
        headers: this.getHeaders(),
        params: httpParams
      }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  // Iscrivi utente ad evento
  iscriviAdEvento(eventoDocumentId: string, formData: EventoFormData): Observable<EventoIscrizione> {
    const payload = {
      data: {
        ...formData,
        evento: eventoDocumentId,
        dataIscrizione: new Date().toISOString(),
        confermata: true
      }
    };

    return this.http.post<StrapiResponse<EventoIscrizione>>(
      `${this.apiUrl}${this.ISCRIZIONI_ENDPOINT}`,
      payload,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  // Ottieni iscrizioni per evento
  getIscrizioniEvento(eventoDocumentId: string): Observable<EventoIscrizione[]> {
    const queryParams = {
      filters: {
        evento: {
          documentId: {
            $eq: eventoDocumentId
          }
        }
      },
      populate: ['evento'],
      sort: ['dataIscrizione:desc']
    };

    return this.http.get<StrapiResponse<EventoIscrizione[]>>(
      `${this.apiUrl}${this.ISCRIZIONI_ENDPOINT}`,
      {
        headers: this.getHeaders(),
        params: this.buildParams(queryParams)
      }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  // Verifica se un evento è pieno
  isEventoPieno(evento: Evento): boolean {
    if (!evento.richiedeIscrizione || !evento.postiDisponibili) {
      return false;
    }
    return (evento.postiOccupati || 0) >= evento.postiDisponibili;
  }

  // Calcola posti disponibili
  getPostiDisponibili(evento: Evento): number {
    if (!evento.richiedeIscrizione || !evento.postiDisponibili) {
      return 0;
    }
    return evento.postiDisponibili - (evento.postiOccupati || 0);
  }

  // Verifica se un evento è passato
  isEventoPassato(evento: Evento): boolean {
    return new Date(evento.dataInizio) < new Date();
  }

  // Verifica se un evento è oggi
  isEventoOggi(evento: Evento): boolean {
    const oggi = new Date();
    const dataEvento = new Date(evento.dataInizio);
    return oggi.toDateString() === dataEvento.toDateString();
  }

 
  private transformEvento(evento: any): Evento {
    return {
      ...evento,
      // Aggiusta il nome della proprietà per le iscrizioni
      postiOccupati: evento.iscrizioneEventos?.length || 0,
      iscrizioni: evento.iscrizioneEventos || [] // Mantieni compatibilità con l'interfaccia
    };
  }

  private buildEventFilters(filters?: EventoFilters): any {
    if (!filters) return {};

    const strapiFilters: any = {};

    if (filters.categoria) {
      strapiFilters.categoria = {
        documentId: {
          $eq: filters.categoria
        }
      };
    }

    if (filters.stato) {
      strapiFilters.stato = {
        $eq: filters.stato
      };
    }

    if (filters.dataInizio) {
      strapiFilters.dataInizio = {
        $gte: filters.dataInizio
      };
    }

    if (filters.dataFine) {
      strapiFilters.dataInizio = {
        ...strapiFilters.dataInizio,
        $lte: filters.dataFine
      };
    }

    if (filters.richiedeIscrizione !== undefined) {
      strapiFilters.richiedeIscrizione = {
        $eq: filters.richiedeIscrizione
      };
    }

    if (filters.postiDisponibili) {
      strapiFilters.postiDisponibili = {
        $gt: 0
      };
    }

    return strapiFilters;
  }
}