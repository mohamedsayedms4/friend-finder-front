import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { UserService } from 'src/service/user/user.service';
import {
  FriendsService,
  RelationState,
  UserRelationDTO,
  FriendRequestItemDTO
} from 'src/service/friends/friends.service';

export interface SuggestUser {
  userId: number;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  profilePicture?: string | null;
}

@Component({
  selector: 'app-right-bar',
  templateUrl: './right-bar.component.html',
  styleUrls: ['./right-bar.component.css']
})
export class RightBarComponent implements OnInit {

  loading = false;
  loadingRequests = false;

  suggestions: SuggestUser[] = [];

  // Friend requests
  incoming: FriendRequestItemDTO[] = [];
  outgoing: FriendRequestItemDTO[] = [];

  incomingLimit = 3;
  suggestionsLimit = 6;

  // relation state per userId
  relationByUserId = new Map<number, RelationState>();

  // requestId per userId (needed for accept/reject)
  requestIdByUserId = new Map<number, number | null>();

  busyIds = new Set<number>();

  constructor(
    private userService: UserService,
    private friendsService: FriendsService
  ) {}

  ngOnInit(): void {
    this.loadRightBar();
  }

  // =========================
  // Combined loader
  // =========================
  loadRightBar(): void {
    this.loading = true;
    this.loadingRequests = true;

    forkJoin({
      suggestions: this.userService.getSuggestions().pipe(
        catchError((err: any) => {
          console.error('[RightBar] getSuggestions ERROR', err);
          return of([] as SuggestUser[]);
        })
      ),
      incoming: this.friendsService.getIncomingRequests().pipe(
        catchError((err: any) => {
          console.error('[RightBar] getIncomingRequests ERROR', err);
          return of([] as FriendRequestItemDTO[]);
        })
      ),
      outgoing: this.friendsService.getOutgoingRequests().pipe(
        catchError((err: any) => {
          console.error('[RightBar] getOutgoingRequests ERROR', err);
          return of([] as FriendRequestItemDTO[]);
        })
      )
    }).pipe(
      finalize(() => {
        this.loading = false;
        this.loadingRequests = false;
      })
    ).subscribe(({ suggestions, incoming, outgoing }) => {
      this.suggestions = Array.isArray(suggestions) ? suggestions : [];
      this.incoming = Array.isArray(incoming) ? incoming : [];
      this.outgoing = Array.isArray(outgoing) ? outgoing : [];

      // Default NONE for suggestions
      this.suggestions.forEach(u => {
        this.relationByUserId.set(u.userId, 'NONE');
        this.requestIdByUserId.set(u.userId, null);
      });

      // Apply incoming/outgoing to relation maps
      this.incoming.forEach(r => {
        this.relationByUserId.set(r.userId, 'INCOMING');
        this.requestIdByUserId.set(r.userId, r.requestId);
      });

      this.outgoing.forEach(r => {
        this.relationByUserId.set(r.userId, 'OUTGOING');
        this.requestIdByUserId.set(r.userId, r.requestId);
      });
    });
  }

  // =========================
  // Computed
  // =========================
  get incomingTotal(): number { return this.incoming.length; }

  get incomingLimited(): FriendRequestItemDTO[] {
    return this.incoming.slice(0, this.incomingLimit);
  }

  get suggestionsLimited(): SuggestUser[] {
    return this.suggestions.slice(0, this.suggestionsLimit);
  }

  // =========================
  // UI helpers
  // =========================
  displayName(u: SuggestUser): string {
    const full = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
    return full || u.email || 'User';
  }

  displayNameReq(r: FriendRequestItemDTO): string {
    const full = [r.firstName, r.lastName].filter(Boolean).join(' ').trim();
    return full || r.email || 'User';
  }

  imageSrc(u: SuggestUser): string {
    const raw = (u.profilePicture || '').trim();
    if (!raw) return 'assets/images/users/user-1.jpg';
    if (raw.startsWith('/assets/')) return raw.substring(1);
    if (raw.startsWith('assets/')) return raw;
    return raw;
  }

