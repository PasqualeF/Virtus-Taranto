import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { PalestreService, Palestra } from 'src/app/core/service/palestre.service';

@Component({
  selector: 'app-palestre',
  templateUrl: './palestre.component.html',
  styleUrls: ['./palestre.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('flipIn', [
      transition(':enter', [
        style({ transform: 'rotateY(90deg)', opacity: 0 }),
        animate('600ms ease-out', style({ transform: 'rotateY(0deg)', opacity: 1 })),
      ]),
    ]),
    trigger('detailExpand', [
      state('collapsed', style({ 
        opacity: 0, 
        transform: 'scale(0.8)' 
      })),
      state('expanded', style({ 
        opacity: 1, 
        transform: 'scale(1)' 
      })),
      transition('collapsed <=> expanded', animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})
export class PalestreComponent implements OnInit, OnDestroy {
  
  // Stato componente
  activeTab: number = 0;
  isMobile: boolean = false;
  isLoading = true;
  errorMessage = '';
  
  // Event listeners per cleanup
  private eventListeners: (() => void)[] = [];
  
  // Dati
  palestre: Palestra[] = [];
  selectedPalestra: Palestra | null = null;
  detailState: 'collapsed' | 'expanded' = 'collapsed';
  
  // Statistiche
  palestreStats = {
    totali: 0,
    prenotabili: 0,
    serviziDisponibili: [] as string[]
  };

  constructor(
    private palestreService: PalestreService,
    private router: Router
  ) {
    this.checkMobileState();
    
    // Listener per resize con cleanup
    const resizeListener = () => this.checkMobileState();
    window.addEventListener('resize', resizeListener);
    this.eventListeners.push(() => window.removeEventListener('resize', resizeListener));
  }

  ngOnInit(): void {
    this.loadPalestre();
    this.loadStats();
  }

  ngOnDestroy(): void {
    // Cleanup event listeners
    this.eventListeners.forEach(cleanup => cleanup());
  }

  private checkMobileState(): void {
    this.isMobile = window.innerWidth < 768;
  }

  loadPalestre(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.palestreService.getAllPalestre(50).subscribe({
      next: (palestre) => {
        this.palestre = palestre;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Errore nel caricamento palestre:', error);
        this.errorMessage = 'Errore nel caricamento delle palestre. Riprova più tardi.';
        this.isLoading = false;
        this.loadFallbackData();
      }
    });
  }

  loadStats(): void {
    this.palestreService.getPalestreStats().subscribe({
      next: (stats) => {
        this.palestreStats = stats;
      },
      error: (error) => {
        console.warn('⚠️ Errore nel caricamento statistiche:', error);
      }
    });
  }

  private loadFallbackData(): void {
    this.palestre = [
      {
        id: 1,
        documentId: 'fallback-1',
        nome: 'PalaFiom',
        descrizione: 'Il nostro campo principale, casa delle partite più emozionanti. Struttura recentemente rinnovata con pavimentazione in parquet di ultima generazione.',
        indirizzo: 'Via Lago di Trasimeno, 74121 Taranto TA',
        lat: 40.4686,
        lng: 17.2403,
        immagine: 'assets/palestre/archimede_1.jpg',
        servizi: ['Parcheggio', 'Spogliatoi', 'Bar', 'Wi-Fi'],
        prenotabile: true,
        slug: 'palafiom'
      },
      {
        id: 2,
        documentId: 'fallback-2',
        nome: 'Palestra Falanto',
        descrizione: 'Una struttura moderna per allenamenti di alto livello. Ideale per sessioni di allenamento intensivo.',
        indirizzo: 'Via Lago di Como, 74121 Taranto TA',
        lat: 40.4756,
        lng: 17.2518,
        immagine: 'assets/palestre/martellotta.jpg',
        servizi: ['Parcheggio', 'Spogliatoi', 'Sala pesi', 'Area medica'],
        prenotabile: false,
        slug: 'palestra-falanto'
      }
    ];
  }

  showDetails(palestra: Palestra): void {
    this.selectedPalestra = palestra;
    this.detailState = 'expanded';
    this.activeTab = 0;
  }

  closeDetails(): void {
    this.detailState = 'collapsed';
    setTimeout(() => {
      this.selectedPalestra = null;
    }, 300);
  }
  
  changeTab(tabIndex: number): void {
    this.activeTab = tabIndex;
  }

  refreshData(): void {
    this.loadPalestre();
    this.loadStats();
  }

  searchPalestre(searchTerm: string): void {
    if (!searchTerm || searchTerm.trim().length < 2) {
      this.loadPalestre();
      return;
    }

    this.isLoading = true;

    this.palestreService.searchPalestre(searchTerm.trim()).subscribe({
      next: (palestre) => {
        this.palestre = palestre;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Errore nella ricerca delle palestre';
        this.isLoading = false;
      }
    });
  }

  filterByBookable(onlyBookable: boolean): void {
    if (onlyBookable) {
      this.isLoading = true;
      
      this.palestreService.getPalestrePrenotabili().subscribe({
        next: (palestre) => {
          this.palestre = palestre;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Errore nel filtro prenotabili:', error);
          this.isLoading = false;
        }
      });
    } else {
      this.loadPalestre();
    }
  }

  findNearbyPalestre(): void {
    if (!navigator.geolocation) {
      alert('La geolocalizzazione non è supportata dal tuo browser');
      return;
    }

    this.isLoading = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        this.palestreService.getPalestreNearby(lat, lng, 20).subscribe({
          next: (palestre) => {
            this.palestre = palestre;
            this.isLoading = false;
          },
          error: (error) => {
            this.isLoading = false;
            this.loadPalestre();
          }
        });
      },
      (error) => {
        console.warn('Errore geolocalizzazione:', error);
        alert('Impossibile ottenere la tua posizione. Verifica le impostazioni del browser.');
        this.isLoading = false;
        this.loadPalestre();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }

  onImageError(event: any, palestra: Palestra): void {
    console.warn(`⚠️ Errore caricamento immagine per ${palestra.nome}`);
    event.target.src = 'assets/palestre/default-palestra.jpg';
  }

  isPalestraBookable(palestra: Palestra): boolean {
    return palestra.prenotabile;
  }

  getBookableClass(palestra: Palestra): string {
    return palestra.prenotabile ? 'bookable' : 'not-bookable';
  }

  formatServizi(servizi: string[], maxVisible: number = 3): {visible: string[], extra: number} {
    return {
      visible: servizi.slice(0, maxVisible),
      extra: Math.max(0, servizi.length - maxVisible)
    };
  }

  getServiceIcon(servizio: string): string {
    const iconMap: {[key: string]: string} = {
      'parcheggio': '🚗',
      'spogliatoi': '👔',
      'bar': '☕',
      'wi-fi': '📶',
      'sala pesi': '🏋️',
      'area medica': '🏥',
      'campo esterno': '🏀',
      'area ristoro': '🍕'
    };
    
    return iconMap[servizio.toLowerCase()] || '✅';
  }

  get hasPalestre(): boolean {
    return this.palestre.length > 0;
  }

  get numPalestrePrenotabili(): number {
    return this.palestre.filter(p => p.prenotabile).length;
  }

  // Redirect alle prenotazioni invece di implementare la logica qui
  bookPalestra(palestra: Palestra): void {
    if (!palestra.prenotabile) {
      console.warn(`⚠️ Palestra ${palestra.nome} non prenotabile`);
      return;
    }

    // Naviga alla pagina prenotazioni passando l'ID della palestra come query param
    this.router.navigate(['/servizi/prenotazioni'], { 
      queryParams: { 
        palestra: palestra.id,
        nome: palestra.nome 
      } 
    });
  }

  trackByPalestra(index: number, palestra: Palestra): number {
    return palestra.id;
  }

  getMinDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}