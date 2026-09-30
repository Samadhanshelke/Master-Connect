import React, { useRef } from 'react';
import { View, TouchableOpacity, Animated, Image, ScrollView, Dimensions, Text, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconButton } from './IconButton';
import { Avatar } from './Avatar';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLanguage } from '@/context/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type PostAttachment = {
  type: 'image' | 'images' | 'poll' | 'document';
  url?: string;
  urls?: string[];
  pollOptions?: { text: string; votes: number }[];
  fileName?: string;
};

export type PostData = {
  id: string;
  authorId: string;
  user: string;
  avatar: null;
  time: string;
  content: string;
  likes: number;
  comments: { id: string; user: string; text: string; time: string }[];
  isLiked: boolean;
  isBookmarked: boolean;
  isFollowing: boolean;
  attachment?: PostAttachment;
};

type PostCardProps = {
  post: PostData;
  onLike?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onFollow?: (postId: string) => void;
  onComment?: (post: PostData) => void;
  onMenuPress?: (postId: string) => void;
  onReadMore?: (post: PostData) => void;
  onMentionPress?: (username: string) => void;
  onLinkPress?: (url: string) => void;
  showFollowButton?: boolean;
  showMenu?: boolean;
  currentImageIndex?: { [key: string]: number };
  onImageScroll?: (postId: string, event: any) => void;
};

export function PostCard({
  post,
  onLike,
  onBookmark,
  onFollow,
  onComment,
  onMenuPress,
  onReadMore,
  onMentionPress,
  onLinkPress,
  showFollowButton = true,
  showMenu = true,
  currentImageIndex = {},
  onImageScroll,
}: PostCardProps) {
  
  const { i18n } = useLanguage();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  const heartScale = useRef(new Animated.Value(1)).current;

  // Parse content for @mentions and URLs
  const parseContent = (text: string) => {
    // Regex patterns
    const mentionRegex = /@(\w+)/g;
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
    
    // Combined pattern to split text
    const combinedRegex = /(@\w+|https?:\/\/[^\s]+|www\.[^\s]+)/g;
    
    const parts = text.split(combinedRegex);
    
    return parts.map((part, index) => {
      if (!part) return null;
      
      // Check if it's a mention
      if (part.match(/^@\w+$/)) {
        const username = part.slice(1); // Remove @ symbol
        return (
          <Text
            key={index}
            style={{ color: theme.primary, fontWeight: '600' }}
            onPress={() => onMentionPress?.(username)}
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
              if (onLinkPress) {
                onLinkPress(url);
              } else {
                Linking.openURL(url).catch(() => {});
              }
            }}
          >
            {part}
          </Text>
        );
      }
      
      // Regular text
      return <Text key={index}>{part}</Text>;
    });
  };

  const handleLikePress = () => {
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.4, duration: 100, useNativeDriver: true }),
      Animated.timing(heartScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    
    onLike?.(post.id);
  };

  const renderAttachment = () => {
    if (!post.attachment) return null;

    switch (post.attachment.type) {
      case 'image':
        return (
          <Image 
            source={{ uri: post.attachment.url }}
            className="w-full h-[200px] rounded-xl mb-3"
            resizeMode="cover"
          />
        );
      case 'images':
        const imageCount = post.attachment.urls?.length || 0;
        const currentIdx = currentImageIndex[post.id] || 0;
        return (
          <View className="mb-3">
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) => onImageScroll?.(post.id, e)}
              scrollEventThrottle={16}
            >
              {post.attachment.urls?.map((url, idx) => (
                <Image 
                  key={idx}
                  source={{ uri: url }}
                  style={{ 
                    width: SCREEN_WIDTH - 64, 
                    marginRight: idx < imageCount - 1 ? 8 : 0,
                  }}
                  className="h-[200px] rounded-xl"
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
                    width: currentIdx === idx ? 16 : 6,
                    backgroundColor: currentIdx === idx ? theme.primary : theme.border,
                  }}
                />
              ))}
            </View>
          </View>
        );
      case 'poll':
        const totalVotes = post.attachment.pollOptions?.reduce((sum, opt) => sum + opt.votes, 0) || 0;
        return (
          <View className="mb-3">
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
            className="flex-row items-center rounded-xl p-3 mb-3 gap-3 border"
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
    <ThemedView 
      className="rounded-xl p-4 mb-3 border" 
      style={{ backgroundColor: theme.surface, borderColor: theme.border }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-3">
          <Avatar name={post.user} size="md" />
          <View>
            <View className="flex-row items-center gap-2">
              <ThemedText type="defaultSemiBold">{post.user}</ThemedText>
              {showFollowButton && (
                <TouchableOpacity onPress={() => onFollow?.(post.id)}>
                  <ThemedText 
                    className="text-[13px] font-semibold"
                    style={{ color: post.isFollowing ? theme.textSecondary : theme.primary }}
                  >
                    {post.isFollowing ? i18n.common.following : i18n.common.follow}
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
            <ThemedText className="text-xs -mt-1" style={{ color: theme.textSecondary }}>{post.time}</ThemedText>
          </View>
        </View>
        {showMenu && (
          <IconButton 
            icon="ellipsis-horizontal" 
            variant="ghost" 
            size="sm" 
            onPress={() => onMenuPress?.(post.id)}
          />
        )}
      </View>

      {/* Content */}
      <TouchableOpacity onPress={() => onReadMore?.(post)} activeOpacity={0.7}>
        <Text 
          className="mb-2 leading-[22px]" 
          numberOfLines={3}
          style={{ color: theme.text, fontSize: 15 }}
        >
          {parseContent(post.content)}
        </Text>
        {post.content.length > 100 && (
          <ThemedText 
            className="text-[14px] font-semibold mb-3" 
            style={{ color: theme.primary }}
          >
            Read More
          </ThemedText>
        )}
      </TouchableOpacity>

      {/* Attachment */}
      {renderAttachment()}

      {/* Actions */}
      <View className="flex-row pt-3 border-t justify-between" style={{ borderTopColor: theme.border }}>
        <View className="flex-row gap-4">
          <TouchableOpacity 
            className="flex-row items-center gap-1.5"
            onPress={handleLikePress}
          >
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons 
                name={post.isLiked ? "heart" : "heart-outline"} 
                size={22} 
                color={post.isLiked ? theme.error : theme.textSecondary} 
              />
            </Animated.View>
            <ThemedText style={{ color: theme.textSecondary }}>
              {post.likes}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-row items-center gap-1.5"
            onPress={() => onComment?.(post)}
          >
            <Ionicons name="chatbubble-outline" size={20} color={theme.textSecondary} />
            <ThemedText style={{ color: theme.textSecondary }}>{post.comments.length}</ThemedText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => onBookmark?.(post.id)}>
          <Ionicons 
            name={post.isBookmarked ? "bookmark" : "bookmark-outline"} 
            size={22} 
            color={post.isBookmarked ? theme.primary : theme.textSecondary} 
          />
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}
