import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FriendsService, FriendDTO } from 'src/service/friends/friends.service';

@Component({
  selector: 'app-time-friends',
  templateUrl: './time-friends.component.html',
  styleUrls: ['./time-friends.component.css']
})
export class TimeFriendsComponent implements OnInit {

  loading = false;
  errorMsg = '';

  friends: FriendDTO[] = [];

  constructor(private friendsService: FriendsService) {}

  ngOnInit(): void {
    this.loadFriends();
  }

  loadFriends(): void {
    this.loading = true;
    this.errorMsg = '';

    this.friendsService.getFriends().subscribe({
      next: (list: FriendDTO[]) => {
        this.friends = Array.isArray(list) ? list : [];
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        console.error('[TimeFriends] getFriends ERROR:', err);
        this.errorMsg = 'Failed to load friends.';
        this.loading = false;
      }
    });
  }

  displayName(f: FriendDTO): string {
    const full = [f.firstName, f.lastName].filter(Boolean).join(' ').trim();
    return full || f.email || 'User';
  }

  imageSrc(f: FriendDTO): string {
    const raw = (f.profilePicture || '').trim();
    if (!raw) return 'assets/images/users/user-1.jpg';
    if (raw.startsWith('/assets/')) return raw.substring(1);
    if (raw.startsWith('assets/')) return raw;
    return raw;
  }

  onImgError(ev: Event): void {
    (ev.target as HTMLImageElement).src = 'assets/images/users/user-1.jpg';
  }

  // cover ثابت، ممكن تخليه داينامك لو حبيت
  coverSrc(index: number): string {
    const n = (index % 10) + 1; // 1..10
    return `assets/images/covers/${n}.jpg`;
  }
}
