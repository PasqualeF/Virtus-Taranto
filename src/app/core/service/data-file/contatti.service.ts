// src/app/core/services/data.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Societa } from '../../models/societa.model';

export interface ContattiData {
  titolo: string;
  descrizione: string;
  societa: Societa[];
}



@Injectable({
  providedIn: 'root'
})
export class ContattiService {
  private readonly dataPath = 'assets/data/contatti/';

  constructor(private http: HttpClient) {}

  getContattiData(): Observable<ContattiData> {
    return this.http.get<ContattiData>(`${this.dataPath}contatti.json`).pipe(
      map(data => ({
        ...data,
        societa: data.societa.map(s => ({
          ...s,
          expanded: false
        }))
      })),
      catchError(error => {
        console.error('Errore nel caricamento dei contatti:', error);
        // Restituiamo un oggetto ContattiData vuoto invece di null
        return of({
          titolo: '',
          descrizione: '',
          societa: []
        });
      })
    );
  }
}

export { Societa };
