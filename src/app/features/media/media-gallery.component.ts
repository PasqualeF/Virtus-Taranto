// src/app/components/media/media-gallery.component.ts

import { Component, OnInit, HostListener } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

// Interfaccia semplificata per le immagini
interface MediaItem {
  id: number;
  url: string;
  thumbnail: string;
  nome: string;
  tipo: 'foto' | 'video';
}

// Interfaccia per i video
interface Video {
  id: number;
  url: string;
  thumbnail: string;
  titolo: string;
  embedUrl?: string;
}

@Component({
  selector: 'app-media-gallery',
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
  activeTab: 'foto' | 'video' = 'foto';
  isMobile: boolean = false;
  loading: boolean = false;
  
  // Dati media
  allFoto: MediaItem[] = [];
  allVideo: Video[] = [];
  filteredFoto: MediaItem[] = [];
  filteredVideo: Video[] = [];
  
  // Paginazione
  currentPage: number = 1;
  pageSize: number = 12;
  totalPages: number = 1;
  
  // Lightbox e Video modal
  lightboxActive: boolean = false;
  videoModalActive: boolean = false;
  currentLightboxItem: MediaItem | null = null;
  lightboxIndex: number = 0;
  currentVideo: Video | null = null;

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.loadMediaFromAssets();
  }

  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  private loadMediaFromAssets(): void {
    this.loading = true;
    
    // Simulazione di caricamento asincrono
    setTimeout(() => {
      this.loadFotoFromAssets();
      this.loadVideoFromAssets();
      this.filterMedia();
      this.loading = false;
    }, 500);
  }

  private loadFotoFromAssets(): void {
    // Lista delle immagini presenti in assets/media
    // Questa lista può essere generata dinamicamente o mantenuta manualmente
    const imageFiles = [
  '1.jpg',
  '2.jpg',
  '3.jpg',
  '4.jpg',
  '5.jpg',
  '6.jpg',
  '7.jpg',
  '8.jpg',
  '9.jpg',
  '10.jpg',
  '11.jpg',
  '12.jpg',
  '13.jpg', 
  '14.jpg',
  '15.jpg',
  '16.jpg',
  '17.jpg',
  '18.jpg',
  '19.jpg',
  '20.jpg'
];


    this.allFoto = imageFiles.map((fileName, index) => ({
      id: index + 1,
      url: `assets/media/${fileName}`,
      thumbnail: `assets/media/${fileName}`, // Usa la stessa immagine come thumbnail
      nome: this.getFileNameWithoutExtension(fileName),
      tipo: 'foto' as const
    }));
  }

  private loadVideoFromAssets(): void {
    // Lista dei video mockati - in un'implementazione reale potresti leggerli da una configurazione
    this.allVideo = [
      
    ];
  }

  private getFileNameWithoutExtension(fileName: string): string {
    return fileName.split('.')[0].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  setActiveTab(tab: 'foto' | 'video'): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.filterMedia();
  }

  private filterMedia(): void {
    if (this.activeTab === 'foto') {
      this.filteredFoto = [...this.allFoto];
      this.totalPages = Math.ceil(this.filteredFoto.length / this.pageSize);
    } else if (this.activeTab === 'video') {
      this.filteredVideo = [...this.allVideo];
      this.totalPages = Math.ceil(this.filteredVideo.length / this.pageSize);
    }
    
    // Reset della pagina se necessario
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  // Metodi separati per ottenere gli elementi di ogni tipo da mostrare nella pagina corrente
  getCurrentPageFoto(): MediaItem[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredFoto.slice(startIndex, endIndex);
  }

  getCurrentPageVideo(): Video[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredVideo.slice(startIndex, endIndex);
  }
  
  changePage(direction: 'prev' | 'next'): void {
    if (direction === 'prev' && this.currentPage > 1) {
      this.currentPage--;
    } else if (direction === 'next' && this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
  
  // Lightbox per le foto
  openLightbox(foto: MediaItem): void {
    this.currentLightboxItem = foto;
    this.lightboxIndex = this.filteredFoto.findIndex(f => f.id === foto.id);
    this.lightboxActive = true;
    document.body.style.overflow = 'hidden';
  }
  
  closeLightbox(): void {
    this.lightboxActive = false;
    this.currentLightboxItem = null;
    document.body.style.overflow = '';
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
    document.body.style.overflow = 'hidden';
  }
  
  closeVideoModal(): void {
    this.videoModalActive = false;
    this.currentVideo = null;
    document.body.style.overflow = '';
  }
  
  // Sanitizzazione URL per sicurezza
  sanitizeVideoUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  
  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  // Metodo per gestire errori di caricamento immagini
  onImageError(event: any): void {
    // Sostituisce con un'immagine placeholder se il caricamento fallisce
    event.target.src = 'assets/placeholder-image.jpg';
  }
}