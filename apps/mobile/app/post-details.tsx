import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  Text,
  Linking,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { IconButton, Avatar } from '@/components/ui';
import { Colors } from '@/constants/theme'
import { useAuth } from '@/context/AuthContext';
import { usePosts } from '@/context/PostsContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLanguage } from '@/context/LanguageContext';
import { sharePostText } from '@/utils/share';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PostDetailsScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { i18n } = useLanguage();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { getPost, loading, toggleLike, toggleBookmark, addComment } = usePosts();

  const post = postId ? getPost(postId) : undefined;
  const [newComment, setNewComment] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        if (Platform.OS === 'android') {
          setKeyboardHeight(e.endCoordinates.height);
        }
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  if (!post) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: theme.background }}>
        {loading ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          <ThemedText>Post not found</ThemedText>
        )}
      </SafeAreaView>
    );
  }

  const handleLike = async () => {
    try {
      await toggleLike(post.id);
    } catch (error) {
      console.error('Error liking post:', error);
      Toast.show({ type: 'error', text1: 'Could not update like' });
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await addComment(post.id, newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      Toast.show({ type: 'error', text1: 'Could not add comment' });
    }
  };

  const handleBookmark = async () => {
    try {
      await toggleBookmark(post.id);
    } catch (error) {
      console.error('Error bookmarking post:', error);
      Toast.show({ type: 'error', text1: 'Could not save post' });
    }
  };

  const handleImageScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (SCREEN_WIDTH - 32));
    setCurrentImageIndex(index);
  };

  // Parse content for @mentions and URLs
  const parseContent = (text: string) => {
    const combinedRegex = /(@\w+|https?:\/\/[^\s]+|www\.[^\s]+)/g;
    const parts = text.split(combinedRegex);
    
    return parts.map((part, index) => {
      if (!part) return null;
      
      // Check if it's a mention
      if (part.match(/^@\w+$/)) {
        const username = part.slice(1);
        return (
          <Text
            key={index}
            style={{ color: theme.primary, fontWeight: '600' }}
            onPress={() => {
              Toast.show({
                type: 'info',
                text1: `@${username} tapped`,
                text2: 'Navigate to user profile',
                position: 'top',
                visibilityTime: 2000,
              });
            }}
          >
            {part}
          </Text>
        );
      }
      
      // Check if it's a URL
      if (part.match(/^(https?:\/\/|www\.)/)) {
        const url = part.startsWith('www.') ? `https://${part}` : part;
        return (
          <Text
            key={index}
            style={{ color: '#3B82F6', textDecorationLine: 'underline' }}
            onPress={() => {
              Linking.openURL(url).catch(() => {});
            }}
          >
            {part}
          </Text>
        );
      }
      
      return <Text key={index}>{part}</Text>;
    });
  };

  const renderAttachment = () => {
    if (!post.attachment) return null;

    switch (post.attachment.type) {
      case 'image':
        return (
          <Image 
            source={{ uri: post.attachment.url }}
            className="w-full h-[250px] rounded-xl mb-4"
            resizeMode="cover"
          />
        );
      case 'images':
        const imageCount = post.attachment.urls?.length || 0;
        return (
          <View className="mb-4">
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleImageScroll}
              scrollEventThrottle={16}
            >
              {post.attachment.urls?.map((url, idx) => (
                <Image 
                  key={idx}
                  source={{ uri: url }}
                  style={{ 
                    width: SCREEN_WIDTH - 32, 
                    marginRight: idx < imageCount - 1 ? 8 : 0,
                  }}
                  className="h-[250px] rounded-xl"
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            <View className="flex-row justify-center mt-2 gap-1.5">
              {post.attachment.urls?.map((_, idx) => (
                <View 
                  key={idx}
                  className="h-1.5 rounded-full"
                  style={{
                    width: currentImageIndex === idx ? 16 : 6,
                    backgroundColor: currentImageIndex === idx ? theme.primary : theme.border,
                  }}
                />
              ))}
            </View>
          </View>
        );
      case 'poll':
        const totalVotes = post.attachment.pollOptions?.reduce((sum, opt) => sum + opt.votes, 0) || 0;
        return (
          <View className="mb-4">
            {post.attachment.pollOptions?.map((option, idx) => {
              const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
              return (
                <TouchableOpacity
                  key={idx}
                  className="rounded-lg p-3 mb-2 overflow-hidden border"
                  style={{ backgroundColor: theme.surface, borderColor: theme.border }}
                >
                  <View 
                    className="absolute left-0 top-0 bottom-0"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: theme.primary + '20',
                    }}
                  />
                  <View className="flex-row justify-between">
                    <ThemedText>{option.text}</ThemedText>
                    <ThemedText style={{ color: theme.textSecondary }}>
                      {Math.round(percentage)}%
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              );
            })}
            <ThemedText className="text-xs mt-1" style={{ color: theme.textSecondary }}>
              {totalVotes} votes
            </ThemedText>
          </View>
        );
      case 'document':
        return (
          <TouchableOpacity
            className="flex-row items-center rounded-xl p-3 mb-4 gap-3 border"
            style={{ backgroundColor: theme.surface, borderColor: theme.border }}
            onPress={() => post.attachment?.url && Linking.openURL(post.attachment.url).catch(() => {})}
          >
            <View 
              className="w-11 h-11 rounded-lg items-center justify-center"
              style={{ backgroundColor: theme.error + '20' }}
            >
              <Ionicons name="document-text" size={24} color={theme.error} />
            </View>
            <View className="flex-1">
              <ThemedText className="font-semibold">{post.attachment.fileName}</ThemedText>
              <ThemedText className="text-xs" style={{ color: theme.textSecondary }}>Tap to view</ThemedText>
            </View>
            <Ionicons name="download-outline" size={22} color={theme.primary} />
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }}>
      {/* Header */}
      <View 
        className="flex-row items-center px-4 py-3 border-b"
        style={{ borderBottomColor: theme.border }}
      >
        <IconButton icon="arrow-back" variant="ghost" onPress={() => router.back()} />
        <ThemedText type="subtitle" className="ml-3 flex-1">Post</ThemedText>
        <IconButton
          icon="share-social-outline"
          variant="ghost"
          onPress={() => sharePostText({ user: post.user, content: post.content }).catch(() => {
            Toast.show({ type: 'error', text1: 'Could not share post' });
          })}
        />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Post Author */}
          <View className="flex-row items-center gap-3 mb-4">
            <Avatar name={post.user} size="lg" />
            <View className="flex-1">
              <ThemedText type="defaultSemiBold" className="text-lg">{post.user}</ThemedText>
              <ThemedText className="text-sm" style={{ color: theme.textSecondary }}>{post.time}</ThemedText>
            </View>
          </View>

          {/* Post Content */}
          <Text className="text-[16px] leading-[26px] mb-4" style={{ color: theme.text }}>
            {parseContent(post.content)}
          </Text>

          {/* Attachment */}
          {renderAttachment()}

          {/* Actions */}
          <View 
            className="flex-row py-3 border-t border-b justify-between mb-4" 
            style={{ borderColor: theme.border }}
          >
            <View className="flex-row gap-6">
              <TouchableOpacity 
                className="flex-row items-center gap-2"
                onPress={handleLike}
              >
                <Ionicons 
                  name={post.isLiked ? "heart" : "heart-outline"} 
                  size={24} 
                  color={post.isLiked ? theme.error : theme.textSecondary} 
                />
                <ThemedText style={{ color: theme.textSecondary }}>
                  {post.likes}
                </ThemedText>
              </TouchableOpacity>

              <View className="flex-row items-center gap-2">
                <Ionicons name="chatbubble-outline" size={22} color={theme.textSecondary} />
                <ThemedText style={{ color: theme.textSecondary }}>{post.comments.length}</ThemedText>
              </View>
            </View>

            <TouchableOpacity onPress={handleBookmark}>
              <Ionicons 
                name={post.isBookmarked ? "bookmark" : "bookmark-outline"} 
                size={24} 
                color={post.isBookmarked ? theme.primary : theme.textSecondary} 
              />
            </TouchableOpacity>
          </View>

          {/* Comments Section */}
          <ThemedText type="subtitle" className="mb-4">
            Comments ({post.comments.length})
          </ThemedText>

          {post.comments.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="chatbubble-outline" size={48} color={theme.border} />
              <ThemedText className="mt-3" style={{ color: theme.textSecondary }}>
                No comments yet
              </ThemedText>
              <ThemedText className="text-[13px]" style={{ color: theme.textSecondary }}>
                Be the first to comment!
              </ThemedText>
            </View>
          ) : (
            <View className="gap-4">
              {post.comments.map((comment) => (
                <View key={comment.id} className="flex-row gap-3">
                  <Avatar name={comment.user} size="sm" />
                  <View className="flex-1 rounded-xl p-3" style={{ backgroundColor: theme.surface }}>
                    <View className="flex-row items-center gap-2 mb-1">
                      <ThemedText className="font-semibold">{comment.user}</ThemedText>
                      <ThemedText className="text-xs" style={{ color: theme.textSecondary }}>
                        {comment.time}
                      </ThemedText>
                    </View>
                    <ThemedText>{comment.text}</ThemedText>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Comment Input */}
        <View 
          className="flex-row items-center p-4 border-t gap-3"
          style={{ borderTopColor: theme.border, backgroundColor: theme.background, paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }}
        >
          <Avatar name={profile?.name || user?.email || 'You'} size="sm" />
          <TextInput
            className="flex-1 rounded-full px-4 py-2.5 border"
            style={{
              backgroundColor: theme.surface,
              color: theme.text,
              borderColor: theme.border,
            }}
            placeholder="Add a comment..."
            placeholderTextColor={theme.textSecondary}
            value={newComment}
            onChangeText={setNewComment}
          />
          <TouchableOpacity 
            onPress={handleAddComment}
            disabled={!newComment.trim()}
          >
            <Ionicons 
              name="send" 
              size={24} 
              color={newComment.trim() ? theme.primary : theme.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
