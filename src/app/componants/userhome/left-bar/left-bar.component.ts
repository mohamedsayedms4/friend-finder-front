import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription, interval } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { UserService, UserMe } from 'src/service/user/user.service';

import { PresenceApiService } from '../../../../service/presence-api.service';
import { ChatApiService } from '../../../../service/chat-api.service';
import { ChatWsService } from '../../../../service/chat-ws.service';

import { OnlineFriendDTO, MessageDTO } from 'src/app/core/models/chat.model';

@Component({
  selector: 'app-left-bar',
  templateUrl: './left-bar.component.html',
  styleUrls: ['./left-bar.component.css']
})
export class LeftBarComponent implements OnInit, OnDestroy {

  // Default fallback
  userImage: string = 'assets/images/users/user-1.jpg';
  userName: string = 'User';

  // لو /me بيرجع id استخدمه
  meId: number | null = null;

  private readonly ASSETS_PREFIX = 'assets/';
  private readonly API_BASE = 'http://localhost:8080';

  // Presence
  loadingFriends = false;
  friends: OnlineFriendDTO[] = [];

  // Chat panel
  chatOpen = false;
  activeFriend: OnlineFriendDTO | null = null;
  loadingMessages = false;
  messages: MessageDTO[] = [];
  draft = '';

  /**
   * لتفادي تكرار optimistic + ws:
   * نخزن pending keyed by friendId + content
   */
  private pendingByKey = new Map<string, number>(); // key -> optimisticMsgId

  private subs = new Subscription();

  constructor(
    private userService: UserService,
    private presenceApi: PresenceApiService,
    private chatApi: ChatApiService,
    private chatWs: ChatWsService
  ) {}

  ngOnInit(): void {
    this.loadMe();

    // WS connect
    this.chatWs.connect();

    // Receive realtime messages
    this.subs.add(
      this.chatWs.stream().subscribe((msg) => {
        if (!this.activeFriend) return;

        const friendId = this.activeFriend.userId;

        // اعرض فقط ما يخص الشات الحالي:
        // - رسالة جاية من الصديق
        // - أو رسالة جاية مني (echo)
        if (this.meId != null) {
          if (msg.senderId !== friendId && msg.senderId !== this.meId) return;
        } else {
          // بدون meId: على الأقل اعرض رسائل الصديق
          if (msg.senderId !== friendId) return;
        }

        // ✅ لو دي echo لرسالة كنت باعتها optimistic، بدلها بدل ما تضيف واحدة جديدة
        if (this.meId != null && msg.senderId === this.meId) {
          const key = this.pendingKey(friendId, msg.content);
          const optimisticId = this.pendingByKey.get(key);

          if (optimisticId != null) {
            // استبدال الرسالة المؤقتة بالرسالة الحقيقية
            this.messages = this.messages.map(m => (m.id === optimisticId ? msg : m));
            this.pendingByKey.delete(key);
            return;
          }
        }

        // ✅ لو مش pending، ضيفها بس لو مش موجودة بالفعل
        if (!this.containsMessage(msg)) {
          this.messages = [...this.messages, msg];
        }
      })
    );

    // Poll friends presence each 10s
    this.subs.add(
      interval(10000).subscribe(() => this.loadFriendsPresence(false))
    );

    // initial presence
    this.loadFriendsPresence(true);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    // اختياري
    // this.chatWs.disconnect();
  }

  // ---------------- ME ----------------
  private loadMe(): void {
    this.userService.getMe().subscribe({
      next: (me: UserMe) => {
        const fullName = [me?.firstName, me?.lastName].filter(Boolean).join(' ').trim();
        this.userName = fullName || me?.email || 'User';

        // لو DTO عندك فيه id
        // @ts-ignore
        this.meId = (me as any)?.id ?? null;

        const picRaw = (me?.profilePicture || '').trim();
        const resolved = this.resolveImageUrl(picRaw);
        if (resolved) this.userImage = resolved;
      },
      error: (err: HttpErrorResponse) => {
        console.error('[LeftBar] /me ERROR:', err);
      }
    });
  }

  // ---------------- Presence ----------------
  loadFriendsPresence(showLoading: boolean): void {
    if (showLoading) this.loadingFriends = true;

    this.presenceApi.getFriendsPresence()
      .pipe(finalize(() => (this.loadingFriends = false)))
      .subscribe({
        next: (list) => {
          const arr = list || [];
          this.friends = [...arr].sort((a, b) => Number(b.online) - Number(a.online));
        },
        error: (err) => {
          console.error('[LeftBar] presence error:', err);
          this.friends = [];
        }
      });
  }

