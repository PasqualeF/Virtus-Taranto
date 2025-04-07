import { Component, OnInit, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate, query, stagger } from '@angular/animations';
import { NewsService, News } from 'src/app/core/service/news.service';

// Estensione dell'interfaccia News esistente con proprietà aggiuntive
interface EnhancedNews extends News {
  categoria?: string;
  descrizione?: string;
  contenuto?: string;
}

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
  news: EnhancedNews[] = [];
  filteredNews: EnhancedNews[] = [];
  selectedNews: EnhancedNews | null = null;
  loading = true;
  currentPage = 1;
  itemsPerPage = 9;
  categories: string[] = [];
  activeCategory: string = 'all';
  paginationWindowSize = 5; // Numero di pulsanti pagina da mostrare
  private scrollPosition = 0;

  constructor(private newsService: NewsService) {}

  ngOnInit(): void {
    this.loadNews();
    this.adjustItemsPerPage();
  }

  @HostListener('window:resize')
  onResize() {
    this.adjustItemsPerPage();
  }

  // Adatta il numero di elementi per pagina in base alla dimensione dello schermo
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
    this.newsService.getAllNews().subscribe((news: News[]) => {
      // Applica una trasformazione per aggiungere categorie di esempio
      // In un'app reale, queste potrebbero già provenire dal backend
      this.news = news.map((item: News, index: number) => {
        const enhancedItem: EnhancedNews = {...item};
        // Assegna categorie di esempio in modo ciclico
        const categoryOptions = ['Squadra', 'Campionato', 'Giovanili', 'Eventi', 'Allenamenti'];
        enhancedItem.categoria = categoryOptions[index % categoryOptions.length];
        
        // Aggiungi una breve descrizione di esempio
        enhancedItem.descrizione = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin eget magna at dolor ullamcorper interdum vel eu risus. Vivamus scelerisque libero ut velit cursus.';
        
        return enhancedItem;
      });
      
      // Estrai categorie uniche
      this.categories = Array.from(new Set(this.news.map(item => item.categoria || '')));
      
      // Filtra iniziale (tutte le news)
      this.filterByCategory('all');
      this.loading = false;
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
    // Aggiorna lo stato della paginazione se necessario
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }

  get paginatedNews(): EnhancedNews[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredNews.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredNews.length / this.itemsPerPage);
  }
  
  // Genera array di numeri di pagina da visualizzare
  get pageNumbers(): number[] {
    const halfWindow = Math.floor(this.paginationWindowSize / 2);
    let start = Math.max(1, this.currentPage - halfWindow);
    let end = Math.min(this.totalPages, start + this.paginationWindowSize - 1);
    
    // Adatta l'inizio se non abbiamo abbastanza pagine alla fine
    if (end - start + 1 < this.paginationWindowSize) {
      start = Math.max(1, end - this.paginationWindowSize + 1);
    }
    
    // Crea l'array di numeri di pagina
    return Array.from({length: end - start + 1}, (_, i) => start + i);
  }

  showNewsDetails(news: EnhancedNews): void {
    // Salva la posizione di scroll attuale
    this.scrollPosition = window.pageYOffset;
    this.selectedNews = news;
    // Blocca lo scrolling del body quando il modal è aperto
    document.body.style.overflow = 'hidden';
  }

  closeNewsDetails(): void {
    // Ripristina la possibilità di scrollare
    document.body.style.overflow = '';
    this.selectedNews = null;
    // Ripristina la posizione di scroll
    setTimeout(() => {
      window.scrollTo(0, this.scrollPosition);
    }, 0);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      // Scorri in alto quando cambi pagina
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

  // Trova l'indice della news corrente nell'array filtrato
  getCurrentNewsIndex(): number {
    if (!this.selectedNews) return -1;
    return this.filteredNews.findIndex(n => 
      n.titolo === this.selectedNews?.titolo && 
      n.data === this.selectedNews?.data
    );
  }

  // Ottieni la news precedente (se esiste)
  getPreviousNews(): EnhancedNews | null {
    const currentIndex = this.getCurrentNewsIndex();
    if (currentIndex > 0) {
      return this.filteredNews[currentIndex - 1];
    }
    return null;
  }

  // Ottieni la news successiva (se esiste)
  getNextNews(): EnhancedNews | null {
    const currentIndex = this.getCurrentNewsIndex();
    if (currentIndex < this.filteredNews.length - 1 && currentIndex !== -1) {
      return this.filteredNews[currentIndex + 1];
    }
    return null;
  }

  // Naviga tra le news all'interno del modale
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
}