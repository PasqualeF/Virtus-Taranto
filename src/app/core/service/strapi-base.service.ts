import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environments';
// strapi-base.service.ts - AGGIORNA LE INTERFACCE

export interface StrapiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiImageFormat {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  path: string | null;
  width: number;
  height: number;
  size: number;
  sizeInBytes: number;
  url: string;
}

// NUOVA INTERFACCIA per Strapi v5 - l'immagine è un oggetto diretto
export interface StrapiImageV5 {
  id: number;
  documentId: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats?: {
    thumbnail?: StrapiImageFormat;
    small?: StrapiImageFormat;
    medium?: StrapiImageFormat;
    large?: StrapiImageFormat;
  };
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  provider_metadata: any;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class StrapiBaseService {
  protected apiUrl = environment.strapiUrl;
  protected apiToken = environment.strapiApiToken;

  constructor(protected http: HttpClient) {}

  protected getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiToken}`
    });
  }

  protected buildParams(params?: any): HttpParams {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          if (typeof params[key] === 'object') {
            httpParams = httpParams.set(key, JSON.stringify(params[key]));
          } else {
            httpParams = httpParams.set(key, params[key].toString());
          }
        }
      });
    }
    
    return httpParams;
  }

  protected handleError(error: any): Observable<never> {
    console.error('Strapi API Error:', error);
    return throwError(() => error);
  }

  // Helper per costruire URL completo delle immagini
  getImageUrl(imageUrl: string): string {
    if (!imageUrl) return 'assets/images/placeholder.jpg';
    
    // Se l'URL è già completo, restituiscilo così com'è
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    // Altrimenti, aggiungi il base URL di Strapi
    return `${this.apiUrl}${imageUrl}`;
  }

  // Helper per ottenere la migliore qualità di immagine disponibile (Strapi v5)
  getBestImageUrl(strapiImage: StrapiImageV5 | undefined | null): string {
    if (!strapiImage) {
      return 'assets/images/placeholder.jpg';
    }

    const formats = strapiImage.formats;
    const baseUrl = strapiImage.url;

    // Prova a ottenere la migliore qualità disponibile
    if (formats?.large) {
      return this.getImageUrl(formats.large.url);
    } else if (formats?.medium) {
      return this.getImageUrl(formats.medium.url);
    } else if (formats?.small) {
      return this.getImageUrl(formats.small.url);
    } else {
      return this.getImageUrl(baseUrl);
    }
  }
}