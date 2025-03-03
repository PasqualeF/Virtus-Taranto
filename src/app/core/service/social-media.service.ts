import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SocialMediaService {
  private facebookApiUrl = 'https://graph.facebook.com/v12.0/';
  private instagramApiUrl = 'https://graph.instagram.com/';

  constructor(private http: HttpClient) { }

  getFacebookPosts(pageId: string, accessToken: string): Observable<any> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const sinceDate = Math.floor(oneWeekAgo.getTime() / 1000); // Convert to Unix timestamp

    return this.http.get(`${this.facebookApiUrl}${pageId}/posts?access_token=${accessToken}&fields=message,created_time,full_picture,permalink_url&since=${sinceDate}`);
  }

  getInstagramPosts(userId: string, accessToken: string): Observable<any> {
    return this.http.get(`${this.instagramApiUrl}${userId}/media?access_token=${accessToken}&fields=caption,media_url,permalink,timestamp`);
  }

  getAllSocialMediaPosts(fbPageId: string, fbAccessToken: string, igUserId: string, igAccessToken: string): Observable<any[]> {
    return forkJoin([
      this.getFacebookPosts(fbPageId, fbAccessToken),
      this.getInstagramPosts(igUserId, igAccessToken)
    ]).pipe(
      map(([fbResponse, igResponse]) => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const fbPosts = fbResponse.data.map((post: any) => ({ ...post, source: 'facebook' }));
        const igPosts = igResponse.data
          .filter((post: any) => new Date(post.timestamp) >= oneWeekAgo)
          .map((post: any) => ({ ...post, source: 'instagram' }));

        return [...fbPosts, ...igPosts].sort((a, b) => 
          new Date(b.created_time || b.timestamp).getTime() - new Date(a.created_time || a.timestamp).getTime()
        );
      })
    );
  }
}