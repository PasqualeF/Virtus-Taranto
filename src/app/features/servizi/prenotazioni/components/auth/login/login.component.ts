// components/auth/login/login.component.ts - VERSIONE CON DEBUG MIGLIORATO
import { Component, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('400ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('400ms ease-in', style({ transform: 'translateX(-100%)', opacity: 0 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class LoginComponent implements OnInit {
  @Output() loginSuccess = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  loginForm!: FormGroup;
  registerForm!: FormGroup;
  isLoading$ = this.authService.isLoading$;
  error$ = this.authService.error$;
  
  showPassword = false;
  showRegisterPassword = false;
  showRegisterConfirmPassword = false;
  
  // Stato per il toggle tra login e register
  isRegisterMode = false;

  ngOnInit(): void {
    this.initializeForms();
  }

  private initializeForms(): void {
    // Form Login
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    // Form Register (con nuovi campi obbligatori)
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      emailAddress: ['', [Validators.required, Validators.email]],
      userName: ['', [Validators.required, Validators.minLength(3)]],
      organization: ['', [Validators.required, Validators.minLength(2)]],
      position: ['', [Validators.required, Validators.minLength(2)]],
      password: ['', [Validators.required, this.passwordValidator]],
      confirmPassword: ['', [Validators.required]],
      acceptTermsOfService: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  /**
   * Toggle tra login e register
   */
  toggleMode(): void {
    this.isRegisterMode = !this.isRegisterMode;
    // Reset errori quando si cambia modalità
    this.authService.clearError?.();
  }

  /**
   * Submit Login
   */
  onLoginSubmit(): void {
    if (this.loginForm.valid) {
      const credentials = {
        username: this.loginForm.value.username,
        password: this.loginForm.value.password
      };


      this.authService.login(credentials).subscribe({
        next: (response) => {
          if (response.success) {
            this.loginSuccess.emit();
          }
        },
        error: (error) => {
        }
      });
    } else {
      this.markFormGroupTouched(this.loginForm);
    }
  }

  /**
   * Submit Register - con debug migliorato
   */
  onRegisterSubmit(): void {
  

    if (this.registerForm.valid) {
      const formData = { ...this.registerForm.value };
      
      // Mappa il campo "role" a "position" se necessario per il backend
      const requestData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        emailAddress: formData.emailAddress,
        userName: formData.userName,
        organization: formData.organization,
        position: formData.position, // Mantieni "role" come campo
        password: formData.password,
        acceptTermsOfService: formData.acceptTermsOfService
      };


      this.authService.createAccount(requestData).subscribe({
        next: (response) => {
          
          // Verifica se la registrazione è riuscita in modi diversi
          const isSuccess = response && (
            response.success === true || 
            response.userId ||
            !response.hasOwnProperty('success') // Alcuni backend non hanno il campo success
          );

          if (isSuccess) {
            // Auto-login dopo registrazione
            this.autoLogin(requestData.userName, requestData.password);
          } else {
          }
        },
        error: (error) => {          
          // Verifica se nonostante l'errore l'account è stato creato
          if (error.status === 200 || error.status === 201) {
            this.autoLogin(requestData.userName, requestData.password);
          }
        }
      });
    } else {
      this.markFormGroupTouched(this.registerForm);
    }
  }

  private autoLogin(username: string, password: string): void {
    
    this.authService.login({ username, password }).subscribe({
      next: (response) => {
        if (response.success) {
          this.loginSuccess.emit();
        }
      },
      error: (error) => {
        // Torna al login mode in caso di errore
        this.isRegisterMode = false;
        alert('Account creato, ma login automatico fallito. Prova ad accedere manualmente.');
      }
    });
  }

  togglePasswordVisibility(field: 'login' | 'register' | 'confirm'): void {
    switch(field) {
      case 'login': this.showPassword = !this.showPassword; break;
      case 'register': this.showRegisterPassword = !this.showRegisterPassword; break;
      case 'confirm': this.showRegisterConfirmPassword = !this.showRegisterConfirmPassword; break;
    }
  }

  private markFormGroupTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      control?.markAsTouched();
    });
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

  // Helper methods
  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field?.errors && field.touched) {
      // Errori generici
      if (field.errors['required']) {
        switch(fieldName) {
          case 'firstName': return 'Il nome è obbligatorio';
          case 'lastName': return 'Il cognome è obbligatorio';
          case 'emailAddress': return 'L\'email è obbligatoria';
          case 'userName': return 'L\'username è obbligatorio';
          case 'organization': return 'L\'organizzazione è obbligatoria';
          case 'position': return 'Il ruolo è obbligatorio';
          case 'password': return 'La password è obbligatoria';
          case 'confirmPassword': return 'La conferma password è obbligatoria';
          default: return `${fieldName} è obbligatorio`;
        }
      }
      
      if (field.errors['email']) return 'Email non valida';
      
      if (field.errors['minlength']) {
        switch(fieldName) {
          case 'firstName':
          case 'lastName':
          case 'organization':
          case 'position':
            return `Minimo ${field.errors['minlength'].requiredLength} caratteri`;
          case 'userName':
            return `L'username deve avere almeno ${field.errors['minlength'].requiredLength} caratteri`;
          case 'password':
            return `La password deve avere almeno ${field.errors['minlength'].requiredLength} caratteri`;
          default:
            return `Minimo ${field.errors['minlength'].requiredLength} caratteri`;
        }
      }
      
      if (field.errors['invalidPassword']) 
        return 'Password deve contenere almeno 8 caratteri, una maiuscola, una minuscola e un numero';
      if (field.errors['passwordMismatch']) 
        return 'Le password non coincidono';
      if (field.errors['requiredTrue']) 
        return 'È necessario accettare i termini di servizio';
    }
    return '';
  }

  /**
   * Utility per debug dei form errors - VERSIONE BASE
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

  /**
   * Utility per debug dettagliato dei form errors
   */
  private getDetailedFormErrors(form: FormGroup): any {
    const detailedErrors: any = {};
    
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control && control.errors) {
        detailedErrors[key] = {
          value: control.value,
          errors: control.errors,
          valid: control.valid,
          touched: control.touched,
          dirty: control.dirty
        };
      }
    });
    
    return detailedErrors;
  }

}