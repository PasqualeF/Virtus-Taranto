// components/booking-form/booking-form.component.ts - VERSIONE CON NUOVA LOGICA PRICING
import { Component, OnInit, Input, inject, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, finalize, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { BookingService } from '../../core/services/booking.service';
import { PalestreService, Palestra } from 'src/app/core/service/palestre.service';
import { AuthService } from '../../core/services/auth.service';
import {
  CreateReservationRequest,
  ReservationCreated,
  AvailabilitySlot,
  TrainingSchedule
} from 'src/app/core/models/booking.models';

// Interfaccia per i time slots
interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  timeLabel: string;
  duration: string;
  available: boolean;
  conflictInfo?: string;
  period: 'morning' | 'evening';
  durationMinutes: number;
}

// Interfaccia per i tipi di prenotazione
interface TipoPrenotazione {
  value: string;
  label: string;
}

// Interfaccia per le fasce di prezzo orarie AGGIORNATA
interface FasciaOraria {
  oraInizio: number;
  oraFine: number;
  prezzoOrario: number; // Prezzo per ora
  nome: string;
  descrizione: string;
  disponibile: boolean; // Aggiunto per gestire fasce non prenotabili
}

// Interfaccia per i costi fissi
interface CostiFissi {
  spogliatoio: number;
  custodia: number;
  riscaldamento: number;
}

// Interfaccia per il calcolo del prezzo
interface CalcoloPrezzoResult {
  costoFisso: number;
  costoOrario: number;
  costoTotale: number;
  dettaglioOrario: string;
  durataOre: number;
  durataMinuti: number;
}

// Interfaccia per la prenotazione da modificare
interface BookingToEdit {
  id: number;
  palestraId: number;
  palestra: string;
  data: string;
  orarioInizio: string;
  orarioFine: string;
  tipo: string;
  descrizione?: string;
}

