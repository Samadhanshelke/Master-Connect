import { ThemedText } from '@/components/themed-text';
import { Button, IconButton } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useBanners } from '@/context/BannersContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { parseDateKey, todayDateKey } from '@/services/banners';
import { pickImages, uploadFile } from '@/services/media';
import { BANNER_PRICE } from '@/types/banner';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function BannerBookingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { myBanners, loading, createBanner, payForBanner, isDateBooked } = useBanners();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState(false);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDay = firstDay.getDay();
    const days: (number | null)[] = [];

    for (let i = 0; i < startingDay; i += 1) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i += 1) {
      days.push(i);
    }
    return days;
  }, [currentMonth]);

  const isDatePast = (dateStr: string) => dateStr < todayDateKey();

  const handleSelectDate = (day: number) => {
    const dateStr = formatDateKey(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );

    if (isDateBooked(dateStr)) {
      Toast.show({ type: 'error', text1: 'Date not available', text2: 'This date is already booked' });
      return;
    }

    if (isDatePast(dateStr)) {
      Toast.show({ type: 'error', text1: 'Invalid date', text2: 'Cannot book past dates' });
      return;
    }

    setSelectedDate(dateStr);
    setShowCalendar(false);
  };

  const handleSelectImage = async () => {
    try {
      const files = await pickImages(1);
      if (files.length === 0) return;
      setSelectedImage(files[0].uri);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: error instanceof Error ? error.message : 'Could not pick image',
      });
    }
  };

  const handleSendRequest = async () => {
    if (!selectedDate) {
      Toast.show({ type: 'error', text1: 'Select a date first' });
      return;
    }
    if (!selectedImage) {
      Toast.show({ type: 'error', text1: 'Upload a banner image first' });
      return;
    }
    if (!user) {
      Toast.show({ type: 'error', text1: 'You must be signed in' });
      return;
    }

    try {
      setSaving(true);
      const imageUri = await uploadFile(
        user.uid,
        { uri: selectedImage, name: 'banner.jpg', mimeType: 'image/jpeg' },
        'banners',
      );
      await createBanner({ date: selectedDate, imageUri });
      setSelectedDate(null);
      setSelectedImage(null);
      Toast.show({
        type: 'success',
        text1: 'Request submitted',
        text2: 'Wait for admin approval, then complete payment',
      });
    } catch (error) {
      console.error('Error creating banner request:', error);
      Toast.show({
        type: 'error',
        text1: 'Could not submit request',
        text2: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentComplete = async () => {
    if (!payingId) return;
    try {
      setPaying(true);
      await payForBanner(payingId);
      setPayingId(null);
      Toast.show({
        type: 'success',
        text1: 'Payment successful!',
        text2: 'Your banner will be displayed on the selected date',
      });
    } catch (error) {
      console.error('Error paying for banner:', error);
      Toast.show({ type: 'error', text1: 'Could not complete payment' });
    } finally {
      setPaying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return theme.success;
      case 'pending': return theme.secondary;
      case 'rejected': return theme.error;
      default: return theme.textSecondary;
    }
  };

  const shiftMonth = (offset: number) => {
    setCurrentMonth((current) => {
      const next = new Date(current.getFullYear(), current.getMonth() + offset, 1);
      return next;
    });
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }} edges={['top', 'left', 'right']}>
      <View className="flex-row items-center px-4 py-3 border-b gap-3" style={{ borderBottomColor: theme.border }}>
        <IconButton icon="arrow-back" variant="ghost" onPress={() => router.back()} />
        <ThemedText type="subtitle">Banner Advertising</ThemedText>
      </View>

      <ScrollView className="flex-1 p-4">
        <View
          className="rounded-xl p-4 mb-6"
          style={{ backgroundColor: theme.primary + '15' }}
        >
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons name="information-circle" size={22} color={theme.primary} />
            <ThemedText className="font-semibold" style={{ color: theme.primary }}>
              How It Works
            </ThemedText>
          </View>
          <View className="gap-1.5 ml-7">
            <ThemedText className="text-sm" style={{ color: theme.text }}>
              1. Select an available date for your banner
            </ThemedText>
            <ThemedText className="text-sm" style={{ color: theme.text }}>
              2. Upload your banner image (recommended: 1200×400)
            </ThemedText>
            <ThemedText className="text-sm" style={{ color: theme.text }}>
              3. Submit request for approval
            </ThemedText>
            <ThemedText className="text-sm" style={{ color: theme.text }}>
              4. Once approved, complete payment (₹{BANNER_PRICE})
            </ThemedText>
            <ThemedText className="text-sm" style={{ color: theme.text }}>
              5. Your banner will be shown on the selected date!
            </ThemedText>
          </View>
        </View>

        <ThemedText type="subtitle" className="mb-3">Book a Banner</ThemedText>

        <View
          className="rounded-xl p-4 mb-6 border"
          style={{ backgroundColor: theme.surface, borderColor: theme.border }}
        >
          <ThemedText className="font-semibold mb-2">Select Date</ThemedText>
          <TouchableOpacity
            className="flex-row items-center justify-between p-3 rounded-lg border mb-4"
            style={{ borderColor: theme.border }}
            onPress={() => setShowCalendar(true)}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="calendar-outline" size={20} color={theme.primary} />
              <ThemedText>
                {selectedDate ? parseDateKey(selectedDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }) : 'Choose a date'}
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          <ThemedText className="font-semibold mb-2">Banner Image</ThemedText>
          {selectedImage ? (
            <View className="mb-4">
              <Image
                source={{ uri: selectedImage }}
                className="w-full h-[100px] rounded-lg"
                resizeMode="cover"
              />
              <TouchableOpacity
                className="absolute top-2 right-2 bg-black/50 rounded-full p-1"
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="border-2 border-dashed rounded-lg p-6 items-center mb-4"
              style={{ borderColor: theme.border }}
              onPress={handleSelectImage}
            >
              <Ionicons name="cloud-upload-outline" size={40} color={theme.primary} />
              <ThemedText className="mt-2 font-medium" style={{ color: theme.primary }}>
                Tap to upload banner
              </ThemedText>
              <ThemedText className="text-xs mt-1" style={{ color: theme.textSecondary }}>
                JPG, PNG • Max 5MB • 1200×400 recommended
              </ThemedText>
            </TouchableOpacity>
          )}

          <View
            className="flex-row items-center justify-between p-3 rounded-lg mb-4"
            style={{ backgroundColor: theme.background }}
          >
            <ThemedText style={{ color: theme.textSecondary }}>Banner Price (1 day)</ThemedText>
            <ThemedText className="text-lg font-bold" style={{ color: theme.primary }}>
              ₹{BANNER_PRICE}
            </ThemedText>
          </View>

          <Button
            title="Send Request for Approval"
            onPress={handleSendRequest}
            fullWidth
            loading={saving}
            disabled={!selectedDate || !selectedImage || saving}
          />
        </View>

        <ThemedText type="subtitle" className="mb-3">My Banner Requests</ThemedText>

        {loading ? (
          <View className="items-center py-8">
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : myBanners.length === 0 ? (
          <View className="items-center py-8">
            <Ionicons name="images-outline" size={48} color={theme.border} />
            <ThemedText className="mt-2" style={{ color: theme.textSecondary }}>
              No banner requests yet
            </ThemedText>
          </View>
        ) : (
          myBanners.map((request) => (
            <View
              key={request.id}
              className="rounded-xl p-4 mb-3 border"
              style={{ backgroundColor: theme.surface, borderColor: theme.border }}
            >
              <Image
                source={{ uri: request.imageUri }}
                className="w-full h-[80px] rounded-lg mb-3"
                resizeMode="cover"
              />

              <View className="flex-row justify-between items-center mb-2">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="calendar" size={16} color={theme.primary} />
                  <ThemedText className="font-medium">
                    {parseDateKey(request.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </ThemedText>
                </View>
                <View
                  className="px-2 py-1 rounded-full"
                  style={{ backgroundColor: getStatusColor(request.status) + '20' }}
                >
                  <ThemedText
                    className="text-xs font-semibold capitalize"
                    style={{ color: getStatusColor(request.status) }}
                  >
                    {request.status}
                  </ThemedText>
                </View>
              </View>

              {request.status === 'approved' && request.paymentStatus === 'unpaid' && (
                <Button
                  title={`Pay ₹${request.price}`}
                  onPress={() => setPayingId(request.id)}
                  fullWidth
                  size="sm"
                />
              )}

              {request.paymentStatus === 'paid' && (
                <View
                  className="flex-row items-center justify-center gap-2 py-2 rounded-lg"
                  style={{ backgroundColor: theme.success + '15' }}
                >
                  <Ionicons name="checkmark-circle" size={18} color={theme.success} />
                  <ThemedText className="font-medium" style={{ color: theme.success }}>
                    Payment Complete - Banner Scheduled
                  </ThemedText>
                </View>
              )}

              {request.status === 'pending' && (
                <ThemedText className="text-center text-sm" style={{ color: theme.textSecondary }}>
                  Awaiting approval from admin
                </ThemedText>
              )}
            </View>
          ))
        )}

        <View className="mt-4 mb-8">
          <ThemedText className="text-xs text-center" style={{ color: theme.textSecondary }}>
            Note: Banner cannot be changed after payment. Each banner is displayed for exactly one day.
          </ThemedText>
        </View>
      </ScrollView>

      <Modal visible={showCalendar} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View
            className="rounded-t-3xl p-4 pb-8"
            style={{ backgroundColor: theme.background }}
          >
            <View className="flex-row justify-between items-center mb-4">
              <ThemedText type="subtitle">Select Date</ThemedText>
              <IconButton
                icon="close"
                variant="ghost"
                onPress={() => setShowCalendar(false)}
              />
            </View>

            <View className="flex-row justify-between items-center mb-4">
              <TouchableOpacity onPress={() => shiftMonth(-1)}>
                <Ionicons name="chevron-back" size={24} color={theme.primary} />
              </TouchableOpacity>
              <ThemedText className="font-semibold text-lg">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </ThemedText>
              <TouchableOpacity onPress={() => shiftMonth(1)}>
                <Ionicons name="chevron-forward" size={24} color={theme.primary} />
              </TouchableOpacity>
            </View>

            <View className="flex-row mb-2">
              {dayNames.map((day) => (
                <View key={day} className="flex-1 items-center">
                  <ThemedText className="text-xs font-medium" style={{ color: theme.textSecondary }}>
                    {day}
                  </ThemedText>
                </View>
              ))}
            </View>

            <View className="flex-row flex-wrap">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <View key={`empty-${index}`} className="w-[14.28%] h-10" />;
                }

                const dateStr = formatDateKey(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth(),
                  day,
                );
                const booked = isDateBooked(dateStr);
                const isPast = isDatePast(dateStr);
                const isDisabled = booked || isPast;

                return (
                  <TouchableOpacity
                    key={dateStr}
                    className="w-[14.28%] h-10 items-center justify-center"
                    onPress={() => !isDisabled && handleSelectDate(day)}
                    disabled={isDisabled}
                  >
                    <View
                      className="w-8 h-8 rounded-full items-center justify-center"
                      style={[
                        selectedDate === dateStr ? { backgroundColor: theme.primary } : null,
                        booked ? { backgroundColor: theme.error + '20' } : null,
                      ]}
                    >
                      <ThemedText
                        className={`text-sm ${selectedDate === dateStr ? 'font-bold' : ''}`}
                        style={{
                          color: selectedDate === dateStr
                            ? '#fff'
                            : isPast
                              ? theme.textSecondary
                              : booked
                                ? theme.error
                                : theme.text,
                        }}
                      >
                        {day}
                      </ThemedText>
                    </View>
                    {booked && (
                      <View className="absolute bottom-0">
                        <ThemedText className="text-[8px]" style={{ color: theme.error }}>
                          Booked
                        </ThemedText>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View className="flex-row justify-center gap-6 mt-4">
              <View className="flex-row items-center gap-1">
                <View className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.error + '20' }} />
                <ThemedText className="text-xs" style={{ color: theme.textSecondary }}>Booked</ThemedText>
              </View>
              <View className="flex-row items-center gap-1">
                <View className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.primary }} />
                <ThemedText className="text-xs" style={{ color: theme.textSecondary }}>Selected</ThemedText>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(payingId)} animationType="fade" transparent>
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View
            className="w-full rounded-2xl p-5"
            style={{ backgroundColor: theme.background }}
          >
            <View className="items-center mb-4">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: theme.primary + '15' }}
              >
                <Ionicons name="card" size={32} color={theme.primary} />
              </View>
              <ThemedText type="subtitle">Complete Payment</ThemedText>
              <ThemedText className="text-3xl font-bold mt-2" style={{ color: theme.primary }}>
                ₹{BANNER_PRICE}
              </ThemedText>
            </View>

            <ThemedText className="text-center text-sm mb-6" style={{ color: theme.textSecondary }}>
              Your banner will be displayed on the home screen for the entire selected day.
            </ThemedText>

            <View className="gap-3">
              <Button
                title="Pay Now"
                onPress={handlePaymentComplete}
                fullWidth
                loading={paying}
                disabled={paying}
              />
              <TouchableOpacity
                className="py-3 items-center"
                onPress={() => !paying && setPayingId(null)}
              >
                <ThemedText style={{ color: theme.textSecondary }}>Cancel</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
