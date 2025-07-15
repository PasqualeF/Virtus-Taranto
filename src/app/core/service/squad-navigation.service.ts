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
        // Raggruppa le squadre per tipo
        const squadsByType = new Map<string, SquadNavItem[]>();

        squads.forEach(squad => {
          if (!squad.tipo) {
            console.warn(`Squadra ${squad.name} senza tipo definito`);
            return;
          }

          const navItem: SquadNavItem = {
            name: squad.name,
            route: `/squadra/${this.getRouteFromTipo(squad.tipo)}/${encodeURIComponent(squad.name)}`
          };

          // Determina la categoria dal campo tipo
          const category = this.getCategoryFromTipo(squad.tipo);
          
          if (!squadsByType.has(category)) {
            squadsByType.set(category, []);
          }
          
          squadsByType.get(category)!.push(navItem);
        });

        // Converte la mappa in array di categorie ordinate
        const categories: SportNavCategory[] = [];
        
        // Ordine preferito delle categorie basato sull'enum di Strapi
        const preferredOrder = [
          'Basket Maschile', 
          'Basket Femminile', 
          'Pallavolo', 
          'Minibasket & Minivolley'
        ];
        
        preferredOrder.forEach(categoryName => {
          if (squadsByType.has(categoryName)) {
            const items = squadsByType.get(categoryName)!;
            // Ordina le squadre per nome
            items.sort((a, b) => a.name.localeCompare(b.name));
            
            categories.push({
              label: categoryName,
              items: items
            });
          }
        });

        // Aggiungi eventuali categorie non previste
        squadsByType.forEach((items, categoryName) => {
          if (!preferredOrder.includes(categoryName)) {
            items.sort((a, b) => a.name.localeCompare(b.name));
            categories.push({
              label: categoryName,
              items: items
            });
          }
        });

        return categories;
      }),
      catchError(error => {
        console.error('Errore nel caricamento delle squadre per la navigazione:', error);
        return of([]);
      })
    );
  }

  /**
   * Determina la categoria dal campo tipo basandosi sull'enum di Strapi
   */
  private getCategoryFromTipo(tipo: string): string {
    switch (tipo) {
      case 'BASKET - M':
        return 'Basket Maschile';
      case 'BASKET - F':
        return 'Basket Femminile';
      case 'PALLAVOLO':
        return 'Pallavolo';
      case 'MINIBASKET & MINIVOLLEY':
        return 'Minibasket & Minivolley';
      default:
        console.warn(`Tipo non riconosciuto: ${tipo}`);
        return 'Altro';
    }
  }

  /**
   * Determina il percorso della route dal campo tipo
   */
  private getRouteFromTipo(tipo: string): string {
    switch (tipo) {
      case 'BASKET - M':
        return 'basket-maschile';
      case 'BASKET - F':
        return 'basket-femminile';
      case 'PALLAVOLO':
        return 'pallavolo';
      case 'MINIBASKET & MINIVOLLEY':
        return 'mini';
      default:
        return 'altro';
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

  /**
   * Ottiene le squadre filtrate per tipo
   */
  getSquadsByType(tipo: string): Observable<SquadNavItem[]> {
    return this.squadStrapiService.getAllSquads().pipe(
      map(squads => {
        return squads
          .filter(squad => squad.tipo && squad.tipo.toLowerCase().includes(tipo.toLowerCase()))
          .map(squad => ({
            name: squad.name,
            route: `/squadra/${this.getRouteFromTipo(squad.tipo)}/${encodeURIComponent(squad.name)}`
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
      }),
      catchError(error => {
        console.error(`Errore nel caricamento squadre per tipo ${tipo}:`, error);
        return of([]);
      })
    );
  }
}