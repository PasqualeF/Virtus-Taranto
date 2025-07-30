// home.component.ts - AGGIORNATO con Smart Loading
import { Component, OnInit, ElementRef, ViewChild, ViewChildren, QueryList, HostListener, AfterViewInit, inject } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { SquadService } from 'src/app/core/service/squad.service';
import { PartnerService } from 'src/app/core/service/partner.service';
import { MatchService, Match } from 'src/app/core/service/match.service';
import { TeamSmall } from 'src/app/core/models/squad.model';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

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
  isLoading = false; // Inizia come false
  showSponsors = false;
  loadingProgress = 0;
  logoLoadStates: boolean[] = [false, false, false];
  isMobile = false;
  
  // NEW: Smart loading states
  private dataLoadingStates = {
    matches: false,
    teams: false,
    partners: false
  };

  // Animation States
  logoAnimationStates = [false, false, false];
  titleAnimationState = false;
  buttonAnimationState = false;
  isTyping = false;
  error: string | null = null;

  // Typewriter Configuration - UPDATED with basketball theme
  private phrases = [
    'Dal 2009', 
    'Passione', 
    'Tradizione', 
    'Eccellenza', 

    'Who Else?',
    'Famiglia'
  ];
  private currentPhrase = 0;
  private currentChar = 0;
  private isDeleting = false;
  private typewriterSpeed = 100;
  
  // Services
  private squadService = inject(SquadService);
  private partnerService = inject(PartnerService);
  private matchService = inject(MatchService);
  
  // Assets
  logos = ['assets/logo-virtus-taranto.png', 'assets/poliLogo.png', 'assets/support_o2022 (1).png'];

  // Navigation Sections
  sections = [
    { id: 'hero', name: 'Home' },
    { id: 'sponsors', name: 'Sponsor' },
    { id: 'story', name: 'Storia' },
    { id: 'palestre', name: 'Palestre' }, // ← NUOVO
    { id: 'matches', name: 'Partite' },
  ];


  // Content Data
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
    this.checkIfMobile();
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
    this.smartLoadAllData();
  }

  // NEW: Smart loading method that shows loading screen only if needed
  private smartLoadAllData() {
    // Verifica se i dati sono già disponibili (cache, localStorage, etc.)
    const hasData = this.hasExistingData();
    
    if (!hasData) {
      // Mostra loading screen solo se non ci sono dati
      this.isLoading = true;
      this.startLoadingAnimation();
    }

    // Carica tutti i dati in parallelo
    const matchesRequest = this.matchService.getUpcomingMatches(6).pipe(
      catchError(error => {
        this.loadFallbackMatches();
        return of([]);
      })
    );

    const teamsRequest = this.squadService.getAllSquadsSmall().pipe(
      catchError(error => {
        return of([]);
      })
    );

    const partnersRequest = this.partnerService.getPartners().pipe(
      catchError(error => {
        this.loadFallbackPartners();
        return of([]);
      })
    );

    // Esegui tutte le richieste in parallelo
    forkJoin({
      matches: matchesRequest,
      teams: teamsRequest,
      partners: partnersRequest
    }).pipe(
      finalize(() => {
        // Completa il loading solo se era attivo
        if (this.isLoading) {
          this.completeLoading();
        }
      })
    ).subscribe({
      next: (results) => {
        this.upcomingMatches = results.matches;
        this.teams = results.teams;
        this.sponsors = results.partners.map(partner => ({
          name: partner.name,
          imageUrl: partner.logo
        }));

        // Aggiorna gli stati di caricamento
        this.dataLoadingStates = {
          matches: true,
          teams: true,
          partners: true
        };

      },
      error: (error) => {
        this.error = 'Errore nel caricamento dei dati';
      }
    });
  }

  // NEW: Check if data already exists (could be from cache, localStorage, etc.)
  private hasExistingData(): boolean {
    // Implementa la logica per verificare se i dati sono già disponibili
    // Per ora restituisce false, ma puoi aggiungere controlli per:
    // - localStorage
    // - cache del browser
    // - dati pre-caricati
    return false;
  }

  // NEW: Start loading animation only when needed
  private startLoadingAnimation() {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 3;
      this.loadingProgress = Math.min(progress, 90); // Si ferma al 90%
      
      if (this.loadingProgress >= 90) {
        clearInterval(interval);
      }
    }, 50);
  }

  // NEW: Complete loading process
  private completeLoading() {
    // Completa il progresso
    this.loadingProgress = 100;
    
    // Rimuovi il loading screen dopo un breve delay
    setTimeout(() => {
      this.isLoading = false;
    }, 300);
  }

  // UPDATED: Enhanced fallback matches method
  private loadFallbackMatches() {    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30) + 1);
    
    this.upcomingMatches = [
      { 
        homeTeam: 'Virtus Taranto', 
        awayTeam: 'Pallacanestro Bari', 
        date: futureDate, 
        time: '18:00', 
        venue: 'PalaMazzola',
        isHome: true,
        league: 'Serie A2'
      },
      { 
        homeTeam: 'Basket Lecce', 
        awayTeam: 'Virtus Taranto', 
        date: new Date(futureDate.getTime() + 7 * 24 * 60 * 60 * 1000), 
        time: '20:30', 
        venue: 'PalaSport Lecce',
        isHome: false,
        league: 'Coppa Italia'
      }
    ];
  }

  // NEW: Fallback partners method
  private loadFallbackPartners() {
    this.sponsors = [
      { name: 'Fondazione 251', imageUrl: 'assets/fondazione251.png' },
      { name: 'Bialetti', imageUrl: 'assets/bialetti.png' },
      { name: 'NU', imageUrl: 'assets/nu.png' },
      { name: 'Suite', imageUrl: 'assets/suite.png' },
      { name: 'Vibe', imageUrl: 'assets/vibe.png' }
    ];
  }

  // NEW: Method to handle social media links
  openSocialLink(platform: string): void {
    const socialLinks = {
      instagram: 'https://www.instagram.com/virtustaranto/', // Sostituisci con il link reale
      facebook: 'https://www.facebook.com/virtustaranto/', // Sostituisci con il link reale
      youtube: 'https://www.youtube.com/channel/UCxxxxx', // Sostituisci con il link reale
      tiktok: 'https://www.tiktok.com/@virtustaranto' // Sostituisci con il link reale
    };

    const url = socialLinks[platform as keyof typeof socialLinks];
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
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
    }, 1000);
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
          this.typewriterSpeed = 350;
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
    });
  }
}