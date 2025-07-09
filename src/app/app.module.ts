import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule, routes } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomeComponent } from './features/home//home.component';
import { CalendarComponent } from './features/calendar/calendar.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ButtonComponent } from './shared/components/button/button.component';
import { CardComponent } from './shared/components/card/card.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { MatchesSectionComponent } from './features/home/matches-section/matches-section.component';
import { TeamsSectionComponent } from './features/home/teams-section/teams-section.component';
import { SquadComponent } from './features/squad/squad.component';
import { RouterModule } from '@angular/router';
import { StoryComponent } from './features/home/story/story.component';
import { SposorSectionComponent } from './features/squad/sposor-section/sposor-section.component';
import { StoriaComponent } from './features/whoelse/storia/storia.component';
import { OrganigrammaComponent } from './features/whoelse/organigramma/organigramma.component';
import { OrariAllenamentiComponent } from './features/news/orari-allenamenti/orari-allenamenti.component';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PalestreComponent } from './features/whoelse/palestre/palestre.component';
import { MatIconModule } from '@angular/material/icon';
import { UltimissimeComponent } from './features/news/ultimissime/ultimissime.component';
import { ShopPreviewComponent } from './features/home/shop-preview/shop-preview.component';
import { PartnerComponent } from './features/whoelse/partner/partner.component';
import { VisitaMedicaComponent } from './features/servizi/visita-medica/visita-medica.component';
import { IscrizioniGiovaniliComponent } from './features/servizi/iscrizioni-giovanili/iscrizioni-giovanili.component';
import { CodiceEticoComponent } from './features/servizi/codice-etico/codice-etico.component';
import { AperturaInfortuniComponent } from './features/servizi/apertura-infortuni/apertura-infortuni.component';
import { ContattiComponent } from './features/whoelse/contatti/contatti.component';
import { ComunicazioniComponent } from './features/news/comunicazioni/comunicazioni.component';
import { CalendarioComponent } from './features/eventi/calendario/calendario.component';
import { FullCalendarModule } from '@fullcalendar/angular';
import { TorneiComponent } from './features/eventi/tornei/tornei.component';
import { EventiSpecialiComponent } from './features/eventi/eventi-speciali/eventi-speciali.component';
import { SocialFeedComponent } from './features/news/social-feed/social-feed.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NewsComponent } from './features/home/news-section/news-section.component';
import { YouthTeamsComponent } from './features/squad/mini/youth-teams.component';
import { ShopComponent } from './features/shop/shop.component';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { MediaComponent } from './features/media/media-gallery.component';
import { AchievementsComponent } from './features/whoelse/achivements/achievements.component';

// Factory function per il TranslateHttpLoader
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    CalendarComponent,
    NavbarComponent,
    ButtonComponent,
    CardComponent,
    FooterComponent,
    MatchesSectionComponent,
    TeamsSectionComponent,
    SquadComponent,
    StoryComponent,
    SposorSectionComponent,
    StoriaComponent,
    OrganigrammaComponent,
    OrariAllenamentiComponent,
    PalestreComponent,
    UltimissimeComponent,
    ShopPreviewComponent,
    PartnerComponent,
    VisitaMedicaComponent,
    IscrizioniGiovaniliComponent,
    CodiceEticoComponent,
    AperturaInfortuniComponent,
    ContattiComponent,
    ComunicazioniComponent,
    CalendarioComponent,
    TorneiComponent,
    EventiSpecialiComponent,
    SocialFeedComponent,
    NewsComponent,
    YouthTeamsComponent,
    ShopComponent,
    MediaComponent,
    AchievementsComponent
    ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    FormsModule,
    MatIconModule,
    FullCalendarModule,
    TranslateModule.forRoot({
      defaultLanguage: 'it',
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled', // abilita il ripristino della posizione dello scroll
      anchorScrolling: 'enabled', // abilita lo scroll agli anchor
      scrollOffset: [0, 0], // offset per lo scroll
      onSameUrlNavigation: 'reload' // ricarica la pagina anche se l'URL è lo stesso
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
