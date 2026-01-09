import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type RelationState =
  | 'FRIEND'
  | 'OUTGOING'
  | 'INCOMING'
  | 'NONE'
  | 'BLOCKED'
  | 'BLOCKING';

export interface UserRelationDTO {
  state: RelationState;
  requestId?: number | null; // لو INCOMING/OUTGOING
}

/**
 * ✅ Returned by:
 * GET /api/v1/friends/requests/incoming
 * GET /api/v1/friends/requests/outgoing
 */
export interface FriendRequestItemDTO {
  requestId: number;
  userId: number;

  firstName?: string | null;
  lastName?: string | null;
  email?: string;
  profilePicture?: string | null;

  state: 'INCOMING' | 'OUTGOING';
}

/**
 * ✅ Returned by:
 * GET /api/v1/friends/friends
 */
export interface FriendDTO {
  userId: number;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  profilePicture?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class FriendsService {

  // Backend base
  private readonly baseUrl = 'http://localhost:8080/api/v1/friends';

  constructor(private http: HttpClient) {}

  // معرفة حالة العلاقة بيني وبين userId
  relation(userId: number): Observable<UserRelationDTO> {
    return this.http.get<UserRelationDTO>(`${this.baseUrl}/relation/${userId}`);
  }

  // إرسال طلب صداقة
  sendRequest(toUserId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/requests/${toUserId}`, {});
  }

  // إلغاء طلب (Outgoing)
  cancelRequest(toUserId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/requests/${toUserId}`);
  }

  // قبول طلب (Incoming) — بالـ requestId
  accept(requestId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/requests/${requestId}/accept`, {});
  }

  // رفض طلب
  reject(requestId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/requests/${requestId}/reject`, {});
  }

  // إلغاء صداقة
  unfriend(userId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/friends/${userId}`);
  }

  // Block
  block(userId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/block/${userId}`, {});
  }

  // Unblock
  unblock(userId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/block/${userId}`);
  }

  // ✅ Incoming requests list (people who sent me requests)
  getIncomingRequests(): Observable<FriendRequestItemDTO[]> {
    return this.http.get<FriendRequestItemDTO[]>(`${this.baseUrl}/requests/incoming`);
  }

  // ✅ Outgoing requests list (people I sent requests to)
  getOutgoingRequests(): Observable<FriendRequestItemDTO[]> {
    return this.http.get<FriendRequestItemDTO[]>(`${this.baseUrl}/requests/outgoing`);
  }

  // ✅ Friends list (ACCEPTED)
  getFriends(): Observable<FriendDTO[]> {
    return this.http.get<FriendDTO[]>(`${this.baseUrl}/friends`);
  }
}
