// src/app/componants/userhome/main-page/main-page.component.ts

import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { PostsApiService, PostDTO } from 'src/service/posts-api.service';
import { UserService, UserMe } from 'src/service/user/user.service';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.css']
})
export class MainPageComponent implements OnInit {

  loading = false;
  page = 0;
  size = 10;
  totalPages = 0;

  posts: PostDTO[] = [];

  // غيّره لو الباك عندك على دومين/بورت مختلف
  private readonly apiBase = 'http://localhost:8080';

  // ====== ME (for Add Comment avatar) ======
  meName = 'User';
  meImage = 'assets/images/users/user-1.jpg';
  private readonly ASSETS_PREFIX = 'assets/';

  constructor(
    private postsApi: PostsApiService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // 1) load me
    this.loadMe();

    // 2) load feed
    this.loadFeed();
  }

  // ---------------- ME ----------------

  private loadMe(): void {
    this.userService.getMe().subscribe({
      next: (me: UserMe) => {
        // name
        const fullName = [me?.firstName, me?.lastName].filter(Boolean).join(' ').trim();
        this.meName = fullName || me?.email || 'User';

        // image
        const picRaw = (me?.profilePicture || '').trim();
        this.meImage = this.fixImage(picRaw);
      },
      error: (err) => {
        console.error('[MainPage] loadMe error:', err);
        // keep defaults
      }
    });
  }

  // ---------------- FEED ----------------

