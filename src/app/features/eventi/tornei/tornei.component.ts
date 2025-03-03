// tornei.component.ts
import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';

interface Torneo {
  id: number;
  nome: string;
  tipo: 'ORGANIZZATO' | 'PARTECIPAZIONE';
  stato: 'IN_CORSO' | 'PROGRAMMATO' | 'CONCLUSO';
  dataInizio: string;
  dataFine: string;
  categoria: string;
  descrizione: string;
  numeroSquadre: number ;
  location: string;
  premi: string[];
  squadrePartecipanti: SquadraPartecipante[];
  matchs?: Match[];
}

interface SquadraPartecipante {
  nome: string;
  logo: string;
  posizione?: number;
  vittorie: number;
  sconfitte: number;
  puntiSegnati: number;
  puntiSubiti: number;
}

interface Match {
  id: number;
  squadraCasa: string;
  squadraOspite: string;
  punteggioCasa?: number;
  punteggioOspite?: number;
  data: string;
  fase: string;
  completato: boolean;
}

interface Societa {
  id: number;
  nome: string;
  logo: string;
  torneiOrganizzati: Torneo[];
  torneiPartecipati: Torneo[];
}


export interface BracketMatch extends Match {
  vincitore?: string;
  location?: string;
}

@Component({
  selector: 'app-tornei',
  templateUrl: './tornei.component.html',
  styleUrls: ['./tornei.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('600ms', style({ opacity: 1 })),
      ]),
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(50px)', opacity: 0 }),
        animate('600ms ease-out', style({ transform: 'translateY(0)', opacity: 1 })),
      ]),
    ])
  ]
})
export class TorneiComponent implements OnInit {
  selectedSocieta: Societa | null = null;
  selectedTorneo: Torneo | null = null;
  activeTab: 'organizzati' | 'partecipati' = 'organizzati';
  viewMode: 'grid' | 'bracket' = 'grid';
  
  societa: Societa[] = [
    {
      id: 1,
      nome: 'Virtus Taranto',
      logo: 'assets/virtusLogo.png',
      torneiOrganizzati: [
        {
          id: 1,
          nome: 'Torneo del Mare',
          tipo: 'ORGANIZZATO',
          stato: 'IN_CORSO',
          dataInizio: '2024-06-15',
          dataFine: '2024-06-30',
          categoria: 'Senior',
          descrizione: 'Torneo estivo 5vs5 con le migliori squadre della regione',
          numeroSquadre: 8,
          location: 'PalaMazzola',
          premi: ['Trofeo del Mare 2024', 'Premio MVP', 'Premio Miglior Realizzatore'],
          squadrePartecipanti: [
            {
              nome: 'Virtus Taranto',
              logo: 'assets/virtusLogo.png',
              vittorie: 2,
              sconfitte: 0,
              puntiSegnati: 156,
              puntiSubiti: 134
            },
            // ... altre squadre
          ],
          matchs: [
            {
              id: 1,
              squadraCasa: 'Virtus Taranto',
              squadraOspite: 'Basket Brindisi',
              punteggioCasa: 78,
              punteggioOspite: 72,
              data: '2024-06-15T18:00:00',
              fase: 'Quarti di Finale',
              completato: true
            }
            // ... altri match
          ]
        }
        // ... altri tornei organizzati
      ],
      torneiPartecipati: [
        {
          id: 2,
          nome: 'Coppa Puglia',
          tipo: 'PARTECIPAZIONE',
          stato: 'PROGRAMMATO',
          dataInizio: '2024-09-10',
          dataFine: '2024-09-25',
          categoria: 'Senior',
          descrizione: 'Torneo regionale con tutte le squadre pugliesi',
          numeroSquadre: 16,
          location: 'Varie sedi',
          premi: ['Coppa Puglia 2024', 'Qualificazione Nazionale'],
          squadrePartecipanti: [
            {
              nome: 'Virtus Taranto',
              logo: 'assets/virtusLogo.png',
              vittorie: 0,
              sconfitte: 0,
              puntiSegnati: 0,
              puntiSubiti: 0
            }
            // ... altre squadre
          ]
        }
        // ... altri tornei partecipati
      ]
    }
    // ... altre società
  ];

  constructor() {}

  ngOnInit() {
    this.selectSocieta(this.societa[0]);
  }

  selectSocieta(societa: Societa) {
    this.selectedSocieta = societa;
    this.selectedTorneo = null;
  }

  selectTorneo(torneo: Torneo) {
    this.selectedTorneo = torneo;
  }

  setActiveTab(tab: 'organizzati' | 'partecipati') {
    this.activeTab = tab;
    this.selectedTorneo = null;
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'grid' ? 'bracket' : 'grid';
  }

  getStatoClass(stato: string): string {
    switch(stato) {
      case 'IN_CORSO': return 'stato-in-corso';
      case 'PROGRAMMATO': return 'stato-programmato';
      case 'CONCLUSO': return 'stato-concluso';
      default: return '';
    }
  }

  getStatoText(stato: string): string {
    switch(stato) {
      case 'IN_CORSO': return 'In Corso';
      case 'PROGRAMMATO': return 'Programmato';
      case 'CONCLUSO': return 'Concluso';
      default: return stato;
    }
  }

  selectedMatch: BracketMatch | null = null;

  getBracketRounds(): BracketMatch[][] {
    if (!this.selectedTorneo) return [];

    const rounds: BracketMatch[][] = [];
    const numSquadre = this.selectedTorneo.numeroSquadre;
    const numRounds = Math.log2(numSquadre);

    // Organizza i match per round
    const matches = [...(this.selectedTorneo.matchs || [])];
    let matchesPerRound = numSquadre / 2;

    for (let i = 0; i < numRounds; i++) {
      const roundMatches = matches
        .filter(match => match.fase === this.getRoundName(i, numSquadre))
        .map(match => ({
          ...match,
          vincitore: match.completato ? 
            (match.punteggioCasa! > match.punteggioOspite! ? match.squadraCasa : match.squadraOspite) : 
            undefined
        }));

      rounds.push(roundMatches);
      matchesPerRound = matchesPerRound / 2;
    }

    return rounds;
  }

  getRoundName(roundIndex: number, numSquadre: number): string {
    const rounds = ['Finale', 'Semifinali', 'Quarti di Finale', 'Ottavi di Finale'];
    const totalRounds = Math.log2(numSquadre);
    return rounds[totalRounds - roundIndex - 1] || `Round ${roundIndex + 1}`;
  }

  getTeamLogo(teamName: string): string {
    const squadra = this.selectedTorneo?.squadrePartecipanti.find(s => s.nome === teamName);
    return squadra?.logo || '';
  }

  showMatchDetails(match: BracketMatch) {
    this.selectedMatch = match;
  }

  closeMatchDetails() {
    this.selectedMatch = null;
  }

  
}