  imageSrcReq(r: FriendRequestItemDTO): string {
    const raw = (r.profilePicture || '').trim();
    if (!raw) return 'assets/images/users/user-1.jpg';
    if (raw.startsWith('/assets/')) return raw.substring(1);
    if (raw.startsWith('assets/')) return raw;
    return raw;
  }

  onImgError(ev: Event): void {
    (ev.target as HTMLImageElement).src = 'assets/images/users/user-1.jpg';
  }

  relationOf(userId: number): RelationState {
    return this.relationByUserId.get(userId) || 'NONE';
  }

  requestIdOf(userId: number): number | null {
    return this.requestIdByUserId.get(userId) ?? null;
  }

  isBusy(userId: number): boolean {
    return this.busyIds.has(userId);
  }

  // =========================
  // Friend requests actions (Incoming)
  // =========================
  acceptReq(r: FriendRequestItemDTO): void {
    if (this.isBusy(r.userId)) return;
    this.busyIds.add(r.userId);

    this.friendsService.accept(r.requestId).subscribe({
      next: () => {
        this.incoming = this.incoming.filter(x => x.requestId !== r.requestId);
        this.relationByUserId.set(r.userId, 'FRIEND');
        this.requestIdByUserId.set(r.userId, null);
        this.busyIds.delete(r.userId);
      },
      error: (err: any) => {
        console.error('[RightBar] acceptReq ERROR', err);
        this.busyIds.delete(r.userId);
      }
    });
  }

  rejectReq(r: FriendRequestItemDTO): void {
    if (this.isBusy(r.userId)) return;
    this.busyIds.add(r.userId);

    this.friendsService.reject(r.requestId).subscribe({
      next: () => {
        this.incoming = this.incoming.filter(x => x.requestId !== r.requestId);
        this.relationByUserId.set(r.userId, 'NONE');
        this.requestIdByUserId.set(r.userId, null);
        this.busyIds.delete(r.userId);
      },
      error: (err: any) => {
        console.error('[RightBar] rejectReq ERROR', err);
        this.busyIds.delete(r.userId);
      }
    });
  }

  // =========================
  // Suggestions primary action
  // =========================
  onPrimaryAction(u: SuggestUser): void {
    const userId = u.userId;
    const state = this.relationOf(userId);

    switch (state) {
      case 'NONE':
        this.sendRequest(userId);
        break;

      case 'OUTGOING':
        this.cancelRequest(userId);
        break;

      case 'INCOMING':
        // لو الشخص موجود في suggestions لكن حالته INCOMING، نحتاج requestId
        this.acceptIncoming(userId);
        break;

      case 'FRIEND':
        this.unfriend(userId);
        break;

      case 'BLOCKED':
      case 'BLOCKING':
        this.unblock(userId);
        break;

      default:
        this.sendRequest(userId);
        break;
    }
  }

  onBlockToggle(u: SuggestUser): void {
    const userId = u.userId;
    const state = this.relationOf(userId);

    if (state === 'BLOCKED' || state === 'BLOCKING') this.unblock(userId);
    else this.block(userId);
  }

  // =========================
  // Actions (same behavior as your previous code)
  // =========================
  private sendRequest(toUserId: number): void {
    if (this.isBusy(toUserId)) return;
    this.busyIds.add(toUserId);

    this.friendsService.sendRequest(toUserId).subscribe({
      next: () => {
        this.relationByUserId.set(toUserId, 'OUTGOING');
        // refresh relation to pull requestId if backend provides it
        this.refreshRelation(toUserId, () => this.busyIds.delete(toUserId));
      },
      error: (err: any) => {
        console.error('[RightBar] sendRequest ERROR:', err);
        this.busyIds.delete(toUserId);
      }
    });
  }

