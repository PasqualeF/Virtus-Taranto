// src/app/core/models/reservation.model.ts

export interface AuthenticationResponse {
  sessionToken: string;
  userId: string;
  isAuthenticated: boolean;
  message?: string;
}

export interface AuthenticationRequest {
  username: string;
  password: string;
}

export interface ReservationLink {
  href: string;
  title: string;
}

export interface ReservationResponse {
  links: ReservationLink[];
  message: string | null;
  reservations: LibreBookingReservation[];
  startDateTime: string;
  endDateTime: string;
}

export interface LibreBookingReservation {
  links: ReservationLink[];
  message: string | null;
  referenceNumber: string;
  startDate: string;
  endDate: string;
  firstName: string;
  lastName: string;
  resourceName: string;
  title: string;
  description: string;
  requiresApproval: boolean;
  isRecurring: boolean;
  scheduleId: string;
  userId: string;
  resourceId: string;
  duration: string;
  bufferTime: string;
  bufferedStartDate: string;
  bufferedEndDate: string;
  participants: { [key: string]: string } | any[];
  invitees: any[];
  participatingGuests: any[];
  invitedGuests: any[];
  startReminder: any;
  endReminder: any;
  color: string;
  textColor: string;
  checkInDate: string;
  checkOutDate: string;
  originalEndDate: string;
  isCheckInEnabled: boolean;
  autoReleaseMinutes: any;
  resourceStatusId: string;
  creditsConsumed: any;
}

// Modello per i dati processati (quello che usiamo nel componente)
export interface OrarioAllenamento {
  gruppo: string;
  giorno: string;
  orario: string;
  palestra: string;
  // Campi aggiuntivi da LibreBooking
  referenceNumber?: string;
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isRecurring?: boolean;
}

export interface TabellaOrari {
  gruppo: string;
  [key: string]: string | OrarioAllenamento[];
}

export interface SquadraGiorno {
  gruppo: string;
  allenamenti: OrarioAllenamento[];
}