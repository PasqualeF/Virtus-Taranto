// src/app/core/service/squad-transformer.service.ts

import { Injectable } from '@angular/core';
import { Squad, TeamSmall } from '../models/squad.model';
import { 
  StrapiSquad, 
  StrapiPlayer, 
  StrapiResult, 
  StrapiStanding 
} from '../models/strapi-squad.interfaces';
import { StrapiBaseService } from './strapi-base.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class SquadTransformerService extends StrapiBaseService {
  
  constructor(protected override http: HttpClient) {
    super(http);
  }

  /**
   * Trasforma un array di squadre Strapi in modelli Squad
   */
  transformSquads(strapiSquads: StrapiSquad[]): Squad[] {
    return strapiSquads.map(squad => this.transformSingleSquad(squad));
  }

  /**
   * Trasforma una singola squadra Strapi in modello Squad
   */
  transformSingleSquad(squad: StrapiSquad): Squad {
    const photoUrl = this.getSquadPhotoUrl(squad);
    const results = this.transformResults(squad.results || []);
    const standings = this.transformStandings(squad.standings || []);
    const roster = this.transformRoster(squad.roster || []);

    return new Squad(
      squad.id,
      squad.name,
      photoUrl,
      results,
      standings,
      roster,
      photoUrl
    );
  }

  /**
   * Trasforma una squadra Strapi in TeamSmall per la homepage
   */
  transformToTeamSmall(squad: StrapiSquad): TeamSmall {
    const photoUrl = this.getSquadPhotoUrl(squad);
    const playerCount = squad.roster ? squad.roster.length : 0;
    
    return new TeamSmall(
      squad.name,
      photoUrl,
      `/squadra/basket/${encodeURIComponent(squad.name)}`,
      `Squadra composta da ${playerCount} giocatori.`
    );
  }

  /**
   * Ottiene l'URL della foto della squadra
   */
  private getSquadPhotoUrl(squad: StrapiSquad): string {
    // Prima prova con il campo foto (immagine caricata)
    if (squad.foto) {
      return this.getBestImageUrl(squad.foto);
    }
    
    // Poi prova con photoUrl
    if (squad.photoUrl) {
      return this.getImageUrl(squad.photoUrl);
    }
    
    // Default
    return 'assets/images/default-team-photo.jpg';
  }

  /**
   * Trasforma i risultati nel formato atteso dal frontend
   */
  private transformResults(strapiResults: StrapiResult[]): any[] {
    return strapiResults
      .map(result => ({
        giornata: result.giornata,
        partita: `${result.casa} vs ${result.trasferta}`,
        data: result.data,
        risultato: result.risultato,
        casa: result.casa,
        trasferta: result.trasferta,
        luogo: result.luogo
      }))
      .sort((a, b) => {
        // Ordina per giornata decrescente, poi per data
        if (a.giornata !== b.giornata) {
          return b.giornata - a.giornata;
        }
        return new Date(b.data).getTime() - new Date(a.data).getTime();
      });
  }

  /**
   * Trasforma la classifica nel formato atteso dal frontend
   */
  private transformStandings(strapiStandings: StrapiStanding[]): any[] {
    return strapiStandings
      .map(standing => ({
        pos: standing.pos || 0,
        squadra: standing.squadra,
        punti: standing.punti,
        vittorie: standing.vittorie || 0,
        sconfitte: standing.sconfitte || 0
      }))
      .sort((a, b) => {
        // Ordina per posizione, poi per punti
        if (a.pos !== b.pos) {
          return a.pos - b.pos;
        }
        return b.punti - a.punti;
      });
  }

  /**
   * Trasforma il roster nel formato atteso dal frontend
   */
  private transformRoster(strapiRoster: StrapiPlayer[]): any[] {
    return strapiRoster
      .map(player => ({
        numero: player.numero,
        nome: player.nome,
        cognome: player.cognome,
        posizione: player.posizione,
        ruolo: player.posizione, // Alias per retrocompatibilità
        dataNascita: player.dataNascita,
        altezza: player.altezza
      }))
      .sort((a, b) => a.numero - b.numero);
  }
}