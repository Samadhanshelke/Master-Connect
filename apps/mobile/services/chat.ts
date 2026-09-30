import { ChatGroup, ChatMessageRecord, MessageAttachmentRecord } from '@/types/chat';
import { groupRoomId } from '@/utils/city';
import { apiFetch, poll, Unsubscribe } from './api';

export { groupRoomId } from '@/utils/city';

export function subscribeToUserGroups(
  _uid: string,
  onChange: (groups: ChatGroup[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return poll(() => apiFetch<ChatGroup[]>('/v1/chat/rooms/mine'), onChange, onError);
}

export function subscribeToMessages(
  roomId: string,
  onChange: (messages: ChatMessageRecord[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return poll(
    () => apiFetch<ChatMessageRecord[]>(`/v1/chat/rooms/${roomId}/messages`),
    onChange,
    onError,
  );
}

export async function joinCityGroup(input: {
  uid: string;
  userName: string;
  city: string;
}): Promise<{ roomId: string; alreadyMember: boolean }> {
  const roomId = groupRoomId(input.city.trim());
  return apiFetch(`/v1/chat/rooms/${roomId}/join`, { method: 'POST', body: '{}' });
}

export async function sendChatMessage(input: {
  roomId: string;
  authorId: string;
  authorName: string;
  text: string;
  attachment?: MessageAttachmentRecord;
}): Promise<void> {
  await apiFetch(`/v1/chat/rooms/${input.roomId}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      text: input.text,
      authorName: input.authorName,
      ...(input.attachment ? { attachment: JSON.stringify(input.attachment) } : {}),
    }),
  });
}

export async function deleteChatMessage(roomId: string, messageId: string): Promise<void> {
  await apiFetch(`/v1/chat/rooms/${roomId}/messages/${messageId}`, { method: 'DELETE' });
}

export async function reportChatMessage(roomId: string, messageId: string, _uid: string): Promise<void> {
  await apiFetch(`/v1/chat/rooms/${roomId}/messages/${messageId}/report`, {
    method: 'POST',
    body: '{}',
  });
}

export async function voteOnPoll(
  roomId: string,
  messageId: string,
  optionIndex: number,
  _uid: string,
): Promise<void> {
  await apiFetch(`/v1/chat/rooms/${roomId}/messages/${messageId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ optionIndex }),
  });
}
