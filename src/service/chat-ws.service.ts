import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

import * as SockJS from 'sockjs-client';
import * as webstomp from 'webstomp-client';

import { MessageDTO } from 'src/app/core/models/chat.model';

@Injectable({ providedIn: 'root' })
export class ChatWsService {
  private client: any;
  private connected = false;

  private incoming$ = new Subject<MessageDTO>();

  // لتفادي تكرار الرسالة (optimistic + ws echo)
  private pendingKeys = new Set<string>();

  connect(): void {
    if (this.connected) return;

    const ws = new SockJS('http://localhost:8080/ws');
    this.client = webstomp.over(ws);

    // تقليل اللوج
    this.client.debug = () => {};

    // ✅ ابعت Bearer token في CONNECT
    const token = sessionStorage.getItem('accessToken') || '';
    const headers: any = token ? { Authorization: `Bearer ${token}` } : {};

    this.client.connect(
      headers,
      () => {
        this.connected = true;

        this.client.subscribe('/user/queue/messages', (frame: any) => {
          try {
            const payload = JSON.parse(frame.body) as MessageDTO;

            // لو الرسالة رجعت من السيرفر لنفس المحتوى/المرسل/التوقيت تقريبًا،
            // احذفها من pendingKeys عشان ما تتكررش في الواجهة لو أنت بتضيف optimistic
            const key = this.makeKey(payload);
            if (this.pendingKeys.has(key)) {
              this.pendingKeys.delete(key);
            }

            this.incoming$.next(payload);
          } catch {
            // ignore
          }
        });
      },
      () => {
        this.connected = false;
      }
    );
  }

  disconnect(): void {
    try {
      this.client?.disconnect();
    } catch {}
    this.client = null;
    this.connected = false;
    this.pendingKeys.clear();
  }

  stream(): Observable<MessageDTO> {
    return this.incoming$.asObservable();
  }

  /**
   * إرسال عادي (بدون optimistic).
   */
  send(toUserId: number, content: string): void {
    if (!this.client || !this.connected) return;

    this.client.send(
      '/app/chat.send',
      JSON.stringify({ toUserId, content: (content || '').trim() }),
      {}
    );
  }

  /**
   * ✅ إرسال + عرض فوري عندي (Optimistic UI)
   *
   * لازم تبعت meId من component (id بتاع المستخدم الحالي).
   */
  sendOptimistic(toUserId: number, content: string, meId: number): void {
    const text = (content || '').trim();
    if (!text) return;

    // 1) ضيف الرسالة فورًا للواجهة
    const optimisticMsg = this.buildOptimisticMessage(meId, text);

    // خزّن key لتفادي التكرار لما الرسالة ترجع من السيرفر
    const key = this.makeKey(optimisticMsg);
    this.pendingKeys.add(key);

    this.incoming$.next(optimisticMsg);

    // 2) ابعتها للسيرفر
    this.send(toUserId, text);
  }

  // ---------------- helpers ----------------

  private buildOptimisticMessage(meId: number, content: string): MessageDTO {
    // ملاحظة: لو MessageDTO عندك strict ومطلوب حقول أخرى، زودها هنا
    return {
      // id/conversationId غالبًا السيرفر هيملأهم لاحقًا
      id: null as any,
      conversationId: null as any,
      senderId: meId as any,
      content: content as any,
      createdAt: new Date().toISOString() as any
    } as any;
  }

  private makeKey(m: Partial<MessageDTO>): string {
    // Key ثابت لتحديد نفس الرسالة (مرسل + محتوى + createdAt)
    // لو createdAt في السيرفر بيجي Instant مختلف عن optimistic بفرق كبير،
    // ممكن نخليه يعتمد على (senderId + content) فقط
    const sender = (m as any)?.senderId ?? '';
    const content = ((m as any)?.content ?? '').toString().trim();
    const createdAt = ((m as any)?.createdAt ?? '').toString();
    return `${sender}::${content}::${createdAt}`;
  }
}
