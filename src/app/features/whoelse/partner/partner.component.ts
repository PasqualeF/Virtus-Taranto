import { Component, OnInit, OnDestroy } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { PartnerService, Partner, Benefit } from 'src/app/core/service/partner.service';

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
export class PartnerComponent implements OnInit, OnDestroy {
  collaborationForm: FormGroup;
  isFormSubmitted = false;
  isSubmittingForm = false;
  
  // Dati dal CMS
  partners: Partner[] = [];
  benefits: Benefit[] = [];
  
  // Stati di caricamento
  isLoadingPartners = true;
  isLoadingBenefits = true;
  
  // Gestione errori
  partnersError = false;
  benefitsError = false;
  
  // Per la gestione delle categorie
  categories: string[] = ['Tutti'];
  selectedCategory: string = 'Tutti';
  isLoadingCategories = true;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder, 
    private translate: TranslateService,
    private partnerService: PartnerService
  ) {
    this.collaborationForm = this.fb.group({
      companyName: ['', [Validators.required, Validators.minLength(2)]],
      contactPerson: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[\+]?[0-9\s\-\(\)]+$/)]],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]]
    });
  }

  ngOnInit(): void {
    this.loadAllData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carica tutti i dati necessari dal CMS
   */
  private loadAllData(): void {
    this.loadPartners();
    this.loadBenefits();
    this.loadCategories();
  }

  /**
   * Carica i partner da Strapi
   */
  private loadPartners(): void {
    this.isLoadingPartners = true;
    this.partnersError = false;

    this.partnerService.getPartners()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingPartners = false)
      )
      .subscribe({
        next: (partners) => {
          this.partners = partners;
        },
        error: (error) => {
          this.partnersError = true;
        }
      });
  }

  /**
   * Carica i benefit da Strapi
   */
  private loadBenefits(): void {
    this.isLoadingBenefits = true;
    this.benefitsError = false;

    this.partnerService.getBenefits()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingBenefits = false)
      )
      .subscribe({
        next: (benefits) => {
          this.benefits = benefits;
        },
        error: (error) => {
          console.error('Errore nel caricamento dei benefit:', error);
          this.benefitsError = true;
        }
      });
  }

  /**
   * Carica le categorie disponibili
   */
  private loadCategories(): void {
    this.isLoadingCategories = true;

    this.partnerService.getCategories()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingCategories = false)
      )
      .subscribe({
        next: (categories) => {
          this.categories = categories;
        },
        error: (error) => {
          this.categories = ['Tutti'];
        }
      });
  }

  /**
   * Seleziona una categoria
   */
  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  /**
   * Filtra i partner per categoria
   */
  getPartnersByCategory(category: string): Partner[] {
    if (category === 'Tutti') {
      return this.partners;
    }
    return this.partners.filter(partner => partner.category === category);
  }

  /**
   * Scroll to a specific partner
   */
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

  /**
   * Gestisce l'invio del form di collaborazione
   */
  onSubmit(): void {
    if (this.collaborationForm.valid && !this.isSubmittingForm) {
      this.isSubmittingForm = true;
      
      const formData = this.collaborationForm.value;
      
      this.partnerService.submitCollaborationRequest(formData)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.isSubmittingForm = false)
        )
        .subscribe({
          next: (response) => {
            this.isFormSubmitted = true;
            this.collaborationForm.reset();
          },
          error: (error) => {
            // Qui potresti mostrare un messaggio di errore all'utente
            alert('Si è verificato un errore nell\'invio della richiesta. Riprova più tardi.');
          }
        });
    } else {
      // Marca tutti i campi come touched per mostrare gli errori
      Object.keys(this.collaborationForm.controls).forEach(key => {
        this.collaborationForm.get(key)?.markAsTouched();
      });
    }
  }

  /**
   * Ricarica i dati dal CMS
   */
  refreshData(): void {
    this.loadAllData();
  }

  /**
   * Gestisce l'errore di caricamento delle immagini
   */
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'assets/images/placeholder.jpg';
    }
  }

  /**
   * Verifica se ci sono dati in caricamento
   */
  get isLoading(): boolean {
    return this.isLoadingPartners || this.isLoadingBenefits || this.isLoadingCategories;
  }

  /**
   * Verifica se ci sono errori nei dati
   */
  get hasErrors(): boolean {
    return this.partnersError || this.benefitsError;
  }
}