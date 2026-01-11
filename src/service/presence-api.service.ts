import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OnlineFriendDTO } from '../app/core/models/chat.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PresenceApiService {
  private readonly baseUrl = 'http://localhost:8080/api/v1';

  constructor(private http: HttpClient) {}

  getFriendsPresence(): Observable<OnlineFriendDTO[]> {
    return this.http.get<OnlineFriendDTO[]>(`${this.baseUrl}/presence/friends`);
  }
}
