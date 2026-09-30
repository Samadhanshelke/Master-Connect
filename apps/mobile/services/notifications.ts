import { NotificationRecord } from '@/types/notification';
import { apiFetch, poll, Unsubscribe } from './api';

export function likeNotificationId(postId: string, actorId: string) {
  return `like_${postId}_${actorId}`;
}

export function commentNotificationId(postId: string, commentId: string) {
  return `comment_${postId}_${commentId}`;
}

export function followNotificationId(actorId: string) {
  return `follow_${actorId}`;
}

export function mentionNotificationId(postId: string, recipientId: string) {
  return `mention_${postId}_${recipientId}`;
}

export function subscribeToNotifications(
  _uid: string,
  onChange: (notifications: NotificationRecord[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return poll(() => apiFetch<NotificationRecord[]>('/v1/notifications'), onChange, onError);
}

export async function upsertNotification(
  notificationId: string,
  input: Omit<NotificationRecord, 'id' | 'createdAt' | 'isRead'> & { isRead?: boolean },
) {
  await apiFetch('/v1/notifications', {
    method: 'POST',
    body: JSON.stringify({
      clientKey: notificationId,
      type: input.type,
      recipientId: input.recipientId,
      message: input.message,
      postId: input.postId,
    }),
  });
}

export async function deleteNotification(_recipientId: string, notificationId: string) {
  await apiFetch(`/v1/notifications/${notificationId}`, { method: 'DELETE' });
}

export async function markNotificationRead(_uid: string, notificationId: string) {
  await apiFetch(`/v1/notifications/${notificationId}/read`, { method: 'PATCH', body: '{}' });
}

export async function markAllNotificationsRead(_uid: string, _notificationIds: string[]) {
  await apiFetch('/v1/notifications/read-all', { method: 'PATCH', body: '{}' });
}

export async function ensureWelcomeNotification(_uid: string) {
  await apiFetch('/v1/notifications/welcome', { method: 'POST', body: '{}' });
}
