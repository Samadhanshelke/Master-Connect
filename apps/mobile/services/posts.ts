import { PostCommentRecord, PostRecord, PostVisibility } from '@/types/post';
import { formatRelativeTime } from '@/utils/time';
import { apiFetch, poll, Unsubscribe } from './api';

export type { Unsubscribe };

function mapPost(post: PostRecord): PostRecord {
  return {
    ...post,
    visibility: post.visibility === 'global' ? 'global' : 'local',
    comments: post.comments ?? [],
    likedBy: post.likedBy ?? [],
    likesCount: post.likesCount ?? 0,
  };
}

export function toPostData(
  record: PostRecord,
  uid?: string,
  followingIds: Set<string> = new Set(),
  bookmarkIds: Set<string> = new Set(),
) {
  return {
    id: record.id,
    authorId: record.authorId,
    user: record.authorName,
    avatar: null,
    time: formatRelativeTime(record.createdAt),
    content: record.content,
    likes: record.likesCount,
    comments: record.comments.map((comment: PostCommentRecord) => ({
      id: comment.id,
      user: comment.user,
      text: comment.text,
      time: formatRelativeTime(comment.createdAt),
    })),
    isLiked: uid ? record.likedBy.includes(uid) : false,
    isBookmarked: bookmarkIds.has(record.id),
    isFollowing: followingIds.has(record.authorId),
    attachment: record.attachment,
  };
}

export function subscribeToPosts(
  onChange: (posts: PostRecord[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return poll(async () => (await apiFetch<PostRecord[]>('/v1/posts')).map(mapPost), onChange, onError);
}

export function subscribeToAuthorPosts(
  authorId: string,
  onChange: (posts: PostRecord[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return poll(
    async () => (await apiFetch<PostRecord[]>(`/v1/posts?authorId=${encodeURIComponent(authorId)}`)).map(mapPost),
    onChange,
    onError,
  );
}

export function subscribeToCollectionIds(
  pathSegments: [string, string, string],
  onChange: (ids: Set<string>) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const kind = pathSegments[2];
  return poll(async () => {
    const social = await apiFetch<{ followingIds: string[]; followerIds: string[]; bookmarkIds: string[] }>(
      '/v1/users/me/social',
    );
    if (kind === 'following') return new Set(social.followingIds);
    if (kind === 'followers') return new Set(social.followerIds);
    return new Set(social.bookmarkIds);
  }, onChange, onError);
}

export async function getPostRecord(postId: string): Promise<PostRecord | null> {
  const post = await apiFetch<PostRecord | null>(`/v1/posts/${postId}`);
  return post ? mapPost(post) : null;
}

export function subscribeToPost(
  postId: string,
  onChange: (post: PostRecord | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return poll(() => getPostRecord(postId), onChange, onError);
}

export async function createPost(input: {
  authorId: string;
  authorName: string;
  content: string;
  visibility: PostVisibility;
  location: string;
  attachment?: PostRecord['attachment'];
}): Promise<string> {
  const post = await apiFetch<PostRecord>('/v1/posts', {
    method: 'POST',
    body: JSON.stringify({
      content: input.content,
      visibility: input.visibility,
      location: input.location,
      authorName: input.authorName,
      ...(input.attachment ? { attachment: JSON.stringify(input.attachment) } : {}),
    }),
  });
  return post.id;
}

export async function togglePostLike(postId: string, _uid: string, _isLiked: boolean) {
  await apiFetch(`/v1/posts/${postId}/like`, { method: 'POST', body: '{}' });
}

export async function addPostComment(
  postId: string,
  comment: { authorId: string; user: string; text: string },
): Promise<string> {
  const post = await apiFetch<PostRecord>(`/v1/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ text: comment.text }),
  });
  return post.comments[post.comments.length - 1]?.id || '';
}

export async function deletePost(postId: string) {
  await apiFetch(`/v1/posts/${postId}`, { method: 'DELETE' });
}

export async function reportPost(postId: string, _uid: string, extras?: { content?: string; authorId?: string }) {
  await apiFetch(`/v1/posts/${postId}/report`, {
    method: 'POST',
    body: JSON.stringify({ content: extras?.content || '' }),
  });
}

export async function toggleBookmark(_uid: string, postId: string, isBookmarked: boolean) {
  await apiFetch(`/v1/users/me/bookmarks/${postId}`, {
    method: 'POST',
    body: JSON.stringify({ active: !isBookmarked }),
  });
}

export async function toggleFollow(_uid: string, authorId: string, isFollowing: boolean) {
  await apiFetch(`/v1/users/me/follows/${authorId}`, {
    method: 'POST',
    body: JSON.stringify({ active: !isFollowing }),
  });
}

export type ModerationReport = {
  id: string;
  postId: string;
  reporterId: string;
  authorId: string;
  content: string;
  createdAt: string;
  status: 'open' | 'resolved';
};

export function subscribeToReports(
  onChange: (reports: ModerationReport[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return poll(() => apiFetch<ModerationReport[]>('/v1/reports'), onChange, onError);
}

export async function resolveReport(reportId: string) {
  await apiFetch(`/v1/reports/${reportId}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify({ deletePost: false }),
  });
}
