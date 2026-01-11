export interface OnlineFriendDTO {
  userId: number;
  firstName: string;
  lastName: string;
  profilePicture?: string | null;
  online: boolean;
  lastSeen?: string | null; // ISO
}

export interface MessageDTO {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  createdAt: string; // ISO
}

export interface SendMessageRequest {
  toUserId: number;
  content: string;
}
