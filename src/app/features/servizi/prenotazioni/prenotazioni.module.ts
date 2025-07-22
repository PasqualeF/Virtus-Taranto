// prenotazioni.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

// Routing
import { PrenotazioniRoutingModule } from './prenotazioni-routing.module';

// Container principale
import { PrenotazioniComponent } from './prenotazioni.component';

// Componenti Auth
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { UserProfileComponent } from './components/auth/user-profile/user-profile.component';

// Componenti Booking

// Componenti Shared


// Services (isolati al modulo)
import { AuthService } from './core/services/auth.service';
import { BookingService } from './core/services/booking.service';

// Guards
import { AuthGuard } from './core/guards/auth.guard';
import { LoggedInGuard } from './core/guards/logged-in.guard';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MyBookingsComponent } from './components/my-bookings/my-bookings.component';
import { BookingAuthInterceptor } from './core/interceptors/booking-auth.interceptor';
import { BookingFormComponent } from './components/booking-form/booking-form.component';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';

// Interceptors

@NgModule({
  declarations: [
    PrenotazioniComponent,
  LoginComponent,
  RegisterComponent,
  UserProfileComponent, 
  DashboardComponent,
  BookingFormComponent,
  MyBookingsComponent
  
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    PrenotazioniRoutingModule
  ],
  providers: [
    // Servizi isolati al modulo
    BookingService,    
    // Guards
    AuthGuard,
    LoggedInGuard,
  
  ]
})
export class PrenotazioniModule { 
  constructor() {
  }
}