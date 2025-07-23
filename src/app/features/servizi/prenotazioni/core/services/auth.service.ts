// auth.service.ts - VERSIONE CON FIX PER createAccount
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  CreateAccountRequest,
  AccountCreatedResponse,
  UpdateAccountRequest,
  AccountUpdatedResponse,
  UpdatePasswordRequest,
  CurrentUserResponse,
  LogoutResponse,
  User,
  UserInfo,
  AuthState,
  AuthError
} from '../models/auth.models';
import { environment } from 'src/environments/environments';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // Configurazione
  private readonly API_BASE_URL = environment.backendUrl;
  private readonly TOKEN_KEY = 'booking_auth_token';
  private readonly USER_KEY = 'booking_user_data';

  // State management con inizializzazione corretta
  private readonly authStateSubject = new BehaviorSubject<AuthState>(this.loadInitialState());

  // Observables pubblici
  public readonly authState$ = this.authStateSubject.asObservable();
  public readonly user$ = this.authState$.pipe(map(state => state.user));
  public readonly isAuthenticated$ = this.authState$.pipe(map(state => state.isAuthenticated));
  public readonly isLoading$ = this.authState$.pipe(map(state => state.isLoading));
  public readonly error$ = this.authState$.pipe(map(state => state.error));

  // Flag per evitare inizializzazioni multiple
  private isInitialized = false;

  constructor() {
    this.initializeAuth();
    this.setupStorageListener();
  }

  /**
   * Carica lo stato iniziale dal localStorage
   */
  private loadInitialState(): AuthState {
    try {
      const token = this.getStoredToken();
      const userData = this.getStoredUser();

      if (token && userData && this.isTokenValid(token)) {
        return {
          user: userData,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null
        };
      } else {
        // Pulisci dati corrotti o scaduti
        if (token || userData) {
          this.clearStoredAuth();
        }
        return {
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        };
      }
    } catch (error) {
      console.error('❌ [AUTH_SERVICE] Errore caricamento stato iniziale:', error);
      this.clearStoredAuth();
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    }
  }

  /**
   * Inizializzazione del servizio - SEMPLIFICATA
   */
  private initializeAuth(): void {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;

    const currentState = this.authStateSubject.value;
  }

  /**
   * Setup listener per sincronizzazione tra tab
   */
  private setupStorageListener(): void {
    window.addEventListener('storage', (event) => {
      if (event.key === this.TOKEN_KEY || event.key === this.USER_KEY) {
        const newState = this.loadInitialState();
        this.authStateSubject.next(newState);
      }
    });
  }

  /**
   * Login utente
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.setLoadingState(true);
    this.clearError();

    return this.http.post<LoginResponse>(`${this.API_BASE_URL}/api/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success) {
            this.handleLoginSuccess(response);
          } else {
            throw new AuthError(response.message, 'LOGIN_FAILED');
          }
        }),
        catchError(error => this.handleAuthError(error, 'Login fallito')),
        finalize(() => this.setLoadingState(false))
      );
  }

  /**
   * Logout utente
   */
  logout(): Observable<void> {
    this.setLoadingState(true);

    return this.http.post<LogoutResponse>(`${this.API_BASE_URL}/api/auth/logout`, {})
      .pipe(
        tap(response => {
        }),
        catchError(() => {
          return of({ success: true, message: 'Logout locale' });
        }),
        finalize(() => {
          this.clearAuthAndRedirect();
        }),
        map(() => void 0)
      );
  }

  /**
   * Validazione token con il server - METODO PUBBLICO OTTIMIZZATO
   */
  validateTokenWithServer(): Observable<CurrentUserResponse> {
    return this.http.get<CurrentUserResponse>(`${this.API_BASE_URL}/api/auth/me`)
      .pipe(
        tap(response => {
          if (response.authenticated && response.user) {
            // Aggiorna i dati utente se diversi
            const currentUser = this.getCurrentUser();
            const serverUser = this.mapUserInfoToUser(response.user);
            
            if (!currentUser || JSON.stringify(currentUser) !== JSON.stringify(serverUser)) {
              this.storeUser(serverUser);
              this.updateAuthState({ user: serverUser });
            }
          }
        }),
        catchError(() => {
          return of({
            user: null as any,
            authenticated: false,
            tokenExpiresIn: 0
          });
        })
      );
  }

  /**
   * Refresh del token
   */
  refreshToken(): Observable<RefreshTokenResponse> {
    const currentUser = this.getCurrentUser();

    if (!currentUser) {
      return throwError(() => new AuthError('Nessun utente disponibile', 'NO_USER_DATA'));
    }

    const refreshRequest: RefreshTokenRequest = {
      username: currentUser.username,
      password: '' // Limitazione del backend
    };

    return this.http.post<RefreshTokenResponse>(`${this.API_BASE_URL}/api/auth/refresh`, refreshRequest)
      .pipe(
        tap(response => {
          if (response.success) {
            this.storeToken(response.accessToken);
            this.updateAuthState({
              ...this.authStateSubject.value,
              token: response.accessToken
            });
          }
        }),
        catchError(error => {
          this.clearAuthAndRedirect();
          return this.handleAuthError(error, 'Refresh token fallito');
        })
      );
  }

  /**
   * Creazione nuovo account - VERSIONE FIXATA
   */
  createAccount(accountData: CreateAccountRequest): Observable<AccountCreatedResponse> {
    this.setLoadingState(true);
    this.clearError();

    console.log('📤 [AUTH_SERVICE] Invio richiesta creazione account:', {
      firstName: accountData.firstName,
      lastName: accountData.lastName,
      userName: accountData.userName,
      emailAddress: accountData.emailAddress,
      organization: accountData.organization,
      role: accountData.position
    });

    return this.http.post<AccountCreatedResponse>(`${this.API_BASE_URL}/api/accounts`, accountData)
      .pipe(
        tap(response => {
          console.log('📥 [AUTH_SERVICE] Risposta backend creazione account:', response);
          
          // Verifica diversi possibili formati di risposta
          if (response && (response.success === true)) {
            console.log('✅ [AUTH_SERVICE] Creazione account riuscita');
          } else if (response && response.userId) {
            // Alcuni backend potrebbero non avere il campo "success" ma restituire l'userId
            console.log('✅ [AUTH_SERVICE] Creazione account riuscita (rilevato userId)');
          } else if (response && !response.hasOwnProperty('success')) {
            // Se la risposta non ha il campo "success", potrebbe essere comunque valida
            console.log('✅ [AUTH_SERVICE] Creazione account presumibilmente riuscita (nessun campo success)');
          } else {
            const errorMessage = response?.message || 'Errore sconosciuto nella creazione account';
            console.error('❌ [AUTH_SERVICE] Creazione account fallita:', errorMessage);
            throw new AuthError(errorMessage, 'ACCOUNT_CREATION_FAILED');
          }
        }),
        catchError(error => {
          console.error('💥 [AUTH_SERVICE] Errore HTTP creazione account:', {
            status: error.status,
            statusText: error.statusText,
            error: error.error,
            message: error.message
          });
          
          return this.handleCreateAccountError(error);
        }),
        finalize(() => this.setLoadingState(false))
      );
  }

  /**
   * Gestione specifica degli errori di creazione account
   */
  private handleCreateAccountError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Creazione account fallita';

    console.log('🔍 [AUTH_SERVICE] Analisi errore creazione account:', {
      status: error.status,
      error: error.error,
      message: error.message
    });

    // Controlla se il backend ha effettivamente creato l'account nonostante l'errore
    if (error.status === 201 || error.status === 200) {
      // Status 200/201 potrebbero indicare successo anche se il frontend vede un errore
      console.log('🤔 [AUTH_SERVICE] Status suggerisce successo, ma c\'è un errore nel parsing');
      
      // Prova a interpretare la risposta come successo
      try {
        const response: AccountCreatedResponse = {
          success: true,
          message: 'Account creato con successo',
          userId: error.error?.userId || null
        };
        
        
      } catch (parseError) {
        console.error('❌ [AUTH_SERVICE] Errore nel parsing della risposta di successo:', parseError);
      }
    }

    // Gestione errori specifici
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 409) {
      errorMessage = 'Username o email già esistenti';
    } else if (error.status === 422) {
      errorMessage = 'Dati forniti non validi. Controlla tutti i campi.';
    } else if (error.status === 400) {
      errorMessage = 'Richiesta non valida. Verifica i dati inseriti.';
    } else if (error.status === 500) {
      errorMessage = 'Errore interno del server. Riprova più tardi.';
    } else if (error.status === 0) {
      errorMessage = 'Impossibile connettersi al server';
    }

    console.error('❌ [AUTH_SERVICE] Errore finale creazione account:', errorMessage);
    this.setError(errorMessage);
    return throwError(() => new AuthError(errorMessage, 'ACCOUNT_CREATION_ERROR', error.status));
  }

  /**
   * Aggiornamento account utente
   */
  updateAccount(userId: number, accountData: UpdateAccountRequest): Observable<AccountUpdatedResponse> {
    this.setLoadingState(true);
    this.clearError();

    return this.http.put<AccountUpdatedResponse>(`${this.API_BASE_URL}/api/accounts/${userId}`, accountData)
      .pipe(
        tap(response => {
          if (response.success) {
            this.updateUserData(accountData);
          } else {
            throw new AuthError(response.message, 'ACCOUNT_UPDATE_FAILED');
          }
        }),
        catchError(error => this.handleAuthError(error, 'Aggiornamento account fallito')),
        finalize(() => this.setLoadingState(false))
      );
  }

  /**
   * Aggiornamento password
   */
  updatePassword(userId: number, passwordData: UpdatePasswordRequest): Observable<AccountUpdatedResponse> {
    this.setLoadingState(true);
    this.clearError();

    return this.http.put<AccountUpdatedResponse>(`${this.API_BASE_URL}/api/accounts/${userId}/password`, passwordData)
      .pipe(
        tap(response => {
          if (response.success) {
          } else {
            throw new AuthError(response.message, 'PASSWORD_UPDATE_FAILED');
          }
        }),
        catchError(error => this.handleAuthError(error, 'Aggiornamento password fallito')),
        finalize(() => this.setLoadingState(false))
      );
  }

  // === GETTERS ===
  getCurrentUser(): User | null {
    return this.authStateSubject.value.user;
  }
 
  getCurrentToken(): string | null {
    return this.authStateSubject.value.token;
  }

  isAuthenticated(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.position === role;
  }

  // === METODI PRIVATI ===

  private handleLoginSuccess(response: LoginResponse): void {
    const token = response.accessToken;
    const user = this.mapUserInfoToUser(response.user);

    // Salva tutto nello storage
    this.storeToken(token);
    this.storeUser(user);

    // Aggiorna lo stato
    this.updateAuthState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
      error: null
    });
  }

  private updateUserData(accountData: UpdateAccountRequest): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const updatedUser: User = {
        ...currentUser,
        firstName: accountData.firstName,
        lastName: accountData.lastName,
        emailAddress: accountData.emailAddress,
        username: accountData.userName,
        language: accountData.language,
        timezone: accountData.timezone,
        phone: accountData.phone,
        organization: accountData.organization,
        position: accountData.position
      };
      
      this.storeUser(updatedUser);
      this.updateAuthState({
        ...this.authStateSubject.value,
        user: updatedUser,
        isLoading: false
      });
    }
  }

  private mapUserInfoToUser(userInfo: UserInfo): User {
    return {
      userId: userInfo.userId,
      username: userInfo.username,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      emailAddress: userInfo.emailAddress,
      language: userInfo.language,
      timezone: userInfo.timezone,
      phone: userInfo.phone,
      organization: userInfo.organization,
      position: userInfo.position
    };
  }

  private clearAuthAndRedirect(): void {
    this.clearStoredAuth();
    this.updateAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  }

  private handleAuthError(error: HttpErrorResponse, defaultMessage: string): Observable<never> {
    let errorMessage = defaultMessage;

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 401) {
      errorMessage = 'Credenziali non valide';
    } else if (error.status === 409) {
      errorMessage = 'Username o email già esistenti';
    } else if (error.status === 422) {
      errorMessage = 'Dati non validi';
    } else if (error.status === 0) {
      errorMessage = 'Impossibile connettersi al server';
    }

    console.error('❌ [AUTH_SERVICE] Errore auth:', { status: error.status, message: errorMessage });
    this.setError(errorMessage);
    return throwError(() => new AuthError(errorMessage, 'AUTH_ERROR', error.status));
  }

  private isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      const isValid = payload.exp > now;
      return isValid;
    } catch (error) {
      return false;
    }
  }

  private updateAuthState(newState: Partial<AuthState>): void {
    const currentState = this.authStateSubject.value;
    const updatedState = {
      ...currentState,
      ...newState
    };
    this.authStateSubject.next(updatedState);
  }

  private setLoadingState(isLoading: boolean): void {
    this.updateAuthState({ isLoading });
  }

  private setError(error: string): void {
    this.updateAuthState({ error });
  }

  clearError(): void {
    this.updateAuthState({ error: null });
  }

  private storeToken(token: string): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
    } catch (error) {
    }
  }

  private storeUser(user: User): void {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (error) {
    }
  }

  private getStoredToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('❌ [AUTH_SERVICE] Errore lettura token:', error);
      return null;
    }
  }

  private getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('❌ [AUTH_SERVICE] Errore lettura utente:', error);
      return null;
    }
  }

  private clearStoredAuth(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    } catch (error) {
    }
  }

  /**
   * Controlla se c'è un token valido (non scaduto)
   */
  hasValidToken(): boolean {
    const token = this.getCurrentToken();
    
    if (!token) {
      return false;
    }
    
    try {
      // Decodifica il JWT per controllare la scadenza
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp > currentTime) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('❌ Errore validazione token:', error);
      return false;
    }
  }
}