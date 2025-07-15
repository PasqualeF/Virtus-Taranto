import { Component, OnInit, OnDestroy } from '@angular/core';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { SquadStrapiService } from 'src/app/core/service/squad-strapi.service';
import { StrapiBaseService } from 'src/app/core/service/strapi-base.service';
import { Subscription } from 'rxjs';

interface MiniSquad {
  id: number;
  name: string;
  photoUrl: string;
  tipo: string;
  sport: 'basket' | 'volley';
  ageGroup: string;
  mascot: string;
  primaryColor: string;
  secondaryColor: string;
}

interface EmotionalValue {
  icon: string;
  title: string;
  description: string;
  color: string;
}

@Component({
  selector: 'app-youth-teams',
  templateUrl: './youth-teams.component.html',
  styleUrls: ['./youth-teams.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-50px)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('cardHover', [
      state('rest', style({ transform: 'scale(1)' })),
      state('hover', style({ transform: 'scale(1.05)' })),
      transition('rest <=> hover', [
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)')
      ])
    ])
  ]
})
export class YouthTeamsComponent implements OnInit, OnDestroy {
  loading = true;
  error: string | null = null;
  selectedSport: 'all' | 'basket' | 'volley' = 'all';
  hoveredCard: number | null = null;
  
  miniSquads: MiniSquad[] = [];
  filteredSquads: MiniSquad[] = [];
  
  private subscription: Subscription | null = null;

  // Valori emotivi e di crescita
  emotionalValues: EmotionalValue[] = [
    {
      icon: '🤝',
      title: 'Amicizia',
      description: 'Costruiamo legami che durano una vita',
      color: '#3b82f6'
    },
    {
      icon: '🌟',
      title: 'Crescita',
      description: 'Ogni giorno una nuova scoperta',
      color: '#f59e0b'
    },
    {
      icon: '🏆',
      title: 'Successo',
      description: 'Celebriamo ogni piccola vittoria',
      color: '#10b981'
    },
    {
      icon: '❤️',
      title: 'Passione',
      description: 'Amore per lo sport e per il gioco',
      color: '#ef4444'
    },
    {
      icon: '🎯',
      title: 'Obiettivi',
      description: 'Insieme verso nuovi traguardi',
      color: '#8b5cf6'
    },
    {
      icon: '😊',
      title: 'Divertimento',
      description: 'Il sorriso è il nostro miglior risultato',
      color: '#06b6d4'
    }
  ];

  // Mascotte casuali per le squadre
  private mascots = ['🏀', '⭐', '🚀', '⚡', '🌟', '🏆', '💫', '🎯'];
  private colors = [
    { primary: '#3b82f6', secondary: '#dbeafe' },
    { primary: '#f59e0b', secondary: '#fef3c7' },
    { primary: '#10b981', secondary: '#d1fae5' },
    { primary: '#ef4444', secondary: '#fee2e2' },
    { primary: '#8b5cf6', secondary: '#ede9fe' },
    { primary: '#06b6d4', secondary: '#cffafe' }
  ];

  constructor(
    private squadStrapiService: SquadStrapiService,
    private strapiBaseService: StrapiBaseService
  ) {}

  ngOnInit(): void {
    this.loadMiniSquads();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

   loadMiniSquads(): void {
    this.loading = true;
    this.error = null;

    this.subscription = this.squadStrapiService.getAllSquads().subscribe({
      next: (squads) => {
        // Filtra solo le squadre di minibasket e minivolley
        this.miniSquads = squads
          .filter(squad => squad.tipo === 'MINIBASKET & MINIVOLLEY')
          .map((squad, index) => this.transformToMiniSquad(squad, index));
        
        this.filteredSquads = [...this.miniSquads];
        this.loading = false;
      },
      error: (error) => {
        console.error('Errore nel caricamento delle squadre mini:', error);
        this.error = 'Impossibile caricare le squadre. Riprova più tardi.';
        this.loading = false;
      }
    });
  }

  private transformToMiniSquad(squad: any, index: number): MiniSquad {
    const colorSet = this.colors[index % this.colors.length];
    const mascot = this.mascots[index % this.mascots.length];
    
    // Determina il tipo di sport dal nome
    const sport = this.determineSport(squad.name);
    const ageGroup = this.extractAgeGroup(squad.name);

    // Usa getBestImageUrl per ottenere l'URL migliore dall'oggetto foto
    const imageUrl = squad.foto 
      ? this.strapiBaseService.getBestImageUrl(squad.foto)
      : 'assets/images/team-placeholder.jpg';

    return {
      id: squad.id,
      name: squad.name,
      photoUrl: imageUrl,
      tipo: squad.tipo,
      sport,
      ageGroup,
      mascot,
      primaryColor: colorSet.primary,
      secondaryColor: colorSet.secondary
    };
  }

  private determineSport(name: string): 'basket' | 'volley' {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('volley') || lowerName.includes('pallavolo')) {
      return 'volley';
    }
    return 'basket'; // default
  }

  private extractAgeGroup(name: string): string {
    // Cerca pattern di età nel nome (es: "Under 10", "U10", "8-10 anni")
    const agePatterns = [
      /under\s*(\d+)/i,
      /u\s*(\d+)/i,
      /(\d+)\s*anni/i,
      /(\d+)-(\d+)\s*anni/i
    ];

    for (const pattern of agePatterns) {
      const match = name.match(pattern);
      if (match) {
        if (match[2]) {
          return `${match[1]}-${match[2]} anni`;
        }
        return `Under ${match[1]}`;
      }
    }

    return 'Giovani campioni';
  }

  filterSquads(sport: 'all' | 'basket' | 'volley'): void {
    this.selectedSport = sport;
    
    if (sport === 'all') {
      this.filteredSquads = [...this.miniSquads];
    } else {
      this.filteredSquads = this.miniSquads.filter(squad => squad.sport === sport);
    }
  }

  onCardHover(squadId: number | null): void {
    this.hoveredCard = squadId;
  }

  getCardHoverState(squadId: number): string {
    return this.hoveredCard === squadId ? 'hover' : 'rest';
  }

  getSportIcon(sport: 'basket' | 'volley'): string {
    return sport === 'basket' ? '🏀' : '🏐';
  }

  getSportLabel(sport: 'basket' | 'volley'): string {
    return sport === 'basket' ? 'Minibasket' : 'Minivolley';
  }

  navigateToSquad(squad: MiniSquad): void {
    // Naviga alla pagina della squadra specifica
    const route = `/squadra/mini/${encodeURIComponent(squad.name)}`;
    window.location.href = route;
  }
}