// match.service.ts - AGGIORNATO CON ORARIO DA CAMPO DATA ISO
import { Injectable } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { StrapiBaseService, StrapiResponse } from './strapi-base.service';

// Interfaccia per la squadra dentro Strapi
export interface StrapiSquad {
  id: number;
  documentId: string;
  name: string;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

// Interfaccia per i dati grezzi da Strapi - CORRETTA
export interface StrapiMatch {
  id: number;
  documentId: string;
  casa: string;
  trasferta: string;
  risultato: string | null;
  data: string; // formato ISO: "2025-07-14T12:30:00.000Z" (include data E orario)
  luogo: string | null;
  giornata: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  squads: StrapiSquad[];
}

// Interfaccia per l'applicazione (rimane uguale)
export interface Match {
  homeTeam: string;
  awayTeam: string;
  date: Date;
  time: string; // Estratto dal campo data ISO
  venue: string;
  isHome: boolean;
  league: string;
  squadName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MatchService extends StrapiBaseService {

  private readonly VIRTUS_TEAM_NAME = 'Virtus Taranto';
  private readonly DEFAULT_TIME = '18:00'; // Fallback se non riesco a estrarre l'orario
  private readonly DEFAULT_VENUE = 'PalaMazzola';
  private readonly DEFAULT_LEAGUE = 'Campionato';

  /**
   * Recupera le prossime partite da Strapi con squads populate
   * @param limit Numero massimo di partite da recuperare (default: 12)
   * @returns Observable<Match[]>
   */
  getUpcomingMatches(limit: number = 12): Observable<Match[]> {
    // SOLUZIONE: Usa formato data americano per il filtro, poi filtra lato client per orario
    const today = new Date().toISOString().split('T')[0]; // "2025-07-13" formato americano
    
    
    const params = {
      'filters[data][$gte]': today, // Include partite di oggi e future
      'sort': 'data:asc',
      'pagination[limit]': limit * 2, // Prendiamo più partite per compensare il filtro lato client
      'populate': 'squads'
    };

    return this.http.get<StrapiResponse<StrapiMatch[]>>(
      `${this.apiUrl}/api/results`,
      {
        headers: this.getHeaders(),
        params: this.buildParams(params)
      }
    ).pipe(
      map(response => {        
        // Mappa le partite
        const allMatches = this.mapStrapiMatchesToAppMatches(response.data);
        
        // FILTRO LATO CLIENT: rimuovi partite già iniziate/finite
        const upcomingMatches = this.filterReallyUpcomingMatches(allMatches);
        
        
        // Limita al numero richiesto
        return upcomingMatches.slice(0, limit);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * NUOVO: Filtra solo le partite che devono ancora iniziare (lato client)
   * @param matches Array di partite
   * @returns Match[] Array di partite che devono ancora iniziare
   */
  private filterReallyUpcomingMatches(matches: Match[]): Match[] {
    const now = new Date();
    
    return matches.filter(match => {
      const matchDateTime = new Date(match.date);
      const isUpcoming = matchDateTime > now;
      
      if (isUpcoming) {
        const timeDiff = matchDateTime.getTime() - now.getTime();
        const hoursDiff = Math.round(timeDiff / (1000 * 60 * 60));
      } else {
      }
      
      return isUpcoming;
    });
  }

  /**
   * Recupera una singola partita per ID con squads
   * @param documentId ID del documento Strapi
   * @returns Observable<Match>
   */
  getMatchById(documentId: string): Observable<Match> {
    const params = {
      'populate': 'squads'
    };

    return this.http.get<StrapiResponse<StrapiMatch>>(
      `${this.apiUrl}/api/results/${documentId}`,
      {
        headers: this.getHeaders(),
        params: this.buildParams(params)
      }
    ).pipe(
      map(response => this.mapStrapiMatchToAppMatch(response.data)),
      catchError(this.handleError)
    );
  }

  /**
   * Recupera tutte le partite in un range di date con squads
   * @param startDate Data di inizio (formato YYYY-MM-DD)
   * @param endDate Data di fine (formato YYYY-MM-DD)
   * @returns Observable<Match[]>
   */
  getMatchesByDateRange(startDate: string, endDate: string): Observable<Match[]> {
    const params = {
      'filters[data][$gte]': startDate,
      'filters[data][$lte]': endDate,
      'sort': 'data:asc',
      'populate': 'squads'
    };

    return this.http.get<StrapiResponse<StrapiMatch[]>>(
      `${this.apiUrl}/api/results`,
      {
        headers: this.getHeaders(),
        params: this.buildParams(params)
      }
    ).pipe(
      map(response => this.mapStrapiMatchesToAppMatches(response.data)),
      catchError(this.handleError)
    );
  }

  /**
   * Mappa un array di partite da Strapi al formato dell'applicazione
   * @param strapiMatches Array di partite da Strapi
   * @returns Match[] Array di partite nel formato dell'applicazione
   */
  private mapStrapiMatchesToAppMatches(strapiMatches: StrapiMatch[]): Match[] {
    return strapiMatches.map(match => this.mapStrapiMatchToAppMatch(match));
  }

  /**
   * Mappa una singola partita da Strapi al formato dell'applicazione - AGGIORNATA CON ORARIO DA ISO
   * @param strapiMatch Partita da Strapi
   * @returns Match Partita nel formato dell'applicazione
   */
  private mapStrapiMatchToAppMatch(strapiMatch: StrapiMatch): Match {
    // Determina se la Virtus gioca in casa
    const isVirtusHome = strapiMatch.casa.toLowerCase().includes('virtus taranto');
    
    // Squadra di casa e trasferta
    const homeTeam = strapiMatch.casa;
    const awayTeam = strapiMatch.trasferta;
    
    // Gestione del venue
    let venue = strapiMatch.luogo || '';
    if (!venue) {
      venue = isVirtusHome ? this.DEFAULT_VENUE : 'Da definire';
    }

    // AGGIORNATO: Converti la data ISO e estrai sia data che orario
    const matchDateTime = new Date(strapiMatch.data);
    const time = this.extractTimeFromDate(matchDateTime);

    // Estrazione nome squadra da squads
    let league = this.DEFAULT_LEAGUE;
    let squadName: string | undefined;

    if (strapiMatch.squads && strapiMatch.squads.length > 0) {
      const firstSquad = strapiMatch.squads[0];
      squadName = firstSquad.name;
      league = firstSquad.name;
      
    } else {
      console.warn(`⚠️ Nessuna squadra associata alla partita: ${homeTeam} vs ${awayTeam}`);
    }

    return {
      homeTeam,
      awayTeam,
      date: matchDateTime, // Data completa con orario
      time, // Orario estratto in formato HH:mm
      venue,
      isHome: isVirtusHome,
      league,
      squadName
    };
  }

  /**
   * NUOVO: Estrae l'orario da un oggetto Date in formato HH:mm
   * @param date Oggetto Date
   * @returns string Orario formattato HH:mm
   */
  private extractTimeFromDate(date: Date): string {
    try {
      // Verifica che la data sia valida
      if (isNaN(date.getTime())) {
        return this.DEFAULT_TIME;
      }

      // Estrai ore e minuti
      const hours = date.getHours();
      const minutes = date.getMinutes();

      // Formatta in HH:mm
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      return formattedTime;

    } catch (error) {
      return this.DEFAULT_TIME;
    }
  }

  /**
   * NUOVO: Verifica se una data/orario è valida
   * @param dateTime Oggetto Date
   * @returns boolean True se la data è valida
   */
  private isValidDateTime(dateTime: Date): boolean {
    return dateTime instanceof Date && !isNaN(dateTime.getTime());
  }

  /**
   * NUOVO: Ottieni partite per una squadra specifica
   * @param squadName Nome della squadra
   * @param limit Limite di risultati
   * @returns Observable<Match[]>
   */
  getMatchesBySquad(squadName: string, limit: number = 10): Observable<Match[]> {
    // AGGIORNATO: Usa data/ora completa
    const now = new Date().toISOString();
    
    const params = {
      'filters[data][$gt]': now, // CAMBIATO: ora invece di solo data
      'filters[squads][name][$containsi]': squadName,
      'sort': 'data:asc',
      'pagination[limit]': limit,
      'populate': 'squads'
    };

    return this.http.get<StrapiResponse<StrapiMatch[]>>(
      `${this.apiUrl}/api/results`,
      {
        headers: this.getHeaders(),
        params: this.buildParams(params)
      }
    ).pipe(
      map(response => this.mapStrapiMatchesToAppMatches(response.data)),
      catchError(this.handleError)
    );
  }

  /**
   * NUOVO: Ottieni tutte le squadre disponibili dalle partite
   * @returns Observable<string[]> Lista nomi squadre
   */
  getAvailableSquads(): Observable<string[]> {
    const params = {
      'populate': 'squads',
      'pagination[limit]': 100
    };

    return this.http.get<StrapiResponse<StrapiMatch[]>>(
      `${this.apiUrl}/api/results`,
      {
        headers: this.getHeaders(),
        params: this.buildParams(params)
      }
    ).pipe(
      map(response => {
        const squadNames = new Set<string>();
        response.data.forEach(match => {
          if (match.squads && match.squads.length > 0) {
            match.squads.forEach(squad => squadNames.add(squad.name));
          }
        });
        return Array.from(squadNames).sort();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Utility per verificare se una partita è già conclusa
   * @param match Partita da verificare
   * @returns boolean True se la partita è conclusa
   */
  isMatchFinished(match: Match): boolean {
    const now = new Date();
    const matchDateTime = new Date(match.date);
    
    // AGGIORNATO: Considera conclusa una partita dopo 2 ore dall'inizio
    const matchEndTime = new Date(matchDateTime.getTime() + (2 * 60 * 60 * 1000)); // +2 ore
    
    const isFinished = now > matchEndTime;
    
    return isFinished;
  }

  /**
   * NUOVO: Verifica se una partita è in corso
   * @param match Partita da verificare
   * @returns boolean True se la partita è in corso
   */
  isMatchInProgress(match: Match): boolean {
    const now = new Date();
    const matchDateTime = new Date(match.date);
    const matchEndTime = new Date(matchDateTime.getTime() + (2 * 60 * 60 * 1000)); // +2 ore
    
    const isInProgress = now >= matchDateTime && now <= matchEndTime;
    
    return isInProgress;
  }

  /**
   * NUOVO: Verifica se una partita è futura
   * @param match Partita da verificare  
   * @returns boolean True se la partita deve ancora iniziare
   */
  isMatchUpcoming(match: Match): boolean {
    const now = new Date();
    const matchDateTime = new Date(match.date);
    
    const isUpcoming = now < matchDateTime;
    
    if (isUpcoming) {
      const timeDiff = matchDateTime.getTime() - now.getTime();
      const hoursDiff = Math.round(timeDiff / (1000 * 60 * 60));
    }
    
    return isUpcoming;
  }

  /**
   * Utility per ottenere solo le partite future (non ancora iniziate)
   * @param matches Array di partite
   * @returns Match[] Array di partite future
   */
  filterUpcomingMatches(matches: Match[]): Match[] {
    return matches.filter(match => this.isMatchUpcoming(match));
  }

  /**
   * NUOVO: Utility per ottenere solo le partite in corso
   * @param matches Array di partite  
   * @returns Match[] Array di partite in corso
   */
  filterOngoingMatches(matches: Match[]): Match[] {
    return matches.filter(match => this.isMatchInProgress(match));
  }

  /**
   * Utility per ottenere solo le partite passate
   * @param matches Array di partite
   * @returns Match[] Array di partite passate
   */
  filterPastMatches(matches: Match[]): Match[] {
    return matches.filter(match => this.isMatchFinished(match));
  }

  /**
   * NUOVO: Utility per ottenere partite per stato
   * @param matches Array di partite
   * @returns Object con partite divise per stato
   */
  categorizeMatchesByStatus(matches: Match[]): {
    upcoming: Match[];
    ongoing: Match[];
    finished: Match[];
  } {
    return {
      upcoming: this.filterUpcomingMatches(matches),
      ongoing: this.filterOngoingMatches(matches), 
      finished: this.filterPastMatches(matches)
    };
  }

  /**
   * Utility per ottenere le partite di oggi
   * @returns Observable<Match[]>
   */
  getTodayMatches(): Observable<Match[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
    
    const params = {
      'filters[data][$gte]': startOfDay,
      'filters[data][$lt]': endOfDay,
      'sort': 'data:asc',
      'populate': 'squads'
    };

    return this.http.get<StrapiResponse<StrapiMatch[]>>(
      `${this.apiUrl}/api/results`,
      {
        headers: this.getHeaders(),
        params: this.buildParams(params)
      }
    ).pipe(
      map(response => this.mapStrapiMatchesToAppMatches(response.data)),
      catchError(this.handleError)
    );
  }

  /**
   * Utility per ottenere le partite della settimana corrente
   * @returns Observable<Match[]>
   */
  getThisWeekMatches(): Observable<Match[]> {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    
    const startDate = startOfWeek.toISOString();
    const endDate = endOfWeek.toISOString();
    
    const params = {
      'filters[data][$gte]': startDate,
      'filters[data][$lte]': endDate,
      'sort': 'data:asc',
      'populate': 'squads'
    };

    return this.http.get<StrapiResponse<StrapiMatch[]>>(
      `${this.apiUrl}/api/results`,
      {
        headers: this.getHeaders(),
        params: this.buildParams(params)
      }
    ).pipe(
      map(response => this.mapStrapiMatchesToAppMatches(response.data)),
      catchError(this.handleError)
    );
  }

  /**
   * NUOVO: Statistiche squadre
   * @returns Observable con conteggi per squadra
   */
  getSquadMatchStats(): Observable<{[squadName: string]: number}> {
    return this.getUpcomingMatches(100).pipe(
      map(matches => {
        const stats: {[squadName: string]: number} = {};
        matches.forEach(match => {
          if (match.squadName) {
            stats[match.squadName] = (stats[match.squadName] || 0) + 1;
          }
        });
        return stats;
      })
    );
  }

// AGGIUNGI QUESTI METODI AL match.service.ts

/**
 * NUOVO: Recupera TUTTE le partite per il calendario (passate, presenti e future)
 * @param limit Numero massimo di partite da recuperare (default: 100)
 * @returns Observable<Match[]>
 */
getAllMatchesForCalendar(limit: number = 100): Observable<Match[]> {
  
  const params = {
    'sort': 'data:desc', // Ordina dalla più recente alla più vecchia
    'pagination[limit]': limit,
    'populate': 'squads'
  };

  return this.http.get<StrapiResponse<StrapiMatch[]>>(
    `${this.apiUrl}/api/results`,
    {
      headers: this.getHeaders(),
      params: this.buildParams(params)
    }
  ).pipe(
    map(response => {
      
      // Mappa tutte le partite senza filtri temporali
      const allMatches = this.mapStrapiMatchesToAppMatches(response.data);
      
      // Ordina per data (dalla più vecchia alla più recente per il calendario)
      const sortedMatches = allMatches.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      
      // Log delle statistiche
      const stats = this.categorizeMatchesByStatus(sortedMatches);
  
      return sortedMatches;
    }),
    catchError(error => {      
      return this.getUpcomingMatches(50);
    })
  );
}

/**
 * NUOVO: Recupera partite per il calendario in un range di anni specifico
 * @param startYear Anno di inizio (default: anno corrente - 1)
 * @param endYear Anno di fine (default: anno corrente + 1)
 * @param limit Limite partite (default: 200)
 * @returns Observable<Match[]>
 */
getMatchesForCalendarByYears(
  startYear: number = new Date().getFullYear() - 1,
  endYear: number = new Date().getFullYear() + 1,
  limit: number = 200
): Observable<Match[]> {
  
  const startDate = `${startYear}-01-01`;
  const endDate = `${endYear}-12-31`;
  

  const params = {
    'filters[data][$gte]': startDate,
    'filters[data][$lte]': endDate,
    'sort': 'data:asc',
    'pagination[limit]': limit,
    'populate': 'squads'
  };

  return this.http.get<StrapiResponse<StrapiMatch[]>>(
    `${this.apiUrl}/api/results`,
    {
      headers: this.getHeaders(),
      params: this.buildParams(params)
    }
  ).pipe(
    map(response => {
      
      const matches = this.mapStrapiMatchesToAppMatches(response.data);
      
      // Log statistiche per anni
      const stats = this.categorizeMatchesByStatus(matches);
      return matches;
    }),
    catchError(this.handleError)
  );
}

/**
 * NUOVO: Recupera partite per squadra specifica per il calendario
 * @param squadName Nome della squadra
 * @param includeAllTimeMatches Se includere tutte le partite o solo future (default: true)
 * @param limit Limite risultati (default: 100)
 * @returns Observable<Match[]>
 */
getSquadMatchesForCalendar(
  squadName: string, 
  includeAllTimeMatches: boolean = true,
  limit: number = 100
): Observable<Match[]> {
  
  let params: any = {
    'sort': 'data:asc',
    'pagination[limit]': limit,
    'populate': 'squads'
  };

  // Se non vogliamo tutte le partite, filtra solo future
  if (!includeAllTimeMatches) {
    const now = new Date().toISOString();
    params['filters[data][$gt]'] = now;
  }

  // Filtra per squadra
  params['filters[squads][name][$containsi]'] = squadName;

  return this.http.get<StrapiResponse<StrapiMatch[]>>(
    `${this.apiUrl}/api/results`,
    {
      headers: this.getHeaders(),
      params: this.buildParams(params)
    }
  ).pipe(
    map(response => {      
      const matches = this.mapStrapiMatchesToAppMatches(response.data);
      
      return matches;
    }),
    catchError(this.handleError)
  );
}

/**
 * NUOVO: Metodo ottimizzato per il calendario con fallback intelligente
 * @param preferredLimit Limite preferito (default: 150)
 * @returns Observable<Match[]>
 */
getCalendarMatches(preferredLimit: number = 150): Observable<Match[]> {
  
  // Prima strategia: prova a recuperare tutte le partite
  return this.getAllMatchesForCalendar(preferredLimit).pipe(
    catchError(error => {
      console.warn('⚠️ Fallback: tentativo con range di anni...', error);
      
      // Seconda strategia: range di anni
      return this.getMatchesForCalendarByYears(
        new Date().getFullYear() - 1,
        new Date().getFullYear() + 1,
        preferredLimit
      ).pipe(
        catchError(secondError => {
          console.warn('⚠️ Secondo fallback: solo partite future...', secondError);
          
          // Terza strategia: almeno le partite future
          return this.getUpcomingMatches(50).pipe(
            map(futureMatches => {
              return futureMatches;
            })
          );
        })
      );
    })
  );
}

/**
 * NUOVO: Recupera partite per il calendario con paginazione
 * @param page Pagina corrente (default: 1)
 * @param pageSize Dimensione pagina (default: 50)
 * @returns Observable<{matches: Match[], total: number, hasMore: boolean}>
 */
getCalendarMatchesPaginated(page: number = 1, pageSize: number = 50): Observable<{
  matches: Match[];
  total: number;
  hasMore: boolean;
}> {
  const start = (page - 1) * pageSize;
  

  const params = {
    'sort': 'data:desc',
    'pagination[start]': start,
    'pagination[limit]': pageSize,
    'pagination[withCount]': true,
    'populate': 'squads'
  };

  return this.http.get<StrapiResponse<StrapiMatch[]> & { meta: { pagination: { total: number } } }>(
    `${this.apiUrl}/api/results`,
    {
      headers: this.getHeaders(),
      params: this.buildParams(params)
    }
  ).pipe(
    map(response => {
      const matches = this.mapStrapiMatchesToAppMatches(response.data);
      const total = response.meta?.pagination?.total || response.data.length;
      const hasMore = start + pageSize < total;
      
      
      return {
        matches: matches.sort((a, b) => a.date.getTime() - b.date.getTime()), // Riordina per data crescente
        total,
        hasMore
      };
    }),
    catchError(this.handleError)
  );
}

/**
 * NUOVO: Ottieni tutte le squadre con il conteggio delle partite
 * @returns Observable<{name: string, matchCount: number, upcomingCount: number}[]>
 */
getSquadsWithMatchCounts(): Observable<{name: string, matchCount: number, upcomingCount: number}[]> {
  return this.getAllMatchesForCalendar(500).pipe(
    map(matches => {
      const squadStats = new Map<string, {total: number, upcoming: number}>();
      
      matches.forEach(match => {
        if (match.squadName) {
          const current = squadStats.get(match.squadName) || {total: 0, upcoming: 0};
          current.total++;
          
          if (this.isMatchUpcoming(match)) {
            current.upcoming++;
          }
          
          squadStats.set(match.squadName, current);
        }
      });
      
      return Array.from(squadStats.entries()).map(([name, stats]) => ({
        name,
        matchCount: stats.total,
        upcomingCount: stats.upcoming
      })).sort((a, b) => b.matchCount - a.matchCount);
    })
  );
}

/**
 * UTILITÀ: Verifica se i dati del calendario sono aggiornati
 * @param matches Array di partite
 * @returns boolean True se i dati sembrano completi e aggiornati
 */
isCalendarDataComplete(matches: Match[]): boolean {
  if (matches.length === 0) return false;
  
  const now = new Date();
  const oneMonthAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  const oneMonthFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
  
  // Verifica che ci siano partite nel mese passato E nel mese futuro
  const hasRecentPast = matches.some(m => m.date >= oneMonthAgo && m.date <= now);
  const hasNearFuture = matches.some(m => m.date >= now && m.date <= oneMonthFromNow);
  
  const isComplete = hasRecentPast && hasNearFuture && matches.length >= 5;

  
  return isComplete;
}


}