import React, { useEffect, useMemo, useState } from 'react';
import { View, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Avatar, IconButton } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';
import { subscribeToCollectionIds } from '@/services/posts';
import { getUsersByIds, ListedUser } from '@/services/users';

export default function UserListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const title = (params.title as string) || 'Users';
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [userIds, setUserIds] = useState<Set<string>>(new Set());
  const [users, setUsers] = useState<ListedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const collectionName = title.toLowerCase().includes('follower') ? 'followers' : 'following';

  useEffect(() => {
    if (!user) {
      setUserIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    return subscribeToCollectionIds(
      ['users', user.uid, collectionName],
      (ids) => {
        setUserIds(ids);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading user list:', error);
        setLoading(false);
      },
    );
  }, [user?.uid, collectionName]);

  useEffect(() => {
    let cancelled = false;
    const loadUsers = async () => {
      try {
        const next = await getUsersByIds([...userIds]);
        if (!cancelled) setUsers(next);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, [userIds]);

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.location.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [users, searchQuery],
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center px-4 py-3 border-b gap-3" style={{ borderBottomColor: theme.border }}>
        <IconButton icon="arrow-back" variant="ghost" onPress={() => router.back()} />
        <ThemedText type="subtitle">{title}</ThemedText>
      </View>
      
      <View 
        className="flex-row items-center px-4 py-2.5 mx-4 mt-4 mb-2 rounded-xl border"
        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
      >
        <Ionicons name="search" size={20} color={theme.textSecondary} />
        <TextInput
          className="flex-1 ml-2 text-[15px]"
          style={{ color: theme.text }}
          placeholder={`Search ${title.toLowerCase()}...`}
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
             <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View className="items-center py-16">
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View className="items-center py-16 px-8">
              <Ionicons name="people-outline" size={48} color={theme.border} />
              <ThemedText className="mt-3" style={{ color: theme.textSecondary }}>
                No {title.toLowerCase()} yet
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <View
              className="flex-row items-center px-4 py-3 border-b" 
              style={{ borderBottomColor: theme.border, backgroundColor: theme.surface }}
            >
              <Avatar name={item.name} size="md" />
              <View className="ml-3 flex-1">
                <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                <ThemedText className="text-sm" style={{ color: theme.textSecondary }}>
                  {item.bio || item.location || item.email}
                </ThemedText>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
