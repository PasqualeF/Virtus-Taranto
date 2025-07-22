// prenotazioni.component.ts - VERSIONE AGGIORNATA
import { Component, OnInit, inject, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { NavigationService } from 'src/app/core/service/navigation.service';

@Component({
  selector: 'app-prenotazioni',
  templateUrl: './prenotazioni.component.html',
  styleUrls: ['./prenotazioni.component.css'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('sidebarState', [
      state('open', style({ transform: 'translateX(0)' })),
      state('closed', style({ transform: 'translateX(-100%)' })),
      transition('open <=> closed', animate('300ms ease-in-out'))
    ])
  ]
})
export class PrenotazioniComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly navigationService = inject(NavigationService);
  private readonly destroy$ = new Subject<void>();

  // State management
  isAuthenticated = false;
  isLoading = true;
  currentUser: any = null;
  currentSection = 'dashboard';
  sidebarOpen = false;
  isMobile = false;

  // Sezioni disponibili
  sections = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      description: 'Panoramica delle tue prenotazioni'
    },
    {
      id: 'nuova-prenotazione',
      label: 'Nuova Prenotazione',
      icon: 'add_circle',
      description: 'Prenota una palestra'
    },
    {
      id: 'mie-prenotazioni',
      label: 'Le Mie Prenotazioni',
      icon: 'event_note',
      description: 'Gestisci le tue prenotazioni'
    },
    {
      id: 'profilo',
      label: 'Il Mio Profilo',
      icon: 'person',
      description: 'Gestisci il tuo account'
    }
  ];

  ngOnInit(): void {
    
    // IMPORTANTE: Imposta lo stato booking area immediatamente
    this.navigationService.setBookingArea(true);
    
    this.checkScreenSize();
    this.setupWindowResize();
    this.checkAuthentication();
  }

  ngOnDestroy(): void {
    
    // Solo pulisci se stiamo veramente uscendo dall'app di prenotazioni
    // Non durante un semplice refresh
    const isNavigatingAway = !this.router.url.includes('/prenotazioni');
    
    if (isNavigatingAway) {
      this.navigationService.exitBookingArea();
    }
    
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Verifica lo stato di autenticazione
   */
  private checkAuthentication(): void {
    
    // Prima controlla se c'è un token valido
    const hasToken = this.authService.hasValidToken();
    
    if (hasToken) {
      // Se c'è un token, imposta subito lo stato di login
      this.navigationService.setUserLoggedIn(true);
    }
    
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (isAuth) => {
          this.isAuthenticated = isAuth;
          this.isLoading = false;
          
          if (isAuth) {
            this.loadUserData();
            // Assicurati che lo stato navigation sia corretto
            this.navigationService.setUserLoggedIn(true);
          } else {
            // Se non autenticato, pulisci lo stato login ma mantieni booking area
            this.navigationService.setUserLoggedIn(false);
          }
        },
        error: (error) => {
          console.error('❌ Errore controllo autenticazione:', error);
          this.isAuthenticated = false;
          this.isLoading = false;
          this.navigationService.setUserLoggedIn(false);
        }
      });

    // Ascolta anche i dati utente
    this.authService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  /**
   * Carica i dati dell'utente
   */
  private loadUserData(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUser = user;
    }
  }

  /**
   * Cambia sezione attiva
   */
  changeSection(sectionId: string): void {
    this.currentSection = sectionId;
    
    // Chiudi sidebar su mobile dopo la selezione
    if (this.isMobile) {
      this.sidebarOpen = false;
    }
  }

  /**
   * Toggle sidebar
   */
  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  /**
   * Chiudi sidebar
   */
  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  /**
   * Effettua il logout
   */
  logout(): void {
    
    this.authService.logout().subscribe({
      next: () => {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.currentSection = 'dashboard';
        this.closeSidebar();
        
        // Pulisci completamente lo stato navigation al logout
        this.navigationService.exitBookingArea();
        this.navigationService.clearStoredState();
      },
      error: (error) => {
        console.error('❌ Errore durante logout:', error);
        // Anche in caso di errore, pulisci lo stato locale
        this.isAuthenticated = false;
        this.currentUser = null;
        this.navigationService.exitBookingArea();
        this.navigationService.clearStoredState();
      }
    });
  }

  /**
   * Gestisce il successo del login
   */
  onLoginSuccess(): void {
    
    // Assicurati che entrambi gli stati siano impostati
    this.navigationService.enterAuthenticatedBookingArea();
    
    // Forza un aggiornamento dello stato
    setTimeout(() => {
      this.navigationService.forceStateUpdate();
    }, 100);
  }

  /**
   * Naviga alla home principale
   */
  navigateToHome(): void {
    // Prima di navigare, pulisci lo stato
    this.navigationService.exitBookingArea();
    this.router.navigate(['/home']);
  }

  /**
   * Controlla dimensioni schermo
   */
  private checkScreenSize(): void {
    this.isMobile = window.innerWidth < 1024;
    
    // Su desktop, apri la sidebar di default
    if (!this.isMobile) {
      this.sidebarOpen = true;
    }
  }

  /**
   * Setup listener per resize window
   */
  private setupWindowResize(): void {
    window.addEventListener('resize', () => {
      const wasMobile = this.isMobile;
      this.isMobile = window.innerWidth < 1024;
      
      // Se si passa da mobile a desktop, apri sidebar
      if (wasMobile && !this.isMobile) {
        this.sidebarOpen = true;
      }
      // Se si passa da desktop a mobile, chiudi sidebar
      else if (!wasMobile && this.isMobile) {
        this.sidebarOpen = false;
      }
    });
  }

  /**
   * Ottieni iniziali utente per avatar
   */
  getUserInitials(): string {
    if (!this.currentUser) return 'U';
    
    const firstName = this.currentUser.firstName || '';
    const lastName = this.currentUser.lastName || '';
    
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  /**
   * Ottieni nome completo utente
   */
  getFullName(): string {
    if (!this.currentUser) return 'Utente';
    
    return `${this.currentUser.firstName || ''} ${this.currentUser.lastName || ''}`.trim();
  }

  /**
   * Ottieni ruolo utente
   */
  getUserRole(): string {
    if (!this.currentUser) return '';
    
    return this.currentUser.position || 'Utente';
  }

  /**
   * Controlla se una sezione è attiva
   */
  isSectionActive(sectionId: string): boolean {
    return this.currentSection === sectionId;
  }

  /**
   * Ottieni sezione corrente
   */
  getCurrentSection() {
    return this.sections.find(s => s.id === this.currentSection) || this.sections[0];
  }

  /**
   * Gestisce click su overlay (mobile)
   */
  onOverlayClick(): void {
    if (this.isMobile) {
      this.closeSidebar();
    }
  }
}