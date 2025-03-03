import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface News {
  id: number;
  immagine: string;
  data: string;
  titolo: string;
}
@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private news = [
    { id: 1, immagine: 'assets//news/1.jpg', data: '2023-05-01', titolo: 'Vittoria schiacciante nell\'ultima partita' },
    { id: 2, immagine: 'assets//news/2.jpg', data: '2023-04-28', titolo: 'Nuovo allenatore per la squadra giovanile' },
    { id: 3, immagine: 'assets//news/3.jpg', data: '2023-04-25', titolo: 'Torneo estivo: aperte le iscrizioni' },
    { id: 4, immagine: 'assets//news/1.jpg', data: '2023-04-22', titolo: 'Intervista esclusiva con il capitano' },
    { id: 5, immagine: 'assets//news/3.jpg', data: '2023-04-19', titolo: 'Resoconto della stagione: i momenti top' },
    { id: 6, immagine: 'assets//news/1.jpg', data: '2023-04-16', titolo: 'Nuova partnership con sponsor locale' },
    { id: 7, immagine: 'assets//news/1.jpg', data: '2023-05-01', titolo: 'Vittoria schiacciante nell\'ultima partita' },
    { id: 8, immagine: 'assets//news/2.jpg', data: '2023-04-28', titolo: 'Nuovo allenatore per la squadra giovanile' },
    { id: 9, immagine: 'assets//news/3.jpg', data: '2023-04-25', titolo: 'Torneo estivo: aperte le iscrizioni' },
    { id: 10, immagine: 'assets//news/1.jpg', data: '2023-04-22', titolo: 'Intervista esclusiva con il capitano' },
    { id: 11, immagine: 'assets//news/3.jpg', data: '2023-04-19', titolo: 'Resoconto della stagione: i momenti top' },
    { id: 12, immagine: 'assets//news/1.jpg', data: '2023-04-16', titolo: 'Nuova partnership con sponsor locale' },
    { id: 13, immagine: 'assets//news/1.jpg', data: '2023-05-01', titolo: 'Vittoria schiacciante nell\'ultima partita' },
    { id: 14, immagine: 'assets//news/2.jpg', data: '2023-04-28', titolo: 'Nuovo allenatore per la squadra giovanile' },
    { id: 15, immagine: 'assets//news/3.jpg', data: '2023-04-25', titolo: 'Torneo estivo: aperte le iscrizioni' },
    { id: 16, immagine: 'assets//news/1.jpg', data: '2023-04-22', titolo: 'Intervista esclusiva con il capitano' },
    { id: 17, immagine: 'assets//news/3.jpg', data: '2023-04-19', titolo: 'Resoconto della stagione: i momenti top' },
    { id: 18, immagine: 'assets//news/1.jpg', data: '2023-04-16', titolo: 'Nuova partnership con sponsor locale' }
    // Aggiungi altre notizie qui...
  ];

  getAllNews(): Observable<News[]> {
    return of(this.news);
  }
}