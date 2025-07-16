// cookie-banner.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CookieService, CookiePreferences } from 'src/app/core/service/cookie.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cookie-banner',
  templateUrl: './cookie-banner.component.html',
  styleUrls: ['./cookie-banner.component.css']
})
export class CookieBannerComponent implements OnInit, OnDestroy {
  showBanner = false;
  showDetails = false;
  showPrivacyPolicy = false;
  private subscriptions: Subscription = new Subscription();
  
  cookiePreferences: CookiePreferences = {
    necessary: true,
    analytics: true,
    marketing: true,
    preferences: true
  };

  constructor(
    private cookieService: CookieService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkAndShowBanner();
    this.setupEventListeners();
    
    // Carica preferenze esistenti se disponibili
    const existingPreferences = this.cookieService.getPreferences();
    if (existingPreferences) {
      this.cookiePreferences = { ...existingPreferences };
    }
    
    // Se l'utente ha già dato il consenso, inizializza i servizi
    if (this.cookieService.hasConsentGiven() && existingPreferences) {
      this.initializeAcceptedServices(existingPreferences);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private checkAndShowBanner(): void {
    this.showBanner = !this.cookieService.hasConsentGiven();
  }

  private setupEventListeners(): void {
    const showBannerListener = () => {
      this.checkAndShowBanner();
    };

    window.addEventListener('showCookieBanner', showBannerListener);
    
    this.subscriptions.add(() => {
      window.removeEventListener('showCookieBanner', showBannerListener);
    });
  }

  private initializeAcceptedServices(preferences: CookiePreferences): void {
    // Inizializza solo i servizi per cui l'utente ha dato il consenso
    if (preferences.analytics) {
      console.log('Initializing analytics services...');
      // Il CookieService gestisce l'inizializzazione di GA
    }
    
    if (preferences.marketing) {
      console.log('Initializing marketing services...');
      // Il CookieService gestisce l'inizializzazione dei servizi marketing
    }
  }

  acceptAll(): void {
    const allAcceptedPreferences: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    };
    
    this.cookieService.savePreferences(allAcceptedPreferences);
    this.closeBanner();
  }

  acceptSelected(): void {
    this.cookieService.savePreferences(this.cookiePreferences);
    this.closeBanner();
  }

  private closeBanner(): void {
    this.showBanner = false;
    this.showDetails = false;
    this.showPrivacyPolicy = false;
    
    // Dispatch evento per notificare che il consenso è stato dato
    window.dispatchEvent(new CustomEvent('cookieConsentGiven', {
      detail: this.cookiePreferences
    }));
  }

  toggleDetails(): void {
    this.showDetails = !this.showDetails;
    this.showPrivacyPolicy = false;
  }

  togglePrivacyPolicy(): void {
    this.showPrivacyPolicy = !this.showPrivacyPolicy;
    this.showDetails = false;
  }

  onPreferenceChange(type: keyof CookiePreferences, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.cookiePreferences[type] = target.checked;
    }
  }
}