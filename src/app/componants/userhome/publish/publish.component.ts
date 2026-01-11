// src/app/componants/userhome/publish/publish.component.ts

import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { PostsApiService } from 'src/service/posts-api.service';
import { UserService, UserMe } from 'src/service/user/user.service';

// مطابق للباك
type PostContentType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'MIXED';
type PostVisibility = 'FRIENDS_ONLY';

@Component({
  selector: 'app-publish',
  templateUrl: './publish.component.html',
  styleUrls: ['./publish.component.css']
})
export class PublishComponent implements OnInit {

  // --------- USER UI (same as LeftBar) ----------
  userImage: string = 'assets/images/users/user-1.jpg';
  userName: string = 'User';
  private readonly ASSETS_PREFIX = 'assets/';

  // --------- POST DATA ----------
  text = '';

  // هنخزن الملفات فعليًا
  selectedFiles: File[] = [];

  // للمعاينة فقط (اختياري)
  previewUrls: string[] = [];

  submitting = false;
  errorMsg = '';

  @ViewChild('imageInput', { static: false }) imageInput?: ElementRef<HTMLInputElement>;
  @ViewChild('videoInput', { static: false }) videoInput?: ElementRef<HTMLInputElement>;

  constructor(
    private postsApi: PostsApiService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadMe();
  }

  private loadMe(): void {
    this.userService.getMe().subscribe({
      next: (me: UserMe) => {
        // name
        const fullName = [me?.firstName, me?.lastName].filter(Boolean).join(' ').trim();
        this.userName = fullName || me?.email || 'User';

        // picture
        const picRaw = (me?.profilePicture || '').trim();
        if (!picRaw) return;

        // (A) assets/... => use as is
        if (picRaw.startsWith(this.ASSETS_PREFIX)) {
          this.userImage = picRaw;
          return;
        }

        // (B) full URL => use as is
        if (picRaw.startsWith('http://') || picRaw.startsWith('https://')) {
          this.userImage = picRaw;
          return;
        }

        // (C) windows path => ignore
        const looksLikeWindowsPath =
          /^[A-Za-z]:\\/.test(picRaw) || picRaw.includes('\\') || /^[A-Za-z]:\//.test(picRaw);
        if (looksLikeWindowsPath) {
          console.warn('[Publish] profilePicture is a filesystem path. Ignoring:', picRaw);
          return;
        }

        // (D) anything else => ignore
        console.warn('[Publish] profilePicture is not assets/* and not a URL. Ignoring:', picRaw);
      },
      error: (err: HttpErrorResponse) => {
        console.error('[Publish] /me ERROR:', err);
      }
    });
  }

  // -------------------- Publish logic --------------------

  canPublish(): boolean {
    const t = (this.text || '').trim();
    return !this.submitting && (!!t || this.selectedFiles.length > 0);
  }

  publish(): void {
    this.onPublish();
  }

  private resolveContentType(): PostContentType {
    if (this.selectedFiles.length === 0) return 'TEXT';

    const hasImage = this.selectedFiles.some(f => (f.type || '').startsWith('image/'));
    const hasVideo = this.selectedFiles.some(f => (f.type || '').startsWith('video/'));

    if (hasImage && hasVideo) return 'MIXED';
    if (hasVideo) return 'VIDEO';
    return 'IMAGE';
  }

  onPublish(): void {
    const t = (this.text || '').trim();
    if (!t && this.selectedFiles.length === 0) return;

    this.submitting = true;
    this.errorMsg = '';

    // 1) data part (JSON)
    const data = {
      text: t || null,
      visibility: 'FRIENDS_ONLY' as PostVisibility,
      contentType: this.resolveContentType()
    };

    // 2) multipart form
    const form = new FormData();

    form.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));

    this.selectedFiles.forEach(file => {
      form.append('files', file, file.name);
    });

    this.postsApi.createPostMultipart(form).subscribe({
      next: () => {
        this.text = '';
        this.clearMedia();
        this.submitting = false;
      },
      error: (e) => {
        console.error(e);
        this.errorMsg = 'Failed to publish post';
        this.submitting = false;
      }
    });
  }

  chooseImage(): void {
    this.imageInput?.nativeElement?.click();
  }

  chooseVideo(): void {
    this.videoInput?.nativeElement?.click();
  }

  clearMedia(): void {
    // امسح previews
    this.previewUrls.forEach(u => {
      try { URL.revokeObjectURL(u); } catch {}
    });
    this.previewUrls = [];

    // امسح الملفات
    this.selectedFiles = [];

    // reset inputs
    if (this.imageInput?.nativeElement) this.imageInput.nativeElement.value = '';
    if (this.videoInput?.nativeElement) this.videoInput.nativeElement.value = '';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (!files.length) return;

    files.forEach(f => this.selectedFiles.push(f));

    // previews (اختياري)
    files.forEach(f => {
      const url = URL.createObjectURL(f);
      this.previewUrls.push(url);
    });

    input.value = '';
  }
}
