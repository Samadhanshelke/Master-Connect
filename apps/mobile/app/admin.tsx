import { ThemedText } from '@/components/themed-text';
import { Button, IconButton } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useBanners } from '@/context/BannersContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { parseDateKey } from '@/services/banners';
import { ModerationReport, resolveReport, subscribeToReports } from '@/services/posts';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function AdminScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { profile } = useUserProfile();
  const { pendingBanners, approveBanner, rejectBanner } = useBanners();
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      setLoadingReports(false);
      return;
    }

    return subscribeToReports(
      (next) => {
        setReports(next);
        setLoadingReports(false);
      },
      (error) => {
        console.error('Error loading reports:', error);
        setLoadingReports(false);
      },
    );
  }, [isAdmin]);

  const handleApprove = async (bannerId: string) => {
    try {
      await approveBanner(bannerId);
      Toast.show({ type: 'success', text1: 'Banner approved' });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: error instanceof Error ? error.message : 'Could not approve banner',
      });
    }
  };

  const handleReject = async (bannerId: string) => {
    try {
      await rejectBanner(bannerId);
      Toast.show({ type: 'success', text1: 'Banner rejected' });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: error instanceof Error ? error.message : 'Could not reject banner',
      });
    }
  };

  const handleResolve = async (reportId: string) => {
    try {
      await resolveReport(reportId);
      Toast.show({ type: 'success', text1: 'Report marked resolved' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Could not update report' });
    }
  };

  const openReports = reports.filter((report) => report.status === 'open');

  if (!isAdmin) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center px-8" style={{ backgroundColor: theme.background }}>
        <Ionicons name="shield-outline" size={48} color={theme.border} />
        <ThemedText className="mt-3 text-center">Admin access required</ThemedText>
        <ThemedText className="text-center mt-1" style={{ color: theme.textSecondary }}>
          Set your user role to admin in Firestore to use this screen.
        </ThemedText>
        <Button title="Go back" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }} edges={['top', 'left', 'right']}>
      <View className="flex-row items-center px-4 py-3 border-b gap-3" style={{ borderBottomColor: theme.border }}>
        <IconButton icon="arrow-back" variant="ghost" onPress={() => router.back()} />
        <ThemedText type="subtitle">Admin Tools</ThemedText>
      </View>

      <ScrollView className="flex-1 p-4">
        <ThemedText type="subtitle" className="mb-3">Pending Banners</ThemedText>
        {pendingBanners.length === 0 ? (
          <View className="items-center py-8 mb-4">
            <Ionicons name="images-outline" size={40} color={theme.border} />
            <ThemedText className="mt-2" style={{ color: theme.textSecondary }}>No pending banners</ThemedText>
          </View>
        ) : (
          pendingBanners.map((banner) => (
            <View
              key={banner.id}
              className="rounded-xl p-4 mb-3 border"
              style={{ backgroundColor: theme.surface, borderColor: theme.border }}
            >
              {banner.imageUri ? (
                <Image source={{ uri: banner.imageUri }} className="w-full h-[80px] rounded-lg mb-3" resizeMode="cover" />
              ) : null}
              <ThemedText className="font-semibold">{banner.ownerName}</ThemedText>
              <ThemedText className="text-sm mb-3" style={{ color: theme.textSecondary }}>
                {parseDateKey(banner.date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </ThemedText>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 py-2 rounded-lg items-center"
                  style={{ backgroundColor: theme.success + '20' }}
                  onPress={() => handleApprove(banner.id)}
                >
                  <ThemedText style={{ color: theme.success }}>Approve</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 py-2 rounded-lg items-center"
                  style={{ backgroundColor: theme.error + '20' }}
                  onPress={() => handleReject(banner.id)}
                >
                  <ThemedText style={{ color: theme.error }}>Reject</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <ThemedText type="subtitle" className="mb-3 mt-4">Reported Posts</ThemedText>
        {loadingReports ? (
          <ActivityIndicator color={theme.primary} />
        ) : openReports.length === 0 ? (
          <View className="items-center py-8">
            <Ionicons name="flag-outline" size={40} color={theme.border} />
            <ThemedText className="mt-2" style={{ color: theme.textSecondary }}>No open reports</ThemedText>
          </View>
        ) : (
          openReports.map((report) => (
            <View
              key={report.id}
              className="rounded-xl p-4 mb-3 border"
              style={{ backgroundColor: theme.surface, borderColor: theme.border }}
            >
              <ThemedText className="font-semibold mb-1">{report.content || 'Reported post'}</ThemedText>
              <ThemedText className="text-xs mb-3" style={{ color: theme.textSecondary }}>
                Post {report.postId} • Reporter {report.reporterId}
              </ThemedText>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 py-2 rounded-lg items-center border"
                  style={{ borderColor: theme.border }}
                  onPress={() => router.push({ pathname: '/post-details', params: { postId: report.postId } })}
                >
                  <ThemedText>View post</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 py-2 rounded-lg items-center"
                  style={{ backgroundColor: theme.primary + '20' }}
                  onPress={() => handleResolve(report.id)}
                >
                  <ThemedText style={{ color: theme.primary }}>Resolve</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
