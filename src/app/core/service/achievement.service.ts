// achievement.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError } from 'rxjs';
import { StrapiBaseService, StrapiResponse } from './strapi-base.service';
import { Achievement, AchievementData } from '../models/achievement.model';

@Injectable({
  providedIn: 'root'
})
export class AchievementService extends StrapiBaseService {
  
  constructor(protected override http: HttpClient) {
    super(http);
  }

  /**
   * Test: recupera tutti gli achievements senza filtri
   */
  getAllAchievementsSimple(): Observable<any> {
    const url = `${this.apiUrl}/api/achievements`;
    
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(response => {
        return response;
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Recupera tutti gli achievements
   */
  getAllAchievements(): Observable<Achievement[]> {
    const params = this.buildParams({
      sort: 'order:asc,year:desc',
      'pagination[pageSize]': 100
    });

    return this.http.get<any>(
      `${this.apiUrl}/api/achievements`,
      { headers: this.getHeaders(), params }
    ).pipe(
      map(response => {
        return this.mapAchievements(response);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Recupera solo gli achievements featured per la home
   */
  getFeaturedAchievements(): Observable<Achievement[]> {
    const params = this.buildParams({
      'filters[featured][$eq]': true,
      sort: 'order:asc,year:desc',
      'pagination[pageSize]': 4  // Limitiamo a 4 per la home
    });

    return this.http.get<any>(
      `${this.apiUrl}/api/achievements`,
      { headers: this.getHeaders(), params }
    ).pipe(
      map(response => {
        return this.mapAchievements(response);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Recupera gli achievements per società
   */
  getAchievementsBySocieta(societa: string): Observable<Achievement[]> {
    
    const params = this.buildParams({
      'filters[societa][$eq]': societa,
      sort: 'order:asc,year:desc',
      'pagination[pageSize]': 100
    });

    const url = `${this.apiUrl}/api/achievements`;

    return this.http.get<any>(
      url,
      { headers: this.getHeaders(), params }
    ).pipe(
      map(response => {
        return this.mapAchievements(response);
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Mappa i dati da Strapi al modello Angular
   */
  private mapAchievements(response: any): Achievement[] {
    
    // In Strapi 5, i dati sono direttamente in response.data
    if (response && response.data && Array.isArray(response.data)) {
      return response.data.map((item: any) => this.mapSingleAchievement(item));
    }
    
    // Se è già un array (non dovrebbe succedere con Strapi 5)
    if (Array.isArray(response)) {
      return response.map(item => this.mapSingleAchievement(item));
    }
    
    return [];
  }

  private mapSingleAchievement(item: any): Achievement {
    // In Strapi 5, i dati sono direttamente nell'oggetto, non in attributes
    
    return {
      id: item.id,
      year: item.year,
      title: item.title,
      description: item.description,
      icon: item.icon,
      societa: item.societa as Achievement['societa'],
      featured: item.featured || false,
      order: item.order || 0
    };
  }
}