import { ThemedText } from '@/components/themed-text';
import { Button, IconButton } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useMarketplace } from '@/context/MarketplaceContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { cityFromLocation } from '@/utils/city';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function CreateJobScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const { profile } = useUserProfile();
  const { createJob } = useMarketplace();
  const city = profile?.location ? cityFromLocation(profile.location) : '';

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    orgName: '',
    position: '',
    contact: '',
    address: city,
  });

  const handleCreateJob = async () => {
    if (!form.orgName.trim() || !form.position.trim() || !form.contact.trim()) {
      Toast.show({ type: 'error', text1: 'Please fill all fields' });
      return;
    }

    if (!city) {
      Toast.show({ type: 'error', text1: 'Your signup city is required to post a job' });
      return;
    }

    try {
      setSaving(true);
      await createJob({
        orgName: form.orgName.trim(),
        position: form.position.trim(),
        contact: form.contact.trim(),
        address: form.address.trim() || city,
      });
      Toast.show({ type: 'success', text1: 'Job posted successfully!' });
      router.back();
    } catch (error) {
      console.error('Error creating job:', error);
      Toast.show({ type: 'error', text1: 'Could not post job' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }}>
      <View
        className="flex-row items-center justify-between px-4 py-3 border-b"
        style={{ borderBottomColor: theme.border }}
      >
        <View className="flex-row items-center gap-3">
          <IconButton icon="arrow-back" variant="ghost" onPress={() => router.back()} />
          <ThemedText type="subtitle">Create Job</ThemedText>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-4">
          <View>
            <ThemedText className="font-semibold mb-2">Organization / Shop Name</ThemedText>
            <TextInput
              className="px-4 py-3 rounded-xl border"
              style={{ backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }}
              placeholder="Enter name"
              placeholderTextColor={theme.textSecondary}
              value={form.orgName}
              onChangeText={(text) => setForm({ ...form, orgName: text })}
            />
          </View>

          <View>
            <ThemedText className="font-semibold mb-2">Position Title</ThemedText>
            <TextInput
              className="px-4 py-3 rounded-xl border"
              style={{ backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }}
              placeholder="e.g. Sales Helper"
              placeholderTextColor={theme.textSecondary}
              value={form.position}
              onChangeText={(text) => setForm({ ...form, position: text })}
            />
          </View>

          <View>
            <ThemedText className="font-semibold mb-2">Contact Number</ThemedText>
            <TextInput
              className="px-4 py-3 rounded-xl border"
              style={{ backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }}
              placeholder="Enter contact number"
              placeholderTextColor={theme.textSecondary}
              keyboardType="phone-pad"
              value={form.contact}
              onChangeText={(text) => setForm({ ...form, contact: text })}
            />
          </View>

          <View>
            <ThemedText className="font-semibold mb-2">City</ThemedText>
            <View
              className="px-4 py-3 rounded-xl border"
              style={{ backgroundColor: theme.surface, borderColor: theme.border }}
            >
              <ThemedText>{city || 'Complete your profile to set a city'}</ThemedText>
              <ThemedText className="text-xs mt-1" style={{ color: theme.textSecondary }}>
                Jobs are posted for the city you selected during signup
              </ThemedText>
            </View>
          </View>

          <View>
            <ThemedText className="font-semibold mb-2">Address (optional)</ThemedText>
            <TextInput
              className="px-4 py-3 rounded-xl border"
              style={{ backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }}
              placeholder="Street or area within your city"
              placeholderTextColor={theme.textSecondary}
              value={form.address}
              onChangeText={(text) => setForm({ ...form, address: text })}
            />
          </View>
        </View>
      </ScrollView>

      <View
        className="px-4 pt-3 pb-4 border-t"
        style={{ backgroundColor: theme.background, borderTopColor: theme.border }}
      >
        <Button title="Post Job" loading={saving} onPress={handleCreateJob} fullWidth />
      </View>
    </SafeAreaView>
  );
}
