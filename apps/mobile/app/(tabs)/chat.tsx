import { ChatConversation } from '@/components/chat/ChatConversation';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { cityFromLocation, groupRoomId } from '@/utils/city';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatTabScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { joinGroup } = useChat();
  const city = profile?.location ? cityFromLocation(profile.location) : '';
  const [roomId, setRoomId] = useState<string | null>(city ? groupRoomId(city) : null);
  const [joining, setJoining] = useState(Boolean(city));

  useEffect(() => {
    if (!user || !city) {
      setJoining(false);
      setRoomId(null);
      return;
    }

    let cancelled = false;
    setJoining(true);
    joinGroup(city)
      .then((result) => {
        if (!cancelled) {
          setRoomId(result.roomId);
        }
      })
      .catch((error) => {
        console.error('Error joining city chat:', error);
        if (!cancelled) {
          setRoomId(groupRoomId(city));
        }
      })
      .finally(() => {
        if (!cancelled) setJoining(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.uid, city, joinGroup]);

  if (!city) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center px-8" style={{ backgroundColor: theme.background }} edges={['top', 'left', 'right']}>
        <Ionicons name="location-outline" size={48} color={theme.border} />
        <ThemedText className="mt-3 text-center font-semibold">City not selected</ThemedText>
        <ThemedText className="text-center mt-1" style={{ color: theme.textSecondary }}>
          Finish your profile with a city to join the local chat.
        </ThemedText>
      </SafeAreaView>
    );
  }

  if (joining && !roomId) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: theme.background }} edges={['top', 'left', 'right']}>
        <ActivityIndicator color={theme.primary} />
        <ThemedText className="mt-3" style={{ color: theme.textSecondary }}>Opening city chat...</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }} edges={['top', 'left', 'right']}>
      <View className="flex-1">
        <ChatConversation roomId={roomId || groupRoomId(city)} title={`${city} City Chat`} />
      </View>
    </SafeAreaView>
  );
}
