// achievements.component.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate, query, stagger } from '@angular/animations';
// Verifica che questi percorsi siano corretti nel tuo progetto
import { AchievementService } from 'src/app/core/service/achievement.service';
import { Achievement } from 'src/app/core/models/achievement.model';

interface Societa {
  nome: string;
  logo: string;
}

@Component({
  selector: 'app-achievements',
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.css'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ transform: 'translateY(30px)', opacity: 0 }),
        animate('600ms cubic-bezier(0.35, 0, 0.25, 1)',
          style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('achievementCards', [
      transition(':enter', [
        query('.achievement-card', [
          style({ opacity: 0, transform: 'translateY(50px)' }),
          stagger(100, [
            animate('500ms cubic-bezier(0.35, 0, 0.25, 1)',
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('cardHover', [
      state('inactive', style({
        transform: 'scale(1)'
      })),
      state('active', style({
        transform: 'scale(1.05)'
      })),
      transition('inactive <=> active', [
        animate('200ms ease-out')
      ])
    ])
  ]
})
export class AchievementsComponent implements OnInit {
  societa: Societa[] = [
    { nome: 'Virtus Taranto', logo: 'assets/logo-virtus-taranto.svg' },
    { nome: 'Polisportiva 74020', logo: 'assets/poliLogo.png' },
    { nome: 'Support_O', logo: 'assets/support_o2022 (1).png' }
  ];

  selectedSocieta: string = 'Virtus Taranto';
  achievements: Achievement[] = [];
  loading = false;
  hoverStates: { [key: number]: boolean } = {};
  view: 'grid' | 'timeline' = 'grid';
  isMobile: boolean = false;

  // Mappa icone per Lucide
  iconMap: { [key: string]: string } = {
    'trophy': 'trophy',
    'award': 'award',
    'users': 'users',
    'heart': 'heart',
    'star': 'star',
    'medal': 'medal',
    'target': 'target',
    'flag': 'flag'
  };

  constructor(private achievementService: AchievementService) {
    console.log('AchievementsComponent inizializzato');
  }

  ngOnInit() {
    this.checkScreenSize();
    
    // Test: prima proviamo una chiamata semplice
    this.achievementService.getAllAchievementsSimple().subscribe({
      next: (response) => {
        console.log('Test chiamata semplice riuscita:', response);
        // Dopo il test, carichiamo con il filtro
        this.loadAchievements(this.selectedSocieta);
      },
      error: (error) => {
        console.error('Errore nella chiamata di test:', error);
        console.error('Dettagli:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          error: error.error
        });
      }
    });
  }

  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  loadAchievements(societa: string) {
    this.loading = true;
    this.selectedSocieta = societa;
    
    console.log('Caricamento achievements per:', societa);
    
    this.achievementService.getAchievementsBySocieta(societa).subscribe({
      next: (achievements) => {
        console.log('Achievements ricevuti:', achievements);
        this.achievements = achievements;
        this.loading = false;
        // Inizializza hover states
        this.achievements.forEach(achievement => {
          this.hoverStates[achievement.id] = false;
        });
      },
      error: (error) => {
        console.error('Errore nel caricamento degli achievements:', error);
        this.loading = false;
      }
    });
  }

  toggleView() {
    this.view = this.view === 'grid' ? 'timeline' : 'grid';
  }

  toggleCardHover(achievementId: number) {
    this.hoverStates[achievementId] = !this.hoverStates[achievementId];
  }

  getAchievementsByYear(): { [year: string]: Achievement[] } {
    const grouped: { [year: string]: Achievement[] } = {};
    
    this.achievements.forEach(achievement => {
      if (!grouped[achievement.year]) {
        grouped[achievement.year] = [];
      }
      grouped[achievement.year].push(achievement);
    });
    
    return grouped;
  }

  getYears(): string[] {
    return Object.keys(this.getAchievementsByYear())
      .sort((a, b) => parseInt(b) - parseInt(a));
  }

  getLucideIcon(icon: string): string {
    return this.iconMap[icon] || 'star';
  }
}