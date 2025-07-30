import { Component, Input, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class UserProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  @Input() user: any = null;
  
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  user$ = this.authService.user$;
  isLoading$ = this.authService.isLoading$;
  error$ = this.authService.error$;
  
  activeTab = 'profile';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  
  // Messaggi di successo
  profileUpdateSuccess = false;
  passwordUpdateSuccess = false;
  
  languages = [
    { code: 'it_IT', name: '🇮🇹 Italiano' },
    { code: 'en_US', name: '🇺🇸 English' },
    { code: 'es_ES', name: '🇪🇸 Español' },
    { code: 'fr_FR', name: '🇫🇷 Français' },
    { code: 'de_DE', name: '🇩🇪 Deutsch' }
  ];

  timezones = [
    'Europe/Rome',
    'Europe/London', 
    'Europe/Paris',
    'Europe/Berlin',
    'America/New_York',
    'America/Los_Angeles',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney'
  ];

  positions = [
    'dirigente',
    'allenatore',
    'atleta',
    'arbitro',
    'staff tecnico',
    'genitore',
    'volontario',
    'amministratore',
    'segretario',
    'medico',
    'fisioterapista'
  ];

  ngOnInit(): void {
    this.initializeForms();
    this.loadUserData();
  }

  private initializeForms(): void {
    // Form per il profilo - MAPPING CORRETTO PER IL BACKEND
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      emailAddress: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      userName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
      phone: ['', [Validators.pattern(/^[\+]?[0-9\s\-\(\)]{0,20}$/)]],
      organization: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      position: ['', [Validators.required]],
      language: ['it_IT', [Validators.required]],
      timezone: ['Europe/Rome', [Validators.required]]
    });

    // Form per la password con validazione più robusta
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(1)]],
      newPassword: ['', [Validators.required, this.passwordValidator]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });

    // Auto-clear success messages quando si modifica il form
    this.profileForm.valueChanges.subscribe(() => {
      if (this.profileUpdateSuccess) {
        this.profileUpdateSuccess = false;
      }
    });

    this.passwordForm.valueChanges.subscribe(() => {
      if (this.passwordUpdateSuccess) {
        this.passwordUpdateSuccess = false;
      }
    });
  }

  private loadUserData(): void {
    this.user$.subscribe(user => {
      if (user) {
        
        this.profileForm.patchValue({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          emailAddress: user.emailAddress || '',
          userName: user.username || '', // Backend usa 'username', form usa 'userName'
          phone: user.phone || '',
          organization: user.organization || '',
          position: user.position || '',
          language: user.language || 'it_IT',
          timezone: user.timezone || 'Europe/Rome'
        });
      }
    });
  }

  private passwordValidator(control: any) {
    const value = control.value;
    if (!value) return null;

    const errors: any = {};

    // Verifica lunghezza minima
    if (value.length < 8) {
      errors.minLength = { requiredLength: 8, actualLength: value.length };
    }

    // Verifica presenza di numero
    if (!/[0-9]/.test(value)) {
      errors.requiresNumber = true;
    }

    // Verifica presenza di maiuscola
    if (!/[A-Z]/.test(value)) {
      errors.requiresUppercase = true;
    }

    // Verifica presenza di minuscola
    if (!/[a-z]/.test(value)) {
      errors.requiresLowercase = true;
    }

    // Verifica lunghezza massima
    if (value.length > 100) {
      errors.maxLength = { requiredLength: 100, actualLength: value.length };
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  private passwordMatchValidator(group: FormGroup) {
    const password = group.get('newPassword');
    const confirmPassword = group.get('confirmPassword');
    
    if (!password || !confirmPassword) return null;
    if (!password.value || !confirmPassword.value) return null;
    
    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  onUpdateProfile(): void {

    if (this.profileForm.valid) {
      const user = this.authService.getCurrentUser();
      if (user?.userId) {
        // Prepara i dati nel formato atteso dal backend
        const updateData = {
          firstName: this.profileForm.value.firstName.trim(),
          lastName: this.profileForm.value.lastName.trim(),
          emailAddress: this.profileForm.value.emailAddress.trim(),
          userName: this.profileForm.value.userName.trim(),
          language: this.profileForm.value.language,
          timezone: this.profileForm.value.timezone,
          phone: this.profileForm.value.phone?.trim() || null,
          organization: this.profileForm.value.organization.trim(),
          position: this.profileForm.value.position
        };


        this.authService.updateAccount(user.userId, updateData).subscribe({
          next: (response) => {
            if (response && (response.success === true )) {
              this.profileUpdateSuccess = true;
              this.authService.clearError?.();
              
              // Auto-hide success message dopo 5 secondi
              setTimeout(() => {
                this.profileUpdateSuccess = false;
              }, 5000);
            }
          },
          error: (error) => {
          }
        });
      } else {
      }
    } else {
      this.markFormGroupTouched(this.profileForm);
    }
  }

  onUpdatePassword(): void {


    if (this.passwordForm.valid) {
      const user = this.authService.getCurrentUser();
      if (user?.userId) {
        const passwordData = {
          currentPassword: this.passwordForm.value.currentPassword,
          newPassword: this.passwordForm.value.newPassword
        };


        this.authService.updatePassword(user.userId, passwordData).subscribe({
          next: (response) => {
            if (response && (response.success === true )) {
              this.passwordForm.reset();
              this.passwordUpdateSuccess = true;
              this.authService.clearError?.();
              
              // Reset password visibility flags
              this.showCurrentPassword = false;
              this.showNewPassword = false;
              this.showConfirmPassword = false;
              
              // Auto-hide success message dopo 5 secondi
              setTimeout(() => {
                this.passwordUpdateSuccess = false;
              }, 10000);
            }
          },
          error: (error) => {
          }
        });
      } else {
      }
    } else {
      this.markFormGroupTouched(this.passwordForm);
    }
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    
    // Clear any success messages when switching tabs
    this.profileUpdateSuccess = false;
    this.passwordUpdateSuccess = false;
    
    // Clear any form errors
    this.authService.clearError?.();
  }

  togglePasswordVisibility(field: string): void {
    switch(field) {
      case 'current': 
        this.showCurrentPassword = !this.showCurrentPassword; 
        break;
      case 'new': 
        this.showNewPassword = !this.showNewPassword; 
        break;
      case 'confirm': 
        this.showConfirmPassword = !this.showConfirmPassword; 
        break;
    }
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/home']);
    });
  }

  navigateBack(): void {
    this.router.navigate(['/home']);
  }

  navigateToBookings(): void {
    // TODO: Implementare quando sarà pronto il sistema di prenotazioni
    alert('🏀 Sistema prenotazioni in sviluppo!\n\nPresto potrai:\n• Prenotare campi e palestre\n• Gestire le tue prenotazioni\n• Visualizzare calendario disponibilità\n\nResta sintonizzato! 🚀');
  }

  // === HELPER METHODS ===

  private markFormGroupTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      control?.markAsTouched();
      
      // Se il controllo è un FormGroup annidato, marca anche i suoi controlli
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (!field?.errors || !field.touched) return '';

    const errors = field.errors;

    // Errori required
    if (errors['required']) {
      const fieldNames: { [key: string]: string } = {
        'firstName': 'Il nome',
        'lastName': 'Il cognome', 
        'emailAddress': 'L\'email',
        'userName': 'L\'username',
        'organization': 'L\'organizzazione',
        'position': 'Il ruolo',
        'currentPassword': 'La password attuale',
        'newPassword': 'La nuova password',
        'confirmPassword': 'La conferma password'
      };
      return `${fieldNames[fieldName] || fieldName} è obbligatorio`;
    }

    // Errori email
    if (errors['email']) {
      return 'Inserisci un indirizzo email valido';
    }

    // Errori lunghezza minima
    if (errors['minlength']) {
      return `Minimo ${errors['minlength'].requiredLength} caratteri`;
    }

    // Errori lunghezza massima
    if (errors['maxlength']) {
      return `Massimo ${errors['maxlength'].requiredLength} caratteri`;
    }

    // Errori pattern
    if (errors['pattern']) {
      if (fieldName === 'phone') {
        return 'Formato telefono non valido (solo numeri, spazi, +, -, (), sono permessi)';
      }
      return 'Formato non valido';
    }

    // Errori password complessi
    if (errors['minLength']) {
      return `La password deve avere almeno ${errors['minLength'].requiredLength} caratteri`;
    }

    if (errors['requiresNumber']) {
      return 'La password deve contenere almeno un numero';
    }

    if (errors['requiresUppercase']) {
      return 'La password deve contenere almeno una lettera maiuscola';
    }

    if (errors['requiresLowercase']) {
      return 'La password deve contenere almeno una lettera minuscola';
    }

    if (errors['maxLength']) {
      return `La password non può superare i ${errors['maxLength'].requiredLength} caratteri`;
    }

    // Password mismatch
    if (errors['passwordMismatch']) {
      return 'Le password non coincidono';
    }

    return 'Campo non valido';
  }

  getUserInitials(): string {
    const user = this.authService.getCurrentUser();
    if (user && user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return 'U';
  }

  getFullName(): string {
    const user = this.authService.getCurrentUser();
    if (user) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return 'Utente';
  }

  getUserPosition(): string {
    const user = this.authService.getCurrentUser();
    if (user) {
      return `${user.position || 'Utente'} - ${user.organization || 'Organizzazione'}`;
    }
    return '';
  }

  /**
   * Utility per debug dei form errors
   */
  private getFormErrors(form: FormGroup): any {
    const formErrors: any = {};
    Object.keys(form.controls).forEach(key => {
      const controlErrors = form.get(key)?.errors;
      if (controlErrors) {
        formErrors[key] = controlErrors;
      }
    });
    return formErrors;
  }
}