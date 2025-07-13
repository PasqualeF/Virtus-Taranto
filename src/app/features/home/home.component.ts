// home.component.ts - AGGIORNATO
import { Component, OnInit, ElementRef, ViewChild, ViewChildren, QueryList, HostListener, AfterViewInit, inject } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { SquadService } from 'src/app/core/service/squad.service';
import { PartnerService } from 'src/app/core/service/partner.service';
import { MatchService, Match } from 'src/app/core/service/match.service'; // NUOVO IMPORT
import { TeamSmall } from 'src/app/core/models/squad.model';

interface Team {
  name: string;
  imageUrl: string;
  description: string;
  link : string;
}

interface Sponsor {
  name: string;
  imageUrl: string;
}

interface Achievement {
  year: string;
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('600ms', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(50px)', opacity: 0 }),
        animate('600ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChild('typewriterText') typewriterText!: ElementRef;
  @ViewChild('mobileTypewriterText') mobileTypewriterText!: ElementRef;
  
  // States
  currentSection = 'hero';
  scrollProgress = 0;
  isLoading = true;
  showSponsors = false;
  loadingProgress = 0;
  logoLoadStates: boolean[] = [false, false, false];
  isMobile = false;

  // Animation States
  logoAnimationStates = [false, false, false];
  titleAnimationState = false;
  buttonAnimationState = false;
  isTyping = false;
  error: string | null = null;

  // Typewriter Configuration
  private phrases = ['Passione', 'Tradizione', 'Eccellenza', 'Dal 1948', 'Who Else?'];
  private currentPhrase = 0;
  private currentChar = 0;
  private isDeleting = false;
  private typewriterSpeed = 100;
  
  // Services
  private squadService = inject(SquadService);
  private partnerService = inject(PartnerService);
  private matchService = inject(MatchService); // NUOVO SERVICE
  
  // Assets
  logos = ['assets/logo-virtus-taranto.svg', 'assets/poliLogo.png', 'assets/support_o2022 (1).png'];

  // Navigation Sections
  sections = [
    { id: 'hero', name: 'Home' },
    { id: 'sponsors', name: 'Sponsor' },
    { id: 'story', name: 'Storia' },
    { id: 'achievements', name: 'Successi' },
    { id: 'social', name: 'Social' },
    { id: 'matches', name: 'Partite' },
    { id: 'teams', name: 'Squadre' },
    { id: 'shop', name: 'Shop' }
  ];

  // Content Data - AGGIORNATO: ora viene caricato dinamicamente
  upcomingMatches: Match[] = [];
  teams: TeamSmall[] = [];
  sponsors: Sponsor[] = [];
  
  // Achievement Data
  achievements: Achievement[] = [
    {
      year: '2023',
      title: 'Campionato Serie B',
      description: 'Promozione in Serie A2 dopo una stagione straordinaria',
      icon: 'trophy'
    },
    {
      year: '2022',
      title: 'Coppa Puglia',
      description: 'Vittoria del torneo regionale',
      icon: 'award'
    },
    {
      year: '2021',
      title: 'Settore Giovanile',
      description: 'Miglior settore giovanile della regione',
      icon: 'users'
    },
    {
      year: '2020',
      title: 'Community Impact',
      description: 'Premio per impatto sociale nel territorio',
      icon: 'heart'
    }
  ];

  // AGGIUNTO: getter per duplicare gli sponsor per il carousel infinito
  get duplicatedSponsors(): Sponsor[] {
    if (this.sponsors.length === 0) return [];
    const timesToDuplicate = Math.max(3, Math.ceil(10 / this.sponsors.length));
    let duplicated: Sponsor[] = [];
    for (let i = 0; i < timesToDuplicate; i++) {
      duplicated = [...duplicated, ...this.sponsors];
    }
    return duplicated;
  }

  constructor() {
    this.initializeLoading();
    this.checkIfMobile();
  }
  
  private initializeLoading() {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      this.loadingProgress = Math.min(progress, 100);
      
      if (this.loadingProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          this.isLoading = false;
        }, 500);
      }
    }, 50);
  }

  private checkIfMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkIfMobile();
  }

  ngOnInit() {
    this.startAnimationSequence();
    this.loadAllData();
    
    // Simula loading screen
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  // NUOVO: metodo unificato per caricare tutti i dati
  private loadAllData() {
    this.loadMatches();
    this.loadSquad();
    this.loadPartners();
  }

  // NUOVO: metodo per caricare le partite da Strapi
  private loadMatches() {
    console.log('🏀 Caricamento partite da Strapi...');
    
    this.matchService.getUpcomingMatches(6).subscribe({
      next: (matches) => {
        this.upcomingMatches = matches;
        console.log('✅ Partite caricate:', this.upcomingMatches);
        
        // Log per debugging
        this.upcomingMatches.forEach((match, index) => {
          console.log(`Partita ${index + 1}:`, {
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            date: match.date,
            isHome: match.isHome,
            venue: match.venue
          });
        });
      },
      error: (error) => {
        console.error('❌ Errore nel caricamento delle partite:', error);
        this.error = 'Errore nel caricamento delle partite';
        
        // Dati di fallback come backup
        this.loadFallbackMatches();
      }
    });
  }

  // NUOVO: dati di fallback in caso di errore
  private loadFallbackMatches() {
    console.log('🔄 Caricamento dati di fallback per le partite...');
    
    this.upcomingMatches = [
      { 
        homeTeam: 'Virtus Taranto', 
        awayTeam: 'Team A', 
        date: new Date('2025-08-15'), 
        time: '18:00', 
        venue: 'PalaMazzola',
        isHome: true,
        league: 'Serie A2'
      },
      { 
        homeTeam: 'Team B', 
        awayTeam: 'Virtus Taranto', 
        date: new Date('2025-08-22'), 
        time: '20:30', 
        venue: 'PalaSport B',
        isHome: false,
        league: 'Coppa Italia'
      }
    ];
  }

  // Metodo per caricare i partner
  loadPartners() {
    this.partnerService.getPartners().subscribe({
      next: (partners) => {
        this.sponsors = partners.map(partner => ({
          name: partner.name,
          imageUrl: partner.logo
        }));
        console.log('✅ Partners caricati:', this.sponsors);
      },
      error: (error) => {
        console.error('❌ Errore nel caricamento dei partner:', error);
        // Dati di fallback
        this.sponsors = [
          { name: 'Fondazione 251', imageUrl: 'assets/fondazione251.png' },
          { name: 'Bialetti', imageUrl: 'assets/bialetti.png' },
          { name: 'NU', imageUrl: 'assets/nu.png' },
          { name: 'Suite', imageUrl: 'assets/suite.png' },
          { name: 'Vibe', imageUrl: 'assets/vibe.png' }
        ];
      }
    });
  }
  
  onLogoLoad(index: number) {
    this.logoLoadStates[index] = true;
    if (index < this.logos.length - 1) {
      setTimeout(() => {
        this.logoAnimationStates[index + 1] = true;
      }, 200);
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.startTypewriter();
    }, 2000);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    this.scrollProgress = (scrollTop / scrollHeight) * 100;
    
    this.updateCurrentSection();
    
    if (scrollTop > 300 && !this.showSponsors) {
      this.showSponsors = true;
    }
  }

  // Animation Methods
  startAnimationSequence(): void {
    this.logos.forEach((_, index) => {
      setTimeout(() => {
        this.logoAnimationStates[index] = true;
      }, index * 200);
    });

    setTimeout(() => this.titleAnimationState = true, 1000);
    setTimeout(() => this.buttonAnimationState = true, 2000);
  }

  private startTypewriter(): void {
    const typeNextChar = () => {
      const phrase = this.phrases[this.currentPhrase];
      const elem = this.isMobile && this.mobileTypewriterText ? 
                  this.mobileTypewriterText.nativeElement : 
                  this.typewriterText?.nativeElement;
      
      if (!elem) return;

      this.isTyping = true;

      if (!this.isDeleting) {
        elem.textContent = phrase.substring(0, this.currentChar + 1);
        this.currentChar++;

        if (this.currentChar === phrase.length) {
          this.isDeleting = true;
          this.typewriterSpeed = 1200;
        }
      } else {
        elem.textContent = phrase.substring(0, this.currentChar - 1);
        this.currentChar--;

        if (this.currentChar === 0) {
          this.isDeleting = false;
          this.currentPhrase = (this.currentPhrase + 1) % this.phrases.length;
          this.typewriterSpeed = 100;
        }
      }

      setTimeout(typeNextChar, this.typewriterSpeed);
      this.isTyping = this.currentChar !== phrase.length;
    };

    typeNextChar();
  }

  // Utility Methods - AGGIORNATO: rimosse le partite hardcoded
  getMatchDay(date: Date): string {
    return date.toLocaleDateString('it-IT', { weekday: 'long' });
  }

  private updateCurrentSection(): void {
    for (const section of this.sections) {
      const element = document.getElementById(section.id);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.5 && rect.bottom > 0) {
          this.currentSection = section.id;
        }
      }
    }
  }

  // Interactive Methods
  handleButtonHover(event: MouseEvent): void {
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    button.style.setProperty('--x', `${x}%`);
    button.style.setProperty('--y', `${y}%`);
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  pauseAnimation(element: HTMLElement): void {
    element.style.animationPlayState = 'paused';
  }

  resumeAnimation(element: HTMLElement): void {
    element.style.animationPlayState = 'running';
  }

  loadSquad() {
    this.squadService.getAllSquadsSmall()
    .subscribe(teams => {
      this.teams = teams;
      console.log('✅ Squadre caricate:', this.teams);
    });
  }
}