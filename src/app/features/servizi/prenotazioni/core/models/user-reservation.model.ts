export interface UserReservationsResponse {
  reservations: UserReservation[];
  totalCount: number;
  startDateTime?: string;
  endDateTime?: string;
  success: boolean;
  message?: string;
  confirmedCount?: number;
  pendingCount?: number;
  upcomingCount?: number;

}

export interface UserReservation {
  referenceNumber: string;
  resourceId: number;
  resourceName: string;
  startDateTime: string;
  endDateTime: string;
  duration: string;
  formattedDate: string;
  formattedTimeRange: string;
  title: string;
  description?: string;
  tipo: string;
  status: 'confermata' | 'in-attesa' | 'completata' | 'cancellata';
  isPendingApproval?: boolean;
  isRecurring?: boolean;
  canModify: boolean;
  canCancel: boolean;
  canCheckIn?: boolean;
  canCheckOut?: boolean;
  color?: string;
  textColor?: string;
  participants?: string[];
  invitees?: string[];
  participantCount?: number;
  checkInDate?: string;
  checkOutDate?: string;
  creditsConsumed?: number;
}