import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Avatar, Button, Dropdown, IconButton, PostCard, PostData, Toggle } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useMarketplace } from '@/context/MarketplaceContext';
import { usePosts } from '@/context/PostsContext';
import { useTheme } from '@/context/ThemeContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { joinCityGroup } from '@/services/chat';
import { subscribeToCities } from '@/services/cities';
import { CityRecord } from '@/types/city';
import { JobStatus } from '@/types/marketplace';
import { sharePostText } from '@/utils/share';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { language } = useLanguage();
  const { profile, updateProfile, clearUserData } = useUserProfile();
  const {
    allPosts,
    followingCount,
    followerCount,
    toggleLike,
    toggleBookmark,
    toggleFollow,
    deletePost,
    reportPost,
  } = usePosts();
  const { myShops, myJobs, deleteShop, deleteJob, updateJobStatus } = useMarketplace();
  
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'shops' | 'jobs'>('posts');
  
  // Profile data - initialize from context or fallback
  const [displayName, setDisplayName] = useState(profile?.name || user?.email?.split('@')[0] || 'User');
  const [bio, setBio] = useState(profile?.bio || 'Master Connect member');
  const [city, setCity] = useState(profile?.location || '');
  const [cities, setCities] = useState<CityRecord[]>([]);

  // Update local state when profile context changes
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.name || user?.email?.split('@')[0] || 'User');
      setBio(profile.bio || 'Master Connect member');
      setCity(profile.location || '');
    }
  }, [profile, user]);

  useEffect(() => {
    return subscribeToCities(setCities, (error) => {
      console.error('Error loading cities:', error);
    });
  }, []);

  const userPosts = allPosts.filter((post) => post.authorId === user?.uid);
  const bookmarkedPosts = allPosts.filter((post) => post.isBookmarked);
  
  // Post Options Menu State
  const [showPostOptions, setShowPostOptions] = useState(false);
  const [selectedPostForMenu, setSelectedPostForMenu] = useState<PostData | null>(null);
  const [isSelectedFromSaved, setIsSelectedFromSaved] = useState(false);

  const handleLogout = async () => {
    await clearUserData(); // Clear user profile data
    await signOut();
    Toast.show({ type: 'success', text1: 'Logged out successfully' });
    router.replace('/auth');
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        name: displayName,
        bio: bio,
        location: city,
      });
      if (user && city.trim()) {
        try {
          await joinCityGroup({
            uid: user.uid,
            userName: displayName.trim() || 'User',
            city: city.trim(),
          });
        } catch (error) {
          console.error('Error joining city chat:', error);
        }
      }
      Toast.show({ type: 'success', text1: 'Profile updated!' });
      setShowEditProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Toast.show({ type: 'error', text1: 'Failed to update profile' });
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
      setShowPostOptions(false);
      Toast.show({ type: 'success', text1: 'Post deleted' });
    } catch (error) {
      console.error('Error deleting post:', error);
      Toast.show({ type: 'error', text1: 'Could not delete post' });
    }
  };

  const handleOpenPostMenu = (post: PostData, fromSaved: boolean) => {
    setSelectedPostForMenu(post);
    setIsSelectedFromSaved(fromSaved);
    setShowPostOptions(true);
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

  const handleDeleteShop = (shopId: string, shopName: string) => {
    Alert.alert('Delete shop', `Remove ${shopName}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteShop(shopId);
            Toast.show({ type: 'success', text1: 'Shop deleted' });
          } catch (error) {
            console.error('Error deleting shop:', error);
            Toast.show({ type: 'error', text1: 'Could not delete shop' });
          }
        },
      },
    ]);
  };

  const handleToggleJobStatus = async (jobId: string, status: JobStatus) => {
    try {
      await updateJobStatus(jobId, status === 'active' ? 'closed' : 'active');
      Toast.show({
        type: 'success',
        text1: status === 'active' ? 'Job closed' : 'Job reopened',
      });
    } catch (error) {
      console.error('Error updating job:', error);
      Toast.show({ type: 'error', text1: 'Could not update job' });
    }
  };

  const handleDeleteJob = (jobId: string, position: string) => {
    Alert.alert('Delete job', `Remove ${position}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteJob(jobId);
            Toast.show({ type: 'success', text1: 'Job deleted' });
          } catch (error) {
            console.error('Error deleting job:', error);
            Toast.show({ type: 'error', text1: 'Could not delete job' });
          }
        },
      },
    ]);
  };

  // Settings View
  if (showSettings) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }} edges={['top', 'left', 'right']}>
        <View className="flex-row items-center px-4 py-3 border-b gap-3" style={{ borderBottomColor: theme.border }}>
          <IconButton icon="arrow-back" variant="ghost" onPress={() => setShowSettings(false)} />
          <ThemedText type="subtitle">Settings</ThemedText>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Account Section */}
          <ThemedText className="mb-2 text-[13px] font-semibold" style={{ color: theme.textSecondary }}>
            ACCOUNT
          </ThemedText>
          <ThemedView className="rounded-xl overflow-hidden mb-6 border" style={{ borderColor: theme.border }}>
            <TouchableOpacity 
              className="flex-row items-center justify-between p-4 border-b"
              style={{ backgroundColor: theme.surface, borderBottomColor: theme.border }}
              onPress={() => setShowEditProfile(true)}
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="person-outline" size={22} color={theme.text} />
                <ThemedText>Edit Profile</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              className="flex-row items-center justify-between p-4"
              style={{ backgroundColor: theme.surface }}
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="lock-closed-outline" size={22} color={theme.text} />
                <ThemedText>Change Password</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </ThemedView>

          {/* Appearance Section */}
          <ThemedText className="mb-2 text-[13px] font-semibold" style={{ color: theme.textSecondary }}>
            APPEARANCE
          </ThemedText>
          <ThemedView className="rounded-xl overflow-hidden mb-6 border" style={{ borderColor: theme.border }}>
            <View 
              className="flex-row items-center justify-between p-4"
              style={{ backgroundColor: theme.surface }}
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name={isDark ? "moon" : "sunny-outline"} size={22} color={theme.text} />
                <View>
                  <ThemedText>Dark Mode</ThemedText>
                  <ThemedText className="text-xs" style={{ color: theme.textSecondary }}>
                    {isDark ? 'Currently using dark theme' : 'Currently using light theme'}
                  </ThemedText>
                </View>
              </View>
              <Toggle value={isDark} onChange={() => toggleTheme()} />
            </View>
          </ThemedView>

          {/* Preferences Section */}
          <ThemedText className="mb-2 text-[13px] font-semibold" style={{ color: theme.textSecondary }}>
            PREFERENCES
          </ThemedText>
          <ThemedView className="rounded-xl overflow-hidden mb-6 border" style={{ borderColor: theme.border }}>
            <View 
              className="flex-row items-center justify-between p-4 border-b"
              style={{ backgroundColor: theme.surface, borderBottomColor: theme.border }}
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="notifications-outline" size={22} color={theme.text} />
                <ThemedText>Notifications</ThemedText>
              </View>
              <Toggle value={notifications} onChange={setNotifications} />
            </View>
            <TouchableOpacity 
              className="flex-row items-center justify-between p-4"
              style={{ backgroundColor: theme.surface }}
              onPress={() => router.push({ pathname: '/language-selection', params: { fromSettings: 'true' } })}
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="language-outline" size={22} color={theme.text} />
                <ThemedText>Language</ThemedText>
              </View>
              <View className="flex-row items-center gap-2">
                <ThemedText style={{ color: theme.textSecondary }}>
                  {language === 'en' ? 'English' : language === 'mr' ? 'मराठी' : 'हिंदी'}
                </ThemedText>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </View>
            </TouchableOpacity>
          </ThemedView>

          {/* Services Section */}
          <ThemedText className="mb-2 text-[13px] font-semibold" style={{ color: theme.textSecondary }}>
            SERVICES
          </ThemedText>
          <ThemedView className="rounded-xl overflow-hidden mb-6 border" style={{ borderColor: theme.border }}>
            <TouchableOpacity 
              className="flex-row items-center justify-between p-4"
              style={{ backgroundColor: theme.surface }}
              onPress={() => router.push('/banner-booking')}
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="megaphone-outline" size={22} color={theme.text} />
                <View>
                  <ThemedText>Banner Advertising</ThemedText>
                  <ThemedText className="text-xs" style={{ color: theme.textSecondary }}>
                    Promote on Home Screen
                  </ThemedText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
            {profile?.role === 'admin' && (
              <TouchableOpacity 
                className="flex-row items-center justify-between p-4 border-t"
                style={{ backgroundColor: theme.surface, borderTopColor: theme.border }}
                onPress={() => router.push('/admin')}
              >
                <View className="flex-row items-center gap-3">
                  <Ionicons name="shield-checkmark-outline" size={22} color={theme.text} />
                  <View>
                    <ThemedText>Admin Tools</ThemedText>
                    <ThemedText className="text-xs" style={{ color: theme.textSecondary }}>
                      Approve banners, review reports, or use the web admin
                    </ThemedText>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </ThemedView>

          {/* Support Section */}
          <ThemedText className="mb-2 text-[13px] font-semibold" style={{ color: theme.textSecondary }}>
            SUPPORT
          </ThemedText>
          <ThemedView className="rounded-xl overflow-hidden mb-6 border" style={{ borderColor: theme.border }}>
            <TouchableOpacity 
              className="flex-row items-center justify-between p-4 border-b"
              style={{ backgroundColor: theme.surface, borderBottomColor: theme.border }}
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="help-circle-outline" size={22} color={theme.text} />
                <ThemedText>Help & Support</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              className="flex-row items-center justify-between p-4"
              style={{ backgroundColor: theme.surface }}
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="document-text-outline" size={22} color={theme.text} />
                <ThemedText>Terms & Privacy</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </ThemedView>

          {/* Logout */}
          <TouchableOpacity
            className="flex-row items-center justify-center gap-2 py-4 rounded-xl"
            style={{ backgroundColor: theme.error + '15' }}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={22} color={theme.error} />
            <ThemedText className="font-semibold" style={{ color: theme.error }}>Logout</ThemedText>
          </TouchableOpacity>

          <ThemedText className="text-center text-xs mt-5" style={{ color: theme.textSecondary }}>
            Master Connect v1.0.0
          </ThemedText>
        </ScrollView>

        {/* Edit Profile Modal */}
        <Modal visible={showEditProfile} animationType="slide" transparent>
          <View className="flex-1 justify-end bg-black/50">
            <View className="rounded-t-3xl p-6" style={{ backgroundColor: theme.background }}>
              <View className="flex-row justify-between items-center mb-6">
                <ThemedText type="subtitle">Edit Profile</ThemedText>
                <IconButton icon="close" variant="ghost" onPress={() => setShowEditProfile(false)} />
              </View>

              <ThemedText className="mb-2 font-semibold">Display Name</ThemedText>
              <TextInput
                className="px-4 py-3 rounded-xl mb-4 border"
                style={{ backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }}
                value={displayName}
                onChangeText={setDisplayName}
              />

              <ThemedText className="mb-2 font-semibold">Bio</ThemedText>
              <TextInput
                className="px-4 py-3 rounded-xl mb-4 border"
                style={{ backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }}
                value={bio}
                onChangeText={setBio}
                multiline
              />

              <ThemedText className="mb-2 font-semibold">City</ThemedText>
              <View className="mb-6">
                <Dropdown
                  options={cities.map((item) => ({ label: item.name, value: item.name }))}
                  value={city}
                  onChange={setCity}
                  placeholder="Select your city"
                />
              </View>

              <Button title="Save Changes" onPress={handleSaveProfile} fullWidth />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ borderBottomColor: theme.border }}>
        <ThemedText type="subtitle">Profile</ThemedText>
        <IconButton icon="settings-outline" variant="ghost" onPress={() => setShowSettings(true)} />
      </View>

      <ScrollView className="flex-1">
        {/* Profile Header */}
        <View className="items-center py-6 px-4 border-b" style={{ borderBottomColor: theme.border }}>
          <Avatar name={displayName} size="xl" />
          <ThemedText type="title" className="text-[22px] mt-3">{displayName}</ThemedText>
          {/* <ThemedText style={{ color: theme.textSecondary }}>{user?.email}</ThemedText> */}
          <ThemedText className="mt-0 text-center" style={{ color: theme.textSecondary }}>
            {bio}
          </ThemedText>
          <View className="flex-row items-center mt-2 gap-1">
            <Ionicons name="location" size={14} color={theme.primary} />
            <ThemedText style={{ color: theme.primary }}>{city}</ThemedText>
          </View>

        </View>

        {/* Stats */}
        <View className="flex-row py-4 px-4 border-b" style={{ borderBottomColor: theme.border }}>
          <View className="flex-1 items-center">
            <ThemedText type="title" className="text-xl">{userPosts.length}</ThemedText>
            <ThemedText className="text-[13px]" style={{ color: theme.textSecondary }}>Posts</ThemedText>
          </View>
          <TouchableOpacity 
            className="flex-1 items-center border-x" 
            style={{ borderColor: theme.border }}
            onPress={() => router.push({ pathname: '/user-list', params: { title: 'Followers' } })}
          >
            <ThemedText type="title" className="text-xl">{followerCount}</ThemedText>
            <ThemedText className="text-[13px]" style={{ color: theme.textSecondary }}>Followers</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-1 items-center"
            onPress={() => router.push({ pathname: '/user-list', params: { title: 'Following' } })}
          >
            <ThemedText type="title" className="text-xl">{followingCount}</ThemedText>
            <ThemedText className="text-[13px]" style={{ color: theme.textSecondary }}>Following</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View className="flex-row border-b" style={{ borderBottomColor: theme.border }}>
          <TouchableOpacity 
            className="flex-1 items-center py-3 border-b-2"
            onPress={() => setActiveTab('posts')}
            style={{ borderBottomColor: activeTab === 'posts' ? theme.primary : 'transparent' }}
          >
            <Ionicons 
              name={activeTab === 'posts' ? "grid" : "grid-outline"} 
              size={22} 
              color={activeTab === 'posts' ? theme.primary : theme.textSecondary} 
            />
            <ThemedText 
              className="text-xs mt-1"
              style={{ 
                color: activeTab === 'posts' ? theme.primary : theme.textSecondary,
                fontWeight: activeTab === 'posts' ? '600' : '400',
              }}
            >
              My Posts
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-1 items-center py-3 border-b-2"
            onPress={() => setActiveTab('saved')}
            style={{ borderBottomColor: activeTab === 'saved' ? theme.primary : 'transparent' }}
          >
            <Ionicons 
              name={activeTab === 'saved' ? "bookmark" : "bookmark-outline"} 
              size={22} 
              color={activeTab === 'saved' ? theme.primary : theme.textSecondary} 
            />
            <ThemedText 
              className="text-xs mt-1"
              style={{ 
                color: activeTab === 'saved' ? theme.primary : theme.textSecondary,
                fontWeight: activeTab === 'saved' ? '600' : '400',
              }}
            >
              Saved
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-1 items-center py-3 border-b-2"
            onPress={() => setActiveTab('shops')}
            style={{ borderBottomColor: activeTab === 'shops' ? theme.primary : 'transparent' }}
          >
            <Ionicons 
              name={activeTab === 'shops' ? "storefront" : "storefront-outline"} 
              size={22} 
              color={activeTab === 'shops' ? theme.primary : theme.textSecondary} 
            />
            <ThemedText 
              className="text-xs mt-1"
              style={{ 
                color: activeTab === 'shops' ? theme.primary : theme.textSecondary,
                fontWeight: activeTab === 'shops' ? '600' : '400',
              }}
            >
              My Shops
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-1 items-center py-3 border-b-2"
            onPress={() => setActiveTab('jobs')}
            style={{ borderBottomColor: activeTab === 'jobs' ? theme.primary : 'transparent' }}
          >
            <Ionicons 
              name={activeTab === 'jobs' ? "briefcase" : "briefcase-outline"} 
              size={22} 
              color={activeTab === 'jobs' ? theme.primary : theme.textSecondary} 
            />
            <ThemedText 
              className="text-xs mt-1"
              style={{ 
                color: activeTab === 'jobs' ? theme.primary : theme.textSecondary,
                fontWeight: activeTab === 'jobs' ? '600' : '400',
              }}
            >
              Jobs
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View className="px-4 py-4">
          {activeTab === 'posts' && (
            <>
              {userPosts.length === 0 ? (
                <View className="items-center py-10">
                  <Ionicons name="grid-outline" size={48} color={theme.border} />
                  <ThemedText className="mt-3" style={{ color: theme.textSecondary }}>No posts yet</ThemedText>
                </View>
              ) : (
                userPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    onBookmark={handleBookmark}
                    onReadMore={(item) => router.push({ pathname: '/post-details', params: { postId: item.id } })}
                    showFollowButton={false}
                    showMenu={true}
                    onMenuPress={() => handleOpenPostMenu(post, false)}
                  />
                ))
              )}
            </>
          )}

          {activeTab === 'saved' && (
            <>
              {bookmarkedPosts.length === 0 ? (
                <View className="items-center py-10">
                  <Ionicons name="bookmark-outline" size={48} color={theme.border} />
                  <ThemedText className="mt-3" style={{ color: theme.textSecondary }}>No saved posts yet</ThemedText>
                  <ThemedText className="text-[13px] mt-1" style={{ color: theme.textSecondary }}>
                    Bookmark posts to find them here
                  </ThemedText>
                </View>
              ) : (
                bookmarkedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    onBookmark={handleBookmark}
                    onFollow={handleFollow}
                    onReadMore={(item) => router.push({ pathname: '/post-details', params: { postId: item.id } })}
                    showFollowButton={post.authorId !== user?.uid}
                    showMenu={true}
                    onMenuPress={() => handleOpenPostMenu(post, true)}
                  />
                ))
              )}
            </>
          )}

          {activeTab === 'shops' && (
            <>
              {myShops.length === 0 ? (
                <View className="items-center py-10">
                  <Ionicons name="storefront-outline" size={48} color={theme.border} />
                  <ThemedText className="mt-3" style={{ color: theme.textSecondary }}>No shops yet</ThemedText>
                  <ThemedText className="text-[13px] mt-1 text-center" style={{ color: theme.textSecondary }}>
                    Create a shop to start selling your products or services
                  </ThemedText>
                  <Button
                    title="Create Shop"
                    size="sm"
                    onPress={() => router.push('/create-shop')}
                    style={{ marginTop: 16 }}
                  />
                </View>
              ) : (
                <>
                  {myShops.map((shop) => (
                    <View
                      key={shop.id}
                      className="flex-row items-center p-4 mb-3 rounded-xl border"
                      style={{ backgroundColor: theme.surface, borderColor: theme.border }}
                    >
                      <TouchableOpacity
                        className="flex-row items-center flex-1"
                        onPress={() => router.push(`/shop-details?id=${shop.id}`)}
                      >
                        <View 
                          className="w-14 h-14 rounded-xl items-center justify-center mr-3"
                          style={{ backgroundColor: theme.primary + '20' }}
                        >
                          <Ionicons name="storefront" size={28} color={theme.primary} />
                        </View>
                        <View className="flex-1">
                          <ThemedText type="defaultSemiBold">{shop.name}</ThemedText>
                          <View 
                            className="px-2 py-0.5 rounded-full mt-1 self-start"
                            style={{ backgroundColor: theme.secondary + '20' }}
                          >
                            <ThemedText className="text-[10px] font-semibold" style={{ color: theme.secondary }}>
                              {shop.category}
                            </ThemedText>
                          </View>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="w-10 h-10 items-center justify-center"
                        onPress={() => handleDeleteShop(shop.id, shop.name)}
                      >
                        <Ionicons name="trash-outline" size={20} color={theme.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    className="flex-row items-center justify-center gap-2 py-4 mt-2 rounded-xl border-2 border-dashed"
                    style={{ borderColor: theme.border }}
                    onPress={() => router.push('/create-shop')}
                  >
                    <Ionicons name="add-circle-outline" size={22} color={theme.primary} />
                    <ThemedText className="font-semibold" style={{ color: theme.primary }}>
                      Add Another Shop
                    </ThemedText>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

          {activeTab === 'jobs' && (
            <>
              {myJobs.length === 0 ? (
                <View className="items-center py-10">
                  <Ionicons name="briefcase-outline" size={48} color={theme.border} />
                  <ThemedText className="mt-3" style={{ color: theme.textSecondary }}>No jobs posted yet</ThemedText>
                  <ThemedText className="text-[13px] mt-1 text-center" style={{ color: theme.textSecondary }}>
                    Post a job to find the right candidates for your business
                  </ThemedText>
                  <Button
                    title="Post Job"
                    size="sm"
                    onPress={() => router.push('/create-job')}
                    style={{ marginTop: 16 }}
                  />
                </View>
              ) : (
                <>
                  {myJobs.map((job) => (
                    <View
                      key={job.id}
                      className="p-4 mb-3 rounded-xl border"
                      style={{ backgroundColor: theme.surface, borderColor: theme.border }}
                    >
                      <View className="flex-row justify-between items-start mb-3">
                        <View className="flex-1">
                          <ThemedText type="defaultSemiBold" className="text-lg">{job.position}</ThemedText>
                          <ThemedText className="font-medium" style={{ color: theme.primary }}>{job.orgName}</ThemedText>
                        </View>
                        <View 
                          className="px-2 py-1 rounded-full"
                          style={{ backgroundColor: job.status === 'active' ? theme.success + '20' : theme.error + '20' }}
                        >
                          <ThemedText className="text-[11px] font-semibold" style={{ color: job.status === 'active' ? theme.success : theme.error }}>
                            {job.status === 'active' ? 'Active' : 'Closed'}
                          </ThemedText>
                        </View>
                      </View>

                      <View className="gap-2 mb-4">
                        <View className="flex-row items-center gap-2">
                          <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
                          <ThemedText style={{ color: theme.textSecondary }} className="flex-1 text-sm">{job.address}</ThemedText>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <Ionicons name="call-outline" size={16} color={theme.textSecondary} />
                          <ThemedText style={{ color: theme.textSecondary }} className="text-sm">{job.contact}</ThemedText>
                        </View>
                      </View>

                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          className="flex-1 py-2 rounded-lg items-center border"
                          style={{ borderColor: theme.border }}
                          onPress={() => handleToggleJobStatus(job.id, job.status)}
                        >
                          <ThemedText className="text-sm">
                            {job.status === 'active' ? 'Close' : 'Reopen'}
                          </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="flex-1 py-2 rounded-lg items-center"
                          style={{ backgroundColor: theme.error + '15' }}
                          onPress={() => handleDeleteJob(job.id, job.position)}
                        >
                          <ThemedText className="text-sm" style={{ color: theme.error }}>Delete</ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                  <TouchableOpacity
                    className="flex-row items-center justify-center gap-2 py-4 mt-2 rounded-xl border-2 border-dashed"
                    style={{ borderColor: theme.border }}
                    onPress={() => router.push('/create-job')}
                  >
                    <Ionicons name="add-circle-outline" size={22} color={theme.primary} />
                    <ThemedText className="font-semibold" style={{ color: theme.primary }}>
                      Post Another Job
                    </ThemedText>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

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

            {selectedPostForMenu && !isSelectedFromSaved && (
              <TouchableOpacity 
                className="flex-row items-center gap-4 py-4"
                onPress={() => selectedPostForMenu && handleDeletePost(selectedPostForMenu.id)}
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
