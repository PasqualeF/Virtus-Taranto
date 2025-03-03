import { Component, OnInit} from '@angular/core';
import { trigger, state, style, transition, animate, query, stagger } from '@angular/animations';
import { NewsService, News } from 'src/app/core/service/news.service';

@Component({
  selector: 'app-ultimissime',
  templateUrl: './ultimissime.component.html',
  styleUrls: ['./ultimissime.component.css'],
  animations: [
    trigger('staggerFade', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(50px)' }),
          stagger('100ms', [
            animate('500ms cubic-bezier(0.35, 0, 0.25, 1)',
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('newsModal', [
      state('void', style({
        transform: 'translate(-50%, -50%) scale(0.7)',
        opacity: 0
      })),
      state('*', style({
        transform: 'translate(-50%, -50%) scale(1)',
        opacity: 1
      })),
      transition('void <=> *', [
        animate('400ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ])
    ]),
    trigger('overlay', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
          style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('400ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
          style({ opacity: 0 }))
      ])
    ])
  ]
})
export class UltimissimeComponent implements OnInit {
  news: News[] = [];
  selectedNews: News | null = null;
  loading = true;
  currentPage = 1;
  itemsPerPage = 9;

  constructor(private newsService: NewsService) {}

  ngOnInit(): void {
    this.loadNews();
  }

  loadNews(): void {
    this.newsService.getAllNews().subscribe(news => {
      this.news = news;
      this.loading = false;
    });
  }

  get paginatedNews(): News[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.news.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.news.length / this.itemsPerPage);
  }

  showNewsDetails(news: News): void {
    this.selectedNews = news;
  }

  closeNewsDetails(): void {
    this.selectedNews = null;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
}