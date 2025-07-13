// src/app/components/contatti/contatti.component.ts

import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { TranslateService } from '@ngx-translate/core';
import { Societa } from 'src/app/core/models/societa.model';
import { SocietaMap } from 'src/app/core/models/societaMap';
import { RichiesteInformazioniService } from 'src/app/core/service/richieste-informazioni.service';
import { RichiestaInformazioniCreate } from 'src/app/core/models/richiesta-informazioni.model';

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
  isSubmitting = false;
  showSuccessMessage = false;
  showErrorMessage = false;
  errorMessage = '';

  constructor(
    private translate: TranslateService,
    private richiesteService: RichiesteInformazioniService
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
    this.translate.get('CONTATTI.societa').subscribe((societaMap: SocietaMap) => {
      // Converti l'oggetto in array
      this.societa = Object.values(societaMap);
    });
  }

  onSubmit() {
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.showSuccessMessage = false;
    this.showErrorMessage = false;

   

    // Validazione rapida
    if (!this.formData.nome || !this.formData.email || !this.formData.societa || !this.formData.messaggio) {
      this.showErrorMessage = true;
      this.errorMessage = 'Compila tutti i campi obbligatori';
      this.isSubmitting = false;
      return;
    }

    // Prepara i dati per Strapi
    const richiestaData: RichiestaInformazioniCreate = {
      nome: this.formData.nome.trim(),
      email: this.formData.email.trim(),
      telefono: this.formData.telefono ? this.formData.telefono.trim() : '',
      societa: this.formData.societa,
      messaggio: this.formData.messaggio.trim()
    };


    // USA IL METODO CORRETTO CON L'ENDPOINT GIUSTO
    this.richiesteService.createRichiesta(richiestaData).subscribe({
      next: (response: any) => {
        this.showSuccessMessage = true;
        this.resetForm();
        
        setTimeout(() => {
          this.showSuccessMessage = false;
        }, 5000);
      },
      error: (error: { message: any; }) => {
        this.showErrorMessage = true;
        this.errorMessage = `Errore: ${error.message || 'Verifica che Strapi sia in esecuzione e le permissions siano abilitate'}`;
        
        setTimeout(() => {
          this.showErrorMessage = false;
        }, 8000);
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  // Rimuovi questo metodo se presente
  // debugStrapi() { ... }

  private resetForm(): void {
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