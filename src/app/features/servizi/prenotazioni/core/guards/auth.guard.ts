import { Injectable, inject } from '@angular/core';
import { 
  CanActivate, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Router,
  UrlTree 
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take, catchError, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | boolean | UrlTree {
    
    
    return this.authService.isAuthenticated$.pipe(
      take(1),
      tap(isAuthenticated => {
        
    
      }),
      map(isAuthenticated => {
        if (isAuthenticated) {
          return true;
        } else {
          
          // Controlla se c'è un token nel localStorage ma lo stato non è sincronizzato
          const token = localStorage.getItem('booking_auth_token');
          const user = localStorage.getItem('booking_user_data');
          
          if (token && user) {
            
            // Forza la reinizializzazione del servizio
            setTimeout(() => {
              window.location.reload();
            }, 100);
            
            return false;
          }
          
          return this.router.createUrlTree(['/servizi/login'], { 
            queryParams: { 
              returnUrl: state.url,
              message: 'Effettua il login per accedere a questa sezione'
            } 
          });
        }
      }),
      catchError((error) => {
        console.error('❌ AuthGuard - Errore nel controllo autenticazione:', error);
        return of(this.router.createUrlTree(['/servizi/login']));
      })
    );
  }
}