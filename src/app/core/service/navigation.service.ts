// core/services/navigation.service.ts - VERSIONE CORRETTA TYPESCRIPT
import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, filter } from 'rxjs/operators';
import { Router, NavigationEnd, Event as RouterEvent } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private readonly BOOKING_AREA_KEY = 'navigationState';
  
  private isInBookingAreaSubject = new BehaviorSubject<boolean>(this.getStoredBookingAreaState());
  private userLoggedInSubject = new BehaviorSubject<boolean>(this.getStoredLoginState());

  // Observable che combina area booking + login status
  public hideNavigation$ = combineLatest([
    this.isInBookingAreaSubject.asObservable().pipe(distinctUntilChanged()),
    this.userLoggedInSubject.asObservable().pipe(distinctUntilChanged())
  ]).pipe(
    map(([inBookingArea, loggedIn]) => {
      const shouldHide = inBookingArea && loggedIn;
      return shouldHide;
    }),
    distinctUntilChanged()
  );

  constructor(private router: Router) {
    this.initializeRouterListener();
    this.restoreStateOnInit();
  }

  /**
   * Inizializza il listener per i cambi di route - FIX TYPESCRIPT
   */
  private initializeRouterListener(): void {
    this.router.events.pipe(
      filter((event: RouterEvent): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.handleRouteChange(event.url);
    });
  }

  /**
   * Ripristina lo stato all'inizializzazione
   */
  private restoreStateOnInit(): void {
    const currentUrl = this.router.url;
    
    // Se siamo in una route di prenotazioni, ripristina lo stato
    if (this.isBookingRoute(currentUrl)) {
      const storedBookingState = this.getStoredBookingAreaState();
      const storedLoginState = this.getStoredLoginState();
      
      
      if (storedBookingState) {
        this.setBookingArea(true);
      }
      if (storedLoginState) {
        this.setUserLoggedIn(true);
      }
    }
  }

  /**
   * Gestisce i cambi di route
   */
  private handleRouteChange(url: string): void {
    
    if (this.isBookingRoute(url)) {
      // Se entriamo in una route di booking, mantieni lo stato se esistente
      const storedState = this.getStoredBookingAreaState();
      if (storedState) {
        this.setBookingArea(true);
      }
    } else {
      // Se usciamo dalle route di booking, pulisci lo stato
      this.exitBookingArea();
    }
  }

  /**
   * Controlla se l'URL è una route di booking/prenotazioni
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

  /**
   * Imposta se l'utente è nell'area prenotazioni
   */
  setBookingArea(inBookingArea: boolean): void {
    this.isInBookingAreaSubject.next(inBookingArea);
    this.storeBookingAreaState(inBookingArea);
  }

  /**
   * Imposta lo stato di login
   */
  setUserLoggedIn(loggedIn: boolean): void {
    this.userLoggedInSubject.next(loggedIn);
    this.storeLoginState(loggedIn);
  }

  /**
   * Metodo di utilità per entrare nell'area prenotazioni autenticata
   */
  enterAuthenticatedBookingArea(): void {
    this.setBookingArea(true);
    this.setUserLoggedIn(true);
  }

  /**
   * Metodo di utilità per uscire dall'area prenotazioni
   */
  exitBookingArea(): void {
    this.setBookingArea(false);
    this.setUserLoggedIn(false);
  }

  /**
   * Forza l'aggiornamento dello stato (utile dopo refresh)
   */
  forceStateUpdate(): void {
    const currentUrl = this.router.url;
    
    if (this.isBookingRoute(currentUrl)) {
      // Verifica se l'utente dovrebbe essere autenticato
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (token) {
        this.enterAuthenticatedBookingArea();
      }
    }
  }

  // ===== METODI DI PERSISTENZA =====

  /**
   * Salva lo stato booking area nel localStorage
   */
  private storeBookingAreaState(inBookingArea: boolean): void {
    try {
      const state = {
        inBookingArea,
        timestamp: Date.now()
      };
      localStorage.setItem(`${this.BOOKING_AREA_KEY}_booking`, JSON.stringify(state));
    } catch (error) {
      console.warn('⚠️ Impossibile salvare stato booking area:', error);
    }
  }

  /**
   * Salva lo stato login nel localStorage
   */
  private storeLoginState(loggedIn: boolean): void {
    try {
      const state = {
        loggedIn,
        timestamp: Date.now()
      };
      localStorage.setItem(`${this.BOOKING_AREA_KEY}_login`, JSON.stringify(state));
    } catch (error) {
      console.warn('⚠️ Impossibile salvare stato login:', error);
    }
  }

  /**
   * Recupera lo stato booking area dal localStorage
   */
  private getStoredBookingAreaState(): boolean {
    try {
      const stored = localStorage.getItem(`${this.BOOKING_AREA_KEY}_booking`);
      if (stored) {
        const state = JSON.parse(stored);
        // Verifica che lo stato non sia troppo vecchio (max 1 ora)
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - state.timestamp < oneHour) {
          return state.inBookingArea;
        }
      }
    } catch (error) {
      console.warn('⚠️ Errore recupero stato booking area:', error);
    }
    return false;
  }

  /**
   * Recupera lo stato login dal localStorage
   */
  private getStoredLoginState(): boolean {
    try {
      const stored = localStorage.getItem(`${this.BOOKING_AREA_KEY}_login`);
      if (stored) {
        const state = JSON.parse(stored);
        // Verifica che lo stato non sia troppo vecchio (max 1 ora)
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - state.timestamp < oneHour) {
          return state.loggedIn;
        }
      }
    } catch (error) {
      console.warn('⚠️ Errore recupero stato login:', error);
    }
    return false;
  }

  /**
   * Pulisce tutti gli stati salvati
   */
  clearStoredState(): void {
    try {
      localStorage.removeItem(`${this.BOOKING_AREA_KEY}_booking`);
      localStorage.removeItem(`${this.BOOKING_AREA_KEY}_login`);
    } catch (error) {
    }
  }

  // ===== GETTERS PER DEBUG =====

  /**
   * Ottieni lo stato corrente per debug
   */
  getCurrentState(): { inBookingArea: boolean; loggedIn: boolean } {
    return {
      inBookingArea: this.isInBookingAreaSubject.value,
      loggedIn: this.userLoggedInSubject.value
    };
  }
}