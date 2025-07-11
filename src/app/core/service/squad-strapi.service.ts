// src/app/core/service/squad-strapi.service.ts

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { StrapiBaseService, StrapiResponse } from './strapi-base.service';
import { 
  StrapiSquad, 
  StrapiPlayer, 
  StrapiResult, 
  StrapiStanding 
} from '../models/strapi-squad.interfaces';

@Injectable({
  providedIn: 'root'
})
export class SquadStrapiService extends StrapiBaseService {
  private endpoint = '/api/squads';

  constructor(protected override http: HttpClient) {
    super(http);
  }

  /**
   * Ottiene tutte le squadre con le relazioni popolate
   */
  getAllSquads(): Observable<StrapiSquad[]> {
    const params = {
      'populate': '*'  // In Strapi v5, usa populate=* per popolare tutte le relazioni
    };

    return this.http.get<StrapiResponse<StrapiSquad[]>>(
      `${this.apiUrl}${this.endpoint}`,
      { 
        headers: this.getHeaders(),
        params: this.buildParams(params)
      }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Ottiene una singola squadra per nome
   */
  getSquadByName(name: string): Observable<StrapiSquad | null> {
    const params = {
      'populate': '*',
      'filters[name][$eqi]': name // Case insensitive
    };

    return this.http.get<StrapiResponse<StrapiSquad[]>>(
      `${this.apiUrl}${this.endpoint}`,
      { 
        headers: this.getHeaders(),
        params: this.buildParams(params)
      }
    ).pipe(
      map(response => response.data.length > 0 ? response.data[0] : null),
      catchError(this.handleError)
    );
  }

  /**
   * Ottiene una singola squadra per ID
   */
  getSquadById(id: number): Observable<StrapiSquad | null> {
    const params = {
      'populate': '*',
      'filters[id][$eq]': id
    };

    return this.http.get<StrapiResponse<StrapiSquad[]>>(
      `${this.apiUrl}${this.endpoint}`,
      { 
        headers: this.getHeaders(),
        params: this.buildParams(params)
      }
    ).pipe(
      map(response => response.data.length > 0 ? response.data[0] : null),
      catchError(this.handleError)
    );
  }

  /**
   * Ottiene le squadre in formato ridotto (per homepage)
   */
  getAllSquadsSmall(): Observable<StrapiSquad[]> {
    const params = {
       'populate': '*'
    };

    return this.http.get<StrapiResponse<StrapiSquad[]>>(
      `${this.apiUrl}${this.endpoint}`,
      { 
        headers: this.getHeaders(),
        params: this.buildParams(params)
      }
    ).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Ottiene i giocatori di una squadra
   */
  getSquadRoster(squadId: number): Observable<StrapiPlayer[]> {
    const params = {
      'populate[roster]': '*',
      'filters[id][$eq]': squadId
    };

    return this.http.get<StrapiResponse<StrapiSquad[]>>(
      `${this.apiUrl}${this.endpoint}`,
      { 
        headers: this.getHeaders(),
        params: this.buildParams(params)
      }
    ).pipe(
      map(response => response.data[0]?.roster || []),
      catchError(this.handleError)
    );
  }

  /**
   * Ottiene i risultati di una squadra
   */
  getSquadResults(squadId: number): Observable<StrapiResult[]> {
    const params = {
      'populate[results]': '*',
      'filters[id][$eq]': squadId
    };

    return this.http.get<StrapiResponse<StrapiSquad[]>>(
      `${this.apiUrl}${this.endpoint}`,
      { 
        headers: this.getHeaders(),
        params: this.buildParams(params)
      }
    ).pipe(
      map(response => response.data[0]?.results || []),
      catchError(this.handleError)
    );
  }

  /**
   * Ottiene la classifica di una squadra
   */
  getSquadStandings(squadId: number): Observable<StrapiStanding[]> {
    const params = {
      'populate[standings]': '*',
      'filters[id][$eq]': squadId
    };

    return this.http.get<StrapiResponse<StrapiSquad[]>>(
      `${this.apiUrl}${this.endpoint}`,
      { 
        headers: this.getHeaders(),
        params: this.buildParams(params)
      }
    ).pipe(
      map(response => response.data[0]?.standings || []),
      catchError(this.handleError)
    );
  }
}