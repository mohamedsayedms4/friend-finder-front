import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserMe {
  userId: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profilePicture: string | null;
}

export interface SuggestUser {
  userId: number;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  profilePicture?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly baseUrl = 'http://localhost:8080/api/v1/users';

  constructor(private http: HttpClient) {}

  getMe(): Observable<UserMe> {
    return this.http.get<UserMe>(`${this.baseUrl}/me`);
  }

  // IMPORTANT: غيّر المسار حسب الباك عندك
  // افتراض: GET /api/v1/users/suggestions?limit=5
  getSuggestions(limit = 5): Observable<SuggestUser[]> {
    return this.http.get<SuggestUser[]>(`${this.baseUrl}/suggestions?limit=${limit}`);
  }
}
