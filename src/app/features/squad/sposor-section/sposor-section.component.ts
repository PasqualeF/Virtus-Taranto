import { Component, OnInit, inject } from '@angular/core';
import { PartnerService, Partner } from 'src/app/core/service/partner.service';

interface Sponsor {
  name: string;
  imageUrl: string;
}

@Component({
  selector: 'app-sposor-section',
  templateUrl: './sposor-section.component.html',
  styleUrls: ['./sposor-section.component.css']
})
export class SposorSectionComponent implements OnInit {
  sponsors: Sponsor[] = [];
  loading = true;
  error: string | null = null;
  
  private partnerService = inject(PartnerService);

  // Dati di fallback in caso di errore
  private fallbackSponsors: Sponsor[] = [
    { name: 'Fondazione 251', imageUrl: 'assets/fondazione251.png' },
    { name: 'Bialetti', imageUrl: 'assets/bialetti.png' },
    { name: 'NU', imageUrl: 'assets/nu.png' },
    { name: 'Suite', imageUrl: 'assets/suite.png' },
    { name: 'Vibe', imageUrl: 'assets/vibe.png' },
    { name: 'MLog', imageUrl: 'assets/mlogtrasparente1.png' }
  ];

  // Getter per duplicare gli sponsor per il carousel infinito
  get duplicatedSponsors(): Sponsor[] {
    if (this.sponsors.length === 0) return [];
    
    // Duplica gli sponsor abbastanza volte per riempire il carousel
    const timesToDuplicate = Math.max(3, Math.ceil(12 / this.sponsors.length));
    let duplicated: Sponsor[] = [];
    
    for (let i = 0; i < timesToDuplicate; i++) {
      duplicated = [...duplicated, ...this.sponsors];
    }
    
    return duplicated;
  }

  ngOnInit(): void {
    this.loadSponsors();
  }

  private loadSponsors(): void {
    this.loading = true;
    this.error = null;

    this.partnerService.getPartners().subscribe({
      next: (partners: Partner[]) => {
        
        // Trasforma i partner in sponsor per il componente
        this.sponsors = partners.map(partner => ({
          name: partner.name,
          imageUrl: partner.logo
        }));
        
        this.loading = false;
        
        // Log per debugging
      },
      error: (error) => {
        this.error = 'Errore nel caricamento degli sponsor';
        
        // Usa i dati di fallback
        this.sponsors = [...this.fallbackSponsors];
        this.loading = false;
        
      }
    });
  }

  pauseAnimation(element: HTMLElement): void {
    element.style.animationPlayState = 'paused';
  }

  resumeAnimation(element: HTMLElement): void {
    element.style.animationPlayState = 'running';
  }

  // Metodo per ricaricare gli sponsor (utile per retry)
  reloadSponsors(): void {
    this.loadSponsors();
  }

  // TrackBy function per ottimizzare il rendering della lista
  trackBySponsor(index: number, sponsor: Sponsor): string {
    return `${sponsor.name}-${index}`;
  }

  // Gestisce errori di caricamento immagini
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/placeholder.jpg'; // Immagine di fallback
  }
}