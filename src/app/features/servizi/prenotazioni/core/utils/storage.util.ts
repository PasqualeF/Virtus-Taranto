// features/servizi/prenotazioni/core/utils/storage.util.ts
export class BookingStorageUtil {
  private static readonly TOKEN_KEY = 'booking_auth_token';
  private static readonly USER_KEY = 'booking_user_data';
  private static readonly PREFIX = 'booking_';

  static saveToken(token: string): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
    } catch (error) {
      console.error('Errore salvataggio token:', error);
    }
  }

  static getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Errore lettura token:', error);
      return null;
    }
  }

  static saveUser(user: any): void {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Errore salvataggio utente:', error);
    }
  }

  static getUser(): any | null {
    try {
      const userData = localStorage.getItem(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Errore lettura utente:', error);
      return null;
    }
  }

  static clearAll(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      
      // Pulisci anche altri dati del modulo
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.PREFIX))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Errore pulizia storage:', error);
    }
  }

  static isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      return payload.exp > now;
    } catch (error) {
      return false;
    }
  }
}