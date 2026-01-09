import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/service/security/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;
  messageAr: string = '';
  messageEn: string = '';

  constructor(
    @Inject(FormBuilder) private fb: FormBuilder,
    private authService: AuthService,
    @Inject(Router) private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const payload = {
      email: this.loginForm.get('email')?.value,
      password: this.loginForm.get('password')?.value,
    };

    this.authService.login(payload).subscribe({
      next: (res: any) => {
        const auth = res?.data;

        if (auth?.accessToken) sessionStorage.setItem('accessToken', auth.accessToken);
        if (auth?.refreshToken) sessionStorage.setItem('refreshToken', auth.refreshToken);

        const u = auth?.user;
        if (u) {
          const fullName = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
          sessionStorage.setItem('userFullName', fullName);
          sessionStorage.setItem('userProfilePicture', u.profilePicture ?? '');
        }

        this.router.navigateByUrl('/mainpage');
      },
      error: (err: any) => {
        console.log(err);
        this.messageEn = err?.error?.message || 'Unexpected error';
        this.messageAr = err?.error?.messageAr || 'حدث خطأ غير متوقع';

        setTimeout(() => {
          this.messageEn = '';
          this.messageAr = '';
        }, 3000);
      }
    });
  }
}
