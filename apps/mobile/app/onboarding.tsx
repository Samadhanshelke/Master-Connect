import { ThemedText } from '@/components/themed-text';
import { Button, Dropdown, Input } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { joinCityGroup } from '@/services/chat';
import { subscribeToCities } from '@/services/cities';
import { CityRecord } from '@/types/city';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function OnboardingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { completeOnboarding } = useUserProfile();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<CityRecord[]>([]);

  useEffect(() => {
    if (user) {
      if (user.email) {
        setEmail(user.email);
      }
      if (user.displayName) {
        setName(user.displayName);
      }
    }
  }, [user]);

  useEffect(() => {
    return subscribeToCities(setCities, (error) => {
      console.error('Error loading cities:', error);
    });
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    Toast.show({
      type,
      text1: message,
      position: 'top',
      visibilityTime: 2500,
      topOffset: 50,
    });
  };

  const handleComplete = async () => {
    if (!name.trim()) {
      showToast('error', 'Please enter your name');
      return;
    }

    if (!email.trim()) {
      showToast('error', 'Please enter your email');
      return;
    }

    if (!location.trim()) {
      showToast('error', 'Please select your city');
      return;
    }

    setLoading(true);
    try {
      const profileData = {
        name: name.trim(),
        email: email.trim(),
        location: location.trim(),
        bio: bio.trim(),
        createdAt: new Date().toISOString(),
      };

      await completeOnboarding(profileData);

      if (user) {
        try {
          await joinCityGroup({
            uid: user.uid,
            userName: name.trim(),
            city: location.trim(),
          });
        } catch (error) {
          console.error('Error joining city chat:', error);
        }
      }

      showToast('success', 'Profile saved successfully!');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast('error', 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: theme.background, flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ marginBottom: 32 }}>
            <ThemedText
              type="title"
              style={{ fontSize: 28, color: theme.text, marginBottom: 8 }}
            >
              Complete Your Profile
            </ThemedText>
            <ThemedText style={{ fontSize: 16, color: theme.textSecondary, lineHeight: 24 }}>
              Tell us a bit about yourself to get started
            </ThemedText>
          </View>

          <View style={{ gap: 20 }}>
            <View>
              <ThemedText style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8 }}>
                Full Name *
              </ThemedText>
              <Input
                leftIcon="person-outline"
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

            <View>
              <ThemedText style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8 }}>
                Email *
              </ThemedText>
              <Input
                leftIcon="mail-outline"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading && !user?.email}
              />
            </View>

            <View>
              <ThemedText style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8 }}>
                City *
              </ThemedText>
              {cities.length === 0 ? (
                <View
                  style={{
                    backgroundColor: theme.surface,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.border,
                    paddingHorizontal: 14,
                    paddingVertical: 16,
                  }}
                >
                  <ThemedText style={{ color: theme.textSecondary }}>
                    No cities are available yet. Ask an admin to add your city first.
                  </ThemedText>
                </View>
              ) : (
                <Dropdown
                  options={cities.map((city) => ({ label: city.name, value: city.name }))}
                  value={location}
                  onChange={setLocation}
                  placeholder="Select your city"
                />
              )}
            </View>

            <View>
              <ThemedText style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 8 }}>
                Bio (Optional)
              </ThemedText>
              <View
                style={{
                  backgroundColor: theme.surface,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.border,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <TextInput
                  placeholder="Tell us about yourself..."
                  placeholderTextColor={theme.textSecondary}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!loading}
                  style={{
                    color: theme.text,
                    fontSize: 16,
                    minHeight: 100,
                  }}
                />
              </View>
            </View>
          </View>

          <View style={{ flex: 1, minHeight: 40 }} />

          <Button
            title="Complete Profile"
            loading={loading}
            fullWidth
            size="lg"
            onPress={handleComplete}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
