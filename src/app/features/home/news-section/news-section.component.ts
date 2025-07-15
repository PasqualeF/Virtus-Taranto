import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NewsService, News } from 'src/app/core/service/news.service';
import { Subscription } from 'rxjs';

interface NewsItem {
  id: number;
  immagine: string;
  data: string;
  titolo: string;
  excerpt?: string;
  contenuto?: string;
}

@Component({
  selector: 'app-news',
  templateUrl: './news-section.component.html',
  styleUrls: ['./news-section.component.css']
})
export class NewsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('carouselContainer') carouselContainer: ElementRef | undefined;
  
  newsItems: NewsItem[] = [];
  loading = false;
  currentPage = 1;
  itemsPerPage = 6;
  isMobile = false;
  currentMobileSlide = 0;
  
  // Touch handling migliorato
  touchStartX = 0;
  touchStartY = 0;
  isDragging = false;
  isUserInteracting = false;
  
  // Auto-slide migliorato
  autoSlideInterval: any;
  autoSlideDelay = 4000; // 4 secondi
  
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private newsService: NewsService
  ) {}

  ngOnInit() {
    this.checkScreenSize();
    this.loadNewsItems();
  }

  ngAfterViewInit() {
    if (this.isMobile) {
      this.scrollToCurrentSlide();
      // Avvia auto-slide dopo un breve delay
      setTimeout(() => {
        this.startAutoSlide();
      }, 1000);
    }
  }

  ngOnDestroy() {
    this.stopAutoSlide();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  @HostListener('window:resize')
  checkScreenSize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 768;
    
    // Se cambia da desktop a mobile o viceversa
    if (wasMobile !== this.isMobile) {
      this.stopAutoSlide();
      if (this.isMobile) {
        setTimeout(() => {
          this.scrollToCurrentSlide();
          this.startAutoSlide();
        }, 100);
      }
    }
  }

  loadNewsItems() {
    this.loading = true;
    
    const newsSubscription = this.newsService.getAllNews({
      sort: 'data:desc',
      pagination: { page: 1, pageSize: 12 }
    }).subscribe({
      next: (news: News[]) => {
        this.newsItems = this.mapNewsToNewsItems(news);
        this.loading = false;
      },
      error: (error) => {
        console.error('Errore nel caricamento delle notizie:', error);
        this.loading = false;
        this.loadStubData();
      }
    });

    this.subscriptions.push(newsSubscription);
  }

  private mapNewsToNewsItems(news: News[]): NewsItem[] {
    return news.map(item => ({
      id: item.id,
      immagine: item.immagine,
      data: item.data,
      titolo: item.titolo,
      excerpt: this.createExcerpt(item.contenuto),
      contenuto: item.contenuto
    }));
  }

  private createExcerpt(descrizione: string): string {
    if (!descrizione) return '';
    
    const maxLength = 120;
    if (descrizione.length <= maxLength) {
      return descrizione;
    }
    
    return descrizione.substring(0, maxLength).trim() + '...';
  }

  private loadStubData() {
    this.newsItems = [
      { 
        id: 1, 
        immagine: 'assets/news/1.jpg', 
        data: '2023-05-01', 
        titolo: 'Vittoria schiacciante nell\'ultima partita',
        excerpt: 'La nostra squadra ha dominato sul campo avversario con un punteggio finale di 92-78. Una prestazione eccezionale da parte di tutta la squadra che ha saputo mantenere il controllo per tutti i quarti.'
      },
      { 
        id: 2, 
        immagine: 'assets/news/2.jpg', 
        data: '2023-04-28', 
        titolo: 'Nuovo sponsor per la stagione 2023/2024',
        excerpt: 'Siamo lieti di annunciare la partnership con un nuovo sponsor che supporterà la nostra squadra durante la prossima stagione. Un accordo importante per il futuro del club.'
      },
      { 
        id: 3, 
        immagine: 'assets/news/3.jpg', 
        data: '2023-04-25', 
        titolo: 'Inizia il campus estivo per giovani atleti',
        excerpt: 'Dal 15 giugno inizierà il campus estivo per ragazzi dai 8 ai 16 anni. Un\'occasione unica per imparare e divertirsi con il basket sotto la guida dei nostri migliori allenatori.'
      },
      { 
        id: 4, 
        immagine: 'assets/news/4.jpg', 
        data: '2023-04-22', 
        titolo: 'Intervista esclusiva con il nostro capitano',
        excerpt: 'Abbiamo incontrato il capitano Marco Rossi che ci ha parlato degli obiettivi per il finale di stagione e dei progetti futuri della squadra. Una chiacchierata interessante.'
      },
      { 
        id: 5, 
        immagine: 'assets/news/5.jpg', 
        data: '2023-04-18', 
        titolo: 'Nuovo allenatore per la squadra Under 16',
        excerpt: 'Diamo il benvenuto a coach Luca Bianchi che guiderà i nostri giovani talenti della categoria Under 16. Un professionista con grande esperienza nel settore giovanile.'
      },
      { 
        id: 6, 
        immagine: 'assets/news/6.jpg', 
        data: '2023-04-15', 
        titolo: 'Ristrutturazione del palazzetto quasi completata',
        excerpt: 'I lavori di ristrutturazione del nostro palazzetto sono quasi terminati. Presto potremo tornare a giocare nella nostra casa con strutture completamente rinnovate.'
      }
    ];
  }

  getCurrentPageNews(): NewsItem[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.newsItems.slice(startIndex, endIndex);
  }

  getTotalPages(): number {
    return Math.ceil(this.newsItems.length / this.itemsPerPage);
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  openNewsDetail(news: NewsItem) {
    this.router.navigate(['/news/ultimissime']);
  }

  // GESTIONE TOUCH MIGLIORATA
  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.isDragging = false;
    this.isUserInteracting = true;
    this.stopAutoSlide();
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isUserInteracting) return;
    
    const touchCurrentX = event.touches[0].clientX;
    const touchCurrentY = event.touches[0].clientY;
    
    const diffX = Math.abs(this.touchStartX - touchCurrentX);
    const diffY = Math.abs(this.touchStartY - touchCurrentY);
    
    // Se il movimento orizzontale è maggiore di quello verticale, è uno swipe
    if (diffX > diffY && diffX > 10) {
      this.isDragging = true;
      event.preventDefault(); // Previene lo scroll verticale
    }
  }

  onTouchEnd(event: TouchEvent) {
    if (!this.isUserInteracting) return;
    
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    
    const diffX = this.touchStartX - touchEndX;
    const diffY = Math.abs(this.touchStartY - touchEndY);
    
    // Verifica se è un swipe orizzontale valido
    if (this.isDragging && Math.abs(diffX) > 50 && diffY < 100) {
      if (diffX > 0) {
        this.nextSlide();
      } else {
        this.prevSlide();
      }
    }
    
    this.isDragging = false;
    this.isUserInteracting = false;
    
    // Riavvia auto-slide dopo 2 secondi di inattività
    setTimeout(() => {
      if (!this.isUserInteracting) {
        this.startAutoSlide();
      }
    }, 2000);
  }

  goToSlide(index: number) {
    if (index === this.currentMobileSlide) return;
    
    this.currentMobileSlide = index;
    this.scrollToCurrentSlide();
    this.isUserInteracting = true;
    this.stopAutoSlide();
    
    // Riavvia auto-slide dopo 3 secondi
    setTimeout(() => {
      this.isUserInteracting = false;
      this.startAutoSlide();
    }, 3000);
  }

  nextSlide() {
    this.currentMobileSlide = (this.currentMobileSlide + 1) % this.newsItems.length;
    this.scrollToCurrentSlide();
  }

  prevSlide() {
    this.currentMobileSlide = (this.currentMobileSlide - 1 + this.newsItems.length) % this.newsItems.length;
    this.scrollToCurrentSlide();
  }

  scrollToCurrentSlide() {
    if (this.carouselContainer) {
      const container = this.carouselContainer.nativeElement;
      const slideWidth = container.scrollWidth / this.newsItems.length;
      const scrollLeft = this.currentMobileSlide * slideWidth;
      
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  }

  startAutoSlide() {
    if (!this.isMobile || this.newsItems.length <= 1) return;
    
    this.stopAutoSlide();
    this.autoSlideInterval = setInterval(() => {
      if (!this.isUserInteracting && !this.isDragging) {
        this.nextSlide();
      }
    }, this.autoSlideDelay);
  }

  stopAutoSlide() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
      this.autoSlideInterval = null;
    }
  }

  // Event listeners per gestire visibilità della pagina
  @HostListener('document:visibilitychange')
  onVisibilityChange() {
    if (document.hidden) {
      this.stopAutoSlide();
    } else if (this.isMobile && !this.isUserInteracting) {
      setTimeout(() => {
        this.startAutoSlide();
      }, 1000);
    }
  }
}