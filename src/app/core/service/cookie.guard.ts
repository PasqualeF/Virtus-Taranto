// cookie.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { CookieService } from './cookie.service';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CookieGuard implements CanActivate, CanActivateChild {

  constructor(
    private cookieService: CookieService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // Ora permette sempre la navigazione, il banner si gestisce da solo
    return of(true);
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // Ora permette sempre la navigazione, il banner si gestisce da solo
    return of(true);
  }
}