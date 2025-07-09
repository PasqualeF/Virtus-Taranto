// src/app/core/service/squad.service.ts

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Squad, TeamSmall } from '../models/squad.model';
import { SquadStrapiService } from './squad-strapi.service';
import { SquadTransformerService } from './squad-transformer.service';

@Injectable({
  providedIn: 'root'
})
export class SquadService {
  
  constructor(
    private squadStrapiService: SquadStrapiService,
    private squadTransformer: SquadTransformerService
  ) {}

  /**
   * Ottiene tutte le squadre
   */
  getAllSquads(): Observable<Squad[]> {
    return this.squadStrapiService.getAllSquads().pipe(
      map(strapiSquads => this.squadTransformer.transformSquads(strapiSquads))
    );
  }

  /**
   * Ottiene tutte le squadre in formato ridotto
   */
  getAllSquadsSmall(): Observable<TeamSmall[]> {
    return this.squadStrapiService.getAllSquadsSmall().pipe(
      map(strapiSquads => strapiSquads.map(squad => 
        this.squadTransformer.transformToTeamSmall(squad)
      ))
    );
  }

  /**
   * Ottiene una squadra per ID
   */
  getSquadById(id: number): Observable<Squad | undefined> {
    return this.squadStrapiService.getSquadById(id).pipe(
      map(strapiSquad => strapiSquad 
        ? this.squadTransformer.transformSingleSquad(strapiSquad) 
        : undefined
      )
    );
  }

  /**
   * Ottiene una squadra per nome
   */
  getSquadByName(name: string): Observable<Squad | undefined> {
    // Decodifica il nome dall'URL (gestisce spazi e caratteri speciali)
    const decodedName = decodeURIComponent(name);
    
    // Prima prova con il nome esatto
    return this.squadStrapiService.getSquadByName(decodedName).pipe(
      switchMap(strapiSquad => {
        if (strapiSquad) {
          return of(this.squadTransformer.transformSingleSquad(strapiSquad));
        }
        
        // Se non trova, prova con il nome normalizzato
        const normalizedName = this.normalizeSquadName(decodedName);
        return this.getAllSquads().pipe(
          map(squads => squads.find(squad => 
            this.normalizeSquadName(squad.name) === normalizedName
          ))
        );
      })
    );
  }

  /**
   * Normalizza il nome della squadra per la ricerca
   */
  private normalizeSquadName(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '');
  }

  /**
   * Ottiene solo il roster di una squadra
   */
  getSquadRoster(squadId: number): Observable<any[]> {
    return this.squadStrapiService.getSquadRoster(squadId).pipe(
      map(players => this.squadTransformer['transformRoster'](players))
    );
  }

  /**
   * Ottiene solo i risultati di una squadra
   */
  getSquadResults(squadId: number): Observable<any[]> {
    return this.squadStrapiService.getSquadResults(squadId).pipe(
      map(results => this.squadTransformer['transformResults'](results))
    );
  }

  /**
   * Ottiene solo la classifica di una squadra
   */
  getSquadStandings(squadId: number): Observable<any[]> {
    return this.squadStrapiService.getSquadStandings(squadId).pipe(
      map(standings => this.squadTransformer['transformStandings'](standings))
    );
  }
}