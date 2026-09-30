import { saveUserProfile, syncUserDocument, toProfile } from '@/services/users';
import { UserProfile } from '@/types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

export type { UserProfile };

type UserProfileContextType = {
  profile: UserProfile | null;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  isNewUser: boolean;
  hasSeenWelcome: boolean;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: (data: Omit<UserProfile, 'role'> & { role?: UserProfile['role'] }) => Promise<void>;
  markWelcomeSeen: () => Promise<void>;
  setIsNewUser: (isNew: boolean) => Promise<void>;
  clearUserData: () => Promise<void>;
};

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

const profileCacheKey = (uid: string) => `@app:user_profile:${uid}`;
const WELCOME_KEY = '@app:welcome_shown';

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [isNewUser, setIsNewUserState] = useState(false);

  useEffect(() => {
    const loadWelcome = async () => {
      try {
        const welcomeSeen = await AsyncStorage.getItem(WELCOME_KEY);
        setHasSeenWelcome(welcomeSeen === 'true');
      } catch (error) {
        console.error('Error loading welcome state:', error);
      }
    };

    loadWelcome();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      if (authLoading) {
        return;
      }

      if (!user) {
        setProfile(null);
        setHasCompletedOnboarding(false);
        setIsNewUserState(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const record = await syncUserDocument(user);
        if (cancelled) return;

        const mapped = toProfile(record);
        setProfile(mapped);
        setHasCompletedOnboarding(record.onboardingCompleted);
        setIsNewUserState(!record.onboardingCompleted);
        await AsyncStorage.setItem(profileCacheKey(user.uid), JSON.stringify(mapped));
      } catch (error) {
        console.error('Error loading profile:', error);

        try {
          const cached = await AsyncStorage.getItem(profileCacheKey(user.uid));
          if (cancelled) return;

          if (cached) {
            const mapped = JSON.parse(cached) as UserProfile;
            setProfile(mapped);
            const completed = Boolean(mapped.name && mapped.location);
            setHasCompletedOnboarding(completed);
            setIsNewUserState(!completed);
          } else {
            setProfile(null);
            setHasCompletedOnboarding(false);
            setIsNewUserState(true);
          }
        } catch (cacheError) {
          console.error('Error loading cached profile:', cacheError);
          if (!cancelled) {
            setProfile(null);
            setHasCompletedOnboarding(false);
            setIsNewUserState(true);
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) {
      throw new Error('You must be signed in to update your profile');
    }

    const record = await saveUserProfile(user.uid, data, profile);
    const mapped = toProfile(record);
    await AsyncStorage.setItem(profileCacheKey(user.uid), JSON.stringify(mapped));
    setProfile(mapped);
  };

  const completeOnboarding = async (data: Omit<UserProfile, 'role'> & { role?: UserProfile['role'] }) => {
    if (!user) {
      throw new Error('You must be signed in to complete onboarding');
    }

    const record = await saveUserProfile(
      user.uid,
      { ...data, role: data.role ?? 'citizen', onboardingCompleted: true },
      profile,
    );
    const mapped = toProfile(record);

    await Promise.all([
      AsyncStorage.setItem(profileCacheKey(user.uid), JSON.stringify(mapped)),
      AsyncStorage.setItem(WELCOME_KEY, 'true'),
    ]);

    setProfile(mapped);
    setHasCompletedOnboarding(true);
    setHasSeenWelcome(true);
    setIsNewUserState(false);
  };

  const markWelcomeSeen = async () => {
    try {
      await AsyncStorage.setItem(WELCOME_KEY, 'true');
      setHasSeenWelcome(true);
    } catch (error) {
      console.error('Error marking welcome seen:', error);
    }
  };

  const setIsNewUser = async (isNew: boolean) => {
    setIsNewUserState(isNew);
  };

  const clearUserData = async () => {
    try {
      if (user) {
        await AsyncStorage.removeItem(profileCacheKey(user.uid));
      }
      setProfile(null);
      setHasCompletedOnboarding(false);
      setIsNewUserState(false);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  };

  const value: UserProfileContextType = {
    profile,
    isLoading,
    hasCompletedOnboarding,
    isNewUser,
    hasSeenWelcome,
    updateProfile,
    completeOnboarding,
    markWelcomeSeen,
    setIsNewUser,
    clearUserData,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}
