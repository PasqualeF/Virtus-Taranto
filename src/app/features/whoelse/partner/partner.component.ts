import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

interface Partner {
  name: string;
  logo: string;
  description: string;
  website: string;
}

interface Benefit {
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-partner',
  templateUrl: './partner.component.html',
  styleUrls: ['./partner.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('flipIn', [
      transition(':enter', [
        style({ transform: 'rotateY(90deg)' }),
        animate('600ms ease-out', style({ transform: 'rotateY(0deg)' })),
      ]),
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)' }),
        animate('600ms ease-out', style({ transform: 'translateX(0)' })),
      ]),
    ])
  ]
})
export class PartnerComponent implements OnInit {
  collaborationForm: FormGroup;
  isFormSubmitted = false;
 // partners: Partner[] = [];
  partners: Partner[] = [];

  benefits: Benefit[] = [];

  constructor(private fb: FormBuilder,private translate: TranslateService) {
    this.collaborationForm = this.fb.group({
      companyName: ['', Validators.required],
      contactPerson: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      message: ['', Validators.required]
    });
  }


  ngOnInit(): void {
    this.loadData();
    
    // Sottoscrizione ai cambiamenti di lingua
    this.translate.onLangChange.subscribe(() => {
      this.loadData();
    });
  }

   
  private loadData(): void {
    // Carica i dati dalla struttura oggetto delle società
    this.translate.get('PARTNER_BENEFIT.benefit').subscribe((benefits: Benefit) => {
      // Converti l'oggetto in array
      this.benefits = Object.values(benefits);
    });

       // Carica i dati dalla struttura oggetto delle società
    this.translate.get('PARTNER.sponsor').subscribe((partners: Partner) => {
      // Converti l'oggetto in array
      this.partners = Object.values(partners);
    });
  }

  onSubmit() {
    if (this.collaborationForm.valid) {
      // Qui andrebbe implementata la logica di invio al backend
      console.log(this.collaborationForm.value);
      this.isFormSubmitted = true;
      this.collaborationForm.reset();
      // Mostra un messaggio di successo
    }
  }
}