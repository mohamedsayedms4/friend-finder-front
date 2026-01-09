import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService, UserMe } from 'src/service/user/user.service';

@Component({
  selector: 'app-time-line-profile',
  templateUrl: './time-line-profile.component.html',
  styleUrls: ['./time-line-profile.component.css']
})
export class TimeLineProfileComponent implements OnInit {

  // Defaults (fallback)
  userImage: string = 'assets/images/users/user-1.jpg';
  userName: string = 'User';
  userJobTitle: string = 'USER'; // لو مش عندك jobTitle في الباك، سيبه ثابت أو امسحه
  followersText: string = '— people following';

  loading = false;
  errorMsg = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    console.log('[TimeLineProfile] ngOnInit fired');

    const token = sessionStorage.getItem('accessToken');
    console.log('[TimeLineProfile] accessToken:', token);

    this.loading = true;

    this.userService.getMe().subscribe({
      next: (me: UserMe) => {
        console.log('[TimeLineProfile] /me SUCCESS raw:', me);

        // الاسم
        const fullName = [me?.firstName, me?.lastName].filter(Boolean).join(' ').trim();
        this.userName = fullName || me?.email || 'User';

        // الوظيفة/الـ role (لو عندك role في التوكن/الـme عدل هنا)
        // لو UserMe عندك مفيهوش role: سيبه ثابت أو احذفه من الـHTML
        this.userJobTitle = 'USER';

        // followers (لو عندك رقم followers في الباك حطه)
        this.followersText = '— people following';

        // الصورة
        const picRaw = (me?.profilePicture || '').trim();
        console.log('[TimeLineProfile] profilePicture raw:', picRaw);

        if (picRaw) {
          // لو الباك رجّع assets/... (إنت ناوي تخزن جوه Angular assets)
          if (picRaw.startsWith('assets/')) {
            this.userImage = picRaw;
          }
          // لو URL كامل
          else if (picRaw.startsWith('http://') || picRaw.startsWith('https://')) {
            this.userImage = picRaw;
          }
          // لو رجّع Windows path → مينفعش في المتصفح
          else if (/^[A-Za-z]:\\/.test(picRaw) || picRaw.includes('\\') || /^[A-Za-z]:\//.test(picRaw)) {
            console.warn('[TimeLineProfile] Windows path cannot be used in <img src>:', picRaw);
            // سيب default
          }
          // لو path نسبي من الباك (مثلاً /uploads/..)
          else {
            const BASE_URL = 'http://localhost:8080/';
            this.userImage = BASE_URL + picRaw.replace(/^\//, '');
          }
        }

        console.log('[TimeLineProfile] FINAL state:', {
          userName: this.userName,
          userImage: this.userImage
        });

        this.loading = false;
      },

      error: (err: HttpErrorResponse) => {
        console.error('[TimeLineProfile] /me ERROR:', err);
        console.error('[TimeLineProfile] status:', err.status);
        console.error('[TimeLineProfile] body:', err.error);

        this.errorMsg = 'Failed to load user profile';
        this.loading = false;
      }
    });
  }
}
