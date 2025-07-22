// auth.models.ts - ALLINEATO AL BACKEND JAVA
export interface LoginRequest {
  username: string;
  password: string;
}

// Risposta del backend Java - AuthService.login()
export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserInfo;
  success: boolean;
  message: string;
}

// Struttura UserInfo dal backend
export interface UserInfo {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  language: string;
  timezone: string;
  phone: string;
  organization: string;
  position: string;
}

// Per il refresh token
export interface RefreshTokenRequest {
  username: string;
  password: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  success: boolean;
  message: string;
}

// Per la creazione account
export interface CreateAccountRequest {
  firstName: string;
  lastName: string;
  emailAddress: string;
  userName: string;
  language?: string;
  timezone?: string;
  phone?: string;
  organization: string;
  position: string;
  password: string;
  acceptTermsOfService: boolean;
}

// Risposta creazione account
export interface AccountCreatedResponse {
  success: boolean;
  message: string;
  userId?: number;
}

// Per aggiornamento account
export interface UpdateAccountRequest {
  firstName: string;
  lastName: string;
  emailAddress: string;
  userName: string;
  language: string;
  timezone: string;
  phone: string;
  organization: string;
  position: string;
}

// Risposta aggiornamento account
export interface AccountUpdatedResponse {
  success: boolean;
  message: string;
}

// Per aggiornamento password
export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Risposta del getCurrentUser
export interface CurrentUserResponse {
  user: UserInfo;
  authenticated: boolean;
  tokenExpiresIn: number;
}

// Risposta logout
export interface LogoutResponse {
  success: boolean;
  message: string;
}

// Modello User semplificato per il frontend
export interface User {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  language: string;
  timezone: string;
  phone: string;
  organization: string;
  position: string;
}

// State dell'autenticazione
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Errori personalizzati
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}