// comunicazioni-strapi.service.ts
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { StrapiBaseService, StrapiResponse, StrapiImageV5 } from './strapi-base.service';

// Interfacce per il mapping dei dati Strapi
export interface StrapiAutore {
  id: number;
  nome: string;
  ruolo: string;
}

export interface StrapiAllegato extends StrapiImageV5 {
  // Già definito in StrapiImageV5, possiamo estenderlo se necessario
}

export interface StrapiComunicazione {
  id: number;
  documentId: string;
  titolo: string;
  descrizione: string;
  data: string;
  tipo: 'urgente' | 'importante' | 'standard';
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  autore: StrapiAutore;
  allegato: StrapiAllegato[];
}

// Interfaccia per l'uso nel componente (manteniamo compatibilità)
export interface Comunicazione {
  id: number;
  titolo: string;
  contenuto: string;
  data: string;
  tipo: 'urgente' | 'importante' | 'standard';
  autore: string;
  ruoloAutore: string;
  avatar: string;
  allegati?: {
    nome: string;
    tipo: string;
    dimensione: string;
    url: string;
  }[];
  stato: 'nuovo' | 'letto' | 'archiviato';
  destinatari: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ComunicazioniStrapiService extends StrapiBaseService {

  private readonly endpoint = '/api/comunicazionis';

  /**
   * Recupera tutte le comunicazioni da Strapi v5
   */
  getComunicazioni(): Observable<Comunicazione[]> {
    let params = new HttpParams()
      .set('populate', '*')
      .set('sort', 'data:desc');

    return this.http.get<StrapiResponse<StrapiComunicazione[]>>(
      `${this.apiUrl}${this.endpoint}`,
      {
        headers: this.getHeaders(),
        params: params
      }
    ).pipe(
      map(response => this.mapStrapiComunicazioniToLocal(response.data)),
      catchError(this.handleError)
    );
  }

  /**
   * Recupera una singola comunicazione per ID
   */
  getComunicazioneById(id: number): Observable<Comunicazione> {
    let params = new HttpParams()
      .set('populate', '*');

    return this.http.get<StrapiResponse<StrapiComunicazione>>(
      `${this.apiUrl}${this.endpoint}/${id}`,
      {
        headers: this.getHeaders(),
        params: params
      }
    ).pipe(
      map(response => this.mapStrapiComunicazioneToLocal(response.data)),
      catchError(this.handleError)
    );
  }

  /**
   * Filtra le comunicazioni per tipo
   */
  getComunicazioniByTipo(tipo: 'urgente' | 'importante' | 'standard'): Observable<Comunicazione[]> {
    let params = new HttpParams()
      .set('populate', '*')
      .set('filters[tipo][$eq]', tipo)
      .set('sort', 'data:desc');

    return this.http.get<StrapiResponse<StrapiComunicazione[]>>(
      `${this.apiUrl}${this.endpoint}`,
      {
        headers: this.getHeaders(),
        params: params
      }
    ).pipe(
      map(response => this.mapStrapiComunicazioniToLocal(response.data)),
      catchError(this.handleError)
    );
  }

  /**
   * Cerca comunicazioni per titolo o descrizione
   */
  searchComunicazioni(searchTerm: string): Observable<Comunicazione[]> {
    let params = new HttpParams()
      .set('populate', '*')
      .set('filters[$or][0][titolo][$containsi]', searchTerm)
      .set('filters[$or][1][descrizione][$containsi]', searchTerm)
      .set('sort', 'data:desc');

    return this.http.get<StrapiResponse<StrapiComunicazione[]>>(
      `${this.apiUrl}${this.endpoint}`,
      {
        headers: this.getHeaders(),
        params: params
      }
    ).pipe(
      map(response => this.mapStrapiComunicazioniToLocal(response.data)),
      catchError(this.handleError)
    );
  }

  /**
   * Cerca comunicazioni con filtri combinati
   */
  getComunicazioniWithFilters(searchTerm?: string, tipo?: string): Observable<Comunicazione[]> {
    let params = new HttpParams()
      .set('populate', '*')
      .set('sort', 'data:desc');

    // Aggiungi filtro per tipo se specificato
    if (tipo && tipo !== 'tutti') {
      params = params.set('filters[tipo][$eq]', tipo);
    }

    // Aggiungi filtro di ricerca se specificato
    if (searchTerm) {
      params = params
        .set('filters[$or][0][titolo][$containsi]', searchTerm)
        .set('filters[$or][1][descrizione][$containsi]', searchTerm);
    }

    return this.http.get<StrapiResponse<StrapiComunicazione[]>>(
      `${this.apiUrl}${this.endpoint}`,
      {
        headers: this.getHeaders(),
        params: params
      }
    ).pipe(
      map(response => this.mapStrapiComunicazioniToLocal(response.data)),
      catchError(this.handleError)
    );
  }

  /**
   * Mapper da StrapiComunicazione[] a Comunicazione[]
   */
  private mapStrapiComunicazioniToLocal(strapiComunicazioni: StrapiComunicazione[]): Comunicazione[] {
    return strapiComunicazioni.map(com => this.mapStrapiComunicazioneToLocal(com));
  }

  /**
   * Mapper da StrapiComunicazione a Comunicazione
   */
  private mapStrapiComunicazioneToLocal(strapiCom: StrapiComunicazione): Comunicazione {
    return {
      id: strapiCom.id,
      titolo: strapiCom.titolo,
      contenuto: strapiCom.descrizione, // Mappiamo descrizione -> contenuto
      data: strapiCom.data,
      tipo: strapiCom.tipo,
      autore: strapiCom.autore?.nome || 'Autore sconosciuto',
      ruoloAutore: strapiCom.autore?.ruolo || '',
      avatar: this.generateAvatarPlaceholder(strapiCom.autore?.nome || 'U'),
      allegati: this.mapAllegati(strapiCom.allegato),
      stato: 'nuovo', // Stato predefinito, potresti gestirlo diversamente
      destinatari: this.getDestinatariByTipo(strapiCom.tipo) // Logica per determinare i destinatari
    };
  }

  /**
   * Mapper per gli allegati
   */
  private mapAllegati(strapiAllegati: StrapiAllegato[]): { nome: string; tipo: string; dimensione: string; url: string; }[] {
    if (!strapiAllegati || strapiAllegati.length === 0) {
      return [];
    }

    return strapiAllegati.map(allegato => ({
      nome: allegato.name,
      tipo: allegato.ext.replace('.', ''),
      dimensione: this.formatFileSize(allegato.size),
      url: this.getImageUrl(allegato.url)
    }));
  }

  /**
   * Genera un placeholder per l'avatar basato sul nome
   */
  private generateAvatarPlaceholder(nome: string): string {
    // Potresti implementare una logica più sofisticata per generare avatar
    // Per ora restituiamo un placeholder
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=3b82f6&color=fff&size=48`;
  }

  /**
   * Formatta la dimensione del file
   */
  private formatFileSize(sizeInKB: number): string {
    if (sizeInKB < 1024) {
      return `${Math.round(sizeInKB)} KB`;
    } else {
      const sizeInMB = sizeInKB / 1024;
      return `${sizeInMB.toFixed(1)} MB`;
    }
  }

  /**
   * Determina i destinatari basandosi sul tipo di comunicazione
   */
  private getDestinatariByTipo(tipo: string): string[] {
    switch (tipo) {
      case 'urgente':
        return ['Tutti', 'Staff Tecnico', 'Direzione'];
      case 'importante':
        return ['Staff Tecnico', 'Prima Squadra'];
      case 'standard':
        return ['Staff'];
      default:
        return ['Staff'];
    }
  }
}