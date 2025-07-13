import { Injectable } from '@angular/core';
import { Observable, map, catchError, of, forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environments';
import { StaffMember, OrganigrammaData } from '../models/person.model';

export interface Societa {
  nome: string;
  logo: string;
}

interface StrapiStaffMember {
  id: number;
  documentId: string;
  nome: string;
  ruolo: string;
  livello: number;
  email: string;
  telefono: string;
  descrizione: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  image?: any;
}

interface StrapiResponse<T> {
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

@Injectable({
  providedIn: 'root'
})
export class OrganigrammaStrapiService {
  private readonly apiUrl = environment.strapiUrl || 'http://localhost:1337';
  private readonly apiToken = environment.strapiApiToken;
  
  private defaultSocieta: Societa[] = [
    {
      nome: 'Virtus Taranto',
      logo: 'assets/virtusLogo.png',
    },
    {
      nome: 'Support_o',
      logo: 'assets/support_logo.png',
    },
    {
      nome: 'Polisportiva 74020',
      logo: 'assets/poliLogo.png',
    }
  ];

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (this.apiToken) {
      headers['Authorization'] = `Bearer ${this.apiToken}`;
    }
    
    return headers;
  }

  /**
   * Recupera tutto lo staff - ora usa la collection staff-members
   */
  getStaff(societa: string): Observable<StaffMember[]> {
  // Sintassi alternativa per Strapi v5
  const params = new URLSearchParams();
  params.append('populate[0]', 'image');
  params.append('populate[1]', 'organigramma');
  params.append('filters[organigramma][societa][$eq]', societa);
  
  return this.http.get<StrapiResponse<StrapiStaffMember[]>>(
    `${this.apiUrl}/api/staff-members?${params.toString()}`, 
    {
      headers: this.getHeaders()
    }
  ).pipe(
    map(response => {
      if (!response.data || !Array.isArray(response.data)) {
        return [];
      }
      
      return this.mapStaffMembers(response.data);
    }),
    catchError(error => {
      console.error('Errore nel caricamento staff:', error);
      return of([]);
    })
  );
}

  /**
   * Recupera tutte le società disponibili
   */
  getAllSocieta(): Observable<string[]> {
    return this.http.get<StrapiResponse<any[]>>(`${this.apiUrl}/api/organigrammas`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (!response.data || !Array.isArray(response.data)) {
          return [];
        }
        
        return response.data
          .map(item => item.attributes?.societa || item.societa)
          .filter(societa => societa !== undefined && societa !== null);
      }),
      catchError(error => {
        console.error('Errore nel caricamento società:', error);
        return of([]);
      })
    );
  }

  /**
   * Recupera tutti gli organigrammi
   */
  getAllOrganigrammi(): Observable<OrganigrammaData[]> {
    return forkJoin({
      organigrammi: this.http.get<StrapiResponse<any[]>>(`${this.apiUrl}/api/organigrammas`, {
        headers: this.getHeaders()
      }),
      staff: this.http.get<StrapiResponse<StrapiStaffMember[]>>(`${this.apiUrl}/api/staff-members?populate=image`, {
        headers: this.getHeaders()
      })
    }).pipe(
      map(({ organigrammi, staff }) => {
        if (!organigrammi.data || !Array.isArray(organigrammi.data)) {
          return [];
        }

        const allStaff = staff.data ? this.mapStaffMembers(staff.data) : [];
        
        return organigrammi.data.map(item => ({
          id: item.id,
          documentId: item.documentId,
          societa: item.attributes?.societa || item.societa || '',
          createdAt: item.createdAt || '',
          updatedAt: item.updatedAt || '',
          publishedAt: item.publishedAt || '',
          staff: allStaff // Per ora tutti i membri vanno in tutti gli organigrammi
        }));
      }),
      catchError(error => {
        console.error('Errore nel caricamento organigrammi:', error);
        return of([]);
      })
    );
  }

  /**
   * Recupera tutto lo staff raggruppato per società
   */
  getAllStaffBySocieta(): Observable<{ [key: string]: StaffMember[] }> {
    return forkJoin({
      organigrammi: this.getAllSocieta(),
      staff: this.http.get<StrapiResponse<StrapiStaffMember[]>>(`${this.apiUrl}/api/staff-members?populate=image`, {
        headers: this.getHeaders()
      })
    }).pipe(
      map(({ organigrammi, staff }) => {
        const allStaff = staff.data ? this.mapStaffMembers(staff.data) : [];
        const staffBySocieta: { [key: string]: StaffMember[] } = {};
        
        // Per ora assegniamo tutto lo staff a tutte le società
        organigrammi.forEach(societa => {
          staffBySocieta[societa] = allStaff;
        });
        
        return staffBySocieta;
      }),
      catchError(error => {
        console.error('Errore nel caricamento staff per società:', error);
        return of({});
      })
    );
  }

  /**
   * Recupera un singolo membro dello staff per ID
   */
  getStaffMemberById(id: number): Observable<StaffMember | null> {
    return this.http.get<StrapiResponse<StrapiStaffMember>>(`${this.apiUrl}/api/staff-members/${id}?populate=image`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.data) {
          return this.mapStaffMember(response.data);
        }
        return null;
      }),
      catchError(error => {
        console.error('Errore nel caricamento membro staff:', error);
        return of(null);
      })
    );
  }

  /**
   * Mapping dei membri dello staff
   */
  private mapStaffMembers(strapiStaff: StrapiStaffMember[]): StaffMember[] {
    return strapiStaff.map(member => this.mapStaffMember(member));
  }

  /**
   * Mapping di un singolo membro dello staff
   */
  private mapStaffMember(strapiMember: StrapiStaffMember): StaffMember {
    const staffMember: StaffMember = {
      id: strapiMember.id,
      nome: strapiMember.nome || 'Nome non disponibile',
      ruolo: strapiMember.ruolo || 'Ruolo non disponibile',
      livello: strapiMember.livello || 1,
      foto: '', // Mantenuto per compatibilità
      email: strapiMember.email || '',
      telefono: strapiMember.telefono || '',
      descrizione: strapiMember.descrizione || ''
    };

    // Gestione immagine
    if (strapiMember.image) {
      staffMember.image = strapiMember.image;
      staffMember.imageBase64 = this.buildImageUrls(strapiMember.image);
    }

    return staffMember;
  }

  /**
   * Costruisce URL completo per le immagini
   */
  private buildImageUrls(image: any): string {
    if (!image) return '';
    
    let imageUrl = '';
    
    if (typeof image === 'string') {
      imageUrl = image;
    } else if (image.url) {
      imageUrl = image.url;
    } else if (image.formats?.medium?.url) {
      imageUrl = image.formats.medium.url;
    } else if (image.formats?.small?.url) {
      imageUrl = image.formats.small.url;
    }
    
    if (!imageUrl) return '';
    
    return imageUrl.startsWith('http') ? imageUrl : `${this.apiUrl}${imageUrl}`;
  }

  /**
   * Società predefinite
   */
  getSocieta(): Societa[] {
    return this.defaultSocieta;
  }

  /**
   * Raggruppa staff per livello
   */
  groupStaffByLevel(staff: StaffMember[]): { [key: number]: StaffMember[] } {
    return staff.reduce((acc, member) => {
      const level = member.livello;
      if (!acc[level]) {
        acc[level] = [];
      }
      acc[level].push(member);
      return acc;
    }, {} as { [key: number]: StaffMember[] });
  }

  /**
   * Ricerca staff per nome o ruolo
   */
  searchStaff(query: string, societa?: string): Observable<StaffMember[]> {
    return this.getStaff(societa || '').pipe(
      map(staff => {
        const searchTerm = query.toLowerCase();
        return staff.filter(member => 
          member.nome.toLowerCase().includes(searchTerm) ||
          member.ruolo.toLowerCase().includes(searchTerm)
        );
      })
    );
  }

  /**
   * Verifica se una società esiste
   */
  checkSocietaExists(societa: string): Observable<boolean> {
    return this.getAllSocieta().pipe(
      map(societas => societas.includes(societa)),
      catchError(() => of(false))
    );
  }

  /**
   * Ottiene l'URL dell'immagine per un formato specifico
   */
  getImageUrls(image: any, format: 'thumbnail' | 'small' | 'medium' | 'large' = 'medium'): string {
    if (!image) return 'assets/default-profile.png';
    
    if (image.formats && image.formats[format]) {
      return this.buildImageUrls(image.formats[format]);
    }
    
    return this.buildImageUrls(image);
  }
}