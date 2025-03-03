import { Injectable } from '@angular/core';
import { Observable, of, delay, map } from 'rxjs';
import { Immagine, OrganigrammaData, StaffMember } from '../models/person.model';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environments';
export interface Societa {
  nome: string;
  logo: string;
}
@Injectable({
  providedIn: 'root'
})
export class OrganigrammaService {
  private apiUrl = `${environment.apiUrl}/api/v1/organigramma`;
  
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

  getStaff(societa: string): Observable<StaffMember[]> {
    return this.http.get<StaffMember[]>(`${this.apiUrl}/staff/${encodeURIComponent(societa)}`);
  }

  getAllOrganigrammi(): Observable<OrganigrammaData[]> {
    return this.http.get<OrganigrammaData[]>(`${this.apiUrl}`);
  }

  getAllSocieta(): Observable<string[]> {
    return this.http.get<OrganigrammaData[]>(`${this.apiUrl}/societa`)
      .pipe(
        map((organigrammi: OrganigrammaData[]) => 
          organigrammi.map(org => org.societa)
        )
      );
  }

  getSocieta(): Societa[] {
    return this.defaultSocieta;
  }
  
  getAllStaffBySocieta(): Observable<{ [key: string]: StaffMember[] }> {
    return this.http.get<OrganigrammaData[]>(`${this.apiUrl}/staff-by-societa`)
      .pipe(
        map((organigrammi: OrganigrammaData[]) => {
          const staffBySocieta: { [key: string]: StaffMember[] } = {};
          organigrammi.forEach(org => {
            staffBySocieta[org.societa] = org.staff;
          });
          return staffBySocieta;
        })
      );
  }

  // Metodi di utility
  getImageUrl(image: Immagine | undefined, format: 'thumbnail' | 'small' | 'medium' | 'large' = 'medium'): string {
    if (!image) return 'assets/placeholder.png'; // Immagine di default
    return `${environment.apiUrl}${image.formats[format].url}`;
  }

  // Metodo per raggruppare lo staff per livello
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
}