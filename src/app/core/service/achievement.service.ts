// achievement.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
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
    console.log('Test chiamata semplice a:', url);
    
    return this.http.get<any>(url, { headers: this.getHeaders() }).pipe(
      map(response => {
        console.log('Risposta grezza da Strapi:', response);
        return response;
      }),
      this.handleError
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
        console.log('Risposta completa:', response);
        return this.mapAchievements(response);
      }),
      this.handleError
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
        console.log('Risposta featured:', response);
        return this.mapAchievements(response);
      }),
      this.handleError
    );
  }

  /**
   * Recupera gli achievements per società
   */
  getAchievementsBySocieta(societa: string): Observable<Achievement[]> {
    console.log('AchievementService.getAchievementsBySocieta chiamato con:', societa);
    
    const params = this.buildParams({
      'filters[societa][$eq]': societa,
      sort: 'order:asc,year:desc',
      'pagination[pageSize]': 100
    });

    const url = `${this.apiUrl}/api/achievements`;
    console.log('URL chiamato:', url);
    console.log('Parametri:', params.toString());

    return this.http.get<any>(
      url,
      { headers: this.getHeaders(), params }
    ).pipe(
      map(response => {
        console.log('Risposta completa:', response);
        return this.mapAchievements(response);
      }),
      this.handleError
    );
  }

  /**
   * Mappa i dati da Strapi al modello Angular
   */
  private mapAchievements(response: any): Achievement[] {
    console.log('Mappando risposta:', response);
    
    // In Strapi 5, i dati sono direttamente in response.data
    if (response && response.data && Array.isArray(response.data)) {
      return response.data.map((item: any) => this.mapSingleAchievement(item));
    }
    
    // Se è già un array (non dovrebbe succedere con Strapi 5)
    if (Array.isArray(response)) {
      return response.map(item => this.mapSingleAchievement(item));
    }
    
    console.warn('Struttura risposta non riconosciuta:', response);
    return [];
  }

  private mapSingleAchievement(item: any): Achievement {
    // In Strapi 5, i dati sono direttamente nell'oggetto, non in attributes
    console.log('Mappando singolo achievement:', item);
    
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