import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { StrapiBaseService, StrapiResponse, StrapiImageV5 } from './strapi-base.service';

// Interfacce per i Partner da Strapi v5
export interface StrapiPartner {
  id: number;
  documentId: string;
  name: string;
  description: string | null;
  website: string | null;
  category?: string | null;
  highlight?: string | null;
  logo: StrapiImageV5[]; // Array di immagini, non singola immagine
  order?: number;
  isActive: boolean; // Ripristinato isActive
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface StrapiBenefit {
  id: number;
  documentId: string;
  title: string;
  description: string;
  icon: string;
  order?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

// Interfacce per l'uso nel componente (versioni semplificate)
export interface Partner {
  name: string;
  logo: string;
  description: string;
  website: string;
  category?: string;
  highlight?: string;
  order?: number;
}

export interface Benefit {
  title: string;
  description: string;
  icon: string;
  order?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PartnerService extends StrapiBaseService {

  private readonly PARTNERS_ENDPOINT = '/api/partners';
  private readonly BENEFITS_ENDPOINT = '/api/partner-benefits';

  /**
   * Recupera tutti i partner attivi da Strapi
   */
  getPartners(): Observable<Partner[]> {
    const params = {
      'populate': 'logo',
      'filters[isActive][$eq]': true, // Ripristinato isActive
      'sort': 'order:asc,name:asc',
      'pagination[pageSize]': 100
    };

    return this.http.get<StrapiResponse<StrapiPartner[]>>(
      `${this.apiUrl}${this.PARTNERS_ENDPOINT}`,
      {
        headers: this.getHeaders(),
        params: this.buildParams(params)
      }
    ).pipe(
      map(response => this.transformPartnersData(response.data)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Recupera i partner per categoria
   */
  getPartnersByCategory(category: string): Observable<Partner[]> {
    const params = {
      'populate': 'logo',
      'filters[isActive][$eq]': true, // Ripristinato isActive
      'filters[category][$eq]': category,
      'sort': 'order:asc,name:asc',
      'pagination[pageSize]': 100
    };

    return this.http.get<StrapiResponse<StrapiPartner[]>>(
      `${this.apiUrl}${this.PARTNERS_ENDPOINT}`,
      {
        headers: this.getHeaders(),
        params: this.buildParams(params)
      }
    ).pipe(
      map(response => this.transformPartnersData(response.data)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Recupera le categorie disponibili
   */
  
  getCategories(): Observable<string[]> {
    const params = {
      'filters[isActive][$eq]': true,
      'fields': 'category'
    };

    return this.http.get<StrapiResponse<StrapiPartner[]>>(
      `${this.apiUrl}${this.PARTNERS_ENDPOINT}`,
      {
        headers: this.getHeaders(),
        params: this.buildParams(params)
      }
    ).pipe(
      map(response => {
        const categories = response.data
          .map(partner => partner.category)
          .filter((category): category is string => 
            category !== null && 
            category !== undefined && 
            category.trim() !== ''
          )
          .filter((category, index, array) => array.indexOf(category) === index)
          .sort();
        
        return ['Tutti', ...categories];
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Recupera tutti i benefit attivi da Strapi
   */
  getBenefits(): Observable<Benefit[]> {
    const params = {
      'filters[isActive][$eq]': true,
      'sort': 'order:asc,title:asc',
      'pagination[pageSize]': 50
    };

    return this.http.get<StrapiResponse<StrapiBenefit[]>>(
      `${this.apiUrl}${this.BENEFITS_ENDPOINT}`,
      {
        headers: this.getHeaders(),
        params: this.buildParams(params)
      }
    ).pipe(
      map(response => this.transformBenefitsData(response.data)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Invia una richiesta di collaborazione
   */
  submitCollaborationRequest(data: any): Observable<any> {
    const collaborationData = {
      data: {
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        message: data.message,
        stato: 'pending',
        submittedAt: new Date().toISOString()
      }
    };

    return this.http.post<any>(
      `${this.apiUrl}/api/collaboration-requests`,
      collaborationData,
      {
        headers: this.getHeaders()
      }
    ).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Trasforma i dati dei partner da Strapi nel formato utilizzato dal componente
   */
  private transformPartnersData(strapiPartners: StrapiPartner[]): Partner[] {
    return strapiPartners.map(partner => ({
      name: partner.name,
      logo: this.getLogoUrl(partner.logo),
      description: partner.description || '',
      website: partner.website || '',
      category: partner.category || undefined,
      highlight: partner.highlight || undefined,
      order: partner.order
    }));
  }

  /**
   * Estrae l'URL del logo dall'array di immagini
   */
  private getLogoUrl(logoArray: StrapiImageV5[]): string {
    if (!logoArray || logoArray.length === 0) {
      console.warn('Logo array vuoto o non definito');
      return 'assets/images/placeholder.jpg';
    }

    // Prendi la prima immagine dall'array
    const logoImage = logoArray[0];
    const logoUrl = this.getBestImageUrl(logoImage);
    
    console.log('Logo URL generato:', logoUrl);
    return logoUrl;
  }

  /**
   * Trasforma i dati dei benefit da Strapi nel formato utilizzato dal componente
   */
  private transformBenefitsData(strapiBenefits: StrapiBenefit[]): Benefit[] {
    return strapiBenefits.map(benefit => ({
      title: benefit.title,
      description: benefit.description,
      icon: benefit.icon,
      order: benefit.order
    }));
  }
}