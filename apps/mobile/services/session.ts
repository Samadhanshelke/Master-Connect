import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'mc_token';
const USER_KEY = 'mc_user';

export type SessionUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

type Listener = (user: SessionUser | null) => void;
const listeners = new Set<Listener>();

function emit(user: SessionUser | null) {
  listeners.forEach((listener) => listener(user));
}

export function subscribeSession(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function loadSession(): Promise<SessionUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as SessionUser;
}

export async function saveSession(token: string, user: SessionUser) {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
  emit(user);
}

export async function clearSession() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  emit(null);
}
