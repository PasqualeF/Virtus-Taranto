import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { catchError, forkJoin, map, Observable } from 'rxjs';
import { SocialFeedService } from 'src/app/core/service/social-feed.service';
import { SocialMediaService } from 'src/app/core/service/social-media.service';

interface SocialPost {
  id: string;
  platform: 'facebook' | 'instagram';
  type: 'image' | 'video' | 'text';
  content: string;
  mediaUrl?: string;
  likes: number;
  comments: number;
  shares?: number;
  timestamp: Date;
  link: string;
  author: {
    name: string;
    avatar?: string;
  };
}

@Component({
  selector: 'app-news',
  templateUrl: './news-section.component.html',
  styleUrls: ['./news-section.component.css']
})
export class NewsComponent implements OnInit { posts: SocialPost[] = [];
  loading = true;
  selectedPlatform: 'all' | 'facebook' | 'instagram' = 'all';
  view: 'grid' | 'masonry' | 'carousel' = 'masonry';
  currentPage = 1;
  itemsPerPage = 9;
  sortBy: 'date' | 'engagement' = 'date';
  hoveredPost: string | null = null;
  refreshInterval = 300000; // 5 minuti
  error: string | null = null;

  private readonly FB_PAGE_ID = 'https://www.facebook.com/VirtusTaranto';
  private readonly FB_ACCESS_TOKEN = 'EAAMQz3LpRwsBOzsm3O5IziPcEZCjk14xeEmInLbYWb2TTPapTyvxBOduYR6O0oOABOGq5GEYLKPrwYM899dMWGIzulSbNBWEZANXUt41Vi47PlTrgF0uObDyZBiJ5aI8jxAcu3qeLXh94VERuYAJvK7pfcOnwmx5rZApPa6ZAJkmx5KwlNuZCK2otWg7F09CPGq2gGN9Pfwy0IEUa0ohHpNQvSfq7GwIeCutBxzgZDZD';


  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,private socialFeedService: SocialFeedService
  ) {}

  ngOnInit() {
    this.loadPosts();
  }

  ngAfterViewInit() {
    // Forza l'aggiornamento della vista dopo il rendering
    this.cdr.detectChanges();
  }

  private loadPosts() {
    this.loading = true; // Assicuriamoci che loading sia true all'inizio
    
    if (!false) {
      this.socialFeedService.getMockPosts().subscribe({
        next: (data) => {
          if (data && data.data) {
            this.posts = this.transformPosts(data.data);
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.error = 'Errore nel caricamento dei post';
          this.loading = false;
          this.posts = []; // Assicuriamoci che posts sia vuoto in caso di errore
          console.error('Errore:', error);
          this.cdr.detectChanges();
        }
      });
    } else {
      this.socialFeedService.getFacebookPosts().pipe(
        catchError(error => {
          console.error('Errore nella chiamata Facebook:', error);
          return []; // Ritorna un array vuoto in caso di errore
        })
      ).subscribe({
        next: (response) => {
          
          // Gestione sicura dei dati
          let fbPosts: SocialPost[] = [];
          
          // Verifica la struttura della risposta
          if (response && response.posts && response.posts.data) {
            fbPosts = this.transformFacebookPosts(response.posts.data);
          } else if (response && response.data) {
            fbPosts = this.transformFacebookPosts(response.data);
          }
          
          this.posts = fbPosts.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.error = 'Errore nel caricamento dei post social';
          this.loading = false;
          this.posts = []; // Assicuriamoci che posts sia vuoto in caso di errore
          console.error('Errore:', error);
          this.cdr.detectChanges();
        }
      });
    }
  }

  private transformPosts(posts: any[]): SocialPost[] {
    return posts.map(post => ({
      id: post.id,
      platform: post.platform,
      type: post.full_picture ? 'image' : 'text',
      content: post.message || post.caption,
      mediaUrl: post.full_picture || post.media_url,
      likes: post.likes?.summary?.total_count || 0,
      comments: post.comments?.summary?.total_count || 0,
      shares: post.shares?.count,
      timestamp: new Date(post.created_time || post.timestamp),
      link: post.permalink || `https://facebook.com/${post.id}`,
      author: {
        name: 'Virtus Taranto Basket',
        avatar: 'assets/logo-virtus.png'
      }
    }));
  }


  private loadSocialFeeds(): Observable<any> {
    const fbPosts$ = this.getFacebookPosts();
    return forkJoin([fbPosts$]).pipe(
      map(([fbPosts]) => {
        this.posts = [...fbPosts].sort((a, b) => 
          b.timestamp.getTime() - a.timestamp.getTime()
        );
        this.loading = false;
        this.cdr.detectChanges();
      })
    );
  }

  private getFacebookPosts(): Observable<SocialPost[]> {
    const url = `https://graph.facebook.com/v21.0/${this.FB_PAGE_ID}/posts`;
    return this.http.get(url, {
      params: {
        access_token: this.FB_ACCESS_TOKEN,
        fields: 'id,message,full_picture,created_time,likes.summary(true),comments.summary(true),shares'
      }
    }).pipe(
      map((response: any) => this.transformFacebookPosts(response.data))
      
    );
  }

 

  private transformFacebookPosts(posts: any[]): SocialPost[] {
    if (!Array.isArray(posts)) {
      console.error('I post ricevuti non sono un array:', posts);
      return [];
    }

    return posts.map(post => {
      try {
        return {
          id: post.id || '',
          platform: 'facebook',
          type: this.getPostType(post),
          content: post.message || '',
          mediaUrl: this.getMediaUrl(post),
          likes: post.reactions?.summary?.total_count || 0,
          comments: post.comments?.summary?.total_count || 0,
          shares: post.shares?.count || 0,
          timestamp: new Date(post.created_time || Date.now()),
          link: `https://facebook.com/${post.id || ''}`,
          author: {
            name: 'Virtus Taranto Basket',
            avatar: 'assets/virtusLogo.png'

          }
        };
      } catch (error) {
        console.error('Errore nella trasformazione del post:', error, post);
        return null;
      }
    }).filter(post => post !== null) as SocialPost[]; // Rimuove eventuali post null
  }



  private getPostType(post: any): 'image' | 'video' | 'text' {
    if (post.attachments?.data?.[0]?.media_type === 'video') return 'video';
    if (post.attachments?.data?.[0]?.media_type === 'photo' || post.full_picture) return 'image';
    return 'text';
  }

  private getMediaUrl(post: any): string | undefined {
    return post.attachments?.data?.[0]?.media?.image?.src || 
           post.attachments?.data?.[0]?.url ||
           post.full_picture ||
           undefined;
  }
  
  getFilteredPosts(): SocialPost[] {
    let filtered = [...this.posts];
    
    if (this.selectedPlatform !== 'all') {
      filtered = filtered.filter(post => post.platform === this.selectedPlatform);
    }

    if (this.sortBy === 'engagement') {
      filtered.sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments));
    }

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(startIndex, startIndex + this.itemsPerPage);
  }

  getEngagementScore(post: SocialPost): number {
    return post.likes + post.comments + (post.shares || 0);
  }

  onPostHover(postId: string | null) {
    this.hoveredPost = postId;
  }

  changeView(view: 'grid' | 'masonry' | 'carousel') {
    this.view = view;
  }

  formatTimestamp(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m fa`;
    if (hours < 24) return `${hours}h fa`;
    return `${days}g fa`;
  }
}