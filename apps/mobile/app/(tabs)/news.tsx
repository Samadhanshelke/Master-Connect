import { ThemedText } from '@/components/themed-text';
import { IconButton } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { fetchNews } from '@/services/news';
import { NewsArticle, NewsCategory } from '@/types/news';
import { formatRelativeTime } from '@/utils/time';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES: { id: NewsCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'general', label: 'Top Stories', icon: 'flame' },
  { id: 'business', label: 'Business', icon: 'briefcase' },
  { id: 'technology', label: 'Tech', icon: 'hardware-chip' },
  { id: 'sports', label: 'Sports', icon: 'football' },
  { id: 'entertainment', label: 'Entertainment', icon: 'film' },
  { id: 'health', label: 'Health', icon: 'fitness' },
];

export default function NewsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('general');
  const [showSearch, setShowSearch] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const abortRef = useRef<AbortController | null>(null);

  const loadNews = useCallback(async (
    category: NewsCategory,
    query: string,
    mode: 'initial' | 'refresh' = 'initial',
  ) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (mode === 'refresh') {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const articles = await fetchNews(category, {
        query: query.trim() || undefined,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setNews(articles);
    } catch (loadError) {
      if (controller.signal.aborted) return;
      console.error('Error fetching news:', loadError);
      setNews([]);
      setError('Could not load headlines. Pull to retry.');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 450);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    loadNews(selectedCategory, searchQuery);
    return () => abortRef.current?.abort();
  }, [selectedCategory, searchQuery, loadNews]);

  const onRefresh = () => {
    loadNews(selectedCategory, searchQuery, 'refresh');
  };

  const handleOpenArticle = (url: string) => {
    Linking.openURL(url);
  };

  const handleCloseSearch = () => {
    setShowSearch(false);
    setSearchInput('');
    setSearchQuery('');
  };

  const renderNewsCard = ({ item, index }: { item: NewsArticle; index: number }) => {
    if (index === 0) {
      return (
        <TouchableOpacity
          className="mb-4 rounded-2xl overflow-hidden"
          style={{ backgroundColor: theme.surface }}
          activeOpacity={0.9}
          onPress={() => handleOpenArticle(item.url)}
        >
          {item.urlToImage ? (
            <Image
              source={{ uri: item.urlToImage }}
              className="w-full h-48"
              resizeMode="cover"
            />
          ) : (
            <View
              className="w-full h-36 items-center justify-center"
              style={{ backgroundColor: theme.primary + '15' }}
            >
              <Ionicons name="newspaper" size={40} color={theme.primary} />
            </View>
          )}
          <View className="p-4">
            <View className="flex-row items-center gap-2 mb-2">
              <View
                className="px-2 py-0.5 rounded"
                style={{ backgroundColor: theme.primary + '20' }}
              >
                <ThemedText className="text-xs font-semibold" style={{ color: theme.primary }}>
                  {item.source.name}
                </ThemedText>
              </View>
              <ThemedText className="text-xs" style={{ color: theme.textSecondary }}>
                {formatRelativeTime(item.publishedAt)}
              </ThemedText>
            </View>
            <ThemedText className="text-lg font-bold mb-2" numberOfLines={2}>
              {item.title}
            </ThemedText>
            {item.description ? (
              <ThemedText className="text-sm" style={{ color: theme.textSecondary }} numberOfLines={2}>
                {item.description}
              </ThemedText>
            ) : null}
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        className="mb-3 rounded-xl overflow-hidden flex-row"
        style={{ backgroundColor: theme.surface }}
        activeOpacity={0.9}
        onPress={() => handleOpenArticle(item.url)}
      >
        <View className="flex-1 p-3">
          <View className="flex-row items-center gap-2 mb-1">
            <ThemedText className="text-xs font-medium" style={{ color: theme.primary }}>
              {item.source.name}
            </ThemedText>
            <ThemedText className="text-xs" style={{ color: theme.textSecondary }}>
              • {formatRelativeTime(item.publishedAt)}
            </ThemedText>
          </View>
          <ThemedText className="font-semibold text-[15px]" numberOfLines={3}>
            {item.title}
          </ThemedText>
        </View>
        {item.urlToImage ? (
          <Image
            source={{ uri: item.urlToImage }}
            className="w-24 h-24 rounded-lg m-2"
            resizeMode="cover"
          />
        ) : (
          <View
            className="w-24 h-24 rounded-lg m-2 items-center justify-center"
            style={{ backgroundColor: theme.primary + '12' }}
          >
            <Ionicons name="newspaper-outline" size={24} color={theme.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View className="flex-row justify-between items-center px-4 py-3 border-b" style={{ borderBottomColor: theme.border }}>
          {showSearch ? (
            <View className="flex-1 flex-row items-center gap-2">
              <TextInput
                autoFocus
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder="Search headlines..."
                placeholderTextColor={theme.textSecondary}
                className="flex-1 px-3 py-2 rounded-xl"
                style={{ backgroundColor: theme.surface, color: theme.text }}
                returnKeyType="search"
              />
              <IconButton icon="close" variant="ghost" size="md" onPress={handleCloseSearch} />
            </View>
          ) : (
            <>
              <ThemedText type="title" className="text-2xl" style={{ color: theme.primary }}>
                News
              </ThemedText>
              <IconButton icon="search-outline" variant="ghost" size="md" onPress={() => setShowSearch(true)} />
            </>
          )}
        </View>

      <View style={{ borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="flex-row items-center px-4 py-2 mr-2 rounded-full"
              style={{
                backgroundColor: selectedCategory === item.id && !searchQuery ? theme.primary : theme.surface,
                borderWidth: 1,
                borderColor: selectedCategory === item.id && !searchQuery ? theme.primary : theme.border,
              }}
              onPress={() => {
                setSelectedCategory(item.id);
                if (searchQuery) {
                  setSearchInput('');
                  setSearchQuery('');
                  setShowSearch(false);
                }
              }}
            >
              <Ionicons
                name={item.icon}
                size={16}
                color={selectedCategory === item.id && !searchQuery ? '#fff' : theme.textSecondary}
              />
              <ThemedText
                className="ml-1.5 font-medium text-[13px]"
                style={{ color: selectedCategory === item.id && !searchQuery ? '#fff' : theme.text }}
              >
                {item.label}
              </ThemedText>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText className="mt-4" style={{ color: theme.textSecondary }}>
            Loading news...
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={news}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          renderItem={renderNewsCard}
          ListEmptyComponent={
            <View className="items-center py-20 px-8">
              <Ionicons name="newspaper-outline" size={64} color={theme.border} />
              <ThemedText className="mt-4 text-lg font-medium">
                {error ? 'Unable to load news' : 'No news available'}
              </ThemedText>
              <ThemedText className="mt-2 text-center" style={{ color: theme.textSecondary }}>
                {error || 'Pull down to refresh'}
              </ThemedText>
              {error ? (
                <TouchableOpacity
                  className="mt-4 px-4 py-2 rounded-full"
                  style={{ backgroundColor: theme.primary }}
                  onPress={() => loadNews(selectedCategory, searchQuery)}
                >
                  <ThemedText className="font-semibold" style={{ color: '#fff' }}>Retry</ThemedText>
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />
      )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
