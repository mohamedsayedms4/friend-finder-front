import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService, UserMe } from 'src/service/user/user.service';

@Component({
  selector: 'app-left-bar',
  templateUrl: './left-bar.component.html',
  styleUrls: ['./left-bar.component.css']
})
export class LeftBarComponent implements OnInit {

  // Default fallback
  userImage: string = 'assets/images/users/user-1.jpg';
  userName: string = 'User';

  // مهم: بعد ما خلت الصور تتخزن في Angular assets
  // الباك لازم يرجع: assets/images/{userId}/{file}.jpg
  // وبالتالي الفرونت "مش" هيضيف http://localhost:8080
  private readonly ASSETS_PREFIX = 'assets/';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    console.log('[LeftBar] ngOnInit fired');

    const token = sessionStorage.getItem('accessToken');
    console.log('[LeftBar] accessToken in sessionStorage:', token);

    console.log('[LeftBar] calling GET /api/v1/users/me ...');

    this.userService.getMe().subscribe({
      next: (me: UserMe) => {
        console.log('[LeftBar] /me SUCCESS raw response:', me);

        // =========================
        // 1) الاسم
        // =========================
        const fullName = [me?.firstName, me?.lastName].filter(Boolean).join(' ').trim();
        this.userName = fullName || me?.email || 'User';
        console.log('[LeftBar] computed userName:', this.userName);

        // =========================
        // 2) الصورة (من assets مباشرة)
        // =========================
        const picRaw = (me?.profilePicture || '').trim();
        console.log('[LeftBar] profilePicture raw:', picRaw);

        if (!picRaw) {
          console.log('[LeftBar] profilePicture empty -> keep default:', this.userImage);
          console.log('[LeftBar] FINAL state:', { userName: this.userName, userImage: this.userImage });
          return;
        }

        // (A) المطلوب: assets/...  => هنستخدمه زي ما هو
        if (picRaw.startsWith(this.ASSETS_PREFIX)) {
          this.userImage = picRaw;
          console.log('[LeftBar] profilePicture is assets path -> userImage:', this.userImage);
          console.log('[LeftBar] FINAL state:', { userName: this.userName, userImage: this.userImage });
          return;
        }

        // (B) لو رجع URL كامل (اختياري) => استخدمه زي ما هو
        if (picRaw.startsWith('http://') || picRaw.startsWith('https://')) {
          this.userImage = picRaw;
          console.log('[LeftBar] profilePicture is full URL -> userImage:', this.userImage);
          console.log('[LeftBar] FINAL state:', { userName: this.userName, userImage: this.userImage });
          return;
        }

        // (C) لو رجع Windows path => ده غلط في السيناريو بتاع assets، اطبع تحذير
        const looksLikeWindowsPath = /^[A-Za-z]:\\/.test(picRaw) || picRaw.includes('\\') || /^[A-Za-z]:\//.test(picRaw);
        if (looksLikeWindowsPath) {
          console.warn('[LeftBar] profilePicture is a filesystem path (Windows). This will not render in browser:', picRaw);
          console.warn('[LeftBar] Fix backend: return assets/images/... instead. Keeping default image.');
          console.log('[LeftBar] FINAL state:', { userName: this.userName, userImage: this.userImage });
          return;
        }

        // (D) أي قيمة تانية (زي uploads/..) => اعتبرها غلط في نظام assets واطبعها
        console.warn('[LeftBar] profilePicture is not assets/* and not a URL. Backend should return assets/images/...:', picRaw);
        console.log('[LeftBar] Keeping default image:', this.userImage);
        console.log('[LeftBar] FINAL state:', { userName: this.userName, userImage: this.userImage });
      },

      error: (err: HttpErrorResponse) => {
        console.error('[LeftBar] /me ERROR:', err);
        console.error('[LeftBar] status:', err.status);
        console.error('[LeftBar] statusText:', err.statusText);
        console.error('[LeftBar] url:', err.url);
        console.error('[LeftBar] body:', err.error);

        if (err.status === 401 || err.status === 403) {
          console.warn('[LeftBar] Unauthorized/Forbidden -> تأكد من interceptor بيبعت Bearer token في الهيدر.');
          console.warn('[LeftBar] sessionStorage accessToken:', sessionStorage.getItem('accessToken'));
        }
      }
    });
  }
}
