import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.css']
})
export class PrivacyPolicyComponent implements OnInit {
  
  ngOnInit(): void {
    window.scrollTo(0, 0);
  }

  acceptAll(): void {
    // Accetta tutti i cookie
    this.setCookiePreference('all', true);
    this.showNotification('✅ Preferenze salvate');
  }

  acceptMinimal(): void {
    // Solo cookie necessari
    this.setCookiePreference('necessary', true);
    this.setCookiePreference('analytics', false);
    this.setCookiePreference('marketing', false);
    this.showNotification('🔧 Solo cookie necessari attivati');
  }

  openPreferences(): void {
    // Apri un modal o reindirizza per gestire le preferenze
    // Per ora mostra solo un messaggio
    this.showNotification('⚙️ Gestione preferenze in arrivo...');
    // TODO: Implementare modal preferenze
  }

  private setCookiePreference(type: string, value: boolean): void {
    localStorage.setItem(`cookie_${type}`, value.toString());
  }

  private showNotification(message: string): void {
    // Crea notifica temporanea
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #28a745;
      color: white;
      padding: 1rem 2rem;
      border-radius: 8px;
      z-index: 9999;
      animation: slideUp 0.3s ease;
      font-weight: 600;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from {
      transform: translate(-50%, 100%);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);