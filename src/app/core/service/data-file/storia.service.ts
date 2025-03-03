import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Societa } from '../../models/societa.model';

export interface Achievement {
  anno: string;
  titolo: string;
  descrizione: string;
}

export interface StoriaData {
  societa: Societa[];
}

@Injectable({
  providedIn: 'root'
})
export class StoriaService {
  private readonly dataPath = 'assets/data/storia/';

  constructor(private http: HttpClient) {}

  getStoriaData(): Observable<StoriaData> {
    return this.http.get<StoriaData>(`${this.dataPath}storia.json`).pipe(
      catchError(error => {
        console.error('Errore nel caricamento dei dati della storia:', error);
        return of({
          societa: []
        });
      })
    );
  }
}