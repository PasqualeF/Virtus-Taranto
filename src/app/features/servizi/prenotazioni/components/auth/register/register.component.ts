import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class RegisterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  registerForm!: FormGroup;
  isLoading$ = this.authService.isLoading$;
  error$ = this.authService.error$;
  showPassword = false;
  showConfirmPassword = false;
  currentStep = 1;
  totalSteps = 3;
  returnUrl = '/servizi/profile';

  // Opzioni per select
  languages = [
    { code: 'it_IT', name: 'Italiano' },
    { code: 'en_US', name: 'English' },
    { code: 'es_ES', name: 'Español' },
    { code: 'fr_FR', name: 'Français' }
  ];

  timezones = [
    'Europe/Rome',
    'Europe/London',
    'America/New_York',
    'Asia/Tokyo'
  ];

  positions = [
    'dirigente',
    'allenatore',
    'atleta',
    'arbitro',
    'staff tecnico',
    'genitore',
    'volontario'
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.setupReturnUrl();
  }

  private initializeForm(): void {
    this.registerForm = this.fb.group({
      // Step 1: Dati personali - MAPPING CORRETTO PER IL BACKEND
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      emailAddress: ['', [Validators.required, Validators.email]], // emailAddress NON email
      phone: ['', [Validators.pattern(/^[\+]?[0-9\s\-\(\)]+$/)]],
      
      // Step 2: Account - MAPPING CORRETTO PER IL BACKEND
      userName: ['', [Validators.required, Validators.minLength(3)]], // userName NON username
      password: ['', [Validators.required, this.passwordValidator]],
      confirmPassword: ['', [Validators.required]],
      
      // Step 3: Organizzazione e preferenze
      organization: ['Pallavolo Massafra', [Validators.required]],
      position: ['', [Validators.required]],
      language: ['it_IT', [Validators.required]],
      timezone: ['Europe/Rome', [Validators.required]],
      acceptTermsOfService: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private setupReturnUrl(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/servizi/profile';
  }

  private passwordValidator(control: any) {
    const value = control.value;
    if (!value) return null;

    const hasNumber = /[0-9]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasMinLength = value.length >= 8;

    const passwordValid = hasNumber && hasUpper && hasLower && hasMinLength;
    return passwordValid ? null : { invalidPassword: true };
  }

  private passwordMatchValidator(group: FormGroup) {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');
    
    if (!password || !confirmPassword) return null;
    
    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  // Navigation tra steps
  nextStep(): void {
    if (this.isCurrentStepValid()) {
      this.currentStep++;
    } else {
      this.markCurrentStepTouched();
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  private isCurrentStepValid(): boolean {
    const step1Fields = ['firstName', 'lastName', 'emailAddress'];
    const step2Fields = ['userName', 'password', 'confirmPassword'];
    const step3Fields = ['organization', 'position', 'acceptTermsOfService'];

    let fieldsToCheck: string[] = [];
    
    switch(this.currentStep) {
      case 1: fieldsToCheck = step1Fields; break;
      case 2: fieldsToCheck = step2Fields; break;
      case 3: fieldsToCheck = step3Fields; break;
    }

    return fieldsToCheck.every(field => {
      const control = this.registerForm.get(field);
      return control && control.valid;
    });
  }

  private markCurrentStepTouched(): void {
    const step1Fields = ['firstName', 'lastName', 'emailAddress', 'phone'];
    const step2Fields = ['userName', 'password', 'confirmPassword'];
    const step3Fields = ['organization', 'position', 'language', 'timezone', 'acceptTermsOfService'];

    let fieldsToMark: string[] = [];
    
    switch(this.currentStep) {
      case 1: fieldsToMark = step1Fields; break;
      case 2: fieldsToMark = step2Fields; break;
      case 3: fieldsToMark = step3Fields; break;
    }

    fieldsToMark.forEach(field => {
      this.registerForm.get(field)?.markAsTouched();
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      const formData = { ...this.registerForm.value };
      delete formData.confirmPassword; // Rimuovi confirmPassword

      this.authService.createAccount(formData).subscribe({
        next: (response) => {
          console.log('✅ Registrazione completata:', response);
          if (response.success) {
            // Auto-login dopo registrazione
            this.autoLogin(formData.userName, formData.password);
          }
        },
        error: (error) => {
          console.error('❌ Registrazione fallita:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private autoLogin(username: string, password: string): void {
    this.authService.login({ username, password }).subscribe({
      next: (response) => {
        console.log('✅ Login automatico completato');
        if (response.success) {
          this.router.navigate([this.returnUrl]);
        }
      },
      error: (error) => {
        console.error('❌ Login automatico fallito:', error);
        this.router.navigate(['/servizi/login']);
      }
    });
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  navigateToLogin(): void {
    this.router.navigate(['/servizi/login'], { 
      queryParams: { returnUrl: this.returnUrl } 
    });
  }

  navigateBack(): void {
    this.router.navigate(['/home']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helper methods
  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} è obbligatorio`;
      if (field.errors['email']) return 'Email non valida';
      if (field.errors['minlength']) return `Minimo ${field.errors['minlength'].requiredLength} caratteri`;
      if (field.errors['invalidPassword']) return 'Password deve contenere almeno 8 caratteri, una maiuscola, una minuscola e un numero';
      if (field.errors['passwordMismatch']) return 'Le password non coincidono';
      if (field.errors['pattern']) return 'Formato non valido';
      if (field.errors['requiredTrue']) return 'È necessario accettare i termini di servizio';
    }
    return '';
  }

  getProgressPercentage(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }
}