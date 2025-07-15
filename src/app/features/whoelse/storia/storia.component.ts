// src/app/components/storia/storia.component.ts

import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { Router } from '@angular/router';
import { Societa } from 'src/app/core/models/societa.model';
import { TranslateService } from '@ngx-translate/core';

// Interfaccia per il selector delle società (allineata con achievements)
interface SocietaSelector {
  nome: string;
  logo: string;
}

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
  // Struttura società per il selector (allineata con achievements)
  societaOptions: SocietaSelector[] = [
    { nome: 'Virtus Taranto', logo: 'assets/logo-virtus-taranto.svg' },
    { nome: 'Polisportiva 74020', logo: 'assets/poliLogo.png' },
    { nome: 'Support_O', logo: 'assets/support_o2022 (1).png' },
    { nome: 'A.s.h. Baskin', logo: 'assets/baskin22.png' }
  ];

  // Dati completi delle società (dal translate service)
  societa: Societa[] = [];
  selectedSocieta: Societa | null = null;
  selectedSocietaNome: string = 'Virtus Taranto'; // Per tracking del nome selezionato
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
        // Trova la società corrispondente al nome selezionato
        this.selectedSocieta = this.societa.find(s => s.nome === this.selectedSocietaNome) || this.societa[0];
      }
    });
  }

  // Metodo aggiornato per essere compatibile con il nuovo selector
  selectSocieta(societaOption: SocietaSelector) {
    this.selectedSocietaNome = societaOption.nome;
    // Trova i dati completi della società selezionata
    this.selectedSocieta = this.societa.find(s => s.nome === societaOption.nome) || null;
    
  }

  // Metodo per verificare se una società è attiva (per il CSS)
  isSocietaActive(societaOption: SocietaSelector): boolean {
    return this.selectedSocietaNome === societaOption.nome;
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