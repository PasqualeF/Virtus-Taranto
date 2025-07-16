// cookie.service.ts
import { Injectable } from '@angular/core';

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CookieService {
  private readonly CONSENT_KEY = 'cookie_consent';
  private readonly PREFERENCES_KEY = 'cookie_preferences';

  constructor() {}

  savePreferences(preferences: CookiePreferences): void {
    localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(preferences));
    localStorage.setItem(this.CONSENT_KEY, 'true');
    
    // Inizializza i servizi basati sulle preferenze
    this.initializeServices(preferences);
  }

  private initializeServices(preferences: CookiePreferences): void {
    // Inizializza Google Analytics se accettato
    if (preferences.analytics) {
      this.initializeGoogleAnalytics();
    }
    
    // Inizializza altri servizi marketing se accettati
    if (preferences.marketing) {
      this.initializeMarketingServices();
    }
  }

  private initializeGoogleAnalytics(): void {
    // Sostituisci 'G-XXXXXXXXXX' con il tuo GA4 Measurement ID
    const GA_MEASUREMENT_ID = 'G-FD977KZM17';
    
    // Carica lo script GA4
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Inizializza gtag
    script.onload = () => {
      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag(...args: any[]) {
        (window as any).dataLayer.push(args);
      }
      (window as any).gtag = gtag;
      
      gtag('js', new Date());
      gtag('config', GA_MEASUREMENT_ID, {
        anonymize_ip: true,
        cookie_flags: 'SameSite=Strict;Secure'
      });
      
      console.log('Google Analytics initialized');
    };
  }

  private initializeMarketingServices(): void {
    // Inizializza Facebook Pixel, Google Ads, etc.
    console.log('Marketing services initialized');
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
  }

  private removeCookies(): void {
    // Rimuovi i cookie di Google Analytics
    const cookiesToRemove = ['_ga', '_ga_', '_gid', '_gat'];
    cookiesToRemove.forEach(cookie => {
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
    });
  }
}