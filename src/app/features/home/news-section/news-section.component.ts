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
  touchStartX = 0;
  autoSlideInterval: any;
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private newsService: NewsService
  ) {}

  ngOnInit() {
    this.checkScreenSize();
    this.loadNewsItems();
    
    if (this.isMobile) {
      this.startAutoSlide();
    }
  }

  ngAfterViewInit() {
    if (this.isMobile) {
      this.scrollToCurrentSlide();
    }
  }

  ngOnDestroy() {
    this.stopAutoSlide();
    // Cleanup subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
  }

  loadNewsItems() {
    this.loading = true;
    
    // Carica le notizie dal service invece di usare dati stub
    const newsSubscription = this.newsService.getAllNews({
      sort: 'data:desc',
      pagination: { page: 1, pageSize: 12 } // Carica più notizie per gestire la paginazione
    }).subscribe({
      next: (news: News[]) => {
        this.newsItems = this.mapNewsToNewsItems(news);
        this.loading = false;
      },
      error: (error) => {
        console.error('Errore nel caricamento delle notizie:', error);
        this.loading = false;
        // Fallback ai dati stub in caso di errore
        this.loadStubData();
      }
    });

    this.subscriptions.push(newsSubscription);
  }

  // Mappa i dati dal service al formato richiesto dal componente
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

  // Crea un estratto dalla descrizione
  private createExcerpt(descrizione: string): string {
    if (!descrizione) return '';
    
    const maxLength = 120;
    if (descrizione.length <= maxLength) {
      return descrizione;
    }
    
    return descrizione.substring(0, maxLength).trim() + '...';
  }

  // Metodo di fallback per i dati stub (in caso di errore)
  private loadStubData() {
    this.newsItems = [
      { 
        id: 1, 
        immagine: 'assets/news/1.jpg', 
        data: '2023-05-01', 
        titolo: 'Vittoria schiacciante nell\'ultima partita',
        excerpt: 'La nostra squadra ha dominato sul campo avversario con un punteggio finale di 92-78. Una prestazione eccezionale da parte di tutta la squadra.'
      },
      { 
        id: 2, 
        immagine: 'assets/news/2.jpg', 
        data: '2023-04-28', 
        titolo: 'Nuovo sponsor per la stagione 2023/2024',
        excerpt: 'Siamo lieti di annunciare la partnership con un nuovo sponsor che supporterà la nostra squadra durante la prossima stagione.'
      },
      { 
        id: 3, 
        immagine: 'assets/news/3.jpg', 
        data: '2023-04-25', 
        titolo: 'Inizia il campus estivo per giovani atleti',
        excerpt: 'Dal 15 giugno inizierà il campus estivo per ragazzi dai 8 ai 16 anni. Un\'occasione per imparare e divertirsi con il basket.'
      },
      { 
        id: 4, 
        immagine: 'assets/news/4.jpg', 
        data: '2023-04-22', 
        titolo: 'Intervista esclusiva con il nostro capitano',
        excerpt: 'Abbiamo incontrato il capitano Marco Rossi che ci ha parlato degli obiettivi per il finale di stagione e dei progetti futuri.'
      },
      { 
        id: 5, 
        immagine: 'assets/news/5.jpg', 
        data: '2023-04-18', 
        titolo: 'Nuovo allenatore per la squadra Under 16',
        excerpt: 'Diamo il benvenuto a coach Luca Bianchi che guiderà i nostri giovani talenti della categoria Under 16.'
      },
      { 
        id: 6, 
        immagine: 'assets/news/6.jpg', 
        data: '2023-04-15', 
        titolo: 'Ristrutturazione del palazzetto quasi completata',
        excerpt: 'I lavori di ristrutturazione del nostro palazzetto sono quasi terminati. Presto potremo tornare a giocare nella nostra casa.'
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
    // Navigazione alla pagina di dettaglio
    this.router.navigate(['/news/ultimissime']);
  }

  // Gestione touch per mobile
  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
    this.stopAutoSlide();
  }

  onTouchEnd(event: TouchEvent) {
    const touchEndX = event.changedTouches[0].clientX;
    const diffX = this.touchStartX - touchEndX;

    if (Math.abs(diffX) > 50) { // Swipe threshold
      if (diffX > 0) {
        // Swipe left
        this.nextSlide();
      } else {
        // Swipe right
        this.prevSlide();
      }
    }
    
    this.startAutoSlide();
  }

  goToSlide(index: number) {
    this.currentMobileSlide = index;
    this.scrollToCurrentSlide();
    this.restartAutoSlide();
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
      const slideWidth = this.carouselContainer.nativeElement.clientWidth;
      this.carouselContainer.nativeElement.scrollLeft = this.currentMobileSlide * slideWidth;
    }
  }

  startAutoSlide() {
    this.autoSlideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000); // Cambia slide ogni 5 secondi
  }

  stopAutoSlide() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }

  restartAutoSlide() {
    this.stopAutoSlide();
    this.startAutoSlide();
  }
}