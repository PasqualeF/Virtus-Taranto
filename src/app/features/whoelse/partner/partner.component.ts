import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

interface Partner {
  name: string;
  logo: string;
  description: string;
  website: string;
  category?: string;
  highlight?: string;
  background?: string;
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
    trigger('staggerIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('600ms ease-out', 
          style({ opacity: 1, transform: 'translateY(0)' })
        )
      ])
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
  partners: Partner[] = [];
  benefits: Benefit[] = [];
  
  // Per la gestione delle categorie
  categories: string[] = ['Tutti'];
  selectedCategory: string = 'Tutti';

  constructor(private fb: FormBuilder, private translate: TranslateService) {
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
    // Carica i dati dalla struttura oggetto dei benefit
    this.translate.get('PARTNER_BENEFIT.benefit').subscribe((benefits: Benefit) => {
      // Converti l'oggetto in array
      this.benefits = Object.values(benefits);
    });

    // Carica i dati dalla struttura oggetto degli sponsor
    this.translate.get('PARTNER.sponsor').subscribe((partners: Partner) => {
      // Converti l'oggetto in array
      this.partners = Object.values(partners);
      
      // Estrai le categorie uniche dai partner (se esistono)
      this.extractCategories();
    });
  }
  
  // Estrai le categorie uniche dai partner
  private extractCategories(): void {
    this.categories = ['Tutti'];
    
    this.partners.forEach(partner => {
      if (partner.category && !this.categories.includes(partner.category)) {
        this.categories.push(partner.category);
      }
    });
  }
  
  // Seleziona una categoria
  selectCategory(category: string): void {
    this.selectedCategory = category;
  }
  
  // Filtra i partner per categoria
  getPartnersByCategory(category: string): Partner[] {
    if (category === 'Tutti') {
      return this.partners;
    }
    return this.partners.filter(partner => partner.category === category);
  }
  
  // Scroll to a specific partner
  scrollToPartner(partnerName: string): void {
    const element = document.getElementById(partnerName);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Trova la categoria del partner e selezionala
      const partner = this.partners.find(p => p.name === partnerName);
      if (partner && partner.category) {
        this.selectCategory(partner.category);
      } else {
        this.selectCategory('Tutti');
      }
      
      // Aggiungi un effetto di highlight temporaneo
      element.classList.add('highlight-animation');
      setTimeout(() => {
        element.classList.remove('highlight-animation');
      }, 1500);
    }
  }

  onSubmit() {
    if (this.collaborationForm.valid) {
      // Qui andrebbe implementata la logica di invio al backend
      console.log(this.collaborationForm.value);
      this.isFormSubmitted = true;
      this.collaborationForm.reset();
    }
  }
}