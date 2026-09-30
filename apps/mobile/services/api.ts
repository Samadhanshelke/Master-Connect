import { getToken } from './session';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export type Unsubscribe = () => void;

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export function poll<T>(
  load: () => Promise<T>,
  onChange: (value: T) => void,
  onError?: (error: Error) => void,
  intervalMs = 4000,
): Unsubscribe {
  let stopped = false;
  const tick = async () => {
    try {
      const value = await load();
      if (!stopped) onChange(value);
    } catch (error) {
      if (!stopped) onError?.(error instanceof Error ? error : new Error('Request failed'));
    }
  };
  void tick();
  const timer = setInterval(() => {
    void tick();
  }, intervalMs);
  return () => {
    stopped = true;
    clearInterval(timer);
  };
}
