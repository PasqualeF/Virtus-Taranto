import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

declare const google: any;

interface Palestra {
  id: number;
  nome: string;
  immagine: string;
  descrizione: string;
  indirizzo: string;
  orari?: { giorno: string; orario: string }[];
  servizi?: string[];
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-palestre',
  templateUrl: './palestre.component.html',
  styleUrls: ['./palestre.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('600ms', style({ opacity: 1 })),
      ]),
    ]),
    trigger('flipIn', [
      transition(':enter', [
        style({ transform: 'rotateY(90deg)' }),
        animate('600ms ease-out', style({ transform: 'rotateY(0deg)' })),
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
export class PalestreComponent implements OnInit, AfterViewInit {
  @ViewChild('mapElement') mapElement!: ElementRef;
  
  map: any;
  activeTab: number = 0;
  markers: any[] = [];
  isMobile: boolean = false;
  
  palestre: Palestra[] = [
    {
      id: 1,
      nome: 'PalaFiom',
      immagine: 'assets/palestre/archimede_1.jpg',
      descrizione: 'Il nostro campo principale, casa delle partite più emozionanti. Struttura recentemente rinnovata con pavimentazione in parquet di ultima generazione, dotata di tribune per 500 spettatori e impianto di illuminazione LED.',
      indirizzo: 'Via Lago di Trasimeno, 74121 Taranto TA',
      orari: [
        { giorno: 'Lun-Ven', orario: '9:00 - 22:00' },
        { giorno: 'Sabato', orario: '10:00 - 20:00' },
        { giorno: 'Domenica', orario: '10:00 - 18:00' }
      ],
      servizi: ['Parcheggio', 'Spogliatoi', 'Bar', 'Wi-Fi'],
      lat: 40.4686,
      lng: 17.2403
    },
    {
      id: 2,
      nome: 'Palestra Falanto',
      immagine: 'assets/palestre/martellotta.jpg',
      descrizione: 'Una struttura moderna per allenamenti di alto livello. Ideale per sessioni di allenamento intensivo e per le attività delle nostre squadre giovanili, con attrezzature all\'avanguardia.',
      indirizzo: 'Via Lago di Como, 74121 Taranto TA',
      orari: [
        { giorno: 'Lun-Ven', orario: '8:30 - 21:30' },
        { giorno: 'Sabato', orario: '9:00 - 19:00' },
        { giorno: 'Domenica', orario: 'Chiuso' }
      ],
      servizi: ['Parcheggio', 'Spogliatoi', 'Sala pesi', 'Area medica'],
      lat: 40.4756, 
      lng: 17.2518
    },
    {
      id: 3,
      nome: 'Centro Sportivo Magna Grecia',
      immagine: 'assets/palestre/magna_grecia.jpg',
      descrizione: 'Complesso multisport con campi da basket indoor e outdoor. Ospita i nostri camp estivi e le attività di minibasket per i più piccoli.',
      indirizzo: 'Via Magna Grecia 123, 74121 Taranto TA',
      orari: [
        { giorno: 'Lun-Ven', orario: '9:00 - 22:00' },
        { giorno: 'Sab-Dom', orario: '10:00 - 20:00' }
      ],
      servizi: ['Parcheggio', 'Campo esterno', 'Spogliatoi', 'Area ristoro'],
      lat: 40.4636,
      lng: 17.2503
    }
  ];
  
  selectedPalestra: Palestra | null = null;
  detailState: 'collapsed' | 'expanded' = 'collapsed';

  constructor() {
    // Controlla se siamo su mobile
    this.isMobile = window.innerWidth < 768;
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth < 768;
    });
  }

  ngOnInit(): void {
    // Ascolta l'evento di caricamento di Google Maps
    window.addEventListener('google-maps-ready', () => {
      console.log('Evento google-maps-ready ricevuto');
      // Inizializza la mappa quando l'API è caricata
      setTimeout(() => {
        this.initMap();
      }, 100);
    });
    
    // Se Google Maps è già stato caricato, inizializza la mappa
    if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
      console.log('Google Maps già disponibile');
      setTimeout(() => {
        this.initMap();
      }, 100);
    }
  }
  
  ngAfterViewInit(): void {
    // Utilizziamo un timeout più lungo per assicurarci che il DOM sia completamente renderizzato
    // e che l'API di Google Maps sia caricata
    setTimeout(() => {
      this.initMap();
    }, 500);
  }
  
  initMap(): void {
    console.log("Inizializzazione mappa...");
    
    // Verifica se l'API di Google Maps è disponibile
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
      console.error('Google Maps API non disponibile. Verifica che lo script sia caricato correttamente.');
      return;
    }
    
    // Verifica se abbiamo un elemento mappa nel DOM
    if (!this.mapElement) {
      console.error('Elemento mappa non trovato nel DOM. Verifica il template HTML.');
      return;
    }
    
    // Verifica che l'elemento nativeElement sia disponibile
    if (!this.mapElement.nativeElement) {
      console.error('mapElement.nativeElement non disponibile');
      return;
    }
    
    console.log("Elemento mappa trovato:", this.mapElement.nativeElement);
    
    try {
      // Imposta dimensioni esplicite per il contenitore della mappa
      this.mapElement.nativeElement.style.width = '100%';
      this.mapElement.nativeElement.style.height = '100%';
      
      // Definisci un centro predefinito (Taranto)
      const defaultCenter = { lat: 40.4686, lng: 17.2403 };
      
      // Inizializza la mappa con opzioni di base
      this.map = new google.maps.Map(this.mapElement.nativeElement, {
        center: defaultCenter,
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        styles: [
          {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{"color": "#193341"}]
          },
          {
            "featureType": "landscape",
            "elementType": "geometry",
            "stylers": [{"color": "#2c5a71"}]
          }
        ]
      });
      
      console.log("Mappa creata:", this.map);
      
      // Calcola il centro della mappa basato sulle palestre
      if (this.palestre.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        this.palestre.forEach(palestra => {
          bounds.extend({ lat: palestra.lat, lng: palestra.lng });
        });
        
        // Aggiungi i marker
        this.addMarkers();
        
        // Adatta la mappa per mostrare tutti i marker
        setTimeout(() => {
          this.map.fitBounds(bounds);
        }, 200);
      }
      
      // Trigger resize per assicurarsi che la mappa si renderizzi correttamente
      setTimeout(() => {
        google.maps.event.trigger(this.map, 'resize');
      }, 300);
      
    } catch (error) {
      console.error('Errore durante l\'inizializzazione della mappa:', error);
    }
  }
  
  addMarkers(): void {
    if (!this.map) {
      console.error('Impossibile aggiungere marker: mappa non inizializzata');
      return;
    }
    
    console.log('Aggiunta marker alla mappa...');
    
    // Rimuovi i marker esistenti
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];
    
    // Aggiungi i nuovi marker
    this.palestre.forEach(palestra => {
      try {
        // Verifica che le coordinate siano valide
        if (!palestra.lat || !palestra.lng) {
          console.warn(`Coordinate non valide per la palestra ${palestra.nome}`);
          return;
        }
        
        const marker = new google.maps.Marker({
          position: { lat: palestra.lat, lng: palestra.lng },
          map: this.map,
          title: palestra.nome,
          animation: google.maps.Animation.DROP
        });
        
        // Aggiungi info window con dettagli
        const infoContent = `
          <div style="padding: 10px; max-width: 200px;">
            <h3 style="margin: 0 0 5px; color: #3b82f6;">${palestra.nome}</h3>
            <p style="margin: 0 0 10px; font-size: 12px;">${palestra.indirizzo}</p>
          </div>
        `;
        
        const infoWindow = new google.maps.InfoWindow({
          content: infoContent
        });
        
        // Aggiungi event listener per il click sul marker
        marker.addListener('click', () => {
          // Chiudi tutte le altre info window
          this.markers.forEach(m => {
            if (m.infoWindow && m.infoWindow !== infoWindow) {
              m.infoWindow.close();
            }
          });
          
          // Apri questa info window
          infoWindow.open({
            anchor: marker,
            map: this.map
          });
          
          // Memorizza l'info window aperta
          marker.infoWindow = infoWindow;
          
          // Mostra i dettagli nel modale
          this.showDetails(palestra);
        });
        
        // Salva il marker nell'array
        marker.infoWindow = infoWindow;
        this.markers.push(marker);
        
      } catch (error) {
        console.error(`Errore nell'aggiunta del marker per ${palestra.nome}:`, error);
      }
    });
    
    console.log(`Aggiunti ${this.markers.length} marker alla mappa`);
  }

  showDetails(palestra: Palestra): void {
    this.selectedPalestra = palestra;
    this.detailState = 'expanded';
    this.activeTab = 0;
    
    // Se la mappa è disponibile, centra sul marker selezionato
    if (this.map) {
      setTimeout(() => {
        try {
          const marker = this.markers.find(m => 
            m.getPosition().lat() === palestra.lat && 
            m.getPosition().lng() === palestra.lng
          );
          
          if (marker) {
            // Anima il marker
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(() => {
              marker.setAnimation(null);
            }, 1500);
          }
        } catch (error) {
          console.error('Errore durante la gestione del marker:', error);
        }
      }, 500);
    }
  }

  closeDetails(): void {
    this.detailState = 'collapsed';
    setTimeout(() => {
      this.selectedPalestra = null;
    }, 300);
  }
  
  changeTab(tabIndex: number): void {
    this.activeTab = tabIndex;
    
    // Se passiamo alla tab della mappa e la mappa non è ancora inizializzata, inizializzala
    if (tabIndex === 1 && !this.map) {
      console.log('Cambio alla tab della mappa, inizializzazione mappa...');
      setTimeout(() => {
        this.initMap();
      }, 300);
    }
    
    // Se la mappa esiste già, triggera un resize per assicurarsi che si renderizzi correttamente
    if (tabIndex === 1 && this.map) {
      setTimeout(() => {
        google.maps.event.trigger(this.map, 'resize');
      }, 300);
    }
  }
  
  getDirections(palestra: Palestra): void {
    // Apre Google Maps con le indicazioni stradali
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${palestra.lat},${palestra.lng}`, '_blank');
  }
}