@Component({
  selector: 'app-booking-form',
  templateUrl: './booking-form.component.html',
  styleUrls: ['./booking-form.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)' }),
        animate('300ms ease-out', style({ transform: 'translateX(0)' }))
      ])
    ]),
    trigger('stepTransition', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class BookingFormComponent implements OnInit {
  @Input() user: any = null;
  @Input() bookingToEdit: BookingToEdit | null = null;
  @Input() isEditMode = false;
  @Output() bookingSuccess = new EventEmitter<ReservationCreated>();
  @Output() editSuccess = new EventEmitter<any>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly bookingService = inject(BookingService);
  private readonly palestreService = inject(PalestreService);

  // Form
  bookingForm!: FormGroup;
  
  // State
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  // Dati
  palestre: Palestra[] = [];
  selectedPalestra: Palestra | null = null;
  
  // UI State
  currentStep = 1;
  totalSteps = 3;
  
  // Success state
  reservationCreated: ReservationCreated | null = null;
  showSuccessModal = false;

  // ===== TIME SLOTS CONFIGURATION =====
  morningSlots1h: TimeSlot[] = [];
  morningSlots1h30: TimeSlot[] = [];
  eveningSlots1h: TimeSlot[] = [];
  eveningSlots1h30: TimeSlot[] = [];
  
  selectedTimeSlot: TimeSlot | null = null;
  
  // ===== TIPI DI PRENOTAZIONE =====
  tipiPrenotazione: TipoPrenotazione[] = [
    { value: 'Allenamento', label: 'Allenamento' },
    { value: 'Partita amichevole', label: 'Partita amichevole' },
    { value: 'Partita Campionato', label: 'Partita Campionato' },
    { value: 'Amatoriale', label: 'Amatoriale' }
  ];

  // ===== COSTI FISSI =====
  readonly costiFissi: CostiFissi = {
    spogliatoio: 15,
    custodia: 10,
    riscaldamento: 10
  };

  // ===== FASCE ORARIE AGGIORNATE =====
  fasceOrarie: FasciaOraria[] = [
    { 
      oraInizio: 8, 
      oraFine: 15, 
      prezzoOrario: 9, 
      nome: 'Mattina/Primo pomeriggio',
      descrizione: 'dalle 08:00 alle 15:00',
      disponibile: true
    },
    { 
      oraInizio: 15, 
      oraFine: 17, 
      prezzoOrario: 13, 
      nome: 'Pomeriggio',
      descrizione: 'dalle 15:00 alle 17:00',
      disponibile: true
    },
    { 
      oraInizio: 17, 
      oraFine: 21, 
      prezzoOrario: 16, 
      nome: 'Sera (NON DISPONIBILE)',
      descrizione: 'dalle 17:00 alle 21:00 - Già occupato',
      disponibile: false // Non prenotabile
    },
    { 
      oraInizio: 21, 
      oraFine: 24, 
      prezzoOrario: 20, 
      nome: 'Tarda sera',
      descrizione: 'dalle 21:00 alle 23:30',
      disponibile: true
    }
  ];
  
  // Date limits
  readonly minDate = new Date().toISOString().split('T')[0];
  readonly maxDate = this.getMaxDate();

  // ===== COMPUTED PROPERTIES FOR TEMPLATE =====
  get canProceedToNextStep(): boolean {
    if (this.loadingSubject.value) return false;
    
    switch(this.currentStep) {
      case 1:
        const palestraValid = this.bookingForm.get('palestraId')?.valid || false;
        const dateValid = this.bookingForm.get('date')?.valid || false;
        return palestraValid && dateValid;
      case 2:
        return !!this.selectedTimeSlot && this.selectedTimeSlot.available;
      case 3:
        return this.bookingForm.valid || false;
      default:
        return false;
    }
  }

  get isEditingMode(): boolean {
    return this.isEditMode && !!this.bookingToEdit;
  }

  get formTitle(): string {
    return this.isEditingMode ? 'Modifica Prenotazione' : 'Nuova Prenotazione';
  }

  get formDescription(): string {
    return this.isEditingMode 
      ? 'Modifica i dettagli della tua prenotazione esistente'
      : 'Prenota la tua palestra con slot da 1h o 1h30min - compatibile LibreBooking';
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadPalestrePrenotabili();
    this.setupFormWatchers();
    this.generateTimeSlots();
    
    if (this.isEditingMode && this.bookingToEdit) {
      this.initializeEditMode();
    }
    
    // Aggiorna lo stato dei controlli form
    this.updateFormControlsState();
  }

  private initializeForm(): void {
    this.bookingForm = this.fb.group({
      palestraId: ['', [Validators.required]],
      date: ['', [Validators.required]],
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      acceptTerms: [false, [Validators.requiredTrue]]
    });
  }

  /**
   * Gestisce lo stato disabled/enabled dei controlli
   */
  private updateFormControlsState(): void {
    if (this.isEditingMode) {
      // In modalità modifica, disabilita la selezione palestra
      this.bookingForm.get('palestraId')?.disable();
    } else {
      // In modalità normale, abilita tutti i controlli
      this.bookingForm.get('palestraId')?.enable();
    }
  }

  /**
   * ===== NUOVA LOGICA DI CALCOLO PREZZO =====
   */

  /**
   * Calcola il prezzo totale per un time slot
   */
  calcolaPrezzoTimeSlot(timeSlot: TimeSlot): CalcoloPrezzoResult {
    const startHour = this.parseTimeToHour(timeSlot.startTime);
    const startMinute = this.parseTimeToMinute(timeSlot.startTime);
    const endHour = this.parseTimeToHour(timeSlot.endTime);
    const endMinute = this.parseTimeToMinute(timeSlot.endTime);
    
    // Calcola durata totale in minuti
    const durataMinutiTotali = timeSlot.durationMinutes;
    const durataOre = Math.floor(durataMinutiTotali / 60);
    const durataMinutiRimanenti = durataMinutiTotali % 60;
    
    // Costo fisso (sempre lo stesso)
    const costoFisso = this.costiFissi.spogliatoio + this.costiFissi.custodia + this.costiFissi.riscaldamento;
    
    // Calcola costo orario considerando le fasce attraversate
    let costoOrario = 0;
    let dettaglioOrario = '';
    
    // Determina la fascia oraria di inizio
    const fasciaInizio = this.getFasciaOrariaPerOra(startHour);
    
    if (!fasciaInizio || !fasciaInizio.disponibile) {
      // Se la fascia non è disponibile
      return {
        costoFisso,
        costoOrario: 0,
        costoTotale: costoFisso,
        dettaglioOrario: 'Fascia oraria non disponibile',
        durataOre,
        durataMinuti: durataMinutiRimanenti
      };
    }
    
    // Calcola il costo per ore intere
    if (durataOre > 0) {
      costoOrario += durataOre * fasciaInizio.prezzoOrario;
      dettaglioOrario += `${durataOre}h × €${fasciaInizio.prezzoOrario}`;
    }
    
    // Calcola il costo per i minuti rimanenti (mezza ora = metà prezzo)
    if (durataMinutiRimanenti > 0) {
      const costoMezzOra = fasciaInizio.prezzoOrario / 2;
      costoOrario += costoMezzOra;
      if (dettaglioOrario) dettaglioOrario += ' + ';
      dettaglioOrario += `30min × €${costoMezzOra.toFixed(1)}`;
    }
    
    return {
      costoFisso,
      costoOrario,
      costoTotale: costoFisso + costoOrario,
      dettaglioOrario: dettaglioOrario || `€${fasciaInizio.prezzoOrario}/h`,
      durataOre,
      durataMinuti: durataMinutiRimanenti
    };
  }

  /**
   * Trova la fascia oraria per una specifica ora
   */
  private getFasciaOrariaPerOra(hour: number): FasciaOraria | null {
    return this.fasceOrarie.find(fascia => 
      hour >= fascia.oraInizio && hour < fascia.oraFine
    ) || null;
  }

  /**
   * Verifica se un time slot è in una fascia disponibile
   */
  isTimeSlotInAvailableFascia(timeSlot: TimeSlot): boolean {
    const startHour = this.parseTimeToHour(timeSlot.startTime);
    const endHour = this.parseTimeToHour(timeSlot.endTime);
    
    // Verifica che tutto il time slot sia in fasce disponibili
    for (let hour = startHour; hour < endHour; hour++) {
      const fascia = this.getFasciaOrariaPerOra(hour);
      if (!fascia || !fascia.disponibile) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Metodi di supporto aggiornati
   */
  getFasciaOraria(startTime: string): FasciaOraria | null {
    const hour = this.parseTimeToHour(startTime);
    return this.getFasciaOrariaPerOra(hour);
  }

  getPrezzoPrenotazione(): string {
    if (!this.selectedTimeSlot) return '€ 0,00';
    
    const calcolo = this.calcolaPrezzoTimeSlot(this.selectedTimeSlot);
    return `€ ${calcolo.costoTotale.toFixed(2).replace('.', ',')}`;
  }

  /**
   * Ottiene il dettaglio completo del pricing
   */
  getDettaglioPrezzo(): CalcoloPrezzoResult | null {
    if (!this.selectedTimeSlot) return null;
    return this.calcolaPrezzoTimeSlot(this.selectedTimeSlot);
  }

  getFasciaOrariaLabel(): string {
    if (!this.selectedTimeSlot) return '';
    
    const fascia = this.getFasciaOraria(this.selectedTimeSlot.startTime);
    return fascia ? `${fascia.nome} (${fascia.descrizione})` : '';
  }

  /**
   * Ottiene solo le fasce disponibili per il pricing display
   */
  get fasceOrarieDisponibili(): FasciaOraria[] {
    return this.fasceOrarie.filter(fascia => fascia.disponibile);
  }

  private parseTimeToHour(timeString: string): number {
    return parseInt(timeString.split(':')[0]);
  }

  private parseTimeToMinute(timeString: string): number {
    return parseInt(timeString.split(':')[1]);
  }

  /**
   * ===== GENERAZIONE TIME SLOTS AGGIORNATA =====
   */
  private generateTimeSlots(): void {
    this.morningSlots1h = [];
    this.morningSlots1h30 = [];
    this.eveningSlots1h = [];
    this.eveningSlots1h30 = [];

    // MATTINA: 8:00 - 15:00 (disponibile)
    this.generateSlotsForPeriod('morning', 8, 15);
    
    // POMERIGGIO: 15:00 - 17:00 (disponibile)
    this.generateSlotsForPeriod('evening', 15, 17);
    
    // SERA: 17:00 - 21:00 (NON DISPONIBILE - saltiamo)
    // Non generiamo slot per questa fascia
    
    // TARDA SERA: 21:00 - 23:30 (disponibile)
    this.generateSlotsForPeriod('evening', 21, 23, 30); // Fino alle 23:30
  }

  private generateSlotsForPeriod(
    period: 'morning' | 'evening', 
    startHour: number, 
    endHour: number, 
    endMinutes: number = 0
  ): void {
    const startMinutes = startHour * 60;
    const endMinutesTotal = endHour * 60 + endMinutes;
    
    // Genera slot da 1 ora
    for (let minutes = startMinutes; minutes <= endMinutesTotal - 60; minutes += 30) {
      const slot = this.createTimeSlot(minutes, 60, period);
      
      // Verifica se il slot è in una fascia disponibile
      if (this.isTimeSlotInAvailableFascia(slot)) {
        if (period === 'morning') {
          this.morningSlots1h.push(slot);
        } else {
          this.eveningSlots1h.push(slot);
        }
      }
    }
    
    // Genera slot da 1 ora e 30
    for (let minutes = startMinutes; minutes <= endMinutesTotal - 90; minutes += 30) {
      const slot = this.createTimeSlot(minutes, 90, period);
      
      // Verifica se il slot è in una fascia disponibile
      if (this.isTimeSlotInAvailableFascia(slot)) {
        if (period === 'morning') {
          this.morningSlots1h30.push(slot);
        } else {
          this.eveningSlots1h30.push(slot);
        }
      }
    }
  }

  private createTimeSlot(startMinutes: number, durationMinutes: number, period: 'morning' | 'evening'): TimeSlot {
    const startHour = Math.floor(startMinutes / 60);
    const startMin = startMinutes % 60;
    const endMinutes = startMinutes + durationMinutes;
    const endHour = Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;
    
    const startTime = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
    const timeLabel = `${startTime} - ${endTime}`;
    
    const duration = durationMinutes === 60 ? '1h' : '1h30';
    const id = `${period}_${startTime}_${endTime}`;

    return {
      id,
      startTime,
      endTime,
      timeLabel,
      duration,
      available: true,
      period,
      durationMinutes
    };
  }

  /**
   * Inizializza il form in modalità modifica
   */
  private initializeEditMode(): void {
    if (!this.bookingToEdit) return;

    this.bookingForm.patchValue({
      palestraId: this.bookingToEdit.palestraId.toString(),
      date: this.bookingToEdit.data,
      title: this.bookingToEdit.tipo,
      description: this.bookingToEdit.descrizione || '',
      acceptTerms: true
    });

    setTimeout(() => {
      this.selectedPalestra = this.palestre.find(p => p.id === this.bookingToEdit!.palestraId) || null;
      
      if (this.bookingToEdit) {
        this.createTimeSlotFromExisting();
      }
    }, 500);
  }

  private createTimeSlotFromExisting(): void {
    if (!this.bookingToEdit) return;

    const startTime = this.bookingToEdit.orarioInizio;
    const endTime = this.bookingToEdit.orarioFine;
    const durationMinutes = this.calculateDurationMinutes(startTime, endTime);
    const timeLabel = `${startTime} - ${endTime}`;
    const duration = durationMinutes === 60 ? '1h' : '1h30';
    const period = this.parseTimeToHour(startTime) < 15 ? 'morning' : 'evening';

    this.selectedTimeSlot = {
      id: `edit_${startTime}_${endTime}`,
      startTime,
      endTime,
      timeLabel,
      duration,
      available: true,
      period,
      durationMinutes
    };
  }

  private calculateDurationMinutes(startTime: string, endTime: string): number {
    const start = this.parseTimeToMinutes(startTime);
    const end = this.parseTimeToMinutes(endTime);
    return end - start;
  }

  private parseTimeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // ===== RESTO DEI METODI (invariati) =====
  private setupFormWatchers(): void {
    this.bookingForm.get('palestraId')?.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(palestraId => {
        if (palestraId) {
          this.onPalestraChange(Number(palestraId));
        }
      });

    this.bookingForm.get('date')?.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(date => {
        if (date && this.selectedPalestra && !this.isEditingMode) {
          this.loadAvailabilityForTimeSlots();
        }
      });
  }

  private loadPalestrePrenotabili(): void {
    this.setLoading(true);
    
    this.palestreService.getPalestrePrenotabili().subscribe({
      next: (palestre) => {
        this.palestre = palestre;
      },
      error: (error) => {
        this.setError('Errore nel caricamento delle palestre disponibili');
      },
      complete: () => this.setLoading(false)
    });
  }

  onPalestraChange(palestraId: number): void {
    this.selectedPalestra = this.palestre.find(p => p.id === palestraId) || null;
    
    if (this.selectedPalestra && !this.isEditingMode) {
      this.selectedTimeSlot = null;
      this.resetAllSlotsAvailability();
      
      const selectedDate = this.bookingForm.get('date')?.value;
      if (selectedDate) {
        this.loadAvailabilityForTimeSlots();
      }
    }
  }

  private loadAvailabilityForTimeSlots(): void {
    if (!this.selectedPalestra || this.isEditingMode) return;

    const selectedDate = this.bookingForm.get('date')?.value;
    if (!selectedDate) return;

    this.setLoading(true);
    this.setError(null);

    this.bookingService.getAvailabilityForDate(this.selectedPalestra.nome, selectedDate).subscribe({
      next: (dayAvailability) => {
        this.updateSlotsAvailability(dayAvailability.slots);
      },
      error: (error) => {
        this.setError('Errore nel caricamento della disponibilità');
        this.resetAllSlotsAvailability();
      },
      complete: () => this.setLoading(false)
    });
  }

  private updateSlotsAvailability(availabilitySlots: any[]): void {
    this.resetAllSlotsAvailability();
    
    const allSlots = [
      ...this.morningSlots1h,
      ...this.morningSlots1h30,
      ...this.eveningSlots1h,
      ...this.eveningSlots1h30
    ];

    allSlots.forEach(slot => {
      const slotStart = this.parseTimeToDate(slot.startTime);
      const slotEnd = this.parseTimeToDate(slot.endTime);
      
      const hasConflict = availabilitySlots.some(existingSlot => {
        if (!existingSlot.conflictingBooking) return false;
        
        const existingStart = new Date(existingSlot.startDateTime);
        const existingEnd = new Date(existingSlot.endDateTime);
        
        return (slotStart < existingEnd && slotEnd > existingStart);
      });
      
      if (hasConflict) {
        slot.available = false;
        const conflictingSlot = availabilitySlots.find(s => {
          if (!s.conflictingBooking) return false;
          const existingStart = new Date(s.startDateTime);
          const existingEnd = new Date(s.endDateTime);
          return (slotStart < existingEnd && slotEnd > existingStart);
        });
        
        slot.conflictInfo = conflictingSlot?.conflictingBooking?.title || 'Slot occupato';
      }
    });
  }

  private parseTimeToDate(timeString: string): Date {
    const selectedDate = this.bookingForm.get('date')?.value;
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date(selectedDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  private resetAllSlotsAvailability(): void {
    const allSlots = [
      ...this.morningSlots1h,
      ...this.morningSlots1h30,
      ...this.eveningSlots1h,
      ...this.eveningSlots1h30
    ];

    allSlots.forEach(slot => {
      slot.available = true;
      slot.conflictInfo = undefined;
    });
  }

  selectTimeSlot(slot: TimeSlot): void {
    if (!slot.available && !this.isEditingMode) {
      return;
    }

    this.selectedTimeSlot = slot;
    this.setError(null);
  }

  // ===== NAVIGATION =====
  nextStep(): void {
    if (this.canProceedToNextStep) {
      this.currentStep = Math.min(this.currentStep + 1, this.totalSteps);
      this.setError(null);
    } else {
      this.markCurrentStepTouched();
      
      if (this.currentStep === 2 && !this.selectedTimeSlot) {
        this.setError('Seleziona un orario per continuare');
      }
    }
  }

  previousStep(): void {
    this.currentStep = Math.max(this.currentStep - 1, 1);
    this.setError(null);
  }

  cancelEdit(): void {
    this.cancelled.emit();
  }

  private markCurrentStepTouched(): void {
    if (this.currentStep === 1) {
      ['palestraId', 'date'].forEach(field => {
        this.bookingForm.get(field)?.markAsTouched();
      });
    } else if (this.currentStep === 3) {
      ['title', 'acceptTerms'].forEach(field => {
        this.bookingForm.get(field)?.markAsTouched();
      });
    }
  }

  // ===== SUBMIT =====
  onSubmit(): void {
    if (!this.bookingForm.valid || !this.selectedTimeSlot) {
      this.markFormGroupTouched();
      if (!this.selectedTimeSlot) {
        this.setError('Seleziona un orario per completare la prenotazione');
      }
      return;
    }

    if (this.isEditingMode) {
      this.updateReservation();
    } else {
      this.createReservation();
    }
  }

  private createReservation(): void {
    const formData = this.bookingForm.value;
    
    try {
      const reservation = this.buildReservationFromTimeSlot(formData);
      
      this.setLoading(true);

      this.bookingService.createReservation(reservation).subscribe({
        next: (response) => {
          this.reservationCreated = response;
          this.showSuccessModal = true;
          this.bookingSuccess.emit(response);
        },
        error: (error) => {
          this.setError(error.message || 'Errore durante la creazione della prenotazione');
        },
        complete: () => this.setLoading(false)
      });
    } catch (error: any) {
      this.setError(error.message || 'Dati di prenotazione non validi');
    }
  }

  private updateReservation(): void {
    if (!this.bookingToEdit) return;

    const formData = this.bookingForm.value;
    try {
      const updateData = this.buildUpdateRequestFromTimeSlot(formData);
      
      this.setLoading(true);

      this.bookingService.updateReservation(this.bookingToEdit.id.toString(), updateData).subscribe({
        next: (response) => {
          this.editSuccess.emit(response);
        },
        error: (error) => {
          this.setError(error.message || 'Errore durante la modifica della prenotazione');
        },
        complete: () => this.setLoading(false)
      });
    } catch (error: any) {
      this.setError(error.message || 'Dati di modifica non validi');
    }
  }

  private buildReservationFromTimeSlot(formData: any): CreateReservationRequest {
    if (!this.selectedTimeSlot) {
      throw new Error('Nessun time slot selezionato');
    }

    const selectedDate = formData.date;
    const startDateTime = this.buildDateTime(selectedDate, this.selectedTimeSlot.startTime);
    const endDateTime = this.buildDateTime(selectedDate, this.selectedTimeSlot.endTime);
    
    const validation = this.bookingService.validateBooking(startDateTime, endDateTime);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }
    
    return {
      resourceId: 3,
      startDateTime: this.bookingService.formatDateTimeForAPI(startDateTime),
      endDateTime: this.bookingService.formatDateTimeForAPI(endDateTime),
      title: formData.title,
      description: formData.description || `Prenotazione ${this.selectedTimeSlot.duration} - ${this.selectedTimeSlot.timeLabel}`,
      termsAccepted: formData.acceptTerms
    };
  }

  private buildUpdateRequestFromTimeSlot(formData: any): CreateReservationRequest {
    if (!this.selectedTimeSlot) {
      throw new Error('Nessun time slot selezionato');
    }

    const selectedDate = formData.date;
    const startDateTime = this.buildDateTime(selectedDate, this.selectedTimeSlot.startTime);
    const endDateTime = this.buildDateTime(selectedDate, this.selectedTimeSlot.endTime);
    
    return {
      startDateTime: this.bookingService.formatDateTimeForAPI(startDateTime),
      endDateTime: this.bookingService.formatDateTimeForAPI(endDateTime),
      title: formData.title,
      description: formData.description || `Prenotazione ${this.selectedTimeSlot.duration} - ${this.selectedTimeSlot.timeLabel}`,
      resourceId: 3,
    };
  }

  private buildDateTime(date: string, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const dateTime = new Date(date);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime;
  }

  // ===== SUCCESS MODAL =====
  closeSuccessModal(): void {
    this.showSuccessModal = false;
    if (!this.isEditingMode) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.bookingForm.reset();
    this.currentStep = 1;
    this.selectedPalestra = null;
    this.selectedTimeSlot = null;
    this.reservationCreated = null;
    this.resetAllSlotsAvailability();
    this.setError(null);
  }

  // ===== UTILITY METHODS =====
  private getMaxDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 6);
    return date.toISOString().split('T')[0];
  }

  private markFormGroupTouched(): void {
    Object.keys(this.bookingForm.controls).forEach(key => {
      const control = this.bookingForm.get(key);
      control?.markAsTouched();
    });
  }

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  setError(error: string | null): void {
    this.errorSubject.next(error);
  }

  // ===== GETTERS =====
  get progressPercentage(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  get selectedPalestraName(): string {
    return this.selectedPalestra?.nome || '';
  }

  get formattedSelectedDate(): string {
    const date = this.bookingForm.get('date')?.value;
    if (!date) return '';
    
    return new Date(date).toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  get allSlotsEmpty(): boolean {
    const totalSlots = this.morningSlots1h.length + 
                      this.morningSlots1h30.length + 
                      this.eveningSlots1h.length + 
                      this.eveningSlots1h30.length;
    return totalSlots === 0;
  }

  // ===== TEMPLATE HELPERS =====
  isFieldInvalid(fieldName: string): boolean {
    const field = this.bookingForm.get(fieldName);
    // Un campo disabilitato non dovrebbe essere considerato invalido nell'UI
    if (field?.disabled) return false;
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.bookingForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${this.getFieldDisplayName(fieldName)} è obbligatorio`;
      if (field.errors['minlength']) return `Minimo ${field.errors['minlength'].requiredLength} caratteri`;
      if (field.errors['requiredTrue']) return 'È necessario accettare i termini';
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const names: { [key: string]: string } = {
      'palestraId': 'Palestra',
      'date': 'Data',
      'title': 'Titolo'
    };
    return names[fieldName] || fieldName;
  }

  isSlotAvailable(slot: TimeSlot): boolean {
    return slot.available;
  }

  isSlotSelected(slot: TimeSlot): boolean {
    return this.selectedTimeSlot?.id === slot.id;
  }

  getSelectedTipoLabel(): string {
    const selectedTitle = this.bookingForm.get('title')?.value;
    if (!selectedTitle) return 'Non selezionato';
    
    const tipoPrenotazione = this.tipiPrenotazione.find(tipo => tipo.value === selectedTitle);
    return tipoPrenotazione?.label || selectedTitle;
  }
}