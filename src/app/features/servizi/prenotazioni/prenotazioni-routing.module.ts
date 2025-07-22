// prenotazioni-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Container principale
import { PrenotazioniComponent } from './prenotazioni.component';

// Guards del modulo
import { AuthGuard } from './core/guards/auth.guard';
import { LoggedInGuard } from './core/guards/logged-in.guard';

const routes: Routes = [
  {
    path: '',
    component: PrenotazioniComponent,
    data: { 
      title: 'Sistema Prenotazioni',
      description: 'Gestione prenotazioni palestre'
    }
  },
  
  // Redirect per compatibilità con vecchie route
  {
    path: 'login',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: 'register',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: 'profile',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: 'book',
    redirectTo: '',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PrenotazioniRoutingModule { }