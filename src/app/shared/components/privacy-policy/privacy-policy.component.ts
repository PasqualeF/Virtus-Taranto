// privacy-policy.component.ts
import { Component, OnInit } from '@angular/core';
import { CookieService, CookiePreferences } from 'src/app/core/service/cookie.service';

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.css']
})
export class PrivacyPolicyComponent implements OnInit {

  constructor(private cookieService: CookieService) {}

  ngOnInit(): void {
    // Scroll to top when component loads
    window.scrollTo(0, 0);
  }

  // Metodi per gestire le preferenze cookie dalla pagina privacy
  acceptAllCookies(): void {
    const allAcceptedPreferences: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    };
    
    this.cookieService.savePreferences(allAcceptedPreferences);
    this.showSuccessMessage('✅ Tutte le preferenze sono state salvate. Google Analytics è ora attivo.');
  }

  acceptNecessaryOnly(): void {
    const necessaryOnlyPreferences: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    };
    
    this.cookieService.savePreferences(necessaryOnlyPreferences);
    this.showSuccessMessage('🔧 Sono stati accettati solo i cookie necessari. Servizi di tracking disattivati.');
  }

  clearCookiePreferences(): void {
    this.cookieService.revokeConsent();
    this.showSuccessMessage('🗑️ Le preferenze sono state eliminate e i cookie di tracking rimossi.');
    
    // Ricarica la pagina per rimuovere eventuali script di tracking
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  }

  // Metodo per mostrare le preferenze attuali
  getCurrentPreferences(): CookiePreferences | null {
    return this.cookieService.getPreferences();
  }

  // Metodo per verificare se il consenso è stato dato
  hasConsent(): boolean {
    return this.cookieService.hasConsentGiven();
  }

  // Metodo per aprire il banner dei cookie
  openCookieBanner(): void {
    // Forza la visualizzazione del banner dei cookie
    window.dispatchEvent(new CustomEvent('showCookieBanner'));
    this.showSuccessMessage('📋 Banner dei cookie aperto per modificare le preferenze.');
  }

  private showSuccessMessage(message: string): void {
    // Versione migliorata del messaggio di successo
    const alertDiv = document.createElement('div');
    alertDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 0.95rem;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
      ">
        ${message}
      </div>
      <style>
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      </style>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Rimuovi il messaggio dopo 4 secondi
    setTimeout(() => {
      alertDiv.remove();
    }, 4000);
  }
}