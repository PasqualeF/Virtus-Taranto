import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Squad } from 'src/app/core/models/squad.model';
import { SquadService } from 'src/app/core/service/squad.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

type ViewType = 'results' | 'standings' | 'roster';

interface Tab {
  label: string;
  value: ViewType;
}

@Component({
  selector: 'app-squad',
  templateUrl: './squad.component.html',
  styleUrls: ['./squad.component.css']
})
export class SquadComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private squadService = inject(SquadService);
  loading = false;
  selectedSquad: Squad | null = null;
  selectedView: ViewType = 'results';
  private routeSubscription: Subscription | null = null;

  tabs: Tab[] = [
    { label: 'Risultati', value: 'results' },
    { label: 'Classifica', value: 'standings' },
    { label: 'Roster', value: 'roster' }
  ];
  error: string | null = null;

  ngOnInit() {
    this.loadSquadFromRoute();

    this.routeSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadSquadFromRoute();
    });
  }

  ngOnDestroy() {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  loadSquadFromRoute() {
    const squadName = this.route.snapshot.paramMap.get('id');
    if (squadName) {
      this.loadSquad(squadName);
    } else {
      this.error = 'Nessun nome squadra fornito nella route';
    }
  }

  loadSquad(name: string) {
    this.loading = true;
    this.error = null;
    
    this.squadService.getSquadByName(name).subscribe({
      next: (squad) => {
        if (squad) {
          this.selectedSquad = squad;
        } else {
          this.error = `Nessuna squadra trovata con il nome: ${name}`;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Errore nel caricamento della squadra:', err);
        this.error = 'Errore nel caricamento della squadra. Riprova più tardi.';
        this.loading = false;
      }
    });
  }

  getDisplayData(): any[] {
    if (!this.selectedSquad) return [];
    switch (this.selectedView) {
      case 'results':
        return this.selectedSquad.results;
      case 'standings':
        return this.selectedSquad.standings;
      case 'roster':
        return this.selectedSquad.roster;
    }
  }

  getTableHeaders(): string[] {
    const data = this.getDisplayData();
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }

  setView(view: ViewType) {
    this.selectedView = view;
  }
}