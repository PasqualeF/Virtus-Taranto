// ga4.service.ts
import { Injectable } from '@angular/core';
import { CookieService } from './cookie.service';

// Dichiarazioni TypeScript per gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

declare let gtag: (...args: any[]) => void;

@Injectable({
  providedIn: 'root'
})
export class GA4Service {
  private readonly GA_MEASUREMENT_ID = 'G-FD977KZM17'; // Sostituisci con il tuo ID
  private isInitialized = false;
  private pendingEvents: any[] = [];

  constructor(private cookieService: CookieService) {
    this.setupEventListeners();
    this.initializeIfConsented();
  }

  private setupEventListeners(): void {
    // Ascolta per il consenso ai cookie analytics
    window.addEventListener('analyticsCookiesAccepted', () => {
      this.initializeGA4();
    });

    // Ascolta per aggiornamenti delle preferenze
    window.addEventListener('cookiePreferencesUpdated', (event: any) => {
      const preferences = event.detail;
      if (preferences.analytics && !this.isInitialized) {
        this.initializeGA4();
      } else if (!preferences.analytics && this.isInitialized) {
        this.disableGA4();
      }
    });
  }

  private initializeIfConsented(): void {
    if (this.cookieService.canUseAnalytics()) {
      this.initializeGA4();
    }
  }

  private initializeGA4(): void {
    if (this.isInitialized) return;

    // Carica lo script GA4
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Inizializza gtag
    (window as any).dataLayer = (window as any).dataLayer || [];
    window.gtag = window.gtag || function() {
      ((window as any).dataLayer = (window as any).dataLayer || []).push(arguments);
    };
    window.gtag('js', new Date());

    // Configura GA4
    gtag('js', new Date());
    gtag('config', this.GA_MEASUREMENT_ID, {
      anonymize_ip: true,
      cookie_flags: 'SameSite=Strict;Secure',
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });

    this.isInitialized = true;

    // Invia eventi in coda
    this.pendingEvents.forEach(event => {
      gtag('event', event.action, event.parameters);
    });
    this.pendingEvents = [];

  }

  private disableGA4(): void {
    if (!this.isInitialized) return;

    // Disabilita GA4
    window.gtag('config', this.GA_MEASUREMENT_ID, {
      send_page_view: false
    });

    // Rimuovi script se possibile
    const scripts = document.querySelectorAll(`script[src*="${this.GA_MEASUREMENT_ID}"]`);
    scripts.forEach(script => script.remove());

    this.isInitialized = false;
  }

  public trackEvent(action: string, parameters: any = {}): void {
    if (!this.cookieService.canUseAnalytics()) {
      return;
    }

    if (this.isInitialized) {
      window.gtag('event', action, parameters);
    } else {
      // Metti in coda l'evento per quando GA4 sarà inizializzato
      this.pendingEvents.push({ action, parameters });
    }
  }

  public trackPageView(pageTitle: string, pagePath: string): void {
    this.trackEvent('page_view', {
      page_title: pageTitle,
      page_location: window.location.href,
      page_path: pagePath
    });
  }

  public setUserId(userId: string): void {
    if (this.isInitialized && this.cookieService.canUseAnalytics()) {
      window.gtag('config', this.GA_MEASUREMENT_ID, {
        user_id: userId
      });
    }
  }

  public setUserProperty(propertyName: string, value: string): void {
    if (this.isInitialized && this.cookieService.canUseAnalytics()) {
      window.gtag('event', 'user_property', {
        [propertyName]: value
      });
    }
  }
}