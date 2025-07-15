// palestre.service.ts
import { Injectable } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { StrapiBaseService, StrapiResponse, StrapiImageV5 } from './strapi-base.service';

// Interfaccia per i dati grezzi da Strapi
export interface StrapiPalestra {
  id: number;
  documentId: string;
  nome: string;
  descrizione: string;
  indirizzo: string;
  lat: number;
  lng: number;
  immagine?: StrapiImageV5;
  servizi?: string[]; // JSON array
  prenotabile: boolean;
  slug: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

// Interfaccia per l'applicazione (semplificata)
export interface Palestra {
  id: number;
  documentId: string;
  nome: string;
  descrizione: string;
  indirizzo: string;
  lat: number;
  lng: number;
  immagine: string; // URL completo dell'immagine
  servizi: string[];
  prenotabile: boolean;
  slug: string;
}

@Injectable({
  providedIn: 'root'
})
export class PalestreService extends StrapiBaseService {

  private readonly DEFAULT_IMAGE = 'assets/palestre/archimede_1.jpg';

  /**
   * Recupera tutte le palestre pubblicate
   * @param limit Numero massimo di palestre da recuperare (default: 50)
   * @returns Observable<Palestra[]>
   */
  getAllPalestre(limit: number = 50): Observable<Palestra[]> {
    

    const params = {
      'sort': 'nome:asc',
      'pagination[limit]': limit,
      'populate': 'immagine',
      'filters[publishedAt][$notNull]': true // Solo palestre pubblicate
    };

    return this.http.get<StrapiResponse<StrapiPalestra[]>>(
      `${this.apiUrl}/api/palestre`, // Nota: plurale inglese per Strapi
      {
        headers: this.getHeaders(),
        params: this.buildParams(params)
      }
    ).pipe(
      map(response => {
        return this.mapStrapiPalestreToAppPalestre(response.data);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Recupera una singola palestra per ID
   * @param documentId ID del documento Strapi
   * @returns Observable<Palestra>
   */
  getPalestraById(documentId: string): Observable<Palestra> {

    const params = {
      'populate': 'immagine'
    };

    return this.http.get<StrapiResponse<StrapiPalestra>>(
      `${this.apiUrl}/api/palestre/${documentId}`,
      {
        headers: this.getHeaders(),
        params: this.buildParams(params)
      }
    ).pipe(
      map(response => {
        return this.mapStrapiPalestraToAppPalestra(response.data);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Recupera una palestra per slug
   * @param slug Slug della palestra
   * @returns Observable<Palestra>
   */
  getPalestraBySlug(slug: string): Observable<Palestra> {

    const params = {
      'filters[slug][$eq]': slug,
      'populate': 'immagine'
    };

    return this.http.get<StrapiResponse<StrapiPalestra[]>>(
      `${this.apiUrl}/api/palestre`,
      {
        headers: this.getHeaders(),
        params: this.buildParams(params)
      }
    ).pipe(
      map(response => {
        if (response.data.length === 0) {
          throw new Error(`Palestra con slug '${slug}' non trovata`);
        }
        return this.mapStrapiPalestraToAppPalestra(response.data[0]);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Recupera solo le palestre prenotabili
   * @param limit Numero massimo di palestre (default: 20)
   * @returns Observable<Palestra[]>
   */
  getPalestrePrenotabili(limit: number = 20): Observable<Palestra[]> {
    const params = {
      'filters[prenotabile][$eq]': true,
      'filters[publishedAt][$notNull]': true,
      'sort': 'nome:asc',
      'pagination[limit]': limit,
      'populate': 'immagine'
    };

    return this.http.get<StrapiResponse<StrapiPalestra[]>>(
      `${this.apiUrl}/api/palestre`,
      {
        headers: this.getHeaders(),
        params: this.buildParams(params)
      }
    ).pipe(
      map(response => {
        return this.mapStrapiPalestreToAppPalestre(response.data);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Cerca palestre per nome o indirizzo
   * @param searchTerm Termine di ricerca
   * @param limit Numero massimo di risultati (default: 10)
   * @returns Observable<Palestra[]>
   */
  searchPalestre(searchTerm: string, limit: number = 10): Observable<Palestra[]> {

    const params = {
      'filters[$or][0][nome][$containsi]': searchTerm,
      'filters[$or][1][indirizzo][$containsi]': searchTerm,
      'filters[publishedAt][$notNull]': true,
      'sort': 'nome:asc',
      'pagination[limit]': limit,
      'populate': 'immagine'
    };

    return this.http.get<StrapiResponse<StrapiPalestra[]>>(
      `${this.apiUrl}/api/palestre`,
      {
        headers: this.getHeaders(),
        params: this.buildParams(params)
      }
    ).pipe(
      map(response => {
        return this.mapStrapiPalestreToAppPalestre(response.data);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Recupera palestre con paginazione
   * @param page Pagina corrente (default: 1)
   * @param pageSize Dimensione pagina (default: 12)
   * @returns Observable con palestre e metadati di paginazione
   */
  getPalestrePaginated(page: number = 1, pageSize: number = 12): Observable<{
    palestre: Palestra[];
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  }> {

    const params = {
      'sort': 'nome:asc',
      'pagination[page]': page,
      'pagination[pageSize]': pageSize,
      'pagination[withCount]': true,
      'populate': 'immagine',
      'filters[publishedAt][$notNull]': true
    };

    return this.http.get<StrapiResponse<StrapiPalestra[]> & { 
      meta: { pagination: any } 
    }>(
      `${this.apiUrl}/api/palestre`,
      {
        headers: this.getHeaders(),
        params: this.buildParams(params)
      }
    ).pipe(
      map(response => {
        const palestre = this.mapStrapiPalestreToAppPalestre(response.data);
        const pagination = response.meta?.pagination || {
          page: 1,
          pageSize: palestre.length,
          pageCount: 1,
          total: palestre.length
        };


        return {
          palestre,
          pagination
        };
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Mappa un array di palestre da Strapi al formato dell'applicazione
   * @param strapiPalestre Array di palestre da Strapi
   * @returns Palestra[] Array di palestre nel formato dell'applicazione
   */
  private mapStrapiPalestreToAppPalestre(strapiPalestre: StrapiPalestra[]): Palestra[] {
    return strapiPalestre.map(palestra => this.mapStrapiPalestraToAppPalestra(palestra));
  }

  /**
   * Mappa una singola palestra da Strapi al formato dell'applicazione
   * @param strapiPalestra Palestra da Strapi
   * @returns Palestra Palestra nel formato dell'applicazione
   */
  private mapStrapiPalestraToAppPalestra(strapiPalestra: StrapiPalestra): Palestra {
    // Gestione immagine con fallback
    let immagineUrl = this.DEFAULT_IMAGE;
    
    if (strapiPalestra.immagine) {
      immagineUrl = this.getBestImageUrl(strapiPalestra.immagine);
    }

    // Gestione servizi con validazione
    let servizi: string[] = [];
    if (strapiPalestra.servizi && Array.isArray(strapiPalestra.servizi)) {
      servizi = strapiPalestra.servizi.filter(servizio => 
        servizio && typeof servizio === 'string' && servizio.trim().length > 0
      );
    }

    // Validazione coordinate
    const lat = this.validateCoordinate(strapiPalestra.lat, 'latitudine');
    const lng = this.validateCoordinate(strapiPalestra.lng, 'longitudine');

    const palestra: Palestra = {
      id: strapiPalestra.id,
      documentId: strapiPalestra.documentId,
      nome: strapiPalestra.nome || 'Nome non disponibile',
      descrizione: strapiPalestra.descrizione || 'Descrizione non disponibile',
      indirizzo: strapiPalestra.indirizzo || 'Indirizzo non disponibile',
      lat,
      lng,
      immagine: immagineUrl,
      servizi,
      prenotabile: Boolean(strapiPalestra.prenotabile),
      slug: strapiPalestra.slug || `palestra-${strapiPalestra.id}`
    };

    
    return palestra;
  }

  /**
   * Valida una coordinata geografica
   * @param coordinate Coordinata da validare
   * @param tipo Tipo di coordinata per logging
   * @returns number Coordinata validata
   */
  private validateCoordinate(coordinate: number, tipo: string): number {
    if (typeof coordinate !== 'number' || isNaN(coordinate)) {
      console.warn(`⚠️ ${tipo} non valida: ${coordinate}, uso valore di default`);
      // Coordinate di default per Taranto
      return tipo === 'latitudine' ? 40.4686 : 17.2403;
    }

    // Validazione range coordinate italiane approssimativi
    if (tipo === 'latitudine' && (coordinate < 35 || coordinate > 47)) {
      console.warn(`⚠️ ${tipo} fuori range Italia: ${coordinate}`);
      return 40.4686; // Taranto
    }

    if (tipo === 'longitudine' && (coordinate < 6 || coordinate > 19)) {
      console.warn(`⚠️ ${tipo} fuori range Italia: ${coordinate}`);
      return 17.2403; // Taranto
    }

    return coordinate;
  }

  /**
   * Ottieni statistiche sulle palestre
   * @returns Observable<{totali: number, prenotabili: number, servizi: string[]}>
   */
  getPalestreStats(): Observable<{
    totali: number;
    prenotabili: number;
    serviziDisponibili: string[];
  }> {
    return this.getAllPalestre(100).pipe(
      map(palestre => {
        const totali = palestre.length;
        const prenotabili = palestre.filter(p => p.prenotabile).length;
        
        // Estrai tutti i servizi unici
        const tuttiServizi = new Set<string>();
        palestre.forEach(palestra => {
          palestra.servizi.forEach(servizio => tuttiServizi.add(servizio));
        });
        
        const serviziDisponibili = Array.from(tuttiServizi).sort();


        return {
          totali,
          prenotabili,
          serviziDisponibili
        };
      })
    );
  }

  /**
   * Verifica se una palestra è prenotabile
   * @param documentId ID della palestra
   * @returns Observable<boolean>
   */
  isPalestraPrenotabile(documentId: string): Observable<boolean> {
    return this.getPalestraById(documentId).pipe(
      map(palestra => palestra.prenotabile),
      catchError(error => {
        console.error(`❌ Errore verifica prenotabilità palestra ${documentId}:`, error);
        return [false]; // Default: non prenotabile
      })
    );
  }

  /**
   * Utility per calcolare la distanza tra due punti geografici
   * @param lat1 Latitudine punto 1
   * @param lng1 Longitudine punto 1
   * @param lat2 Latitudine punto 2  
   * @param lng2 Longitudine punto 2
   * @returns number Distanza in km
   */
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Raggio della Terra in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distanza in km
  }

  /**
   * Converte gradi in radianti
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  /**
   * Trova palestre nelle vicinanze di una coordinata
   * @param lat Latitudine centro ricerca
   * @param lng Longitudine centro ricerca
   * @param maxDistance Distanza massima in km (default: 10)
   * @returns Observable<Palestra[]> Palestre ordinate per distanza
   */
  getPalestreNearby(lat: number, lng: number, maxDistance: number = 10): Observable<Palestra[]> {
    return this.getAllPalestre().pipe(
      map(palestre => {
        // Calcola distanza e filtra
        const palestreConDistanza = palestre.map(palestra => ({
          ...palestra,
          distanza: this.calculateDistance(lat, lng, palestra.lat, palestra.lng)
        })).filter(p => p.distanza <= maxDistance);

        // Ordina per distanza
        palestreConDistanza.sort((a, b) => a.distanza - b.distanza);


        // Rimuovi il campo distanza dal risultato
        return palestreConDistanza.map(p => {
          const { distanza, ...palestraSenzaDistanza } = p;
          return palestraSenzaDistanza;
        });
      })
    );
  }
}