import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/service/security/auth.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent implements OnInit {

  signupForm!: FormGroup;

  messageAr: string = '';
  messageEn: string = '';

  selectedImage: File | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // مطابق لـ RegisterRequest في الباك
    this.signupForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      biography: [''],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9+]{8,20}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedImage = (input.files && input.files.length > 0) ? input.files[0] : null;
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const payload = {
      email: this.signupForm.value.email,
      password: this.signupForm.value.password,
      firstName: this.signupForm.value.firstName,
      lastName: this.signupForm.value.lastName,
      biography: this.signupForm.value.biography,
      phoneNumber: this.signupForm.value.phoneNumber
    };

    const formData = new FormData();

    // IMPORTANT: data as JSON Blob so Spring reads @RequestPart("data") RegisterRequest
    formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));

    if (this.selectedImage) {
      formData.append('image', this.selectedImage, this.selectedImage.name);
    }

    this.authService.registerMultipart(formData).subscribe({
      next: (res) => {
        const auth = res.data;

        sessionStorage.setItem('accessToken', auth.accessToken);
        sessionStorage.setItem('refreshToken', auth.refreshToken);

        this.router.navigateByUrl('/mainpage');
      },
      error: (err) => {
        this.messageEn = err?.error?.message || 'Unexpected error';
        this.messageAr = err?.error?.messageAr || 'حدث خطأ غير متوقع';

        setTimeout(() => {
          this.messageAr = '';
          this.messageEn = '';
        }, 3000);
      }
    });
  }
}
