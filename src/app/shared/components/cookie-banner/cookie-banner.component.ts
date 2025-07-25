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
  ) {
    // Il servizio viene iniettato qui, quindi il constructor viene chiamato
  }

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
    const hasConsent = this.cookieService.hasConsentGiven();
    this.showBanner = !hasConsent;
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

  acceptAll(): void {    
    const allAcceptedPreferences: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    };
    
    this.cookiePreferences = allAcceptedPreferences;
    this.savePreferencesAndClose();
  }

  acceptSelected(): void {
    this.savePreferencesAndClose();
  }

  private savePreferencesAndClose(): void {
    try {
      // Salva le preferenze - questo triggererà gli eventi necessari
      this.cookieService.savePreferences(this.cookiePreferences);      
      // Chiudi il banner
      this.closeBanner();
      
    } catch (error) {
    }
  }

  private closeBanner(): void {
    this.showBanner = false;
    this.showDetails = false;
    this.showPrivacyPolicy = false;
        
    // Dispatch evento generale per notificare che il consenso è stato dato
    // (questo è ridondante con quello del CookieService, ma può essere utile)
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
      const oldValue = this.cookiePreferences[type];
      this.cookiePreferences[type] = target.checked;
    }
  }

  
}