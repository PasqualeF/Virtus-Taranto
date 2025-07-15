import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { PalestreService, Palestra } from 'src/app/core/service/palestre.service';

declare const google: any;

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
export class PalestreComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapElement', { static: false }) mapElement!: ElementRef;
  
  // Stato componente
  map: any;
  activeTab: number = 0;
  markers: any[] = [];
  isMobile: boolean = false;
  isLoading = true;
  errorMessage = '';
  googleMapsLoaded = false;
  
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

  constructor(private palestreService: PalestreService) {
    this.checkMobileState();
    
    // Listener per resize con cleanup
    const resizeListener = () => this.checkMobileState();
    window.addEventListener('resize', resizeListener);
    this.eventListeners.push(() => window.removeEventListener('resize', resizeListener));
  }

  ngOnInit(): void {
    this.loadPalestre();
    this.loadStats();
    this.setupGoogleMapsListeners();
  }

  ngAfterViewInit(): void {
    
    // Prova a inizializzare la mappa se Google Maps è già caricato
    if (this.googleMapsLoaded && this.mapElement) {
      setTimeout(() => {
        this.initMap();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    // Cleanup event listeners
    this.eventListeners.forEach(cleanup => cleanup());
    
    // Cleanup markers
    this.clearMarkers();
    
    // Cleanup mappa
    if (this.map) {
      this.map = null;
    }
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
        
        // Aggiorna la mappa se è già inizializzata
        if (this.map && palestre.length > 0) {
          this.addMarkers();
          this.fitMapToBounds();
        }
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

    // Inizializza la mappa se è disponibile
    if (this.googleMapsLoaded && this.mapElement && !this.map) {
      setTimeout(() => {
        this.initMap();
      }, 500);
    }
  }

  private setupGoogleMapsListeners(): void {
    
    // Listener per l'evento custom
    const mapsReadyListener = () => {
      this.googleMapsLoaded = true;
      
      // Prova a inizializzare la mappa se l'elemento è disponibile
      if (this.mapElement) {
        setTimeout(() => {
          this.initMap();
        }, 100);
      } else {
        // Riprova dopo un po' se l'elemento non è ancora disponibile
        setTimeout(() => {
          if (this.mapElement) {
            this.initMap();
          }
        }, 1000);
      }
    };
    
    window.addEventListener('google-maps-ready', mapsReadyListener);
    this.eventListeners.push(() => window.removeEventListener('google-maps-ready', mapsReadyListener));
    
    // Controlla se Google Maps è già disponibile
    if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
      this.googleMapsLoaded = true;
      
      if (this.mapElement) {
        setTimeout(() => {
          this.initMap();
        }, 100);
      }
    }
  }

  initMap(): void {
   
    
    // Verifica prerequisiti
    if (!this.validateMapPrerequisites()) {
      return;
    }
    
    try {
      this.setupMapElement();
      
      const defaultCenter = { lat: 40.4686, lng: 17.2403 };
      
      
      this.map = new google.maps.Map(this.mapElement.nativeElement, {
        center: defaultCenter,
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        styles: this.getMapStyles()
      });
            
      // Aggiungi markers se abbiamo palestre
      if (this.palestre.length > 0) {
        this.addMarkers();
        this.fitMapToBounds();
      }
      
      // Trigger resize per rendering corretto
      setTimeout(() => {
        google.maps.event.trigger(this.map, 'resize');
      }, 300);
      
    } catch (error) {
      console.error('❌ Errore durante inizializzazione mappa:', error);
      this.errorMessage = 'Errore nel caricamento della mappa';
    }
  }

  private validateMapPrerequisites(): boolean {
    if (!this.googleMapsLoaded || typeof google === 'undefined' || typeof google.maps === 'undefined') {
      console.error('❌ Google Maps API non disponibile');
      return false;
    }
    
    if (!this.mapElement) {
      console.error('❌ ViewChild mapElement non disponibile');
      return false;
    }
    
    if (!this.mapElement.nativeElement) {
      console.error('❌ Elemento DOM mappa non trovato');
      return false;
    }
    
    return true;
  }

  private setupMapElement(): void {
    const element = this.mapElement.nativeElement;
    element.style.width = '100%';
    element.style.height = '100%';
    element.style.minHeight = '400px';
  }

  private getMapStyles(): any[] {
    return [
      {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{"color": "#193341"}]
      },
      {
        "featureType": "landscape",
        "elementType": "geometry", 
        "stylers": [{"color": "#2c5a71"}]
      },
      {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [{"color": "#4a5568"}]
      }
    ];
  }

  addMarkers(): void {
    if (!this.map) {
      return;
    }
    
    
    this.clearMarkers();
    
    this.palestre.forEach((palestra, index) => {
      this.createMarkerForPalestra(palestra, index);
    });
    
  }

  private createMarkerForPalestra(palestra: Palestra, index: number): void {
    try {
      if (!this.validateCoordinates(palestra)) {
        console.warn(`⚠️ Coordinate non valide per ${palestra.nome}`);
        return;
      }
      
      const marker = new google.maps.Marker({
        position: { lat: palestra.lat, lng: palestra.lng },
        map: this.map,
        title: palestra.nome,
        animation: google.maps.Animation.DROP,
        icon: this.getMarkerIcon(palestra)
      });
      
      const infoWindow = this.createInfoWindow(palestra);
      
      marker.addListener('click', () => {
        this.handleMarkerClick(marker, infoWindow, palestra);
      });
      
      (marker as any).infoWindow = infoWindow;
      (marker as any).palestraData = palestra;
      this.markers.push(marker);
      
    } catch (error) {
      console.error(`❌ Errore nell'aggiunta del marker per ${palestra.nome}:`, error);
    }
  }

  private validateCoordinates(palestra: Palestra): boolean {
    return !isNaN(palestra.lat) && !isNaN(palestra.lng) && 
           palestra.lat !== 0 && palestra.lng !== 0;
  }

  private getMarkerIcon(palestra: Palestra): any {
    const iconColor = palestra.prenotabile ? '#3b82f6' : '#6b7280';
    
    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: iconColor,
      fillOpacity: 0.8,
      strokeColor: '#ffffff',
      strokeWeight: 2
    };
  }

  private createInfoWindow(palestra: Palestra): any {
    const prenotabileIcon = palestra.prenotabile ? '📅' : '🏢';
    const serviziText = palestra.servizi.length > 0 ? 
      palestra.servizi.slice(0, 3).join(', ') + 
      (palestra.servizi.length > 3 ? '...' : '') : 
      'Nessun servizio specificato';

    const infoContent = `
      <div style="padding: 15px; max-width: 250px; font-family: 'Inter', sans-serif;">
        <h3 style="margin: 0 0 8px; color: #3b82f6; font-size: 16px; font-weight: 600;">
          ${prenotabileIcon} ${palestra.nome}
        </h3>
        <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280; line-height: 1.4;">
          📍 ${palestra.indirizzo}
        </p>
        <p style="margin: 0 0 10px; font-size: 11px; color: #9ca3af;">
          🏷️ ${serviziText}
        </p>
        ${palestra.prenotabile ? 
          '<div style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 10px; text-align: center;">📅 Prenotabile</div>' : 
          '<div style="background: #f3f4f6; color: #6b7280; padding: 4px 8px; border-radius: 4px; font-size: 10px; text-align: center;">🏢 Solo visite</div>'
        }
      </div>
    `;
    
    return new google.maps.InfoWindow({
      content: infoContent
    });
  }

  private handleMarkerClick(marker: any, infoWindow: any, palestra: Palestra): void {
    this.markers.forEach(m => {
      if ((m as any).infoWindow && (m as any).infoWindow !== infoWindow) {
        (m as any).infoWindow.close();
      }
    });
    
    infoWindow.open({
      anchor: marker,
      map: this.map
    });
    
    this.showDetails(palestra);
  }

  private clearMarkers(): void {
    this.markers.forEach(marker => {
      if (marker.setMap) {
        marker.setMap(null);
      }
    });
    this.markers = [];
  }

  private fitMapToBounds(): void {
    if (!this.map || this.palestre.length === 0) return;

    try {
      const bounds = new google.maps.LatLngBounds();
      
      this.palestre.forEach(palestra => {
        if (this.validateCoordinates(palestra)) {
          bounds.extend({ lat: palestra.lat, lng: palestra.lng });
        }
      });
      
      if (this.palestre.length === 1) {
        this.map.setCenter(bounds.getCenter());
        this.map.setZoom(15);
      } else {
        this.map.fitBounds(bounds);
      }
      
    } catch (error) {
      console.error('❌ Errore nell\'adattamento dei bounds:', error);
    }
  }

  showDetails(palestra: Palestra): void {
    
    this.selectedPalestra = palestra;
    this.detailState = 'expanded';
    this.activeTab = 0;
    
    this.animateMarkerForPalestra(palestra);
  }

  private animateMarkerForPalestra(palestra: Palestra): void {
    if (!this.map) return;
    
    setTimeout(() => {
      try {
        const marker = this.markers.find(m => 
          (m as any).palestraData && (m as any).palestraData.id === palestra.id
        );
        
        if (marker) {
          marker.setAnimation(google.maps.Animation.BOUNCE);
          this.map.panTo(marker.getPosition());
          
          setTimeout(() => {
            marker.setAnimation(null);
          }, 1500);
        }
      } catch (error) {
        console.error('❌ Errore durante animazione marker:', error);
      }
    }, 500);
  }

  closeDetails(): void {
    this.detailState = 'collapsed';
    setTimeout(() => {
      this.selectedPalestra = null;
    }, 300);
  }
  
  changeTab(tabIndex: number): void {
    this.activeTab = tabIndex;
    
    // Se passiamo alla tab della mappa
    if (tabIndex === 1) {
      // Se la mappa non è inizializzata ma Google Maps è caricato
      if (!this.map && this.googleMapsLoaded && this.mapElement) {
        setTimeout(() => {
          this.initMap();
        }, 300);
      }
      
      // Se la mappa esiste, triggera un resize
      if (this.map) {
        setTimeout(() => {
          google.maps.event.trigger(this.map, 'resize');
          if (this.palestre.length > 0) {
            this.fitMapToBounds();
          }
        }, 300);
      }
    }
  }
  
  getDirections(palestra: Palestra): void {
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${palestra.lat},${palestra.lng}&destination_place_id=${encodeURIComponent(palestra.nome)}`;
    window.open(url, '_blank');
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
        
        if (this.map) {
          this.addMarkers();
          this.fitMapToBounds();
        }
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
          
          if (this.map) {
            this.addMarkers();
            this.fitMapToBounds();
          }
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
            
            if (this.map) {
              this.addMarkers();
              this.fitMapToBounds();
            }
          },
          error: (error) => {
            this.isLoading = false;
            this.loadPalestre();
          }
        });
      },
      (error) => {
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

  bookPalestra(palestra: Palestra): void {
    if (!palestra.prenotabile) {
      console.warn(`⚠️ Palestra ${palestra.nome} non prenotabile`);
      return;
    }

    alert(`Prenotazione per ${palestra.nome} sarà disponibile a breve!`);
  }

  trackByPalestra(index: number, palestra: Palestra): number {
    return palestra.id;
  }

  getMinDate(): string {
    return new Date().toISOString().split('T')[0];
  }


}