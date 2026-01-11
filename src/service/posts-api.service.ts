// src/service/posts-api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type ReactionType = 'LIKE' | 'DISLIKE';
export type PostVisibility = 'FRIENDS_ONLY';
export type PostContentType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'MIXED';

export interface UserSummaryDTO {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
}

export interface PostMediaDTO {
  id?: number;
  mediaType: 'IMAGE' | 'VIDEO';
  url: string;
  position: number;
}

export interface PostDTO {
  id: number;
  author: UserSummaryDTO;

  visibility: PostVisibility;
  contentType: PostContentType;

  text?: string | null;

  // backend بيرجع media list
  media?: PostMediaDTO[];

  likeCount?: number;
  dislikeCount?: number;
  commentCount?: number;

  myReaction?: ReactionType | null;

  createdAt?: string;

  // UI helpers (اختياري)
  commentText?: string;
  comments?: CommentDTO[];
}

export interface CommentDTO {
  id: number;
  content: string;
  author: UserSummaryDTO;
  createdAt?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements?: number;
  number?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class PostsApiService {

  // عدّلها لو عندك env
  private readonly baseUrl = 'http://localhost:8080/api/v1/posts';

  constructor(private http: HttpClient) {}

  // ---------------- POSTS ----------------

  /**
   * JSON create (القديم)
   */
  createPost(payload: any): Observable<PostDTO> {
    return this.http.post<PostDTO>(`${this.baseUrl}`, payload);
  }

  /**
   * NEW: multipart/form-data create
   * backend:
   * POST /api/v1/posts
   * parts:
   *  - data (application/json)
   *  - files (one or many)
   */
  createPostMultipart(form: FormData): Observable<PostDTO> {
    return this.http.post<PostDTO>(`${this.baseUrl}`, form);
  }

  getFeed(page = 0, size = 10): Observable<PageResponse<PostDTO>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    return this.http.get<PageResponse<PostDTO>>(`${this.baseUrl}/feed`, { params });
  }

  getPostById(id: number): Observable<PostDTO> {
    return this.http.get<PostDTO>(`${this.baseUrl}/${id}`);
  }

  // ---------------- REACTIONS ----------------
  // backend:
  // PUT    /api/v1/posts/{postId}/reaction  body {type}
  // DELETE /api/v1/posts/{postId}/reaction

  upsertReaction(postId: number, type: ReactionType): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${postId}/reaction`, { type });
  }

  removeReaction(postId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${postId}/reaction`);
  }

  // ---------------- COMMENTS ----------------
  // لو endpoints عندك مختلفة: عدّل المسارات هنا فقط

  listTopComments(postId: number, page = 0, size = 10): Observable<PageResponse<CommentDTO>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));

    return this.http.get<PageResponse<CommentDTO>>(`${this.baseUrl}/${postId}/comments`, { params });
  }

  addComment(postId: number, content: string, parentId: number | null): Observable<CommentDTO> {
    return this.http.post<CommentDTO>(`${this.baseUrl}/${postId}/comments`, { content, parentId });
  }
}
