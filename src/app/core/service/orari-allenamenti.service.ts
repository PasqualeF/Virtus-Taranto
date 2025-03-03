import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrariAllenamentiService {
  private orariAllenamenti = [
    { gruppo: 'Under 19', giorno: 'Lunedì', orario: '18:00-20:00', palestra: 'Palestra A' },
    { gruppo: 'Under 19', giorno: 'Martedì', orario: '17:00-19:00', palestra: 'Palestra A' },
    { gruppo: 'Under 19', giorno: 'Mercoledì', orario: '18:00-20:00', palestra: 'Palestra A' },
    { gruppo: 'Under 19', giorno: 'Giovedì', orario: '17:00-19:00', palestra: 'Palestra A' },
    { gruppo: 'Under 19', giorno: 'Venerdì', orario: '17:00-19:00', palestra: 'Palestra A' },
    { gruppo: 'Under 17', giorno: 'Lunedì', orario: '14:00-15:00', palestra: 'Palestra B' },
    { gruppo: 'Under 17', giorno: 'Martedì', orario: '17:00-19:00', palestra: 'Palestra B' },
    { gruppo: 'Under 17', giorno: 'Mercoledì', orario: '14:00-15:00', palestra: 'Palestra B' },
    { gruppo: 'Under 17', giorno: 'Giovedì', orario: '14:00-15:00', palestra: 'Palestra B' },
    { gruppo: 'Under 17', giorno: 'Venerdì', orario: '14:00-15:00', palestra: 'Palestra A' },
    { gruppo: 'Minibasket', giorno: 'Lunedì', orario: '15:00-16:00', palestra: 'Palestra A' },
    { gruppo: 'Minibasket', giorno: 'Mercoledì', orario: '15:00-16:00', palestra: 'Palestra A' },
    { gruppo: 'Minibasket', giorno: 'Venerdì', orario: '15:00-16:00', palestra: 'Palestra A' },

    // Aggiungi altri orari di allenamento qui
  ];

  getOrariAllenamenti(): Observable<any[]> {
    return of(this.orariAllenamenti);
  }
}