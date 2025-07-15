// cookie.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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
  private readonly COOKIE_CONSENT_KEY = 'cookie_preferences';
  private readonly CONSENT_TIMESTAMP_KEY = 'consent_timestamp';
  private readonly CONSENT_VERSION = '1.0';
  
  private cookiePreferencesSubject = new BehaviorSubject<CookiePreferences | null>(null);
  public cookiePreferences$ = this.cookiePreferencesSubject.asObservable();

  constructor() {
    this.loadPreferences();
  }

  private loadPreferences(): void {
    const saved = localStorage.getItem(this.COOKIE_CONSENT_KEY);
    if (saved) {
      try {
        const preferences: CookiePreferences = JSON.parse(saved);
        this.cookiePreferencesSubject.next(preferences);
      } catch (error) {
        console.error('Error parsing cookie preferences:', error);
        this.cookiePreferencesSubject.next(null);
      }
    }
  }

  public hasConsentGiven(): boolean {
    return localStorage.getItem(this.COOKIE_CONSENT_KEY) !== null;
  }

  public savePreferences(preferences: CookiePreferences): void {
    localStorage.setItem(this.COOKIE_CONSENT_KEY, JSON.stringify(preferences));
    localStorage.setItem(this.CONSENT_TIMESTAMP_KEY, new Date().toISOString());
    localStorage.setItem('consent_version', this.CONSENT_VERSION);
    
    this.cookiePreferencesSubject.next(preferences);
    
    // Dispatch events for different cookie types
    if (preferences.analytics) {
      window.dispatchEvent(new CustomEvent('analyticsCookiesAccepted'));
    }
    if (preferences.marketing) {
      window.dispatchEvent(new CustomEvent('marketingCookiesAccepted'));
    }
    
    window.dispatchEvent(new CustomEvent('cookiePreferencesUpdated', { 
      detail: preferences 
    }));
  }

  public getPreferences(): CookiePreferences | null {
    return this.cookiePreferencesSubject.value;
  }

  public canUseAnalytics(): boolean {
    const preferences = this.getPreferences();
    return preferences?.analytics || false;
  }

  public canUseMarketing(): boolean {
    const preferences = this.getPreferences();
    return preferences?.marketing || false;
  }

  public acceptAll(): void {
    this.savePreferences({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    });
  }

  public acceptNecessaryOnly(): void {
    this.savePreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    });
  }

  public clearPreferences(): void {
    localStorage.removeItem(this.COOKIE_CONSENT_KEY);
    localStorage.removeItem(this.CONSENT_TIMESTAMP_KEY);
    localStorage.removeItem('consent_version');
    this.cookiePreferencesSubject.next(null);
  }
}