// app.component.ts - VERSIONE CORRETTA TYPESCRIPT
import { Component, OnInit } from '@angular/core';
import { NavigationService } from './core/service/navigation.service';
import { Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './features/servizi/prenotazioni/core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'virtus-taranto-frontend';
  
  // Observable che determina se nascondere la navigazione
  hideNavigation$ = this.navigationService.hideNavigation$;

  constructor(
    private navigationService: NavigationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {    
    // Inizializza lo stato della navigazione
    this.initializeNavigationState();
    
    // Ascolta i cambi di route per aggiornare lo stato
    this.setupRouteListener();
    
    // Ascolta lo stato di autenticazione
    this.setupAuthListener();
  }

  /**
   * Inizializza lo stato della navigazione al caricamento dell'app
   */
  private initializeNavigationState(): void {
    const currentUrl = this.router.url;
    
    // Se siamo in una route di booking e l'utente è autenticato
    if (this.isBookingRoute(currentUrl)) {
      const hasValidToken = this.authService.hasValidToken();
      
      if (hasValidToken) {
        this.navigationService.enterAuthenticatedBookingArea();
      } else {
        this.navigationService.setBookingArea(true);
        this.navigationService.setUserLoggedIn(false);
      }
    }
    
    // Forza un aggiornamento dopo l'inizializzazione
    setTimeout(() => {
      this.navigationService.forceStateUpdate();
    }, 100);
  }

  /**
   * Setup listener per i cambi di route - FIX TYPESCRIPT
   */
  private setupRouteListener(): void {
    this.router.events.pipe(
      filter((event: RouterEvent): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      
      // Aggiorna lo stato basato sulla nuova route
      if (this.isBookingRoute(event.url)) {
        const hasValidToken = this.authService.hasValidToken();
        if (hasValidToken) {
          this.navigationService.enterAuthenticatedBookingArea();
        }
      }
    });
  }

  /**
   * Setup listener per lo stato di autenticazione
   */
  private setupAuthListener(): void {
    this.authService.isAuthenticated$.subscribe(isAuth => {      
      const currentUrl = this.router.url;
      if (this.isBookingRoute(currentUrl)) {
        this.navigationService.setUserLoggedIn(isAuth);
      }
    });
  }

  /**
   * Controlla se l'URL è una route di booking
   */
  private isBookingRoute(url: string): boolean {
    const bookingRoutes = [
      '/prenotazioni',
      '/dashboard',
      '/booking',
      '/reservations'
    ];
    
    return bookingRoutes.some(route => url.includes(route));
  }
}