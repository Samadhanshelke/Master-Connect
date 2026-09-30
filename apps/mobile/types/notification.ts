export type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'system';

export type NotificationRecord = {
  id: string;
  type: NotificationType;
  recipientId: string;
  actorId: string;
  actorName: string;
  message: string;
  postId: string | null;
  isRead: boolean;
  createdAt: string;
};
