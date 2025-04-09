// src/app/components/media/media.component.ts

import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Societa } from '../../core/models/societa.model';
import { Foto, Video, Articolo, MediaData, SocietaMediaMap } from '../../core/models/media.model';

@Component({
  selector: 'app-media',
  templateUrl: './media-gallery.component.html',
  styleUrls: ['./media-gallery.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('600ms', style({ opacity: 1 })),
      ]),
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(50px)', opacity: 0 }),
        animate('600ms ease-out', style({ transform: 'translateY(0)', opacity: 1 })),
      ]),
    ])
  ]
})
export class MediaComponent implements OnInit {
  societa: Societa[] = [];
  selectedSocieta: Societa | null = null;
  activeTab: 'foto' | 'video' | 'rassegna' = 'foto';
  
  // Dati media per società
  mediaData: SocietaMediaMap = {};
  
  // Dati filtrati
  filteredFoto: Foto[] = [];
  filteredVideo: Video[] = [];
  filteredArticoli: Articolo[] = [];
  
  // Filtri
  filtroStagione: string = 'all';
  filtroCategoria: string = 'all';
  filtroAnno: string = 'all';
  filtroFonte: string = 'all';
  
  // Liste per i filtri
  stagioni: string[] = [];
  categorie: string[] = [];
  anni: string[] = [];
  fonti: string[] = [];
  
  // Paginazione
  currentPage: number = 1;
  pageSize: number = 6;
  totalPages: number = 1;
  
  // Lightbox e Video modal
  lightboxActive: boolean = false;
  videoModalActive: boolean = false;
  currentLightboxItem: Foto | null = null;
  lightboxIndex: number = 0;
  currentVideo: Video | null = null;

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    // Mock dei dati delle società
    this.societa = [
      {
        nome: 'Basket Club Junior',
        logo: 'assets/images/logo-bcj.png',
        valori: ['Integrità', 'Rispetto', 'Lavoro di squadra', 'Eccellenza'],
        palmares: [
          { anno: '2023', titolo: 'Campionato Under 16', descrizione: 'Vincitori del campionato regionale Under 16' },
          { anno: '2022', titolo: 'Coppa Regionale', descrizione: 'Finalisti della coppa regionale Under 14' }
        ],
        storia: '',
        descrizione: '',
        indirizzo: '',
        telefono: '',
        email: '',
        sito: '',
        documentoUrl: ''
      },
      {
        nome: 'Pallacanestro Giovani',
        logo: 'assets/images/logo-pg.png',
        valori: ['Passione', 'Disciplina', 'Crescita', 'Divertimento'],
        palmares: [
          { anno: '2023', titolo: 'Torneo Estivo', descrizione: 'Vincitori del torneo estivo Under 18' },
          { anno: '2021', titolo: 'Campionato Under 13', descrizione: 'Campioni regionali Under 13' }
        ],
        storia: '',
        descrizione: '',
        indirizzo: '',
        telefono: '',
        email: '',
        sito: '',
        documentoUrl: ''
      }
    ];
    
