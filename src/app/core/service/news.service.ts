import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { StrapiBaseService, StrapiResponse, StrapiImageV5 } from './strapi-base.service';

// Interfaccia per i dati raw da Strapi v5 - STRUTTURA CORRETTA
export interface StrapiNewsV5 {
  id: number;
  documentId: string;
  titolo: string;
  descrizione: string;
  contenuto?: string;
  data: string;
  categoria?: string;
  featured?: boolean;
  slug?: string;
  immagine?: StrapiImageV5; // Direttamente un oggetto, non data.attributes
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

// Interfaccia per l'app Angular (semplificata)
export interface News {
  id: number;
  titolo: string;
  descrizione: string;
  contenuto?: string;
  data: string;
  categoria?: string;
  featured?: boolean;
  slug?: string;
  immagine: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NewsService extends StrapiBaseService {

  // Ottieni tutte le news
  getAllNews(params?: {
    sort?: string;
    filters?: any;
    pagination?: { page: number; pageSize: number; };
  }): Observable<News[]> {
    const queryParams = this.buildStrapiParams({
      populate: 'immagine',
      sort: params?.sort || 'data:desc',
      ...params
    });
    
    
    return this.http.get<StrapiResponse<StrapiNewsV5[]>>(
      `${this.apiUrl}/api/newss`,
      { 
        headers: this.getHeaders(),
        params: queryParams
      }
    ).pipe(
      tap(response => {
      }),
      map(response => {
        // Controllo di sicurezza
        if (!response || !response.data || !Array.isArray(response.data)) {
          return [];
        }
        
        return this.mapStrapiNewsToAngular(response.data);
      }),
      catchError(this.handleError)
    );
  }

  // Ottieni news per categoria
  getNewsByCategory(categoria: string): Observable<News[]> {
    return this.getAllNews({
      filters: {
        categoria: { $eq: categoria }
      }
    });
  }

  // Ottieni news in evidenza
  getFeaturedNews(): Observable<News[]> {
    return this.getAllNews({
      filters: {
        featured: { $eq: true }
      },
      pagination: { page: 1, pageSize: 5 }
    });
  }

  // Ottieni singola news per ID
  getNewsById(id: number): Observable<News> {
    return this.http.get<StrapiResponse<StrapiNewsV5>>(
      `${this.apiUrl}/api/newss/${id}`,
      { 
        headers: this.getHeaders(),
        params: this.buildStrapiParams({ populate: 'immagine' })
      }
    ).pipe(
      map(response => {
        if (!response || !response.data) {
          throw new Error('News not found');
        }
        return this.mapSingleStrapiNewsToAngular(response.data);
      }),
      catchError(this.handleError)
    );
  }

  // Ottieni news per slug
  getNewsBySlug(slug: string): Observable<News> {
    return this.http.get<StrapiResponse<StrapiNewsV5[]>>(
      `${this.apiUrl}/api/newss`,
      { 
        headers: this.getHeaders(),
        params: this.buildStrapiParams({ 
          populate: 'immagine',
          filters: { slug: { $eq: slug } }
        })
      }
    ).pipe(
      map(response => {
        if (response.data && response.data.length > 0) {
          return this.mapSingleStrapiNewsToAngular(response.data[0]);
        }
        throw new Error('News not found');
      }),
      catchError(this.handleError)
    );
  }

  // Ottieni tutte le categorie disponibili
  getCategories(): Observable<string[]> {
    return this.getAllNews().pipe(
      map(news => {
        const categories = news
          .map(item => item.categoria)
          .filter(cat => cat && cat.trim() !== '');
        return Array.from(new Set(categories)) as string[];
      })
    );
  }

  // Ricerca news
  searchNews(query: string): Observable<News[]> {
    return this.getAllNews({
      filters: {
        $or: [
          { titolo: { $containsi: query } },
          { descrizione: { $containsi: query } },
          { contenuto: { $containsi: query } }
        ]
      }
    });
  }

  // Mapping da Strapi v5 a Angular (array)
  private mapStrapiNewsToAngular(strapiNews: StrapiNewsV5[]): News[] {
    return strapiNews
      .filter(item => item && item.titolo) // Filtra elementi non validi
      .map(item => this.mapSingleStrapiNewsToAngular(item));
  }

  // Mapping da Strapi v5 a Angular (singola news)
  private mapSingleStrapiNewsToAngular(strapiNews: StrapiNewsV5): News {
    
    // Controllo di sicurezza
    if (!strapiNews || !strapiNews.titolo || !strapiNews.descrizione) {
      console.error('Struttura news v5 non valida:', strapiNews);
      throw new Error('Struttura dati news non valida');
    }
    
    return {
      id: strapiNews.id,
      titolo: strapiNews.titolo,
      descrizione: strapiNews.descrizione,
      contenuto: strapiNews.contenuto || strapiNews.descrizione, // Fallback
      data: strapiNews.data || strapiNews.createdAt, // Fallback
      categoria: strapiNews.categoria,
      featured: strapiNews.featured || false,
      slug: strapiNews.slug,
      // AGGIORNATO per Strapi v5: immagine è direttamente un oggetto
      immagine: strapiNews.immagine ? this.getBestImageUrl(strapiNews.immagine) : 'assets/images/placeholder.jpg',
      createdAt: strapiNews.createdAt,
      updatedAt: strapiNews.updatedAt
    };
  }

  // Helper per costruire parametri Strapi
  private buildStrapiParams(params?: any): any {
    if (!params) return {};

    const strapiParams: any = {};

    // Populate
    if (params.populate) {
      strapiParams['populate'] = params.populate;
    }

    // Sort
    if (params.sort) {
      strapiParams['sort'] = params.sort;
    }

    // Filters
    if (params.filters) {
      this.buildFilterParams(params.filters, strapiParams, 'filters');
    }

    // Pagination
    if (params.pagination) {
      strapiParams['pagination[page]'] = params.pagination.page;
      strapiParams['pagination[pageSize]'] = params.pagination.pageSize;
    }

    return strapiParams;
  }

  // Helper ricorsivo per costruire filtri Strapi
  private buildFilterParams(filters: any, params: any, prefix: string): void {
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      const paramKey = `${prefix}[${key}]`;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Se è un oggetto, ricorri
        this.buildFilterParams(value, params, paramKey);
      } else {
        // Se è un valore primitivo, aggiungilo
        params[paramKey] = value;
      }
    });
  }
}