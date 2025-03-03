// src/app/models/squad.model.ts

interface Result {
  giornata: number;
  partita: string;
  data: string;
  risultato: string;
}

interface Standing {
  squadra: string;
  punti: number;
}

interface Player {
  nome: string;
  ruolo: string;
}


export class Squad {
  constructor(
    public id: number,
    public name: string,
    public photoUrl: string,
    public results: Result[],
    public standings: Standing[],
    public roster: Player[],
    public foto?: string
  ) {}
}

export class TeamSmall {
  constructor(
    public name: string,
    public foto?: string, 
    public link? :string,
    public descrizione?: string
  ) {}
}