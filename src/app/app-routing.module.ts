import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { SquadComponent } from './features/squad/squad.component';
import { CalendarComponent } from './features/calendar/calendar.component';
import { StoriaComponent } from './features/whoelse/storia/storia.component';
import { OrganigrammaComponent } from './features/whoelse/organigramma/organigramma.component';
import { OrariAllenamentiComponent } from './features/news/orari-allenamenti/orari-allenamenti.component';
import { PalestreComponent } from './features/whoelse/palestre/palestre.component';
import { UltimissimeComponent } from './features/news/ultimissime/ultimissime.component';
import { PartnerComponent } from './features/whoelse/partner/partner.component';
import { VisitaMedicaComponent } from './features/servizi/visita-medica/visita-medica.component';
import { IscrizioniGiovaniliComponent } from './features/servizi/iscrizioni-giovanili/iscrizioni-giovanili.component';
import { CodiceEticoComponent } from './features/servizi/codice-etico/codice-etico.component';
import { AperturaInfortuniComponent } from './features/servizi/apertura-infortuni/apertura-infortuni.component';
import { ContattiComponent } from './features/whoelse/contatti/contatti.component';
import { ComunicazioniComponent } from './features/news/comunicazioni/comunicazioni.component';
import { CalendarioComponent } from './features/eventi/calendario/calendario.component';
import { TorneiComponent } from './features/eventi/tornei/tornei.component';
import { EventiSpecialiComponent } from './features/eventi/eventi-speciali/eventi-speciali.component';
import { SocialFeedComponent } from './features/news/social-feed/social-feed.component';
import { YouthTeamsComponent } from './features/squad/mini/youth-teams.component';
import { ShopComponent } from './features/shop/shop.component';
import { MediaComponent } from './features/media/media-gallery.component';
import { AchievementsComponent } from './features/whoelse/achivements/achievements.component';


export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'squadra/basket/:id', component: SquadComponent },
  { path: 'squadra/basket-maschile/:id', component: SquadComponent },
  { path: 'squadra/basket-femminile/:id', component: SquadComponent },
  { path: 'squadra/pallavolo/:id', component: SquadComponent },
  { path: 'squadra/mini/:id', component: YouthTeamsComponent },
  { path: 'squadra/mini/minibasket', component: YouthTeamsComponent },
  /*news*/
  { path: 'news/orari-allenamenti', component: OrariAllenamentiComponent },
  { path: 'news/ultimissime', component: UltimissimeComponent },
  { path: 'news/comunicazioni', component: ComunicazioniComponent },
  { path: 'news/social', component: SocialFeedComponent },

  { path: 'media/foto', component: MediaComponent },
    /*fine news*/
   /*who-else*/
  { path: 'who-else/storia', component: StoriaComponent },
  { path: 'who-else/organigramma', component: OrganigrammaComponent },
  { path: 'who-else/palestre', component: PalestreComponent },
  { path: 'who-else/partner', component: PartnerComponent },
  { path: 'who-else/contatti', component: ContattiComponent },
   { path: 'who-else/achivements', component: AchievementsComponent },
  /*fine who-else*/
  /*eventi*/
  { path: 'eventi/calendario', component: CalendarioComponent },
  { path: 'eventi/tornei', component: TorneiComponent },
  { path: 'eventi/eventiSpeciali', component: EventiSpecialiComponent },
  /*fine eventi*/
  { path: 'servizi/visitaMedica', component: VisitaMedicaComponent }, 
  { path: 'servizi/iscrizioni', component: IscrizioniGiovaniliComponent }, 
  { path: 'servizi/codiceEtico', component: CodiceEticoComponent },
  { path: 'servizi/assicurazione', component: AperturaInfortuniComponent },

  { path: 'shop', component: ShopComponent },


  { path: 'calendario', component: CalendarComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }