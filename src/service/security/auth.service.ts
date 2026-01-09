import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiResponse<T> {
  timestamp: string;
  success: boolean;
  message: string;
  data: T;
}

export interface AuthResponse {
  tokenType: string;            // غالبًا "Bearer"
  accessToken: string;
  refreshToken: string;
  accessExpiresInSec: number;
  refreshExpiresInSec: number;
  user: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly baseUrl = 'http://localhost:8080/api/v1/auth';

  constructor(private http: HttpClient) {}

  // ========= REGISTER (multipart) =========
  registerMultipart(formData: FormData): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(
      `${this.baseUrl}/register`,
      formData
      // لا تحتاج withCredentials طالما مش شغال cookies
    );
  }

  // ========= LOGIN (json) =========
  login(body: { email: string; password: string }): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(
      `${this.baseUrl}/login`,
      body
      // لا تحتاج withCredentials طالما مش شغال cookies
    );
  }

  // ========= TOKEN STORAGE =========
  saveTokens(auth: AuthResponse): void {
    if (auth?.accessToken) {
      sessionStorage.setItem('accessToken', auth.accessToken);
    }
    if (auth?.refreshToken) {
      sessionStorage.setItem('refreshToken', auth.refreshToken);
    }
  }

  getAccessToken(): string | null {
    const token = sessionStorage.getItem('accessToken');
    return token && token.trim().length > 0 ? token : null;
  }

  getRefreshToken(): string | null {
    const token = sessionStorage.getItem('refreshToken');
    return token && token.trim().length > 0 ? token : null;
  }

  // ========= AUTH HELPERS (used by guards) =========
  isUserLogin(): boolean {
    return !!this.getAccessToken();
  }

  logout(): void {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
  }
}
