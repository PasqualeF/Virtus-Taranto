// booking.models.ts
export interface CreateReservationRequest {
  resourceId: number;
  startDateTime: string; // ISO string format
  endDateTime: string;   // ISO string format
  title: string;
  description?: string;
  participants?: string[];
  participatingGuests?: string[];
  invitees?: string[];
  invitedGuests?: string[];
  recurrenceRule?: string;
  allowParticipation?: boolean;
  termsAccepted?: boolean;
}

export interface ReservationCreated {
id: any;
  referenceNumber: string;
  isPendingApproval: boolean;
  message: string;
  success: boolean;
  startDateTime?: string;
  endDateTime?: string;
  title?: string;
  resourceId?: number;
}

export interface BookingResource {
  id: number;
  name: string;
  description?: string;
  capacity?: number;
}

export interface ResourcesResponse {
  resources: BookingResource[];
  success: boolean;
  message?: string;
}

export interface TrainingSchedule {
  id?: number;
  title: string;
  startTime: string;
  endTime: string;
  day: string;
  description?: string;
  recurring: boolean;
}

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  available: boolean;
  reason?: string; // Motivo se non disponibile
}

// core/models/booking.models.ts - AGGIORNATO PER IL TUO BACKEND

// ===== RESPONSE DAL TUO BACKEND =====
export interface BackendBookingsResponse {
  success: boolean;
  message: string | null;
  data: BackendBooking[];
  timestamp: string;
}

export interface BackendBooking {
  gruppo: string;
  giorno: string;
  orario: string; // es: "10:30-11:00"
  palestra: string;
  palestraId: string;
  referenceNumber: string;
  title: string;
  description: string;
  startDate: string; // ISO string es: "2025-07-15T10:30:00+0000"
  endDate: string; // ISO string es: "2025-07-15T11:00:00+0000"
  isRecurring: boolean;
}

// ===== SLOT DI DISPONIBILITÀ =====
export interface TimeSlot {
  startTime: string; // es: "08:00"
  endTime: string; // es: "09:00"
  startDateTime: Date; // Data completa di inizio
  endDateTime: Date; // Data completa di fine
  available: boolean;
  conflictingBooking?: BackendBooking; // Se non disponibile, quale prenotazione lo blocca
  isPartiallyBlocked?: boolean; // Se solo parzialmente bloccato
}

export interface DayAvailability {
  date: string; // es: "2025-07-19"
  dayName: string; // es: "Sabato"
  slots: TimeSlot[];
  totalSlots: number;
  availableSlots: number;
  busySlots: number;
}

// ===== CONFIGURAZIONE SLOT =====
export interface SlotConfig {
  openingTime: string; // es: "08:00"
  closingTime: string; // es: "22:00"
  slotDuration: number; // Durata in minuti (60)
  intervalMinutes: number; // Intervallo di inizio (15)
  minBookingDuration: number; // Durata minima prenotazione (60)
  maxBookingDuration: number; // Durata massima prenotazione (240 = 4 ore)
}



// ===== UTILITY TYPES =====
export interface TimeRange {
  start: Date;
  end: Date;
}

export interface SlotValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}