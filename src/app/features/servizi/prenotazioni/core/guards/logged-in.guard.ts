import { Injectable, inject } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent,
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, EMPTY, of } from 'rxjs';
import { 
  catchError, 
  switchMap, 
  filter, 
  take,
  finalize, 
  map
} from 'rxjs/operators';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
@Injectable({
  providedIn: 'root'
})
export class LoggedInGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (isAuthenticated) {
          return this.router.createUrlTree(['/servizi/profile']);
        }
        return true; // Consenti accesso a login/register
      }),
      catchError(() => {
        return of(true); // In caso di errore, consenti l'accesso
      })
    );
  }

}

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | boolean | UrlTree {
    
    const requiredRoles = route.data['roles'] as string[] || [];
    
    
    if (requiredRoles.length === 0) {
      return true; // Nessun ruolo richiesto
    }

    return this.authService.user$.pipe(
      take(1),
      map(user => {
        if (!user) {
          return this.router.createUrlTree(['/servizi/login'], {
            queryParams: { 
              returnUrl: state.url,
              message: 'Accesso richiesto'
            }
          });
        }

        const hasRequiredRole = requiredRoles.includes(user.position);
        
        if (!hasRequiredRole) {
          return this.router.createUrlTree(['/servizi/profile'], {
            queryParams: { 
              message: 'Non hai i permessi necessari per accedere a questa sezione'
            }
          });
        }

        return true;
      }),
      catchError(() => {
        return of(this.router.createUrlTree(['/servizi/login']));
      })
    );
  }
}