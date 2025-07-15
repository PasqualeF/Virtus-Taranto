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
  
  // Inizializza con tutti i cookie abilitati per default (tranne necessary che è sempre true)
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
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private checkAndShowBanner(): void {
    // Mostra sempre il banner se non c'è consenso
    this.showBanner = !this.cookieService.hasConsentGiven();
  }

  private setupEventListeners(): void {
    // Ascolta per eventi custom che forzano la visualizzazione del banner
    const showBannerListener = () => {
      this.checkAndShowBanner();
    };

    window.addEventListener('showCookieBanner', showBannerListener);
    
    // Cleanup subscription per rimuovere l'event listener
    this.subscriptions.add(() => {
      window.removeEventListener('showCookieBanner', showBannerListener);
    });
  }

  acceptAll(): void {
    // Salva tutte le preferenze come accettate
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
    window.dispatchEvent(new CustomEvent('cookieConsentGiven'));
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