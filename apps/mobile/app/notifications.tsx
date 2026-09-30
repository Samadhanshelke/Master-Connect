import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useNotifications } from '@/context/NotificationsContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { NotificationRecord, NotificationType } from '@/types/notification';
import { formatRelativeTime } from '@/utils/time';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function NotificationsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'like': return 'heart';
      case 'comment': return 'chatbubble';
      case 'follow': return 'person-add';
      case 'mention': return 'at';
      case 'system': return 'notifications';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'like': return '#E91E63';
      case 'comment': return '#2196F3';
      case 'follow': return '#4CAF50';
      case 'mention': return '#FF9800';
      case 'system': return theme.primary;
      default: return theme.primary;
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking notifications read:', error);
      Toast.show({ type: 'error', text1: 'Could not mark notifications as read' });
    }
  };

  const handlePress = async (item: NotificationRecord) => {
    try {
      await markAsRead(item.id);
    } catch (error) {
      console.error('Error marking notification read:', error);
    }

    if (item.postId && (item.type === 'like' || item.type === 'comment' || item.type === 'mention')) {
      router.push({ pathname: '/post-details', params: { postId: item.postId } });
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }} edges={['top', 'left', 'right']}>
      <View
        className="flex-row items-center justify-between px-4 py-3 border-b"
        style={{ borderBottomColor: theme.border }}
      >
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <ThemedText type="title" className="text-xl">
            Notifications
          </ThemedText>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAll}>
            <ThemedText className="text-sm font-medium" style={{ color: theme.primary }}>
              Mark all read
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Ionicons name="notifications-outline" size={64} color={theme.border} />
              <ThemedText className="mt-4 text-lg font-medium">
                No notifications yet
              </ThemedText>
              <ThemedText className="mt-2 text-center" style={{ color: theme.textSecondary }}>
                When you get likes, comments, or followers, they will show up here
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              className="flex-row items-start gap-3 py-3 px-3 rounded-xl mb-2"
              style={{
                backgroundColor: item.isRead ? 'transparent' : theme.primary + '10',
              }}
              onPress={() => handlePress(item)}
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: getNotificationColor(item.type) + '20' }}
              >
                <Ionicons
                  name={getNotificationIcon(item.type)}
                  size={22}
                  color={getNotificationColor(item.type)}
                />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-1">
                  <ThemedText className="font-semibold text-[15px]">{item.actorName}</ThemedText>
                  {!item.isRead && (
                    <View
                      className="w-2 h-2 rounded-full ml-1"
                      style={{ backgroundColor: theme.primary }}
                    />
                  )}
                </View>
                <ThemedText className="text-[14px] mt-0.5" style={{ color: theme.textSecondary }}>
                  {item.message}
                </ThemedText>
                <ThemedText className="text-xs mt-1" style={{ color: theme.textSecondary }}>
                  {formatRelativeTime(item.createdAt)}
                </ThemedText>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