  loadFeed(): void {
    this.loading = true;
    this.page = 0;

    this.postsApi.getFeed(this.page, this.size)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.totalPages = res.totalPages || 0;

          this.posts = (res.content || []).map((p: any) => ({
            ...p,

            // UI fields
            comments: p.comments || [],
            commentsLoaded: p.commentsLoaded ?? false,
            loadingComments: p.loadingComments ?? false,
            commentText: p.commentText ?? ''
          }));
        },
        error: (err) => console.error(err)
      });
  }

  loadMore(): void {
    if (this.page + 1 >= this.totalPages) return;

    this.page++;
    this.loading = true;

    this.postsApi.getFeed(this.page, this.size)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          const more = (res.content || []).map((p: any) => ({
            ...p,
            comments: p.comments || [],
            commentsLoaded: p.commentsLoaded ?? false,
            loadingComments: p.loadingComments ?? false,
            commentText: p.commentText ?? ''
          }));

          this.posts = this.posts.concat(more);
        },
        error: (err) => console.error(err)
      });
  }

  // ---------------- TEMPLATE HELPERS ----------------

  isLiked(post: PostDTO): boolean {
    return (post?.myReaction || null) === 'LIKE';
  }

  isDisliked(post: PostDTO): boolean {
    return (post?.myReaction || null) === 'DISLIKE';
  }

  likeCount(post: PostDTO): number {
    return Number((post as any)?.likeCount ?? 0);
  }

  dislikeCount(post: PostDTO): number {
    return Number((post as any)?.dislikeCount ?? 0);
  }

  commentCount(post: PostDTO): number {
    return Number((post as any)?.commentCount ?? 0);
  }

  // ---------------- URL FIXERS ----------------

  fixImage(url?: string | null): string {
    if (!url) return 'assets/images/users/user-1.jpg';

    const s = String(url).trim();

    // Windows path => fallback
    if (s.startsWith('C:') || s.startsWith('D:') || s.includes('\\')) {
      return 'assets/images/users/user-1.jpg';
    }

    // absolute
    if (s.startsWith('http://') || s.startsWith('https://')) return s;

    // relative (/uploads/... or /assets/..)
    if (s.startsWith('/')) return this.apiBase + s;

    // assets/... (Angular assets)
    if (s.startsWith(this.ASSETS_PREFIX)) return s;

    // anything else => fallback
    return 'assets/images/users/user-1.jpg';
  }

  fixMedia(url?: string | null): string {
    if (!url) return '';

    const s = String(url).trim();

    // Windows path => don't render
    if (s.startsWith('C:') || s.startsWith('D:') || s.includes('\\')) return '';

    if (s.startsWith('http://') || s.startsWith('https://')) return s;
    if (s.startsWith('/')) return this.apiBase + s;

    // assets/... (Angular assets)
    if (s.startsWith(this.ASSETS_PREFIX)) return s;

    // fallback assumption
    return this.apiBase + '/uploads/' + s;
  }

  // ---------------- MEDIA (BASED ON post.media[]) ----------------

  hasMedia(post: any): boolean {
    return Array.isArray(post?.media) && post.media.length > 0;
  }

  mediaItems(post: any): any[] {
    return Array.isArray(post?.media) ? post.media : [];
  }

  isImageMedia(m: any): boolean {
    const t = (m?.mediaType || '').toString().toUpperCase();
    return t === 'IMAGE' && !!this.fixMedia(m?.url);
  }

  isVideoMedia(m: any): boolean {
    const t = (m?.mediaType || '').toString().toUpperCase();
    return t === 'VIDEO' && !!this.fixMedia(m?.url);
  }

  mediaItemUrl(m: any): string {
    return this.fixMedia(m?.url);
  }

  // ---------------- REACTIONS ----------------

  toggleLike(post: PostDTO): void {
    const current = post.myReaction || null;

    if (current === 'LIKE') {
      this.postsApi.removeReaction(post.id).subscribe({
        next: () => {
          post.myReaction = null;
          (post as any).likeCount = Math.max(0, this.likeCount(post) - 1);
        },
        error: (e) => console.error(e)
      });
      return;
    }

    const prev = current;

    this.postsApi.upsertReaction(post.id, 'LIKE').subscribe({
      next: () => {
        post.myReaction = 'LIKE';

        if (prev === 'DISLIKE') {
          (post as any).dislikeCount = Math.max(0, this.dislikeCount(post) - 1);
        }

        (post as any).likeCount = this.likeCount(post) + 1;
      },
      error: (e) => console.error(e)
    });
  }

  toggleDislike(post: PostDTO): void {
    const current = post.myReaction || null;

    if (current === 'DISLIKE') {
      this.postsApi.removeReaction(post.id).subscribe({
        next: () => {
          post.myReaction = null;
          (post as any).dislikeCount = Math.max(0, this.dislikeCount(post) - 1);
        },
        error: (e) => console.error(e)
      });
      return;
    }

    const prev = current;

    this.postsApi.upsertReaction(post.id, 'DISLIKE').subscribe({
      next: () => {
        post.myReaction = 'DISLIKE';

        if (prev === 'LIKE') {
          (post as any).likeCount = Math.max(0, this.likeCount(post) - 1);
        }

        (post as any).dislikeCount = this.dislikeCount(post) + 1;
      },
      error: (e) => console.error(e)
    });
  }

  // ---------------- COMMENTS ----------------

  toggleComments(post: any): void {
    if (post.commentsLoaded) {
      post.commentsLoaded = false;
      post.comments = [];
      return;
    }

    post.commentsLoaded = true;
    post.loadingComments = true;

    this.postsApi.listTopComments(post.id, 0, 10)
      .pipe(finalize(() => post.loadingComments = false))
      .subscribe({
        next: (res) => {
          post.comments = res.content || [];
        },
        error: (e) => console.error(e)
      });
  }

  addComment(post: any): void {
    const text = String(post.commentText || '').trim();
    if (!text) return;

    this.postsApi.addComment(post.id, text, null).subscribe({
      next: (comment: any) => {
        post.comments = post.comments || [];
        post.comments.push(comment);
        post.commentCount = this.commentCount(post) + 1;
        post.commentText = '';
      },
      error: (e) => console.error(e)
    });
  }

  // ---------------- UTIL ----------------

  fullName(u: any): string {
    const f = u && u.firstName ? String(u.firstName).trim() : '';
    const l = u && u.lastName ? String(u.lastName).trim() : '';
    const name = (f + ' ' + l).trim();
    return name || 'User';
  }

  // placeholders للـ replies
  toggleReplies(_post: any, _comment: any): void {}
  isRepliesLoading(_post: any, _commentId: any): boolean { return false; }
  isRepliesShown(_post: any, _commentId: any): boolean { return false; }
  getReplies(_post: any, _commentId: any): any[] { return []; }
  getReplyText(_post: any, _commentId: any): string { return ''; }
  setReplyText(_post: any, _commentId: any, _val: string): void {}
  addReply(_post: any, _comment: any): void {}
}
