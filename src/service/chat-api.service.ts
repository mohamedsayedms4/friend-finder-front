import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MessageDTO } from '../app/core/models/chat.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChatApiService {
  private readonly baseUrl = 'http://localhost:8080/api/v1';

  constructor(private http: HttpClient) {}

  getMessagesWith(userId: number, page = 0, size = 30): Observable<MessageDTO[]> {
    return this.http.get<MessageDTO[]>(
      `${this.baseUrl}/chat/conversations/with/${userId}/messages?page=${page}&size=${size}`
    );
  }
}