  // ---------------- Chat UI ----------------
  openChat(friend: OnlineFriendDTO): void {
    this.activeFriend = friend;
    this.chatOpen = true;
    this.draft = '';
    this.pendingByKey.clear(); // بدّل الشات => نظف pending
    this.loadMessages(friend.userId);
  }

  closeChat(): void {
    this.chatOpen = false;
    this.activeFriend = null;
    this.messages = [];
    this.draft = '';
    this.pendingByKey.clear();
  }

  private loadMessages(friendId: number): void {
    this.loadingMessages = true;

    this.chatApi.getMessagesWith(friendId, 0, 30)
      .pipe(finalize(() => (this.loadingMessages = false)))
      .subscribe({
        next: (msgs) => {
          const serverMsgs = (msgs || []);

          // ✅ Merge بدل replace عشان ما تمسحش optimistic لو لسه موجود
          const merged: MessageDTO[] = [];
          const seen = new Set<string>();

          const add = (m: MessageDTO) => {
            const k = this.msgKey(m);
            if (seen.has(k)) return;
            seen.add(k);
            merged.push(m);
          };

          // أولًا الرسائل الحالية (قد تتضمن optimistic)
          (this.messages || []).forEach(add);

          // ثم رسائل السيرفر
          serverMsgs.forEach(add);

          this.messages = merged;
        },
        error: (err) => {
          console.error('[LeftBar] messages load error:', err);
          // ما تمسحش messages هنا لو عندك optimistic
        }
      });
  }

  send(): void {
    const friend = this.activeFriend;
    const content = (this.draft || '').trim();
    if (!friend || !content) return;

    // ✅ optimistic bubble (pending)
    if (this.meId != null) {
      const optimisticId = Date.now();

      const fake: MessageDTO = {
        id: optimisticId as any,
        conversationId: 0 as any,
        senderId: this.meId as any,
        content,
        createdAt: new Date().toISOString() as any
      } as any;

      this.messages = [...this.messages, fake];

      // خزّن key عشان لما echo ترجع نستبدل
      const key = this.pendingKey(friend.userId, content);
      this.pendingByKey.set(key, optimisticId);
    }

    // send realtime (server will echo back)
    this.chatWs.send(friend.userId, content);

    this.draft = '';
  }

  // helpers
  friendDisplayName(f: OnlineFriendDTO): string {
    const n = `${f.firstName || ''} ${f.lastName || ''}`.trim();
    return n || `User #${f.userId}`;
  }

  friendAvatar(f: OnlineFriendDTO): string {
    const picRaw = (f.profilePicture || '').trim();
    const resolved = this.resolveImageUrl(picRaw);
    return resolved ? resolved : 'assets/images/users/user-2.jpg';
  }

  // ---------------- private utilities ----------------

  private resolveImageUrl(raw: string): string | null {
    const picRaw = (raw || '').trim();
    if (!picRaw) return null;

    // assets path
    if (picRaw.startsWith(this.ASSETS_PREFIX)) return picRaw;

    // full url
    if (picRaw.startsWith('http://') || picRaw.startsWith('https://')) return picRaw;

    // web path from backend
    if (picRaw.startsWith('/uploads/')) return this.API_BASE + picRaw;

    // windows path => ignore
    const looksLikeWindowsPath =
      /^[A-Za-z]:\\/.test(picRaw) || picRaw.includes('\\') || /^[A-Za-z]:\//.test(picRaw);
    if (looksLikeWindowsPath) return null;

    // filename فقط => غالبًا غلط، تجاهله
    return null;
  }

  private pendingKey(friendId: number, content: string): string {
    return `${friendId}::${(content || '').trim()}`;
  }

  private msgKey(m: MessageDTO): string {
    // لو عندك id من السيرفر ممتاز، غير كده fallback
    const id = (m as any)?.id;
    if (id != null) return `id:${id}`;
    return `${(m as any)?.senderId}::${((m as any)?.content || '').toString().trim()}::${(m as any)?.createdAt}`;
  }

  private containsMessage(m: MessageDTO): boolean {
    const k = this.msgKey(m);
    return (this.messages || []).some(x => this.msgKey(x) === k);
  }
}
