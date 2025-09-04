import { Component, OnInit, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate, query, stagger } from '@angular/animations';
// FIXED: Aggiorna questo path secondo la tua struttura
import { NewsService, News } from 'src/app/core/service/news.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environments';


@Component({
  selector: 'app-ultimissime',
  templateUrl: './ultimissime.component.html',
  styleUrls: ['./ultimissime.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('500ms cubic-bezier(0.23, 1, 0.32, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger('100ms', [
            animate('600ms cubic-bezier(0.23, 1, 0.32, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('newsModal', [
      state('void', style({
        transform: 'translate(-50%, -40%) scale(0.8)',
        opacity: 0
      })),
      state('*', style({
        transform: 'translate(-50%, -50%) scale(1)',
        opacity: 1
      })),
      transition('void => *', [
        animate('500ms cubic-bezier(0.175, 0.885, 0.32, 1.275)')
      ]),
      transition('* => void', [
        animate('400ms cubic-bezier(0.6, -0.28, 0.735, 0.045)')
      ])
    ]),
    trigger('overlay', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms cubic-bezier(0.23, 1, 0.32, 1)', 
          style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('350ms cubic-bezier(0.23, 1, 0.32, 1)', 
          style({ opacity: 0 }))
      ])
    ]),
    trigger('cardAnimation', [
      transition(':enter', [
        style({ 
          opacity: 0, 
          transform: 'translateY(30px)' 
        }),
        animate('500ms 100ms cubic-bezier(0.23, 1, 0.32, 1)', 
          style({ 
            opacity: 1, 
            transform: 'translateY(0)' 
          })
        )
      ])
    ]),
    trigger('slideInRight', [
      transition(':enter', [
        style({ 
          transform: 'translateX(20px)', 
          opacity: 0 
        }),
        animate('400ms cubic-bezier(0.23, 1, 0.32, 1)', 
          style({ 
            transform: 'translateX(0)', 
            opacity: 1 
          })
        )
      ])
    ])
  ]
})
export class UltimissimeComponent implements OnInit {
  news: News[] = [];
  filteredNews: News[] = [];
  selectedNews: News | null = null;
  loading = true;
  error: string | null = null;
  currentPage = 1;
  itemsPerPage = 9;
  categories: string[] = [];
  activeCategory: string = 'all';
  paginationWindowSize = 5;
  private scrollPosition = 0;

constructor(private newsService: NewsService, private http: HttpClient) {}


  ngOnInit(): void {
    this.loadNews();
    this.loadCategories();
    this.adjustItemsPerPage();
  }

  @HostListener('window:resize')
  onResize() {
    this.adjustItemsPerPage();
  }

  adjustItemsPerPage(): void {
    const width = window.innerWidth;
    if (width < 576) {
      this.itemsPerPage = 6;
    } else if (width < 992) {
      this.itemsPerPage = 8;
    } else {
      this.itemsPerPage = 9;
    }
    this.updatePageState();
  }

  loadNews(): void {
    this.loading = true;
    this.error = null;
    
    
    this.newsService.getAllNews({
      sort: 'data:desc',
      pagination: { page: 1, pageSize: 50 }
    }).subscribe({
      next: (news: News[]) => {
        this.news = news;
        this.filterByCategory('all');
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Errore nel caricamento delle notizie. Riprova più tardi.';
        this.loading = false;
      }
    });
  }

  loadCategories(): void {
    this.newsService.getCategories().subscribe({
      next: (categories: string[]) => {
        this.categories = categories;
      },
      error: (error) => {
      }
    });
  }

  filterByCategory(category: string): void {
    this.activeCategory = category;
    if (category === 'all') {
      this.filteredNews = [...this.news];
    } else {
      this.filteredNews = this.news.filter(item => item.categoria === category);
    }
    this.currentPage = 1;
    this.updatePageState();
  }

  updatePageState(): void {
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }

  get paginatedNews(): News[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const result = this.filteredNews.slice(startIndex, startIndex + this.itemsPerPage);
    return result;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredNews.length / this.itemsPerPage);
  }
  
  get pageNumbers(): number[] {
    const halfWindow = Math.floor(this.paginationWindowSize / 2);
    let start = Math.max(1, this.currentPage - halfWindow);
    let end = Math.min(this.totalPages, start + this.paginationWindowSize - 1);
    
    if (end - start + 1 < this.paginationWindowSize) {
      start = Math.max(1, end - this.paginationWindowSize + 1);
    }
    
    return Array.from({length: end - start + 1}, (_, i) => start + i);
  }

  showNewsDetails(news: News): void {
    this.scrollPosition = window.pageYOffset;
    this.selectedNews = news;
    document.body.style.overflow = 'hidden';
  }

  closeNewsDetails(): void {
    document.body.style.overflow = '';
    this.selectedNews = null;
    setTimeout(() => {
      window.scrollTo(0, this.scrollPosition);
    }, 0);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  getCurrentNewsIndex(): number {
    if (!this.selectedNews) return -1;
    return this.filteredNews.findIndex(n => n.id === this.selectedNews?.id);
  }

  getPreviousNews(): News | null {
    const currentIndex = this.getCurrentNewsIndex();
    if (currentIndex > 0) {
      return this.filteredNews[currentIndex - 1];
    }
    return null;
  }

  getNextNews(): News | null {
    const currentIndex = this.getCurrentNewsIndex();
    if (currentIndex < this.filteredNews.length - 1 && currentIndex !== -1) {
      return this.filteredNews[currentIndex + 1];
    }
    return null;
  }

  navigateNews(direction: 'prev' | 'next', event: Event): void {
    event.stopPropagation();
    
    if (direction === 'prev') {
      const prevNews = this.getPreviousNews();
      if (prevNews) {
        this.selectedNews = prevNews;
      }
    } else {
      const nextNews = this.getNextNews();
      if (nextNews) {
        this.selectedNews = nextNews;
      }
    }
  }

  refreshNews(): void {
    this.loadNews();
    this.loadCategories();
  }

  searchNews(query: string): void {
    if (query.trim() === '') {
      this.filterByCategory(this.activeCategory);
      return;
    }

    this.loading = true;
    this.newsService.searchNews(query).subscribe({
      next: (news: News[]) => {
        this.filteredNews = news;
        this.currentPage = 1;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
      }
    });
  }


shareOnFacebook(news: any): void {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(news.titolo);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank', 'width=600,height=400');
}

shareOnX(news: any): void {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(news.titolo);
  window.open(`https://x.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400');
}

shareOnWhatsApp(news: any): void {
  const text = encodeURIComponent(`${news.titolo}\n\n${news.descrizione}\n\nLeggi di più: ${window.location.href}`);
  
  // Rileva se siamo su mobile o desktop
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Su mobile, apri l'app WhatsApp
    window.open(`whatsapp://send?text=${text}`, '_blank');
  } else {
    // Su desktop, apri WhatsApp Web
    window.open(`https://web.whatsapp.com/send?text=${text}`, '_blank');
  }
}

}