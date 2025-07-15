

// cookie-check.service.ts
import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CookieService } from './cookie.service';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CookieCheckService {

  constructor(
    private router: Router,
    private cookieService: CookieService
  ) {
    this.initializeCookieCheck();
  }

  private initializeCookieCheck(): void {
    // Controlla il consenso ad ogni cambio di rotta
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.enforceCookieConsent();
      });
  }

  public enforceCookieConsent(): void {
    // Forza la visualizzazione del banner se non c'è consenso
    if (!this.cookieService.hasConsentGiven()) {
      // Questo trigger mostrerà il banner
      window.dispatchEvent(new CustomEvent('showCookieBanner'));
    }
  }
}