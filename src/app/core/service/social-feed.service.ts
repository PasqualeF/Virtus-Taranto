import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocialFeedService {
  private readonly FB_PAGE_ID = 'https://www.facebook.com/VirtusTaranto';
  private readonly FB_ACCESS_TOKEN = 'EAAMQz3LpRwsBOzsm3O5IziPcEZCjk14xeEmInLbYWb2TTPapTyvxBOduYR6O0oOABOGq5GEYLKPrwYM899dMWGIzulSbNBWEZANXUt41Vi47PlTrgF0uObDyZBiJ5aI8jxAcu3qeLXh94VERuYAJvK7pfcOnwmx5rZApPa6ZAJkmx5KwlNuZCK2otWg7F09CPGq2gGN9Pfwy0IEUa0ohHpNQvSfq7GwIeCutBxzgZDZD';

  constructor(private http: HttpClient) {}

  getFacebookPosts(): Observable<any> {
    const url = `https://graph.facebook.com/v21.0/${this.FB_PAGE_ID}`;
    return this.http.get(url, {
      params: {
        access_token: this.FB_ACCESS_TOKEN,
        fields: 'id,name,posts.limit(10){id,created_time,message,attachments{media,media_type,title,description,url},reactions.summary(total_count),comments.summary(total_count),shares}'
      }
    }).pipe(
      map(response => {
        return response;
      }),
      catchError(error => {
        console.error('Errore nella chiamata API Facebook:', error);
        throw error;
      })
    );
  }




  // Per test in sviluppo
  getMockPosts(): Observable<any> {
    const mockData = {
      data: [
        {
          id: '1',
          platform: 'facebook',
          message: 'Post di prova Facebook',
          full_picture: 'https://via.placeholder.com/300',
          created_time: new Date().toISOString(),
          likes: { summary: { total_count: 42 } },
          comments: { summary: { total_count: 7 } },
          shares: { count: 3 }
        },
        {
          id: '2',
          platform: 'facebook',
          message: 'Post di  Facebook',
          full_picture: 'https://via.placeholder.com/300',
          created_time: new Date().toISOString(),
          likes: { summary: { total_count: 42 } },
          comments: { summary: { total_count: 7 } },
          shares: { count: 3 }
        },
        {
          id: '3',
          platform: 'facebook',
          message: 'Post  prova Facebook',
          full_picture: 'https://via.placeholder.com/300',
          created_time: new Date().toISOString(),
          likes: { summary: { total_count: 42 } },
          comments: { summary: { total_count: 7 } },
          shares: { count: 3 }
        },
        {
          id: '4',
          platform: 'instagram',
          caption: 'Post di prova Instagram',
          media_type: 'IMAGE',
          media_url: 'https://via.placeholder.com/300',
          timestamp: new Date().toISOString(),
          permalink: 'https://instagram.com'
        }
      ]
    };
    return of(mockData);
  }
}