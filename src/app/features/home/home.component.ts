// home.component.ts
import { Component, OnInit, ElementRef, ViewChild, ViewChildren, QueryList, HostListener, AfterViewInit, inject } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { SquadService } from 'src/app/core/service/squad.service'; // RIPRISTINATO all'originale
import { PartnerService } from 'src/app/core/service/partner.service'; // AGGIUNTO
import { TeamSmall } from 'src/app/core/models/squad.model';

interface Match {
  homeTeam: string;
  awayTeam: string;
  date: Date;
  time: string;
  venue: string;
  isHome: boolean;
  league: string;
  backgroundImage: string;
}

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

  // Typewriter Configuration - Aggiornata
  private phrases = ['Passione', 'Tradizione', 'Eccellenza', 'Dal 1948', 'Who Else?'];
  private currentPhrase = 0;
  private currentChar = 0;
  private isDeleting = false;
  private typewriterSpeed = 100;
  
  private squadService = inject(SquadService); // RIPRISTINATO all'originale
  private partnerService = inject(PartnerService); // AGGIUNTO
  
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

  // Content Data
  upcomingMatches: Match[] = [
    { 
      homeTeam: 'Virtus Taranto', 
      awayTeam: 'Team A', 
      date: new Date('2025-04-15'), 
      time: '18:00', 
      venue: 'PalaMazzola',
      isHome: true,
      league: 'Serie A2',
      backgroundImage: 'assets/logo-virtus-taranto.png'
    },
    { 
      homeTeam: 'Team B', 
      awayTeam: 'Virtus Taranto', 
      date: new Date('2025-04-16'), 
      time: '20:30', 
      venue: 'PalaSport B',
      isHome: false,
      league: 'Coppa Italia',
      backgroundImage: 'assets/logo-virtus-taranto.png'
    },
    { 
      homeTeam: 'Team B', 
      awayTeam: 'Virtus Taranto', 
      date: new Date('2025-04-17'), 
      time: '20:30', 
      venue: 'PalaSport B',
      isHome: false,
      league: 'Coppa Italia',
      backgroundImage: 'assets/logo-virtus-taranto.png'
    },
    { 
      homeTeam: 'Team B', 
      awayTeam: 'Virtus Taranto', 
      date: new Date('2025-05-15'),  
      time: '20:30', 
      venue: 'PalaSport B',
      isHome: false,
      league: 'Coppa Italia',
      backgroundImage: 'assets/logo-virtus-taranto.png'
    },
    { 
      homeTeam: 'Virtus Taranto', 
      awayTeam: 'Team A', 
      date: new Date('2025-06-15'), 
      time: '18:00', 
      venue: 'PalaMazzola',
      isHome: true,
      league: 'Serie A2',
      backgroundImage: 'assets/logo-virtus-taranto.png'
    },
    { 
      homeTeam: 'Virtus Taranto', 
      awayTeam: 'Team A', 
      date: new Date('2025-06-16'),  
      time: '18:00', 
      venue: 'PalaMazzola',
      isHome: true,
      league: 'Serie A2',
      backgroundImage: 'assets/logo-virtus-taranto.png'
    }
  ];

  teams: TeamSmall[] = [];

  // MODIFICATO: da array statico a array vuoto che verrà popolato dal service
  sponsors: Sponsor[] = [];
  
  // AGGIUNTO: getter per duplicare gli sponsor per il carousel infinito
  get duplicatedSponsors(): Sponsor[] {
    if (this.sponsors.length === 0) return [];
    // Duplica l'array più volte per garantire uno scroll continuo
    const timesToDuplicate = Math.max(3, Math.ceil(10 / this.sponsors.length));
    let duplicated: Sponsor[] = [];
    for (let i = 0; i < timesToDuplicate; i++) {
      duplicated = [...duplicated, ...this.sponsors];
    }
    return duplicated;
  }

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
    this.sortUpcomingMatches();
    this.startAnimationSequence();
    this.loadSquad();
    this.loadPartners();
    
    // Simula loading screen
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  // AGGIUNTO: nuovo metodo per caricare i partner
  loadPartners() {
    this.partnerService.getPartners().subscribe({
      next: (partners) => {
        // Mappiamo i partner dal formato del service al formato Sponsor
        this.sponsors = partners.map(partner => ({
          name: partner.name,
          imageUrl: partner.logo
        }));
        console.log('Partners caricati:', this.sponsors);
      },
      error: (error) => {
        console.error('Errore nel caricamento dei partner:', error);
        // In caso di errore, usiamo i dati di fallback
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
    // Avvia l'animazione del logo successivo
    if (index < this.logos.length - 1) {
      setTimeout(() => {
        this.logoAnimationStates[index + 1] = true;
      }, 200);
    }
  }

  ngAfterViewInit() {
    // Avvia l'effetto typewriter dopo il caricamento della vista
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
    // Logo animations
    this.logos.forEach((_, index) => {
      setTimeout(() => {
        this.logoAnimationStates[index] = true;
      }, index * 200);
    });

    // Other animations
    setTimeout(() => this.titleAnimationState = true, 1000);
    setTimeout(() => this.buttonAnimationState = true, 2000);
  }

  private startTypewriter(): void {
    const typeNextChar = () => {
      const phrase = this.phrases[this.currentPhrase];
      // Select appropriate element based on device
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

  // Utility Methods
  private sortUpcomingMatches(): void {
    this.upcomingMatches.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

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
      console.log(this.teams);
    });
  }
}