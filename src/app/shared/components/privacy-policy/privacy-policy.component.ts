// privacy-policy.component.ts
import { Component, OnInit } from '@angular/core';
import { CookieService } from 'src/app/core/service/cookie.service';

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
    this.cookieService.acceptAll();
    this.showSuccessMessage('Tutte le preferenze sono state salvate');
  }

  acceptNecessaryOnly(): void {
    this.cookieService.acceptNecessaryOnly();
    this.showSuccessMessage('Sono stati accettati solo i cookie necessari');
  }

  clearCookiePreferences(): void {
    this.cookieService.clearPreferences();
    this.showSuccessMessage('Le preferenze sono state eliminate');
  }

  private showSuccessMessage(message: string): void {
    // Implementa la logica per mostrare un messaggio di successo
    // Potresti usare un toast service o un semplice alert
    alert(message);
  }
}