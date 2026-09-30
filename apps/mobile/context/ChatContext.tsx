import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { joinCityGroup, subscribeToUserGroups } from '@/services/chat';
import { ChatGroup } from '@/types/chat';
import { cityFromLocation } from '@/utils/city';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type ChatContextType = {
  groups: ChatGroup[];
  cityGroup: ChatGroup | null;
  loading: boolean;
  joinGroup: (city: string) => Promise<{ roomId: string; alreadyMember: boolean }>;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubGroups = subscribeToUserGroups(user.uid, (next) => {
      setGroups(next);
      setLoading(false);
    }, (error) => {
      console.error('Error loading groups:', error);
      setLoading(false);
    });

    return () => {
      unsubGroups();
    };
  }, [user]);

  const cityGroup = useMemo(() => {
    const city = profile?.location ? cityFromLocation(profile.location) : '';
    if (!city) return groups[0] ?? null;
    return groups.find((group) => group.city.toLowerCase() === city.toLowerCase()) ?? groups[0] ?? null;
  }, [groups, profile?.location]);

  const joinGroup = useCallback(async (city: string) => {
    if (!user) throw new Error('You must be signed in');
    return joinCityGroup({
      uid: user.uid,
      userName: profile?.name || user.email?.split('@')[0] || 'User',
      city,
    });
  }, [user, profile?.name]);

  return (
    <ChatContext.Provider
      value={{
        groups,
        cityGroup,
        loading,
        joinGroup,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
