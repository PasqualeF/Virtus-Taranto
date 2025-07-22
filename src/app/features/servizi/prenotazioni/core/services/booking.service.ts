// core/services/booking.service.ts - AGGIORNATO PER IL TUO BACKEND
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import {
  BackendBookingsResponse,
  BackendBooking,
  TimeSlot,
  DayAvailability,
  SlotConfig,
  CreateReservationRequest,
  ReservationCreated,
  TimeRange,
  SlotValidation
} from 'src/app/core/models/booking.models';
import { UserReservationsResponse } from '../models/user-reservation.model';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private readonly http = inject(HttpClient);
  
  // URL del tuo backend
  private readonly API_BASE_URL = 'http://localhost:8080/vbe/v1';

  // Configurazione slot (personalizzabile)
  private readonly SLOT_CONFIG: SlotConfig = {
    openingTime: '08:00',
    closingTime: '24:00',
    slotDuration: 60, // 1 ora
    intervalMinutes: 15, // Ogni 15 minuti
    minBookingDuration: 60, // Minimo 1 ora
    maxBookingDuration: 240 // Massimo 4 ore
  };

  /**
   * Recupera le prenotazioni esistenti per una palestra
   */
  getExistingBookings(palestraName: string): Observable<BackendBooking[]> {
    
    const url = `${this.API_BASE_URL}/orari-allenamenti/${encodeURIComponent(palestraName)}`;
    
    return this.http.get<BackendBookingsResponse>(url).pipe(
      map(response => {
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.message || 'Errore nel recupero delle prenotazioni');
        }
      }),
      catchError(error => {
        // Ritorna array vuoto invece di fallire completamente
        return of([]);
      })
    );
  }

  /**
   * Calcola la disponibilità per una data specifica
   */
  getAvailabilityForDate(palestraName: string, date: string): Observable<DayAvailability> {
    
    return this.getExistingBookings(palestraName).pipe(
      map(bookings => this.calculateDayAvailability(date, bookings))
    );
  }

  /**
   * Calcola la disponibilità per una settimana
   */
  getWeekAvailability(palestraName: string, startDate: string): Observable<DayAvailability[]> {
    const week: DayAvailability[] = [];
    
    return this.getExistingBookings(palestraName).pipe(
      map(bookings => {
        // Genera 7 giorni dalla data di inizio
        for (let i = 0; i < 7; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          const dateString = date.toISOString().split('T')[0];
          
          week.push(this.calculateDayAvailability(dateString, bookings));
        }
        
        return week;
      })
    );
  }

  /**
   * Calcola gli slot disponibili per una giornata
   */
  private calculateDayAvailability(date: string, existingBookings: BackendBooking[]): DayAvailability {
    const targetDate = new Date(date);
    const dayName = targetDate.toLocaleDateString('it-IT', { weekday: 'long' });
    
    // Filtra le prenotazioni per la data target
    const dayBookings = existingBookings.filter(booking => {
      const bookingDate = new Date(booking.startDate);
      return bookingDate.toDateString() === targetDate.toDateString();
    });


    // Genera tutti gli slot possibili
    const allSlots = this.generateAllTimeSlots(targetDate);
    
    // Verifica disponibilità per ogni slot
    const slots = allSlots.map(slot => ({
      ...slot,
      available: this.isSlotAvailable(slot, dayBookings),
      conflictingBooking: this.findConflictingBooking(slot, dayBookings)
    }));

    const availableSlots = slots.filter(s => s.available).length;
    
    return {
      date,
      dayName,
      slots,
      totalSlots: slots.length,
      availableSlots,
      busySlots: slots.length - availableSlots
    };
  }

  /**
   * Genera tutti gli slot di tempo possibili per una giornata
   */
  private generateAllTimeSlots(date: Date): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const config = this.SLOT_CONFIG;
    
    // Parsing degli orari di apertura e chiusura
    const [openHour, openMin] = config.openingTime.split(':').map(Number);
    const [closeHour, closeMin] = config.closingTime.split(':').map(Number);
    
    // Ora di inizio in minuti dall'inizio della giornata
    let currentMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;
    
    while (currentMinutes + config.slotDuration <= closeMinutes) {
      const startHour = Math.floor(currentMinutes / 60);
      const startMin = currentMinutes % 60;
      const endMinutes = currentMinutes + config.slotDuration;
      const endHour = Math.floor(endMinutes / 60);
      const endMinute = endMinutes % 60;
      
      const startTime = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      // Crea oggetti Date completi
      const startDateTime = new Date(date);
      startDateTime.setHours(startHour, startMin, 0, 0);
      
      const endDateTime = new Date(date);
      endDateTime.setHours(endHour, endMinute, 0, 0);
      
      slots.push({
        startTime,
        endTime,
        startDateTime,
        endDateTime,
        available: true // Sarà calcolato dopo
      });
      
      // Prossimo slot ogni intervalMinutes
      currentMinutes += config.intervalMinutes;
    }
    
    return slots;
  }

  /**
   * Verifica se uno slot è disponibile
   */
  private isSlotAvailable(slot: TimeSlot, existingBookings: BackendBooking[]): boolean {
    return !existingBookings.some(booking => 
      this.hasTimeConflict(slot, booking)
    );
  }

  /**
   * Trova la prenotazione che va in conflitto con lo slot
   */
  private findConflictingBooking(slot: TimeSlot, existingBookings: BackendBooking[]): BackendBooking | undefined {
    return existingBookings.find(booking => 
      this.hasTimeConflict(slot, booking)
    );
  }

  /**
   * Verifica se c'è conflitto tra uno slot e una prenotazione esistente
   */
  private hasTimeConflict(slot: TimeSlot, booking: BackendBooking): boolean {
    const bookingStart = new Date(booking.startDate);
    const bookingEnd = new Date(booking.endDate);
    
    // Due intervalli di tempo si sovrappongono se:
    // start1 < end2 && start2 < end1
    return slot.startDateTime < bookingEnd && bookingStart < slot.endDateTime;
  }

  /**
   * Valida una prenotazione prima di inviarla
   */
  validateBooking(startDateTime: Date, endDateTime: Date): SlotValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Verifica durata minima
    const durationMinutes = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);
    if (durationMinutes < this.SLOT_CONFIG.minBookingDuration) {
      errors.push(`La prenotazione deve durare almeno ${this.SLOT_CONFIG.minBookingDuration} minuti`);
    }
    
    // Verifica durata massima
    if (durationMinutes > this.SLOT_CONFIG.maxBookingDuration) {
      errors.push(`La prenotazione non può durare più di ${this.SLOT_CONFIG.maxBookingDuration} minuti`);
    }
    
    // Verifica che inizi su intervalli validi
    const startMinutes = startDateTime.getMinutes();
    if (startMinutes % this.SLOT_CONFIG.intervalMinutes !== 0) {
      errors.push(`L'orario di inizio deve essere su intervalli di ${this.SLOT_CONFIG.intervalMinutes} minuti`);
    }
    
    // Verifica che sia nel futuro
    if (startDateTime <= new Date()) {
      errors.push('Non è possibile prenotare nel passato');
    }
    
    // Verifica orari di apertura
    const config = this.SLOT_CONFIG;
    const [openHour] = config.openingTime.split(':').map(Number);
    const [closeHour] = config.closingTime.split(':').map(Number);
    
    if (startDateTime.getHours() < openHour || endDateTime.getHours() > closeHour) {
      errors.push(`Gli orari devono essere tra ${config.openingTime} e ${config.closingTime}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Crea una nuova prenotazione
   */
  createReservation(reservationData: CreateReservationRequest): Observable<ReservationCreated> {

    const url = `${this.API_BASE_URL}/reservations`;
    
    return this.http.post<ReservationCreated>(url, reservationData).pipe(
      tap(response => {
      }),
      catchError(this.handleBookingError)
    );
  }


    /**
   * Crea una nuova prenotazione
   */
  updateReservation(id: string, reservationData: CreateReservationRequest): Observable<ReservationCreated> {

    const url = `${this.API_BASE_URL}/reservations` + '/'+ id;
    
    return this.http.post<ReservationCreated>(url, reservationData).pipe(
      tap(response => {
      }),
      catchError(this.handleBookingError)
    );
  }
  /**
   * Gestisce gli errori delle API
   */
  private handleBookingError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Errore durante l\'operazione di prenotazione';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 401) {
      errorMessage = 'Sessione scaduta. Effettua nuovamente il login.';
    } else if (error.status === 403) {
      errorMessage = 'Non hai i permessi per effettuare questa prenotazione';
    } else if (error.status === 409) {
      errorMessage = 'Conflitto: la risorsa potrebbe essere già prenotata in questo orario';
    } else if (error.status === 422) {
      errorMessage = 'Dati di prenotazione non validi';
    } else if (error.status === 0) {
      errorMessage = 'Impossibile connettersi al server delle prenotazioni';
    }
    
  
    
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Formatta una data per le API (ISO string)
   */
  formatDateTimeForAPI(date: Date): string {
      const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  /**
   * Ottieni la configurazione degli slot
   */
  getSlotConfig(): SlotConfig {
    return { ...this.SLOT_CONFIG };
  }

  // Aggiungi questi metodi al BookingService esistente

/**
 * Recupera le prenotazioni dell'utente corrente
 */
getUserReservations(options: string = 'upcoming'): Observable<UserReservationsResponse> {
  
  const url = `${this.API_BASE_URL}/reservations/me?options=${options}`;
  
  return this.http.get<UserReservationsResponse>(url).pipe(
    tap(response => {
      if (response.success) {

      } else {
      }
    }),
    catchError(this.handleBookingError)
  );
}

/**
 * Mappa una prenotazione backend al formato per il componente Angular
 */
private mapToUserBooking(backendReservation: any) {
  return {
    id: parseInt(backendReservation.referenceNumber?.replace(/\D/g, '') || '0'),
    palestra: backendReservation.resourceName || 'Palestra',
    data: this.formatDisplayDate(backendReservation.startDateTime),
    dataCompleta: new Date(backendReservation.startDateTime),
    orarioInizio: this.extractTime(backendReservation.startDateTime),
    orarioFine: this.extractTime(backendReservation.endDateTime),
    tipo: backendReservation.tipo || 'Prenotazione',
    stato: this.mapReservationStatus(backendReservation.status),
    descrizione: backendReservation.description,
    canModify: backendReservation.canModify || false,
    canCancel: backendReservation.canCancel || false
  };
}

/**
 * Mappa lo stato della prenotazione
 */
private mapReservationStatus(status: string): 'confermata' | 'in-attesa' | 'completata' | 'cancellata' {
  switch (status?.toLowerCase()) {
    case 'confermata': return 'confermata';
    case 'in-attesa': return 'in-attesa';
    case 'completata': return 'completata';
    case 'cancellata': return 'cancellata';
    default: return 'confermata';
  }
}


// Aggiungi questi metodi al BookingService esistente (booking.service.ts)

/**
 * Cancella una prenotazione tramite il suo ID
 * @param reservationId ID della prenotazione da cancellare
 * @returns Observable con la risposta del backend
 */
deleteReservation(reservationId: string): Observable<{ success: boolean; message: string }> {
  
  const url = `${this.API_BASE_URL}/reservations/${reservationId}`;
  
  return this.http.delete<{ success: boolean; message: string }>(url).pipe(
    tap(response => {
      if (response.success) {
      } else {
      }
    }),
    catchError(this.handleDeleteError)
  );
}

/**
 * Gestisce gli errori specifici della cancellazione
 */
private handleDeleteError(error: HttpErrorResponse): Observable<never> {
  let errorMessage = 'Errore durante la cancellazione della prenotazione';
  
  if (error.error?.message) {
    errorMessage = error.error.message;
  } else if (error.status === 401) {
    errorMessage = 'Sessione scaduta. Effettua nuovamente il login.';
  } else if (error.status === 403) {
    errorMessage = 'Non hai i permessi per cancellare questa prenotazione';
  } else if (error.status === 404) {
    errorMessage = 'Prenotazione non trovata';
  } else if (error.status === 422) {
    errorMessage = 'Non è possibile cancellare questa prenotazione (potrebbe essere già passata o in corso)';
  } else if (error.status === 0) {
    errorMessage = 'Impossibile connettersi al server';
  }
  
  
  return throwError(() => new Error(errorMessage));
}

/**
 * Formatta la data per il display
 */
private formatDisplayDate(dateTimeString: string): string {
  if (!dateTimeString) return '';
  
  const date = new Date(dateTimeString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Oggi';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Domani';
  } else {
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short'
    });
  }
}

/**
 * Estrae l'orario da una stringa di data/ora
 */
private extractTime(dateTimeString: string): string {
  if (!dateTimeString) return '';
  
  const date = new Date(dateTimeString);
  return date.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

}