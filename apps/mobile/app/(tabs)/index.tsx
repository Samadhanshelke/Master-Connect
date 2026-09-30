import React, { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, Dimensions, BackHandler, Keyboard, Image, ActivityIndicator, ScrollView, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { IconButton, Avatar, PostCard, PostData, Button, TextArea, Divider } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useBanners } from '@/context/BannersContext';
import { useNotifications } from '@/context/NotificationsContext';
import { usePosts } from '@/context/PostsContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { pickDocument, pickImages, PickedFile, uploadFile } from '@/services/media';
import { sharePostText } from '@/utils/share';
import { PostRecord } from '@/types/post';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function FeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { i18n } = useLanguage();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const {
    posts,
    loading,
    createPost,
    toggleLike,
    toggleBookmark,
    toggleFollow,
    addComment,
    deletePost,
    reportPost,
  } = usePosts();
  const { unreadCount } = useNotifications();
  const { todayBanner } = useBanners();
  
  const [showComments, setShowComments] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const [newComment, setNewComment] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: string]: number }>({});
  
  // Create Post Modal State
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedTag, setSelectedTag] = useState<'local' | 'global'>('local');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Post Options Menu State
  const [showPostOptions, setShowPostOptions] = useState(false);
  const [selectedPostForMenu, setSelectedPostForMenu] = useState<PostData | null>(null);
  const [posting, setPosting] = useState(false);
  const [pendingImages, setPendingImages] = useState<PickedFile[]>([]);
  const [pendingDocument, setPendingDocument] = useState<PickedFile | null>(null);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  
  const isOwnPost = (post: PostData) => post.authorId === user?.uid;

  useEffect(() => {
    if (!selectedPost) return;
    const updated = posts.find((post) => post.id === selectedPost.id);
    if (updated) {
      setSelectedPost(updated);
    }
  }, [posts, selectedPost?.id]);

  // Track keyboard height for Create Post modal
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
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

  // Handle Android back button for comments modal
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showComments) {
        setShowComments(false);
        return true; // Prevent default back behavior
      }
      return false; // Let default back behavior happen
    });

    return () => backHandler.remove();
  }, [showComments]);

  const resetComposer = () => {
    setNewPostContent('');
    setPendingImages([]);
    setPendingDocument(null);
    setPollQuestion('');
    setPollOptions(['', '']);
  };

  const handlePickImages = async () => {
    try {
      const files = await pickImages(4);
      if (files.length === 0) return;
      setPendingImages(files);
      setPendingDocument(null);
      setPollQuestion('');
      setPollOptions(['', '']);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: error instanceof Error ? error.message : 'Could not pick images',
      });
    }
  };

  const handlePickDocument = async () => {
    try {
      const file = await pickDocument();
      if (!file) return;
      setPendingDocument(file);
      setPendingImages([]);
      setPollQuestion('');
      setPollOptions(['', '']);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: error instanceof Error ? error.message : 'Could not pick document',
      });
    }
  };

  const handleSavePoll = () => {
    if (!pollQuestion.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter a poll question' });
      return;
    }
    const validOptions = pollOptions.filter((option) => option.trim());
    if (validOptions.length < 2) {
      Toast.show({ type: 'error', text1: 'Add at least 2 options' });
      return;
    }
    setPendingImages([]);
    setPendingDocument(null);
    setShowPollModal(false);
  };

  const handleCreatePost = async () => {
    const validPollOptions = pollOptions.filter((option) => option.trim());
    const hasPoll = Boolean(pollQuestion.trim()) && validPollOptions.length >= 2;
    if (!newPostContent.trim() && pendingImages.length === 0 && !pendingDocument && !hasPoll) {
      Toast.show({ type: 'error', text1: i18n.createPost?.emptyError || 'Please write something' });
      return;
    }
    if (!user) {
      Toast.show({ type: 'error', text1: 'You must be signed in to post' });
      return;
    }

    try {
      setPosting(true);
      let attachment: PostRecord['attachment'] | undefined;

      if (pendingImages.length === 1) {
        const url = await uploadFile(user.uid, pendingImages[0], 'posts');
        attachment = { type: 'image', url };
      } else if (pendingImages.length > 1) {
        const urls = await Promise.all(pendingImages.map((file) => uploadFile(user.uid, file, 'posts')));
        attachment = { type: 'images', urls };
      } else if (pendingDocument) {
        const url = await uploadFile(user.uid, pendingDocument, 'posts');
        attachment = { type: 'document', url, fileName: pendingDocument.name };
      } else if (hasPoll) {
        attachment = {
          type: 'poll',
          pollOptions: validPollOptions.map((text) => ({ text: text.trim(), votes: 0 })),
        };
      }

      await createPost(newPostContent.trim() || pollQuestion.trim(), selectedTag, attachment);
      resetComposer();
      setShowCreatePost(false);
      Toast.show({ type: 'success', text1: i18n.createPost?.success || 'Post created!' });
    } catch (error) {
      console.error('Error creating post:', error);
      Toast.show({ type: 'error', text1: 'Failed to create post' });
    } finally {
      setPosting(false);
    }
  };


  const handleLike = async (postId: string) => {
    try {
      await toggleLike(postId);
    } catch (error) {
      console.error('Error liking post:', error);
      Toast.show({ type: 'error', text1: 'Could not update like' });
    }
  };

  const handleBookmark = async (postId: string) => {
    try {
      await toggleBookmark(postId);
    } catch (error) {
      console.error('Error bookmarking post:', error);
      Toast.show({ type: 'error', text1: 'Could not save post' });
    }
  };

  const handleFollow = async (postId: string) => {
    try {
      await toggleFollow(postId);
    } catch (error) {
      console.error('Error following user:', error);
      Toast.show({ type: 'error', text1: 'Could not update follow' });
    }
  };

  const openComments = (post: PostData) => {
    setSelectedPost(post);
    setShowComments(true);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost) return;

    try {
      await addComment(selectedPost.id, newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      Toast.show({ type: 'error', text1: 'Could not add comment' });
    }
  };

  const handleImageScroll = (postId: string, event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (SCREEN_WIDTH - 32));
    setCurrentImageIndex(prev => ({ ...prev, [postId]: index }));
  };

  const handleReadMore = (post: PostData) => {
    router.push({ pathname: '/post-details', params: { postId: post.id } });
  };

  const handleMentionPress = (username: string) => {
    Toast.show({
      type: 'info',
      text1: `@${username} tapped`,
      text2: 'Navigate to user profile',
      position: 'top',
      visibilityTime: 2000,
    });
    // In a real app: router.push({ pathname: '/user-profile', params: { username } });
  };

  const handleLinkPress = (url: string) => {
    Toast.show({
      type: 'info',
      text1: 'Opening link',
      text2: url,
      position: 'top',
      visibilityTime: 2000,
    });
    // Link opens automatically via Linking.openURL in PostCard
  };

  const handleMenuPress = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setSelectedPostForMenu(post);
      setShowPostOptions(true);
    }
  };

  const handleReportPost = async () => {
    if (!selectedPostForMenu) return;
    try {
      await reportPost(selectedPostForMenu.id);
      setShowPostOptions(false);
      Toast.show({ type: 'success', text1: 'Post reported', text2: 'Thank you for helping keep our community safe' });
    } catch (error) {
      console.error('Error reporting post:', error);
      Toast.show({ type: 'error', text1: 'Could not report post' });
    }
  };

  const handleSharePost = async () => {
    if (!selectedPostForMenu) return;
    try {
      await sharePostText({ user: selectedPostForMenu.user, content: selectedPostForMenu.content });
      setShowPostOptions(false);
    } catch (error) {
      console.error('Error sharing post:', error);
      Toast.show({ type: 'error', text1: 'Could not share post' });
    }
  };

  const handleDeletePost = async () => {
    if (!selectedPostForMenu) return;
    try {
      await deletePost(selectedPostForMenu.id);
      setShowPostOptions(false);
      Toast.show({ type: 'success', text1: 'Post deleted' });
    } catch (error) {
      console.error('Error deleting post:', error);
      Toast.show({ type: 'error', text1: 'Could not delete post' });
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }} edges={['top', 'left', 'right']}>
      <View className="flex-row justify-between items-center px-4 py-3 border-b" style={{ borderBottomColor: theme.border }}>
        <ThemedText type="title" className="text-2xl" style={{ color: theme.primary }}>
          Master Connect
        </ThemedText>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-10 h-10 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={22} color={theme.text} />
            {unreadCount > 0 && (
              <View
                pointerEvents="none"
                className="absolute top-0.5 right-0.5 rounded-full items-center justify-center"
                style={{
                  backgroundColor: theme.error,
                  minWidth: 18,
                  height: 18,
                  paddingHorizontal: unreadCount > 9 ? 4 : 0,
                }}
              >
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: '700',
                    textAlign: 'center',
                    lineHeight: 12,
                    includeFontPadding: false,
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={posts}
        ListHeaderComponent={
          <View className="mb-4 rounded-2xl overflow-hidden">
            <Image
              source={todayBanner?.imageUri ? { uri: todayBanner.imageUri } : require('@/assets/images/banner.jpg')}
              className="w-full h-[160px]"
              resizeMode="cover"
            />
          </View>
        }
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center py-16">
            {loading ? (
              <ActivityIndicator color={theme.primary} />
            ) : (
              <>
                <Ionicons name="newspaper-outline" size={48} color={theme.border} />
                <ThemedText className="mt-3" style={{ color: theme.textSecondary }}>
                  No posts yet
                </ThemedText>
                <ThemedText className="text-[13px]" style={{ color: theme.textSecondary }}>
                  Be the first to share an update
                </ThemedText>
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onLike={handleLike}
            onBookmark={handleBookmark}
            onFollow={handleFollow}
            onComment={openComments}
            onReadMore={handleReadMore}
            onMentionPress={handleMentionPress}
            onLinkPress={handleLinkPress}
            currentImageIndex={currentImageIndex}
            onImageScroll={handleImageScroll}
            showFollowButton={item.authorId !== user?.uid}
            showMenu={true}
            onMenuPress={handleMenuPress}
          />
        )}
      />

      <Modal visible={showComments} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setShowComments(false)}>
        <View className="flex-1">
          <TouchableOpacity 
            className="flex-1 bg-black/50"
            activeOpacity={1}
            onPress={() => setShowComments(false)} 
          />
          <View 
            className="h-[85%] rounded-t-3xl absolute left-0 right-0 bottom-0"
            style={{ backgroundColor: theme.background }}
          >
            <View 
              className="flex-row items-center justify-center py-4 border-b"
              style={{ borderBottomColor: theme.border }}
            >
              <View 
                className="w-10 h-1 rounded-full absolute top-2"
                style={{ backgroundColor: theme.border }}
              />
              <ThemedText type="subtitle">Comments</ThemedText>
            </View>

            <FlatList
              data={selectedPost?.comments || []}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16, flexGrow: 1 }}
              ListEmptyComponent={
                <View className="items-center py-10">
                  <Ionicons name="chatbubble-outline" size={48} color={theme.border} />
                  <ThemedText className="mt-3" style={{ color: theme.textSecondary }}>
                    No comments yet
                  </ThemedText>
                  <ThemedText className="text-[13px]" style={{ color: theme.textSecondary }}>
                    Be the first to comment!
                  </ThemedText>
                </View>
              }
              renderItem={({ item: comment }) => (
                <View className="flex-row mb-4 gap-3">
                  <Avatar name={comment.user} size="sm" />
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <ThemedText className="font-semibold">{comment.user}</ThemedText>
                      <ThemedText className="text-xs" style={{ color: theme.textSecondary }}>{comment.time}</ThemedText>
                    </View>
                    <ThemedText className="mt-0.5">{comment.text}</ThemedText>
                  </View>
                </View>
              )}
            />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View 
                className="flex-row items-center px-3 border-t gap-3"
                style={{ 
                  borderTopColor: theme.border, 
                  backgroundColor: theme.background,
                  paddingTop: 10,
                  paddingBottom: insets.bottom > 0 ? insets.bottom : 10
                }}
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
          </View>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => setShowCreatePost(true)}
        activeOpacity={0.8}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 20,
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: theme.primary,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Create Post Modal */}
      <Modal visible={showCreatePost} animationType="slide" statusBarTranslucent onRequestClose={() => setShowCreatePost(false)}>
        <View 
          className="flex-1 pt-10"
          style={{ backgroundColor: theme.background }}
        >
          {/* Top Bar */}
          <View className="flex-row items-center justify-between py-3">
              {/* Left: Close + Avatar + Dropdown */}
              <View className="flex-row items-center gap-3">
                <IconButton 
                  icon="close" 
                  size="md"
                  variant="ghost"
                  onPress={() => setShowCreatePost(false)} 
                />
                
                {/* User Avatar */}
                <Avatar name={profile?.name || user?.email || 'User'} size="sm" />

                {/* Visibility Dropdown Toggle */}
                <TouchableOpacity 
                  onPress={() => setSelectedTag(selectedTag === 'local' ? 'global' : 'local')}
                  className="flex-row items-center px-3 py-1.5 rounded-2xl"
                  style={{ backgroundColor: theme.surface }}
                >
                  <Ionicons 
                    name={selectedTag === 'local' ? 'location' : 'globe'} 
                    size={16} 
                    color={theme.primary} 
                  />
                  <ThemedText className="ml-1.5 text-[13px] font-medium">
                    {selectedTag === 'local' ? i18n.createPost?.local || 'Local' : i18n.createPost?.anyone || 'Anyone'}
                  </ThemedText>
                  <Ionicons name="chevron-down" size={16} color={theme.textSecondary} className="ml-1" />
                </TouchableOpacity>
              </View>

              {/* Right: Post Button */}
              <Button
                title={i18n.createPost?.post || 'Post'}
                size="sm"
                loading={posting}
                disabled={(!newPostContent.trim() && pendingImages.length === 0 && !pendingDocument && !(pollQuestion.trim() && pollOptions.filter((option) => option.trim()).length >= 2)) || posting}
                onPress={handleCreatePost}
                style={{ borderRadius: 20, paddingHorizontal: 20, marginRight: 12 }}
              />
            </View>

            <Divider spacing={0} />

            {/* Text Input Area */}
            <View className="flex-1">
              <TextArea
                value={newPostContent}
                onChangeText={setNewPostContent}
                placeholder={i18n.createPost?.placeholder || 'Share your thoughts...'}
                bordered={false}
                minHeight={200}
                autoFocus
                style={{ fontSize: 18 }}
              />

              {pendingImages.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 12 }}>
                  {pendingImages.map((file) => (
                    <Image key={file.uri} source={{ uri: file.uri }} className="w-24 h-24 rounded-xl" />
                  ))}
                </ScrollView>
              )}

              {pendingDocument && (
                <View className="mx-4 mb-3 flex-row items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: theme.surface }}>
                  <Ionicons name="document-text" size={18} color={theme.primary} />
                  <ThemedText className="flex-1" numberOfLines={1}>{pendingDocument.name}</ThemedText>
                </View>
              )}

              {pollQuestion.trim() && pollOptions.filter((option) => option.trim()).length >= 2 && (
                <View className="mx-4 mb-3 rounded-xl px-3 py-2" style={{ backgroundColor: theme.surface }}>
                  <ThemedText className="font-semibold">{pollQuestion.trim()}</ThemedText>
                  {pollOptions.filter((option) => option.trim()).map((option) => (
                    <ThemedText key={option} className="text-sm" style={{ color: theme.textSecondary }}>• {option.trim()}</ThemedText>
                  ))}
                </View>
              )}
            </View>

            {/* Bottom Action Bar */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <Divider spacing={0} />
              <View 
                className="flex-row justify-end items-center px-4 gap-2"
                style={{ 
                  paddingTop: 10,
                  paddingBottom: insets.bottom > 0 ? insets.bottom : 10
                }}
              >
                <IconButton 
                  icon="image-outline" 
                  size="md"
                  variant="ghost"
                  color={pendingImages.length ? theme.primary : theme.textSecondary}
                  onPress={handlePickImages}
                />
                <IconButton 
                  icon="stats-chart-outline" 
                  size="md"
                  variant="ghost"
                  color={pollQuestion.trim() ? theme.primary : theme.textSecondary}
                  onPress={() => setShowPollModal(true)}
                />
                <IconButton 
                  icon="document-outline" 
                  size="md"
                  variant="ghost"
                  color={pendingDocument ? theme.primary : theme.textSecondary}
                  onPress={handlePickDocument}
                />
              </View>
            </KeyboardAvoidingView>
          </View>
      </Modal>

      <Modal visible={showPollModal} animationType="slide" transparent onRequestClose={() => setShowPollModal(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl p-4 pb-8" style={{ backgroundColor: theme.background }}>
            <View className="flex-row items-center justify-between mb-4">
              <ThemedText type="subtitle">Create Poll</ThemedText>
              <IconButton icon="close" variant="ghost" onPress={() => setShowPollModal(false)} />
            </View>
            <TextInput
              className="rounded-xl p-3.5 text-[15px] border mb-3"
              style={{ backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }}
              placeholder="Ask a question..."
              placeholderTextColor={theme.textSecondary}
              value={pollQuestion}
              onChangeText={setPollQuestion}
            />
            {pollOptions.map((option, index) => (
              <TextInput
                key={index}
                className="rounded-xl p-3.5 text-[15px] border mb-2"
                style={{ backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }}
                placeholder={`Option ${index + 1}`}
                placeholderTextColor={theme.textSecondary}
                value={option}
                onChangeText={(value) => {
                  const next = [...pollOptions];
                  next[index] = value;
                  setPollOptions(next);
                }}
              />
            ))}
            {pollOptions.length < 5 && (
              <TouchableOpacity onPress={() => setPollOptions([...pollOptions, ''])} className="py-2">
                <ThemedText style={{ color: theme.primary }}>Add option</ThemedText>
              </TouchableOpacity>
            )}
            <Button title="Add Poll" onPress={handleSavePoll} fullWidth />
          </View>
        </View>
      </Modal>

      {/* Post Options Menu */}
      <Modal visible={showPostOptions} animationType="fade" transparent onRequestClose={() => setShowPostOptions(false)}>
        <TouchableOpacity 
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setShowPostOptions(false)}
        >
          <View 
            className="rounded-t-3xl p-4 pb-8"
            style={{ backgroundColor: theme.background }}
          >
            <View className="items-center mb-4">
              <View className="w-10 h-1 rounded-full" style={{ backgroundColor: theme.border }} />
            </View>
            
            <TouchableOpacity 
              className="flex-row items-center gap-4 py-4 border-b"
              style={{ borderBottomColor: theme.border }}
              onPress={handleSharePost}
            >
              <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: theme.primary + '15' }}>
                <Ionicons name="share-social-outline" size={22} color={theme.primary} />
              </View>
              <ThemedText className="text-[16px]">Share Post</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-row items-center gap-4 py-4 border-b"
              style={{ borderBottomColor: theme.border }}
              onPress={handleReportPost}
            >
              <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: theme.secondary + '15' }}>
                <Ionicons name="flag-outline" size={22} color={theme.secondary} />
              </View>
              <ThemedText className="text-[16px]">Report Post</ThemedText>
            </TouchableOpacity>

            {selectedPostForMenu && isOwnPost(selectedPostForMenu) && (
              <TouchableOpacity 
                className="flex-row items-center gap-4 py-4"
                onPress={handleDeletePost}
              >
                <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: theme.error + '15' }}>
                  <Ionicons name="trash-outline" size={22} color={theme.error} />
                </View>
                <ThemedText className="text-[16px]" style={{ color: theme.error }}>Delete Post</ThemedText>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              className="mt-4 py-3 rounded-xl items-center"
              style={{ backgroundColor: theme.surface }}
              onPress={() => setShowPostOptions(false)}
            >
              <ThemedText className="font-semibold">Cancel</ThemedText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