    if (this.societa.length > 0) {
      this.selectedSocieta = this.societa[0];
      
      // Mock dei dati media
      this.mediaData = this.getMockMediaData();
      
      // Carica i dati per la società selezionata
      this.loadMediaData();
    }
  }
  
  private getMockMediaData(): SocietaMediaMap {
    // Dati di esempio per simulare il ritorno da un'API
    return {
      'Basket Club Junior': {
        foto: [
          {
            id: 1,
            url: 'assets/palestre/archimede_1.jpg',
            thumbnail: 'assets/palestre/archimede_1.jpg',
            titolo: 'Finale Under 16',
            descrizione: 'Premiazione della squadra dopo la vittoria del campionato Under 16',
            data: new Date('2023-05-15'),
            categoria: 'Under 16',
            stagione: '2022/2023'
          },
          {
            id: 2,
            url: 'assets/test.jpg',
            thumbnail: 'assets/test.jpg',
            titolo: 'Allenamento Under 14',
            descrizione: 'Sessione di allenamento della squadra Under 14',
            data: new Date('2023-02-10'),
            categoria: 'Under 14',
            stagione: '2022/2023'
          },
          {
            id: 3,
            url: 'assets/images/media/foto3.jpg',
            thumbnail: 'assets/images/media/foto3_thumb.jpg',
            titolo: 'Camp Estivo 2022',
            descrizione: 'I ragazzi durante il camp estivo 2022',
            data: new Date('2022-07-20'),
            categoria: 'Camp',
            stagione: '2021/2022'
          }
        ],
        video: [
          {
            id: 1,
            url: 'https://www.youtube.com/embed/SnuHTMAiV3I?si=oDRx6QfykQbwBA6i',
            thumbnail: 'assets/test.jpg',
            titolo: 'Highlights Finale Under 16',
            descrizione: 'I momenti salienti della finale del campionato Under 16',
            data: new Date('2023-05-16'),
            categoria: 'Under 16',
            stagione: '2022/2023'
          },
          {
            id: 2,
            url: 'https://www.youtube.com/embed/def456',
            thumbnail: 'assets/images/media/video2_thumb.jpg',
            titolo: 'Intervista Coach Marco',
            descrizione: 'Intervista al nostro coach dopo la vittoria del campionato',
            data: new Date('2023-05-18'),
            categoria: 'Interviste',
            stagione: '2022/2023'
          }
        ],
        articoli: [
          {
            id: 1,
            titolo: 'Il Basket Club Junior conquista il titolo Under 16',
            excerpt: 'La squadra Under 16 si è aggiudicata il campionato regionale battendo in finale...',
            contenuto: 'Articolo completo sulla vittoria del campionato...',
            data: new Date('2023-05-17'),
            fonte: 'Gazzetta dello Sport',
            anno: '2023'
          },
          {
            id: 2,
            titolo: 'Intervista al presidente del Basket Club Junior',
            excerpt: 'Abbiamo incontrato il presidente che ci ha parlato dei progetti futuri...',
            contenuto: 'Intervista completa al presidente...',
            data: new Date('2023-04-10'),
            fonte: 'Basket Magazine',
            anno: '2023'
          },
          {
            id: 3,
            titolo: 'Successo per il camp estivo 2022',
            excerpt: 'Grande partecipazione al camp estivo organizzato dal Basket Club Junior...',
            contenuto: 'Articolo completo sul camp estivo...',
            data: new Date('2022-08-05'),
            fonte: 'Giornale Locale',
            anno: '2022'
          }
        ]
      },
      'Pallacanestro Giovani': {
        foto: [
          {
            id: 4,
            url: 'assets/images/media/foto4.jpg',
            thumbnail: 'assets/images/media/foto4_thumb.jpg',
            titolo: 'Torneo Estivo Under 18',
            descrizione: 'La squadra Under 18 vincitrice del torneo estivo',
            data: new Date('2023-07-30'),
            categoria: 'Under 18',
            stagione: '2022/2023'
          },
          {
            id: 5,
            url: 'assets/images/media/foto5.jpg',
            thumbnail: 'assets/images/media/foto5_thumb.jpg',
            titolo: 'Minibasket in piazza',
            descrizione: 'Evento promozionale di minibasket in piazza',
            data: new Date('2023-06-15'),
            categoria: 'Minibasket',
            stagione: '2022/2023'
          }
        ],
        video: [
          {
            id: 3,
            url: 'https://www.youtube.com/embed/ghi789',
            thumbnail: 'assets/images/media/video3_thumb.jpg',
            titolo: 'Torneo Under 18 - Best Plays',
            descrizione: 'Le migliori giocate del torneo estivo Under 18',
            data: new Date('2023-08-02'),
            categoria: 'Under 18',
            stagione: '2022/2023'
          }
        ],
        articoli: [
          {
            id: 4,
            titolo: 'Pallacanestro Giovani trionfa nel torneo estivo',
            excerpt: 'La squadra Under 18 ha dominato il torneo estivo cittadino...',
            contenuto: 'Articolo completo sulla vittoria del torneo...',
            data: new Date('2023-08-01'),
            fonte: 'Sport Locale',
            anno: '2023'
          },
          {
            id: 5,
            titolo: 'Nuovo progetto minibasket per Pallacanestro Giovani',
            excerpt: 'Al via il nuovo progetto di minibasket nelle scuole elementari...',
            contenuto: 'Articolo completo sul progetto minibasket...',
            data: new Date('2023-09-05'),
            fonte: 'Giornale Locale',
            anno: '2023'
          }
        ]
      }
    };
  }
  
  private loadMediaData(): void {
    if (!this.selectedSocieta) return;
    
    if (this.mediaData[this.selectedSocieta.nome]) {
      // Recupera i dati della società selezionata
      const societaMedia = this.mediaData[this.selectedSocieta.nome];
      
      // Popola le liste per i filtri
      this.populateFilterLists(societaMedia);
      
      // Filtra i media in base ai filtri attuali
      this.filtraMedia();
    } else {
      // Reset dei dati filtrati se non ci sono dati
      this.resetFilteredData();
    }
  }
  
  populateFilterLists(mediaData: MediaData): void {
    // Reset delle liste
    this.stagioni = [];
    this.categorie = [];
    this.anni = [];
    this.fonti = [];
    
    // Populate stagioni e categorie da foto e video
    const stagioniSet = new Set<string>();
    const categorieSet = new Set<string>();
    
    // Raccogli stagioni e categorie da foto
    mediaData.foto.forEach(foto => {
      stagioniSet.add(foto.stagione);
      categorieSet.add(foto.categoria);
    });
    
    // Raccogli stagioni e categorie da video
    mediaData.video.forEach(video => {
      stagioniSet.add(video.stagione);
      categorieSet.add(video.categoria);
    });
    
    // Raccogli anni e fonti da articoli
    const anniSet = new Set<string>();
    const fontiSet = new Set<string>();
    
    mediaData.articoli.forEach(articolo => {
      anniSet.add(articolo.anno);
      fontiSet.add(articolo.fonte);
    });
    
    // Converti i Set in array e ordina
    this.stagioni = Array.from(stagioniSet).sort((a, b) => b.localeCompare(a)); // Ordine decrescente
    this.categorie = Array.from(categorieSet).sort();
    this.anni = Array.from(anniSet).sort((a, b) => b.localeCompare(a)); // Ordine decrescente
    this.fonti = Array.from(fontiSet).sort();
  }
  
  resetFilteredData(): void {
    this.filteredFoto = [];
    this.filteredVideo = [];
    this.filteredArticoli = [];
    this.currentPage = 1;
    this.totalPages = 1;
  }
  
  selectSocieta(societa: Societa): void {
    this.selectedSocieta = societa;
    this.currentPage = 1;
    this.filtroStagione = 'all';
    this.filtroCategoria = 'all';
    this.filtroAnno = 'all';
    this.filtroFonte = 'all';
    this.loadMediaData();
  }
  
  setActiveTab(tab: 'foto' | 'video' | 'rassegna'): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.filtraMedia();
  }
  
  // Handler per i cambiamenti dei filtri
  onStagioneChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filtroStagione = select.value;
    this.filtraMedia();
  }
  
  onCategoriaChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filtroCategoria = select.value;
    this.filtraMedia();
  }
  
  onAnnoChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filtroAnno = select.value;
    this.filtraMedia();
  }
  
  onFonteChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filtroFonte = select.value;
    this.filtraMedia();
  }
  
  filtraMedia(): void {
    if (!this.selectedSocieta || !this.mediaData[this.selectedSocieta.nome]) {
      this.resetFilteredData();
      return;
    }
    
    const mediaData = this.mediaData[this.selectedSocieta.nome];
    
    // Filtra foto
    if (this.activeTab === 'foto') {
      this.filteredFoto = mediaData.foto.filter(foto => {
        return (this.filtroStagione === 'all' || foto.stagione === this.filtroStagione) &&
               (this.filtroCategoria === 'all' || foto.categoria === this.filtroCategoria);
      });
      this.totalPages = Math.ceil(this.filteredFoto.length / this.pageSize);
    }
    
    // Filtra video
    else if (this.activeTab === 'video') {
      this.filteredVideo = mediaData.video.filter(video => {
        return (this.filtroStagione === 'all' || video.stagione === this.filtroStagione) &&
               (this.filtroCategoria === 'all' || video.categoria === this.filtroCategoria);
      });
      this.totalPages = Math.ceil(this.filteredVideo.length / this.pageSize);
    }
    
    // Filtra articoli
    else if (this.activeTab === 'rassegna') {
      this.filteredArticoli = mediaData.articoli.filter(articolo => {
        return (this.filtroAnno === 'all' || articolo.anno === this.filtroAnno) &&
               (this.filtroFonte === 'all' || articolo.fonte === this.filtroFonte);
      });
      this.totalPages = Math.ceil(this.filteredArticoli.length / this.pageSize);
    }
    
    // Reset della pagina se necessario
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }
  
  changePage(direction: 'prev' | 'next'): void {
    if (direction === 'prev' && this.currentPage > 1) {
      this.currentPage--;
    } else if (direction === 'next' && this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
  
  // Lightbox per le foto
  openLightbox(foto: Foto): void {
    this.currentLightboxItem = foto;
    this.lightboxIndex = this.filteredFoto.findIndex(f => f.id === foto.id);
    this.lightboxActive = true;
    document.body.style.overflow = 'hidden'; // Disabilita lo scroll
  }
  
  closeLightbox(): void {
    this.lightboxActive = false;
    this.currentLightboxItem = null;
    document.body.style.overflow = ''; // Ripristina lo scroll
  }
  
  prevLightboxItem(): void {
    if (this.lightboxIndex > 0) {
      this.lightboxIndex--;
      this.currentLightboxItem = this.filteredFoto[this.lightboxIndex];
    }
  }
  
  nextLightboxItem(): void {
    if (this.lightboxIndex < this.filteredFoto.length - 1) {
      this.lightboxIndex++;
      this.currentLightboxItem = this.filteredFoto[this.lightboxIndex];
    }
  }
  
  // Modal per i video
  playVideo(video: Video): void {
    this.currentVideo = video;
    this.videoModalActive = true;
    document.body.style.overflow = 'hidden'; // Disabilita lo scroll
  }
  
  closeVideoModal(): void {
    this.videoModalActive = false;
    this.currentVideo = null;
    document.body.style.overflow = ''; // Ripristina lo scroll
  }
  
  // Sanitizzazione URL per sicurezza
  sanitizeVideoUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  
  // Apertura articolo
  apriArticolo(articolo: Articolo): void {
    // Se c'è un URL esterno, apri in una nuova finestra
    if (articolo.url) {
      window.open(articolo.url, '_blank');
    } else {
      // Altrimenti, implementa la visualizzazione interna dell'articolo
      // Per ora, potremmo usare un approccio semplice con localStorage e navigazione
      localStorage.setItem('articoloCorrente', JSON.stringify(articolo));
      this.router.navigate(['/who-else/media/articolo', articolo.id]);
    }
  }
  
  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}