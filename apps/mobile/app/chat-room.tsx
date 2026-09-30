import { ChatConversation } from '@/components/chat/ChatConversation';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatRoomScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const id = typeof params.id === 'string' ? params.id : '';
  const name = typeof params.name === 'string' ? params.name : 'City Chat';

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }} edges={['top', 'left', 'right']}>
      <ChatConversation roomId={id} title={name} showBack onBack={() => router.back()} />
    </SafeAreaView>
  );
}
