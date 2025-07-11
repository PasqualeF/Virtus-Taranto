import { Injectable } from '@angular/core';
import { Observable, map, catchError, of, switchMap } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environments';
import { StaffMember, OrganigrammaData } from '../models/person.model';

export interface Societa {
  nome: string;
  logo: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrganigrammaStrapiDebugService {
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
   * Test di base - verifica connessione Strapi
   */
  testConnection(): Observable<any> {
    console.log('=== TEST CONNESSIONE STRAPI ===');
    return this.http.get(`${this.apiUrl}/api/organigrammas`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Test connessione Strapi riuscito:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Test connessione Strapi fallito:', error);
        return of({ error: error.message });
      })
    );
  }

  /**
   * Debug della struttura Strapi (metodo pubblico)
   */
  debugStrapiStructure(): Observable<any> {
    console.log('=== DEBUG STRUTTURA STRAPI ===');
    
    // Step 1: Solo organigrammi base
    return this.http.get(`${this.apiUrl}/api/organigrammas`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        console.log('📋 ORGANIGRAMMI BASE:', JSON.stringify(response, null, 2));
        return response;
      }),
      catchError(error => {
        console.error('❌ Errore nel recupero organigrammi base:', error);
        return of({ error: error.message });
      })
    );
  }

  /**
   * Test con populate semplice (metodo pubblico)
   */
  testPopulate(): Observable<any> {
    console.log('=== TEST POPULATE ===');
    
    return this.http.get(`${this.apiUrl}/api/organigrammas?populate=*`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        console.log('📋 ORGANIGRAMMI CON POPULATE=*:', JSON.stringify(response, null, 2));
        return response;
      }),
      catchError(error => {
        console.error('❌ Errore con populate=*:', error);
        return of({ error: error.message });
      })
    );
  }

  /**
   * Recupera organigrammi con step progressivi
   */
  getStaff(societa: string): Observable<StaffMember[]> {
    console.log(`\n=== CARICAMENTO STAFF PER: ${societa} ===`);
    
    // Step 1: Prima prova senza populate
    return this.http.get<any>(`${this.apiUrl}/api/organigrammas`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        console.log('🔍 STEP 1 - Risposta base:', response);
        
        if (!response.data || !Array.isArray(response.data)) {
          console.log('❌ Nessun data o data non è array');
          return [];
        }

        console.log(`📊 Trovati ${response.data.length} organigrammi`);
        
        // Mostra tutti gli organigrammi disponibili
        response.data.forEach((item: any, index: number) => {
          const societaItem = item.attributes?.societa || item.societa;
          console.log(`📋 Organigramma ${index + 1}: "${societaItem}"`);
          console.log(`   ID: ${item.id}`);
          console.log(`   DocumentID: ${item.documentId}`);
          console.log(`   Attributes:`, item.attributes);
        });

        // Trova l'organigramma per la società specifica
        const organigrammaFiltrato = response.data.find((item: any) => {
          const societaItem = item.attributes?.societa || item.societa;
          const match = societaItem === societa;
          console.log(`🔍 Confronto: "${societaItem}" === "${societa}" = ${match}`);
          return match;
        });

        if (!organigrammaFiltrato) {
          console.log(`❌ Nessun organigramma trovato per società "${societa}"`);
          console.log('📋 Società disponibili:', response.data.map((item: any) => item.attributes?.societa || item.societa));
          return [];
        }

        console.log('✅ Organigramma trovato:', organigrammaFiltrato);
        
        // Ora prova a recuperare lo staff per questo organigramma
        return this.getStaffForOrganigramma(organigrammaFiltrato.id);
      }),
      catchError(error => {
        console.error('❌ Errore nel caricamento organigrammi:', error);
        return of([]);
      }),
      // Flatten dell'Observable interno
      switchMap(result => {
        if (result instanceof Array) {
          return of(result);
        }
        return result; // È già un Observable
      })
    );
  }

  /**
   * Recupera staff per un organigramma specifico
   */
  private getStaffForOrganigramma(organigrammaId: number): Observable<StaffMember[]> {
    console.log(`\n=== RECUPERO STAFF PER ORGANIGRAMMA ID: ${organigrammaId} ===`);
    
    // Prova con populate dello staff
    return this.http.get<any>(`${this.apiUrl}/api/organigrammas/${organigrammaId}?populate[staff]=*`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        console.log('📋 ORGANIGRAMMA CON STAFF:', JSON.stringify(response, null, 2));
        
        const staff = response.data?.attributes?.staff || [];
        console.log(`👥 Staff trovato: ${staff.length} membri`);
        
        if (staff.length === 0) {
          console.log('⚠️ Nessun membro dello staff trovato. Proviamo a controllare se ci sono staff-members separati...');
          return this.checkStaffMembers();
        }
        
        return this.mapStaffMembers(staff);
      }),
      catchError(error => {
        console.error('❌ Errore nel recupero staff per organigramma:', error);
        console.log('🔄 Proviamo metodo alternativo...');
        return this.checkStaffMembers();
      }),
      switchMap(result => {
        if (result instanceof Array) {
          return of(result);
        }
        return result;
      })
    );
  }

  /**
   * Controlla se ci sono staff-members come collection separata
   */
  private checkStaffMembers(): Observable<StaffMember[]> {
    console.log('\n=== CONTROLLO STAFF-MEMBERS COLLECTION ===');
    
    return this.http.get<any>(`${this.apiUrl}/api/staff-members`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        console.log('👥 STAFF-MEMBERS COLLECTION:', JSON.stringify(response, null, 2));
        
        if (response.data && Array.isArray(response.data)) {
          console.log(`✅ Trovati ${response.data.length} staff members nella collection separata`);
          return this.mapStaffMembers(response.data);
        }
        
        console.log('❌ Nessun staff member trovato nella collection separata');
        return [];
      }),
      catchError(error => {
        console.error('❌ Collection staff-members non esiste o errore:', error);
        return of([]);
      })
    );
  }

  /**
   * Recupera tutte le società disponibili
   */
  getAllSocieta(): Observable<string[]> {
    return this.http.get<any>(`${this.apiUrl}/api/organigrammas`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        console.log('Debug: Risposta getAllSocieta:', response);
        
        if (!response.data) {
          return [];
        }

        const societas = response.data
          .map((item: any) => item.attributes?.societa || item.societa)
          .filter((societa: any) => societa !== undefined && societa !== null);
        
        console.log('Debug: Società estratte:', societas);
        return societas;
      }),
      catchError(error => {
        console.error('Debug: Errore nel caricamento società:', error);
        return of([]);
      })
    );
  }

  /**
   * Mapping semplice dei membri dello staff
   */
  private mapStaffMembers(strapiStaff: any[]): StaffMember[] {
    if (!Array.isArray(strapiStaff)) {
      console.log('Debug: Staff non è un array:', strapiStaff);
      return [];
    }

    return strapiStaff.map((member: any) => {
      console.log('Debug: Mapping membro:', member);
      
      const mappedMember: StaffMember = {
        id: member.id || Math.random(),
        nome: member.nome || member.attributes?.nome || 'Nome non disponibile',
        ruolo: member.ruolo || member.attributes?.ruolo || 'Ruolo non disponibile',
        livello: member.livello || member.attributes?.livello || 1,
        foto: member.foto || member.attributes?.foto || '',
        email: member.email || member.attributes?.email || '',
        telefono: member.telefono || member.attributes?.telefono || '',
        descrizione: member.descrizione || member.attributes?.descrizione || ''
      };

      // Gestione immagine semplificata
      const image = member.image || member.attributes?.image;
      if (image) {
        if (typeof image === 'string') {
          mappedMember.imageBase64 = this.buildImageUrl(image);
        } else if (image.url) {
          mappedMember.imageBase64 = this.buildImageUrl(image.url);
        } else if (image.formats?.medium?.url) {
          mappedMember.imageBase64 = this.buildImageUrl(image.formats.medium.url);
        }
      }

      console.log('Debug: Membro mappato:', mappedMember);
      return mappedMember;
    });
  }

  /**
   * Costruisce URL completo per le immagini
   */
  private buildImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    return `${this.apiUrl}${imageUrl}`;
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
   * Ricerca staff
   */
  searchStaff(query: string, societa?: string): Observable<StaffMember[]> {
    if (societa) {
      return this.getStaff(societa).pipe(
        map(staff => {
          const searchTerm = query.toLowerCase();
          return staff.filter(member => 
            member.nome.toLowerCase().includes(searchTerm) ||
            member.ruolo.toLowerCase().includes(searchTerm)
          );
        })
      );
    }
    
    return of([]);
  }

  /**
   * Verifica esistenza società
   */
  checkSocietaExists(societa: string): Observable<boolean> {
    return this.getAllSocieta().pipe(
      map(societas => societas.includes(societa)),
      catchError(() => of(false))
    );
  }
}