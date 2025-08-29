import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { TranslateService } from '@ngx-translate/core';
import { Societa } from 'src/app/core/models/societa.model';

// Interfaccia per il selector delle società
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
  // Opzioni società per il selector
  societaOptions: SocietaSelector[] = [
    { nome: 'Virtus Taranto', logo: 'assets/logo-virtus-taranto.png' },
    { nome: 'Polisportiva 74020', logo: 'assets/poliLogo.png' },
    { nome: 'Support_O', logo: 'assets/support_o2022 (1).png' },
    { nome: 'A.s.h. Baskin', logo: 'assets/baskin22.png' }
  ];

  // Dati delle società
  societa: Societa[] = [];
  selectedSocieta: Societa | null = null;
  selectedSocietaNome: string = 'Virtus Taranto';

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    this.loadData();
    
    this.translate.onLangChange.subscribe(() => {
      this.loadData();
    });
  }

  private loadData(): void {
    this.translate.get('STORIA.SOCIETA').subscribe((societaMap: SocietaMap) => {
      this.societa = Object.values(societaMap);
      
      if (this.societa.length > 0) {
        this.selectedSocieta = this.societa.find(s => s.nome === this.selectedSocietaNome) || this.societa[0];
      }
    });
  }

  selectSocieta(societaOption: SocietaSelector) {
    this.selectedSocietaNome = societaOption.nome;
    this.selectedSocieta = this.societa.find(s => s.nome === societaOption.nome) || null;
  }

  isSocietaActive(societaOption: SocietaSelector): boolean {
    return this.selectedSocietaNome === societaOption.nome;
  }
}