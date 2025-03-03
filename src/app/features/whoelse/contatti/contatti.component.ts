// src/app/components/contatti/contatti.component.ts

import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { TranslateService } from '@ngx-translate/core';
import { Societa } from 'src/app/core/models/societa.model';
import { SocietaMap } from 'src/app/core/models/societaMap';



@Component({
  selector: 'app-contatti',
  templateUrl: './contatti.component.html',
  styleUrls: ['./contatti.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('600ms', style({ opacity: 1 })),
      ]),
    ]),
    trigger('flipIn', [
      transition(':enter', [
        style({ transform: 'rotateY(90deg)' }),
        animate('600ms ease-out', style({ transform: 'rotateY(0deg)' })),
      ]),
    ])
  ]
})
export class ContattiComponent implements OnInit {
  formData = {
    nome: '',
    email: '',
    telefono: '',
    societa: '',
    messaggio: ''
  };
  societa: Societa[] = [];

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    this.loadData();
    
    // Sottoscrizione ai cambiamenti di lingua
    this.translate.onLangChange.subscribe(() => {
      this.loadData();
    });
  }

  
  private loadData(): void {
    // Carica i dati dalla struttura oggetto delle società
    this.translate.get('CONTATTI.societa').subscribe((societaMap: SocietaMap) => {
      // Converti l'oggetto in array
      this.societa = Object.values(societaMap);
    });
  }

  onSubmit() {
    console.log('Form inviato:', this.formData);
    this.formData = {
      nome: '',
      email: '',
      telefono: '',
      societa: '',
      messaggio: ''
    };
  }

  toggleExpand(societa: Societa) {
    societa.expanded = !societa.expanded;
  }
}