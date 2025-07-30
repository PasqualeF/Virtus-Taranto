import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { PalestreService, Palestra } from 'src/app/core/service/palestre.service';

@Component({
  selector: 'app-palestre-preview',
  templateUrl: './palestre-preview.component.html',
  styleUrls: ['./palestre-preview.component.css'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('cardSlideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class PalestrePreviewComponent implements OnInit, OnDestroy {
  
  palestre: Palestra[] = [];
  isLoading = true;
  error = false;
  isMobile = false;
  
  // Fallback data in caso di errore
  private fallbackPalestre: Palestra[] = [
    {
      id: 1,
      documentId: 'fallback-1',
      nome: 'PalaFiom',
      descrizione: 'Il nostro campo principale, casa delle partite più emozionanti.',
      indirizzo: 'Via Lago di Trasimeno, Taranto',
      lat: 40.4686,
      lng: 17.2403,
      immagine: 'assets/palestre/archimede_1.jpg',
      servizi: ['Parcheggio', 'Spogliatoi', 'Bar'],
      prenotabile: true,
      slug: 'palafiom'
    },
    {
      id: 2,
      documentId: 'fallback-2',
      nome: 'Palestra Falanto',
      descrizione: 'Struttura moderna per allenamenti di alto livello.',
      indirizzo: 'Via Lago di Como, Taranto',
      lat: 40.4756,
      lng: 17.2518,
      immagine: 'assets/palestre/martellotta.jpg',
      servizi: ['Parcheggio', 'Spogliatoi', 'Sala pesi'],
      prenotabile: false,  
      slug: 'palestra-falanto'
    }
  ];

  constructor(
    private palestreService: PalestreService,
    private router: Router
  ) {
    this.checkMobileState();
  }

  ngOnInit(): void {
    this.loadPalestre();
    
    // Listener per il resize
    window.addEventListener('resize', this.onResize.bind(this));
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize.bind(this));
  }

  private checkMobileState(): void {
    this.isMobile = window.innerWidth <= 768;
  }

  private onResize(): void {
    this.checkMobileState();
  }

  private loadPalestre(): void {
    this.isLoading = true;
    this.error = false;

    // Carica solo le prime 3-4 palestre per la preview
    this.palestreService.getAllPalestre(4).subscribe({
      next: (palestre) => {
        this.palestre = palestre.slice(0, this.isMobile ? 2 : 3);
        this.isLoading = false;
      },
      error: (error) => {
        console.warn('⚠️ Errore caricamento palestre, usando fallback:', error);
        this.palestre = this.fallbackPalestre.slice(0, this.isMobile ? 2 : 3);
        this.error = true;
        this.isLoading = false;
      }
    });
  }

  navigateToAllPalestre(): void {
    this.router.navigate(['/palestre']);
  }

  navigateToPalestra(palestra: Palestra): void {
    // Naviga alla pagina completa delle palestre con l'ID specifico
    this.router.navigate(['/palestre'], { 
      fragment: palestra.slug || palestra.id.toString()
    });
  }

  onImageError(event: any): void {
    event.target.src = 'assets/palestre/default-palestra.jpg';
  }

  getShortDescription(description: string): string {
    return description.length > 80 ? description.substring(0, 80) + '...' : description;
  }

  getLocationIcon(): string {
    return '📍';
  }

  getBookableIcon(): string {
    return '📅';
  }

  trackByPalestra(index: number, palestra: Palestra): number {
    return palestra.id;
  }
}