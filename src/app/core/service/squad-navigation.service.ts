// src/app/core/service/squad-navigation.service.ts

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SquadStrapiService } from './squad-strapi.service';

export interface SquadNavItem {
  name: string;
  route: string;
}

export interface SportNavCategory {
  label: string;
  items: SquadNavItem[];
}

@Injectable({
  providedIn: 'root'
})
export class SquadNavigationService {
  
  constructor(private squadStrapiService: SquadStrapiService) {}

  /**
   * Ottiene le squadre raggruppate per sport per il menu di navigazione
   */
  getSquadsForNavigation(): Observable<SportNavCategory[]> {
    return this.squadStrapiService.getAllSquads().pipe(
      map(squads => {
        // Raggruppa le squadre per sport basandosi sul nome
        const basketSquads: SquadNavItem[] = [];
        const volleySquads: SquadNavItem[] = [];
        const miniSquads: SquadNavItem[] = [];

        squads.forEach(squad => {
          const navItem: SquadNavItem = {
            name: squad.name,
            route: `/squadra/${this.getSquadSport(squad.name)}/${encodeURIComponent(squad.name)}`
          };

          // Logica per determinare il tipo di sport dal nome
          const lowerName = squad.name.toLowerCase();
          
          if (lowerName.includes('minibasket')) {
            miniSquads.push(navItem);
          } else if (lowerName.includes('minivolley')) {
            miniSquads.push(navItem);
          } else if (lowerName.includes('volley')) {
            volleySquads.push(navItem);
          } else {
            // Default: basket
            basketSquads.push(navItem);
          }
        });

        // Ordina le squadre per nome
        const sortSquads = (a: SquadNavItem, b: SquadNavItem) => 
          a.name.localeCompare(b.name);

        basketSquads.sort(sortSquads);
        volleySquads.sort(sortSquads);
        miniSquads.sort(sortSquads);

        // Costruisci le categorie
        const categories: SportNavCategory[] = [];

        if (basketSquads.length > 0) {
          categories.push({
            label: 'Basket',
            items: basketSquads
          });
        }

        if (volleySquads.length > 0) {
          categories.push({
            label: 'Volley',
            items: volleySquads
          });
        }

        if (miniSquads.length > 0) {
          categories.push({
            label: 'Mini',
            items: miniSquads
          });
        }

        return categories;
      }),
      catchError(error => {
        console.error('Errore nel caricamento delle squadre per la navigazione:', error);
        // Ritorna un array vuoto in caso di errore
        return of([]);
      })
    );
  }

  /**
   * Determina il tipo di sport basandosi sul nome della squadra
   */
  private getSquadSport(squadName: string): string {
    const lowerName = squadName.toLowerCase();
    
    if (lowerName.includes('minibasket') || lowerName.includes('minivolley')) {
      return 'mini';
    } else if (lowerName.includes('volley')) {
      return 'volley';
    } else {
      return 'basket';
    }
  }

  /**
   * Ottiene un elenco semplice di tutte le squadre
   */
  getAllSquadNames(): Observable<string[]> {
    return this.squadStrapiService.getAllSquads().pipe(
      map(squads => squads.map(squad => squad.name).sort()),
      catchError(error => {
        console.error('Errore nel caricamento dei nomi delle squadre:', error);
        return of([]);
      })
    );
  }
}