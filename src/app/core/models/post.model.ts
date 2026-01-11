export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number; // current page index
  size: number;
}

export interface UserSummaryDTO {
  id: number;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}

export interface CommentDTO {
  id: number;
  content: string;
  author: UserSummaryDTO;
  createdAt: string;

  // لو عندك replies من الباك
  parentId?: number | null;
}

export interface PostDTO {
  id: number;
  text: string;
  mediaUrl?: string;
  mediaType?: 'IMAGE' | 'VIDEO';

  author: UserSummaryDTO;
  createdAt: string;

  likeCount: number;
  dislikeCount: number;
  commentCount: number;

  myReaction?: 'LIKE' | 'DISLIKE' | null;

  // optional (لو بترجعها من feed)
  comments?: CommentDTO[];
}
