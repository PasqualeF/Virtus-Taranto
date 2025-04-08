import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-simple-media',
  templateUrl: './media-gallery.component.html',
  styleUrls: ['./media-gallery.component.css']
})
export class MediaGalleryComponent implements OnInit {
  // Categorie
  categories = ['Foto', 'Album', 'Video'];
  activeCategory = 'Foto';

  // Foto
  photos = [
    {
      id: 1,
      title: 'Partita contro Milano',
      image: 'assets/images/photo1.jpg',
      description: 'Momento emozionante della partita contro Milano'
    },
    {
      id: 2,
      title: 'Allenamento pre-stagione',
      image: 'assets/images/photo2.jpg',
      description: 'La squadra durante l\'allenamento pre-stagione'
    },
    {
      id: 3,
      title: 'Vittoria di campionato',
      image: 'assets/images/photo3.jpg',
      description: 'Celebrazione dopo la vittoria di campionato'
    }
  ];

  // Albums
  albums = [
    {
      id: 1,
      title: 'Campionato 2023',
      cover: 'assets/images/album1.jpg',
      count: 25
    },
    {
      id: 2,
      title: 'Coppa Italia',
      cover: 'assets/images/album2.jpg',
      count: 18
    }
  ];

  // Video
  videos = [
    {
      id: 1,
      title: 'Highlights vs Roma',
      thumbnail: 'assets/images/video1.jpg',
      duration: '3:45'
    },
    {
      id: 2,
      title: 'Intervista al coach',
      thumbnail: 'assets/images/video2.jpg',
      duration: '5:20'
    }
  ];

  // Lightbox
  showLightbox = false;
  currentPhoto = null;

  constructor() { }

  ngOnInit(): void {
    // Simuliamo il caricamento di immagini (in produzione verrebbero da un'API)
    // Qui il codice è volutamente minimale
    this.currentPhoto = currentPhoto;
  }

  selectCategory(category: string): void {
    this.activeCategory = category;
  }

  openLightbox(photo: null): void {
    this.currentPhoto = photo;
    this.showLightbox = true;
  }

  closeLightbox(): void {
    this.showLightbox = false;
    this.currentPhoto = null;
  }
}