import { apiFetch } from './api';
import { UserProfile, UserRecord, UserRole } from '@/types/user';
import { SessionUser } from './session';

export type ListedUser = UserProfile & { id: string };

type ApiUser = {
  id: string;
  email: string;
  name: string;
  location: string;
  bio: string;
  role: UserRole;
  onboardingCompleted: boolean;
  createdAt: string;
};

function mentionKey(value: string) {
  return value.split(/\s+/)[0]?.replace(/^@/, '').toLowerCase() || '';
}

function toRecord(user: ApiUser): UserRecord {
  return {
    email: user.email,
    name: user.name,
    location: user.location,
    bio: user.bio,
    role: user.role,
    onboardingCompleted: user.onboardingCompleted,
    createdAt: user.createdAt,
    updatedAt: user.createdAt,
  };
}

function toListed(user: ApiUser): ListedUser {
  return {
    id: user.id,
    name: user.name || user.email.split('@')[0] || 'User',
    email: user.email,
    location: user.location,
    bio: user.bio,
    createdAt: user.createdAt,
    role: user.role,
  };
}

export async function getUsersByIds(ids: string[]): Promise<ListedUser[]> {
  const uniqueIds = new Set(ids.filter(Boolean));
  if (uniqueIds.size === 0) return [];
  const users = await apiFetch<ApiUser[]>('/v1/users');
  return users.filter((user) => uniqueIds.has(user.id)).map(toListed);
}

export async function findUsersByMentions(handles: string[]): Promise<ListedUser[]> {
  const wanted = new Set(handles.map((handle) => handle.replace(/^@/, '').toLowerCase()).filter(Boolean));
  if (wanted.size === 0) return [];
  const users = await apiFetch<ApiUser[]>('/v1/users');
  return users.map(toListed).filter((user) => {
    return wanted.has(mentionKey(user.name)) || wanted.has(mentionKey(user.email.split('@')[0] || ''));
  });
}

export function toProfile(record: UserRecord): UserProfile {
  return {
    name: record.name,
    email: record.email,
    location: record.location,
    bio: record.bio,
    createdAt: record.createdAt,
    role: record.role,
  };
}

export async function syncUserDocument(user: SessionUser): Promise<UserRecord> {
  const profile = await apiFetch<ApiUser>('/v1/auth/me');
  return toRecord({ ...profile, name: profile.name || user.displayName || '' });
}

export async function saveUserProfile(
  _uid: string,
  updates: Partial<UserProfile> & { onboardingCompleted?: boolean },
  existing?: UserRecord | UserProfile | null,
): Promise<UserRecord> {
  const profile = await apiFetch<ApiUser>('/v1/users/me', {
    method: 'PATCH',
    body: JSON.stringify({
      name: updates.name ?? existing?.name,
      location: updates.location ?? existing?.location,
      bio: updates.bio ?? existing?.bio,
      ...(updates.onboardingCompleted !== undefined
        ? { onboardingCompleted: updates.onboardingCompleted }
        : {}),
    }),
  });
  return toRecord(profile);
}
