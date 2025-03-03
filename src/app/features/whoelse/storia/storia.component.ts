// src/app/components/storia/storia.component.ts

import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { Router } from '@angular/router';
import { Societa } from 'src/app/core/models/societa.model';
import { TranslateService } from '@ngx-translate/core';
interface SocietaMap {
  [key: string]: Societa;
}
@Component({
  selector: 'app-storia',
  templateUrl: './storia.component.html',
  styleUrls: ['./storia.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('600ms', style({ opacity: 1 })),
      ]),
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(50px)', opacity: 0 }),
        animate('600ms ease-out', style({ transform: 'translateY(0)', opacity: 1 })),
      ]),
    ])
  ]
})
export class StoriaComponent implements OnInit {
  societa: Societa[] = [];
  selectedSocieta: Societa | null = null;
  activeTab: 'storia' | 'valori' | 'palmares' = 'storia';

  constructor(
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadData();
    
    // Sottoscrizione ai cambiamenti di lingua
    this.translate.onLangChange.subscribe(() => {
      this.loadData();
    });
  }

  
  private loadData(): void {
    // Carica i dati dalla struttura oggetto delle società
    this.translate.get('STORIA.SOCIETA').subscribe((societaMap: SocietaMap) => {
      // Converti l'oggetto in array
      this.societa = Object.values(societaMap);
      
      if (this.societa.length > 0) {
        this.selectedSocieta = this.societa[0];
      }
    });
  }

  selectSocieta(societa: Societa) {
    this.selectedSocieta = societa;
  }

  setActiveTab(tab: 'storia' | 'valori' | 'palmares') {
    this.activeTab = tab;
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  changeLang(lang: string) {
    this.translate.use(lang);
  }
}