  private cancelRequest(toUserId: number): void {
    if (this.isBusy(toUserId)) return;
    this.busyIds.add(toUserId);

    this.friendsService.cancelRequest(toUserId).subscribe({
      next: () => {
        this.relationByUserId.set(toUserId, 'NONE');
        this.requestIdByUserId.set(toUserId, null);

        // also remove from outgoing list if present
        this.outgoing = this.outgoing.filter(x => x.userId !== toUserId);

        this.busyIds.delete(toUserId);
      },
      error: (err: any) => {
        console.error('[RightBar] cancelRequest ERROR:', err);
        this.busyIds.delete(toUserId);
      }
    });
  }

  private acceptIncoming(userId: number): void {
    if (this.isBusy(userId)) return;
    this.busyIds.add(userId);

    const requestId = this.requestIdOf(userId);
    if (!requestId) {
      // try refresh once
      this.refreshRelation(userId, () => this.busyIds.delete(userId));
      return;
    }

    this.friendsService.accept(requestId).subscribe({
      next: () => {
        // remove from incoming list if present
        this.incoming = this.incoming.filter(x => x.userId !== userId);

        this.relationByUserId.set(userId, 'FRIEND');
        this.requestIdByUserId.set(userId, null);
        this.busyIds.delete(userId);
      },
      error: (err: any) => {
        console.error('[RightBar] acceptIncoming ERROR:', err);
        this.busyIds.delete(userId);
      }
    });
  }

  private unfriend(userId: number): void {
    if (this.isBusy(userId)) return;
    this.busyIds.add(userId);

    this.friendsService.unfriend(userId).subscribe({
      next: () => {
        this.relationByUserId.set(userId, 'NONE');
        this.requestIdByUserId.set(userId, null);
        this.busyIds.delete(userId);
      },
      error: (err: any) => {
        console.error('[RightBar] unfriend ERROR:', err);
        this.busyIds.delete(userId);
      }
    });
  }

  private block(userId: number): void {
    if (this.isBusy(userId)) return;
    this.busyIds.add(userId);

    this.friendsService.block(userId).subscribe({
      next: () => {
        this.relationByUserId.set(userId, 'BLOCKING');
        this.requestIdByUserId.set(userId, null);

        // remove from lists
        this.incoming = this.incoming.filter(x => x.userId !== userId);
        this.outgoing = this.outgoing.filter(x => x.userId !== userId);

        this.refreshRelation(userId, () => this.busyIds.delete(userId));
      },
      error: (err: any) => {
        console.error('[RightBar] block ERROR:', err);
        this.busyIds.delete(userId);
      }
    });
  }

  private unblock(userId: number): void {
    if (this.isBusy(userId)) return;
    this.busyIds.add(userId);

    this.friendsService.unblock(userId).subscribe({
      next: () => {
        this.relationByUserId.set(userId, 'NONE');
        this.requestIdByUserId.set(userId, null);
        this.busyIds.delete(userId);
      },
      error: (err: any) => {
        console.error('[RightBar] unblock ERROR:', err);
        this.busyIds.delete(userId);
      }
    });
  }

  private refreshRelation(userId: number, done?: () => void): void {
    this.friendsService.relation(userId).subscribe({
      next: (rel: UserRelationDTO) => {
        this.relationByUserId.set(userId, rel.state);
        this.requestIdByUserId.set(userId, rel.requestId ?? null);
        done?.();
      },
      error: (err: any) => {
        console.warn('[RightBar] refreshRelation ERROR ->', userId, err);
        done?.();
      }
    });
  }

  // =========================
  // Labels
  // =========================
  primaryLabel(userId: number): string {
    if (this.isBusy(userId)) return '...';

    const state = this.relationOf(userId);
    switch (state) {
      case 'NONE': return 'Add friend';
      case 'OUTGOING': return 'Cancel request';
      case 'INCOMING': return 'Accept';
      case 'FRIEND': return 'Remove';
      case 'BLOCKED':
      case 'BLOCKING': return 'Unblock';
      default: return 'Add friend';
    }
  }

  blockLabel(userId: number): string {
    if (this.isBusy(userId)) return '...';
    const state = this.relationOf(userId);
    return (state === 'BLOCKED' || state === 'BLOCKING') ? 'Unblock' : 'Block';
  }
}
