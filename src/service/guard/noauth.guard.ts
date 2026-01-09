import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../security/auth.service';

@Injectable({
  providedIn: 'root'
})
export class NoauthGuard implements CanActivate {
 constructor(private authService: AuthService, private route: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (!this.authService.isUserLogin()){
      return true;
    }
    this.route.navigateByUrl("/proudct")
    return false;
  }
  
}
