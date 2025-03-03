import { Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { Squad, TeamSmall } from '../models/squad.model';
import { environment } from 'src/environments/environments';
import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class SquadService {
  private apiUrl = `${environment.apiUrl}/api/v1/squads`;
  private squads: Squad[] = [
    new Squad(
      19,
      'Under 19',
      'assets/under19-team-photo.jpg',
      [
        { giornata: 1, partita: 'Under 19 vs Team A', data: '2024-03-01', risultato: '78-65' },
        { giornata: 2, partita: 'Team B vs Under 19', data: '2024-03-08', risultato: '75-70' },
        { giornata: 3, partita: 'Under 19 vs Team C', data: '2024-03-15', risultato: '82-79' },
      ],
      [
        { squadra: 'Team X', punti: 20 },
        { squadra: 'Under 19', punti: 18 },
        { squadra: 'Team Y', punti: 16 },
      ],
      [
        { nome: 'Mario Rossi', ruolo: 'Guardia' },
        { nome: 'Luca Bianchi', ruolo: 'Ala' },
        { nome: 'Giovanni Verdi', ruolo: 'Centro' },
      ]
    ),
    new Squad(
      17,
      'Under 17',
      'assets/under17-team-photo.jpg',
      [
        { giornata: 1, partita: 'Under 17 vs Team C', data: '2024-03-02', risultato: '85-80' },
        { giornata: 2, partita: 'Team D vs Under 17', data: '2024-03-09', risultato: '88-92' },
      ],
      [
        { squadra: 'Under 17', punti: 22 },
        { squadra: 'Team Y', punti: 20 },
        { squadra: 'Team Z', punti: 18 },
      ],
      [
        { nome: 'Paolo Neri', ruolo: 'Playmaker' },
        { nome: 'Andrea Blu', ruolo: 'Ala' },
        { nome: 'Marco Gialli', ruolo: 'Centro' },
      ]
    )
  ];

  constructor(private http: HttpClient) {}

  getAllSquads(): Observable<Squad[]> {
    return this.http.get<Squad[]>(`${this.apiUrl}`);
  }

  getAllSquadsSmall(): Observable<TeamSmall[]> {
    return this.http.get<Squad[]>(`${this.apiUrl}/getAllSquadSmall`)
    .pipe(
      map(squads => squads.map(squad => this.mapToTeamSmall(squad)))
    );
  }



  getSquadById(id: number): Observable<Squad | undefined> {
    return of(this.squads.find(squad => squad.id === id));
  }

  getSquadByName(name: string): Observable<Squad | undefined> {
    return this.getAllSquads().pipe(
      map(squads => squads.find(squad => 
        squad.name.toLowerCase() === name.toLowerCase() ||
        this.normalizeSquadName(squad.name) === this.normalizeSquadName(name)
      ))
    );
  }

  private normalizeSquadName(name: string): string {
    // Rimuove spazi e converte in minuscolo
    // Esempio: "Under 17 Gold" -> "under17gold"
    return name.toLowerCase().replace(/\s+/g, '');
  }

  private mapToTeamSmall(squad: Squad): TeamSmall {
    return new TeamSmall(
      squad.name,
      squad.foto || squad.photoUrl, // Usa foto se disponibile, altrimenti usa photoUrl
      '/squadra/basket/' + squad.name,
      this.generateDescription(squad)
    );
  }

  private generateDescription(squad: Squad): string {
    return `Squadra composta da giocatori.`;
  }
}