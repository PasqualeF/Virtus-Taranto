// cookie.service.ts
import { Injectable } from '@angular/core';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

// Dichiarazioni TypeScript per gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

@Injectable({
  providedIn: 'root'
})
export class CookieService {
  private readonly CONSENT_KEY = 'cookie_consent';
  private readonly PREFERENCES_KEY = 'cookie_preferences';
  private readonly GA_MEASUREMENT_ID = 'G-FD977KZM17'; // Sostituisci con il tuo ID
  private isGA4Initialized = false;

  constructor() {
    // Verifica se il consenso è già stato dato all'avvio
    this.initializeOnStartup();
  }

  private initializeOnStartup(): void {
    if (this.hasConsentGiven()) {
      const preferences = this.getPreferences();
      if (preferences && preferences.analytics) {
        this.initializeGoogleAnalytics();
      }
    }
  }

  savePreferences(preferences: CookiePreferences): void {
    localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(preferences));
    localStorage.setItem(this.CONSENT_KEY, 'true');
        
    // Inizializza i servizi immediatamente
    this.initializeServices(preferences);
  }

  private initializeServices(preferences: CookiePreferences): void {    
    // Inizializza Google Analytics se accettato
    if (preferences.analytics && !this.isGA4Initialized) {
      this.initializeGoogleAnalytics();
    }
    
    // Inizializza altri servizi marketing se accettati
    if (preferences.marketing) {
      this.initializeMarketingServices();
    }
  }

  private async initializeGoogleAnalytics(): Promise<void> {
    if (this.isGA4Initialized) {
      return;
    }

    try {
      
      // Carica lo script GA4
      await this.loadGA4Script();
      
      // Inizializza gtag
      this.setupGtag();
      
      // Configura GA4
      this.configureGA4();
      
      this.isGA4Initialized = true;      
      // Invia page view iniziale
      this.trackPageView();
      
    } catch (error) {
    }
  }

  private loadGA4Script(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Controlla se lo script è già presente
      const existingScript = document.querySelector(`script[src*="${this.GA_MEASUREMENT_ID}"]`);
      if (existingScript) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.GA_MEASUREMENT_ID}`;
      
      script.onload = () => {
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load GA4 script'));
      };

      document.head.appendChild(script);
    });
  }

  private setupGtag(): void {
    // Inizializza dataLayer
    window.dataLayer = window.dataLayer || [];
    
    // Definisci la funzione gtag
    window.gtag = window.gtag || function() {
      window.dataLayer.push(arguments);
    };
    
    // Imposta il timestamp
    window.gtag('js', new Date());
    
  }

  private configureGA4(): void {
    window.gtag('config', this.GA_MEASUREMENT_ID, {
      anonymize_ip: true,
      cookie_flags: 'SameSite=Strict;Secure',
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: 63072000, // 2 anni
      send_page_view: true
    });
    
  }

  private trackPageView(): void {
    if (this.isGA4Initialized && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname
      });
    }
  }

  private initializeMarketingServices(): void {
    // Qui puoi inizializzare Facebook Pixel, Google Ads, etc.
  }

  // Metodi pubblici per tracking
  public trackEvent(action: string, parameters: any = {}): void {
    if (!this.canUseAnalytics()) {
      return;
    }

    if (this.isGA4Initialized && window.gtag) {
      window.gtag('event', action, parameters);
    } else {
    }
  }

  public trackPageViewManual(pageTitle: string, pagePath: string): void {
    if (this.isGA4Initialized && this.canUseAnalytics() && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: pageTitle,
        page_location: window.location.href,
        page_path: pagePath
      });
    }
  }

  // Metodi di controllo
  canUseAnalytics(): boolean {
    const preferences = this.getPreferences();
    return preferences ? preferences.analytics : false;
  }

  canUseMarketing(): boolean {
    const preferences = this.getPreferences();
    return preferences ? preferences.marketing : false;
  }

  canUsePreferences(): boolean {
    const preferences = this.getPreferences();
    return preferences ? preferences.preferences : false;
  }

  hasConsentGiven(): boolean {
    return localStorage.getItem(this.CONSENT_KEY) === 'true';
  }

  getPreferences(): CookiePreferences | null {
    const preferences = localStorage.getItem(this.PREFERENCES_KEY);
    return preferences ? JSON.parse(preferences) : null;
  }

  // Metodo per revocare il consenso
  revokeConsent(): void {
    localStorage.removeItem(this.CONSENT_KEY);
    localStorage.removeItem(this.PREFERENCES_KEY);
    
    // Rimuovi i cookie di tracking
    this.removeCookies();
    
    // Reset GA4
    this.isGA4Initialized = false;
    
  }

  private removeCookies(): void {
    // Rimuovi i cookie di Google Analytics
    const cookiesToRemove = ['_ga', '_ga_', '_gid', '_gat'];
    const domain = window.location.hostname;
    const rootDomain = domain.startsWith('www.') ? domain.substring(4) : domain;
    
    cookiesToRemove.forEach(cookie => {
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`;
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${rootDomain}`;
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  }

  // Metodo di debug
  getDebugInfo(): any {
    return {
      hasConsent: this.hasConsentGiven(),
      preferences: this.getPreferences(),
      isGA4Initialized: this.isGA4Initialized,
      canUseAnalytics: this.canUseAnalytics(),
      gtagExists: typeof window.gtag !== 'undefined',
      dataLayerExists: typeof window.dataLayer !== 'undefined'
    };
  }
}